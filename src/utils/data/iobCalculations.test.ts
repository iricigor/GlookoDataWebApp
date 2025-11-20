/**
 * Tests for IOB calculation utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateIOBAtTime, calculateDailyIOB } from './iobCalculations';
import type { InsulinReading } from '../../types';

describe('IOB Calculations', () => {
  describe('calculateIOBAtTime', () => {
    it('should return zero IOB when no insulin readings', () => {
      const currentTime = new Date('2024-01-15T12:00:00');
      const result = calculateIOBAtTime([], currentTime, 5);
      
      expect(result.basalIOB).toBe(0);
      expect(result.bolusIOB).toBe(0);
      expect(result.totalIOB).toBe(0);
    });

    it('should calculate IOB for a single bolus dose', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T10:00:00'),
          dose: 10,
          insulinType: 'bolus',
        },
      ];
      
      const currentTime = new Date('2024-01-15T11:00:00'); // 1 hour later
      const result = calculateIOBAtTime(readings, currentTime, 5);
      
      // After 1 hour, some insulin should still be active
      expect(result.bolusIOB).toBeGreaterThan(0);
      expect(result.bolusIOB).toBeLessThan(10);
      expect(result.basalIOB).toBe(0);
      expect(result.totalIOB).toBe(result.bolusIOB);
    });

    it('should calculate IOB for basal micro-doses with decay', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T10:00:00'),
          dose: 2,
          insulinType: 'basal',
        },
      ];
      
      const currentTime = new Date('2024-01-15T11:00:00'); // 1 hour later
      const result = calculateIOBAtTime(readings, currentTime, 5);
      
      // Basal uses exponential decay like bolus
      // After 1 hour with 5-hour duration, some insulin is still active
      expect(result.basalIOB).toBeGreaterThan(0);
      expect(result.basalIOB).toBeLessThan(2); // Less than full dose due to decay
      expect(result.bolusIOB).toBe(0);
      expect(result.totalIOB).toBe(result.basalIOB);
    });

    it('should combine basal and bolus IOB', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T10:00:00'),
          dose: 10,
          insulinType: 'bolus',
        },
        {
          timestamp: new Date('2024-01-15T10:30:00'),
          dose: 1.5,
          insulinType: 'basal',
        },
      ];
      
      const currentTime = new Date('2024-01-15T11:00:00');
      const result = calculateIOBAtTime(readings, currentTime, 5);
      
      expect(result.bolusIOB).toBeGreaterThan(0);
      expect(result.basalIOB).toBeGreaterThan(0);
      expect(result.totalIOB).toBeCloseTo(result.basalIOB + result.bolusIOB, 1);
    });

    it('should return zero IOB when insulin duration has passed', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T10:00:00'),
          dose: 10,
          insulinType: 'bolus',
        },
      ];
      
      const currentTime = new Date('2024-01-15T16:00:00'); // 6 hours later
      const result = calculateIOBAtTime(readings, currentTime, 5);
      
      // After 6 hours with 5-hour duration, IOB should be zero
      expect(result.bolusIOB).toBe(0);
      expect(result.totalIOB).toBe(0);
    });

    it('should ignore future insulin readings', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T10:00:00'),
          dose: 10,
          insulinType: 'bolus',
        },
        {
          timestamp: new Date('2024-01-15T13:00:00'), // Future reading
          dose: 8,
          insulinType: 'bolus',
        },
      ];
      
      const currentTime = new Date('2024-01-15T11:00:00');
      const result = calculateIOBAtTime(readings, currentTime, 5);
      
      // Only the first dose should be counted
      expect(result.bolusIOB).toBeGreaterThan(0);
      expect(result.bolusIOB).toBeLessThan(10);
    });

    it('should handle multiple doses of the same type', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T10:00:00'),
          dose: 5,
          insulinType: 'bolus',
        },
        {
          timestamp: new Date('2024-01-15T10:30:00'),
          dose: 5,
          insulinType: 'bolus',
        },
      ];
      
      const currentTime = new Date('2024-01-15T11:00:00');
      const result = calculateIOBAtTime(readings, currentTime, 5);
      
      // Both doses should contribute to IOB
      expect(result.bolusIOB).toBeGreaterThan(5); // More than a single dose
      expect(result.bolusIOB).toBeLessThan(10); // But less than total due to decay
    });

    it('should decrease IOB over time', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T10:00:00'),
          dose: 10,
          insulinType: 'bolus',
        },
      ];
      
      const time1 = new Date('2024-01-15T10:30:00'); // 30 min later
      const time2 = new Date('2024-01-15T11:00:00'); // 60 min later
      const time3 = new Date('2024-01-15T12:00:00'); // 120 min later
      
      const result1 = calculateIOBAtTime(readings, time1, 5);
      const result2 = calculateIOBAtTime(readings, time2, 5);
      const result3 = calculateIOBAtTime(readings, time3, 5);
      
      // IOB should decrease over time
      expect(result1.bolusIOB).toBeGreaterThan(result2.bolusIOB);
      expect(result2.bolusIOB).toBeGreaterThan(result3.bolusIOB);
    });
  });

  describe('calculateDailyIOB', () => {
    it('should generate data points for a full day', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T08:00:00'),
          dose: 10,
          insulinType: 'bolus',
        },
      ];
      
      const result = calculateDailyIOB(readings, '2024-01-15', 5, 60); // 60-minute intervals
      
      // Should have 24 hourly data points (0:00 to 23:00) plus one at 24:00
      expect(result.length).toBe(25);
    });

    it('should include correct time labels', () => {
      const readings: InsulinReading[] = [];
      const result = calculateDailyIOB(readings, '2024-01-15', 5, 60);
      
      expect(result[0].timeLabel).toBe('00:00');
      expect(result[12].timeLabel).toBe('12:00');
      // Last point is at 24:00 which is represented as 00:00 of the next day
      expect(result[result.length - 1].timeLabel).toBe('00:00');
    });

    it('should respect interval parameter', () => {
      const readings: InsulinReading[] = [];
      const result30 = calculateDailyIOB(readings, '2024-01-15', 5, 30); // 30-minute intervals
      const result15 = calculateDailyIOB(readings, '2024-01-15', 5, 15); // 15-minute intervals
      
      // 30-minute intervals: 24 hours * 2 = 48 points + 1 = 49
      expect(result30.length).toBe(49);
      
      // 15-minute intervals: 24 hours * 4 = 96 points + 1 = 97
      expect(result15.length).toBe(97);
    });

    it('should calculate IOB throughout the day', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T12:00:00'),
          dose: 10,
          insulinType: 'bolus',
        },
      ];
      
      const result = calculateDailyIOB(readings, '2024-01-15', 5, 60);
      
      // Find the data point at noon
      const noonPoint = result.find(p => p.timeLabel === '12:00');
      expect(noonPoint).toBeDefined();
      expect(noonPoint!.bolusIOB).toBeGreaterThan(0);
      
      // Data point at 18:00 should have some IOB (within 6 hours)
      const eveningPoint = result.find(p => p.timeLabel === '18:00');
      expect(eveningPoint).toBeDefined();
      // After 6 hours with 5-hour duration, should be zero
      expect(eveningPoint!.bolusIOB).toBe(0);
    });

    it('should include insulin from previous day within duration window', () => {
      const readings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-14T22:00:00'), // Previous day at 10 PM
          dose: 10,
          insulinType: 'bolus',
        },
      ];
      
      const result = calculateDailyIOB(readings, '2024-01-15', 5, 60);
      
      // At midnight, there should still be IOB from the 10 PM dose (2 hours ago)
      const midnightPoint = result.find(p => p.timeLabel === '00:00');
      expect(midnightPoint).toBeDefined();
      expect(midnightPoint!.bolusIOB).toBeGreaterThan(0);
    });

    it('should handle empty readings', () => {
      const result = calculateDailyIOB([], '2024-01-15', 5, 60);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(p => p.totalIOB === 0)).toBe(true);
    });
  });
});
