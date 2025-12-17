/**
 * Unit tests for glucose range TIR utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTIRByTimePeriods,
  calculateHourlyTIR,
  calculateHourlyTIRGrouped,
} from './glucoseRangeTIRUtils';
import type { GlucoseReading, GlucoseThresholds } from '../../types';

// Standard thresholds in mmol/L
const standardThresholds: GlucoseThresholds = {
  veryLow: 3.0,
  low: 3.9,
  high: 10.0,
  veryHigh: 13.9,
};

describe('glucoseRangeTIRUtils', () => {
  describe('calculateTIRByTimePeriods', () => {
    it('should return empty array for no readings', () => {
      const result = calculateTIRByTimePeriods([], standardThresholds, 3);
      expect(result).toEqual([]);
    });

    it('should calculate TIR for applicable time periods', () => {
      // Create readings spanning 30 days
      const readings: GlucoseReading[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        readings.push({ timestamp: date, value: 5.5 }); // in range
      }

      const result = calculateTIRByTimePeriods(readings, standardThresholds, 3);
      
      // Should have 28, 14, 7, 3 day periods (not 90 since data is only 30 days)
      expect(result.length).toBe(4);
      expect(result.map(r => r.days)).toEqual([28, 14, 7, 3]);
      
      // All readings are in range
      result.forEach(period => {
        expect(period.stats.inRange).toBe(period.stats.total);
      });
    });
  });

  describe('calculateHourlyTIR', () => {
    it('should calculate TIR for all 24 hours', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T00:30:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T06:15:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:45:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T18:00:00'), value: 5.5 },
      ];

      const result = calculateHourlyTIR(readings, standardThresholds, 3);
      
      expect(result).toHaveLength(24);
      expect(result[0].hour).toBe(0);
      expect(result[0].hourLabel).toBe('00:00');
      expect(result[0].stats.total).toBe(1);
      expect(result[6].stats.total).toBe(1);
      expect(result[12].stats.total).toBe(1);
      expect(result[18].stats.total).toBe(1);
      
      // Hours without readings should have total 0
      expect(result[1].stats.total).toBe(0);
    });

    it('should handle empty readings', () => {
      const result = calculateHourlyTIR([], standardThresholds, 3);
      
      expect(result).toHaveLength(24);
      result.forEach(hourStats => {
        expect(hourStats.stats.total).toBe(0);
      });
    });
  });

  describe('calculateHourlyTIRGrouped', () => {
    it('should group hours by specified group size', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T00:30:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T01:15:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T06:45:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
      ];

      // 2-hour groups
      const result2 = calculateHourlyTIRGrouped(readings, standardThresholds, 3, 2);
      expect(result2).toHaveLength(12);
      expect(result2[0].hourLabel).toBe('00:00-01:59');
      expect(result2[0].stats.total).toBe(2);

      // 3-hour groups
      const result3 = calculateHourlyTIRGrouped(readings, standardThresholds, 3, 3);
      expect(result3).toHaveLength(8);
      expect(result3[0].hourLabel).toBe('00:00-02:59');

      // 4-hour groups
      const result4 = calculateHourlyTIRGrouped(readings, standardThresholds, 3, 4);
      expect(result4).toHaveLength(6);
      expect(result4[0].hourLabel).toBe('00:00-03:59');

      // 6-hour groups
      const result6 = calculateHourlyTIRGrouped(readings, standardThresholds, 3, 6);
      expect(result6).toHaveLength(4);
      expect(result6[0].hourLabel).toBe('00:00-05:59');
    });

    it('should fall back to hourly when groupSize is 1', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T00:30:00'), value: 5.5 },
      ];

      const resultGrouped = calculateHourlyTIRGrouped(readings, standardThresholds, 3, 1);
      const resultHourly = calculateHourlyTIR(readings, standardThresholds, 3);
      
      expect(resultGrouped).toEqual(resultHourly);
    });
  });
});
