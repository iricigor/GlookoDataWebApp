/**
 * Tests for AGP utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePercentile,
  formatTimeSlot,
  getTimeSlotKey,
  calculateAGPStats,
} from './agpUtils';
import type { GlucoseReading } from '../types';

describe('agpUtils', () => {
  describe('calculatePercentile', () => {
    it('should return 0 for empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0);
    });

    it('should return the only value for single-element array', () => {
      expect(calculatePercentile([100], 50)).toBe(100);
    });

    it('should calculate 50th percentile (median) correctly for odd-length array', () => {
      const values = [70, 80, 90, 100, 110];
      expect(calculatePercentile(values, 50)).toBe(90);
    });

    it('should calculate 50th percentile (median) correctly for even-length array', () => {
      const values = [70, 80, 90, 100];
      expect(calculatePercentile(values, 50)).toBe(85); // (80 + 90) / 2
    });

    it('should calculate 25th percentile correctly', () => {
      const values = [60, 70, 80, 90, 100, 110, 120, 130, 140];
      // 25th percentile at index 2 (0-indexed), value 80
      expect(calculatePercentile(values, 25)).toBe(80);
    });

    it('should calculate 75th percentile correctly', () => {
      const values = [60, 70, 80, 90, 100, 110, 120, 130, 140];
      // 75th percentile at index 6, value 120
      expect(calculatePercentile(values, 75)).toBe(120);
    });

    it('should calculate 10th percentile correctly', () => {
      const values = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
      // 10th percentile at index 0.9, between 60 and 70
      const result = calculatePercentile(values, 10);
      expect(result).toBeGreaterThanOrEqual(60);
      expect(result).toBeLessThanOrEqual(70);
    });

    it('should calculate 90th percentile correctly', () => {
      const values = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
      // 90th percentile at index 8.1, between 140 and 150
      const result = calculatePercentile(values, 90);
      expect(result).toBeGreaterThanOrEqual(140);
      expect(result).toBeLessThanOrEqual(150);
    });

    it('should handle 0th percentile (minimum)', () => {
      const values = [60, 70, 80, 90, 100];
      expect(calculatePercentile(values, 0)).toBe(60);
    });

    it('should handle 100th percentile (maximum)', () => {
      const values = [60, 70, 80, 90, 100];
      expect(calculatePercentile(values, 100)).toBe(100);
    });
  });

  describe('formatTimeSlot', () => {
    it('should format single-digit hours and minutes with leading zeros', () => {
      expect(formatTimeSlot(0, 0)).toBe('00:00');
      expect(formatTimeSlot(5, 5)).toBe('05:05');
      expect(formatTimeSlot(9, 0)).toBe('09:00');
    });

    it('should format double-digit hours and minutes correctly', () => {
      expect(formatTimeSlot(10, 15)).toBe('10:15');
      expect(formatTimeSlot(23, 55)).toBe('23:55');
    });

    it('should format midnight correctly', () => {
      expect(formatTimeSlot(0, 0)).toBe('00:00');
    });

    it('should format noon correctly', () => {
      expect(formatTimeSlot(12, 0)).toBe('12:00');
    });
  });

  describe('getTimeSlotKey', () => {
    it('should round down to nearest 5-minute interval', () => {
      expect(getTimeSlotKey(new Date('2024-01-01T10:00:00'))).toBe('10:00');
      expect(getTimeSlotKey(new Date('2024-01-01T10:01:00'))).toBe('10:00');
      expect(getTimeSlotKey(new Date('2024-01-01T10:04:59'))).toBe('10:00');
      expect(getTimeSlotKey(new Date('2024-01-01T10:05:00'))).toBe('10:05');
      expect(getTimeSlotKey(new Date('2024-01-01T10:09:59'))).toBe('10:05');
    });

    it('should handle midnight', () => {
      expect(getTimeSlotKey(new Date('2024-01-01T00:00:00'))).toBe('00:00');
      expect(getTimeSlotKey(new Date('2024-01-01T00:04:59'))).toBe('00:00');
    });

    it('should handle end of day', () => {
      expect(getTimeSlotKey(new Date('2024-01-01T23:55:00'))).toBe('23:55');
      expect(getTimeSlotKey(new Date('2024-01-01T23:59:59'))).toBe('23:55');
    });
  });

  describe('calculateAGPStats', () => {
    it('should return 288 time slots (24 hours * 12 intervals)', () => {
      const readings: GlucoseReading[] = [];
      const stats = calculateAGPStats(readings);
      expect(stats).toHaveLength(288);
    });

    it('should have all time slots from 00:00 to 23:55', () => {
      const readings: GlucoseReading[] = [];
      const stats = calculateAGPStats(readings);
      
      expect(stats[0].timeSlot).toBe('00:00');
      expect(stats[1].timeSlot).toBe('00:05');
      expect(stats[287].timeSlot).toBe('23:55');
    });

    it('should return zeros for empty readings', () => {
      const readings: GlucoseReading[] = [];
      const stats = calculateAGPStats(readings);
      
      stats.forEach(slot => {
        expect(slot.lowest).toBe(0);
        expect(slot.p10).toBe(0);
        expect(slot.p25).toBe(0);
        expect(slot.p50).toBe(0);
        expect(slot.p75).toBe(0);
        expect(slot.p90).toBe(0);
        expect(slot.highest).toBe(0);
        expect(slot.count).toBe(0);
      });
    });

    it('should group readings by 5-minute time slots', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 100 },
        { timestamp: new Date('2024-01-01T10:02:00'), value: 110 },
        { timestamp: new Date('2024-01-01T10:04:00'), value: 120 },
        { timestamp: new Date('2024-01-02T10:03:00'), value: 105 }, // Different day, same time
      ];

      const stats = calculateAGPStats(readings);
      
      // Find the 10:00 time slot (index 120: 10 hours * 12 intervals)
      const slot1000 = stats.find(s => s.timeSlot === '10:00');
      
      expect(slot1000).toBeDefined();
      expect(slot1000?.count).toBe(4);
      expect(slot1000?.lowest).toBe(100);
      expect(slot1000?.highest).toBe(120);
      expect(slot1000?.p50).toBe(107.5); // Median of [100, 105, 110, 120]
    });

    it('should calculate percentiles correctly for a time slot with data', () => {
      const readings: GlucoseReading[] = [];
      
      // Add 10 readings at 14:30 with values 100, 110, 120, ..., 190
      // Use different days to accumulate data for the same time slot
      for (let i = 0; i < 10; i++) {
        const day = (i + 1).toString().padStart(2, '0');
        readings.push({
          timestamp: new Date(`2024-01-${day}T14:30:00`),
          value: 100 + i * 10,
        });
      }

      const stats = calculateAGPStats(readings);
      
      // Find the 14:30 time slot
      const slot1430 = stats.find(s => s.timeSlot === '14:30');
      
      expect(slot1430).toBeDefined();
      expect(slot1430?.count).toBe(10);
      expect(slot1430?.lowest).toBe(100);
      expect(slot1430?.highest).toBe(190);
      expect(slot1430?.p50).toBe(145); // Median of [100, 110, 120, 130, 140, 150, 160, 170, 180, 190]
      expect(slot1430?.p25).toBe(122.5); // 25th percentile
      expect(slot1430?.p75).toBe(167.5); // 75th percentile
    });

    it('should handle readings from multiple days for same time slot', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T08:15:00'), value: 90 },
        { timestamp: new Date('2024-01-02T08:15:00'), value: 100 },
        { timestamp: new Date('2024-01-03T08:17:00'), value: 110 }, // Same slot (rounds to 08:15)
        { timestamp: new Date('2024-01-04T08:15:00'), value: 120 },
      ];

      const stats = calculateAGPStats(readings);
      
      const slot0815 = stats.find(s => s.timeSlot === '08:15');
      
      expect(slot0815).toBeDefined();
      expect(slot0815?.count).toBe(4);
      expect(slot0815?.lowest).toBe(90);
      expect(slot0815?.highest).toBe(120);
      expect(slot0815?.p50).toBe(105); // Median of [90, 100, 110, 120]
    });

    it('should handle time slot with single reading', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T15:45:00'), value: 150 },
      ];

      const stats = calculateAGPStats(readings);
      
      const slot1545 = stats.find(s => s.timeSlot === '15:45');
      
      expect(slot1545).toBeDefined();
      expect(slot1545?.count).toBe(1);
      expect(slot1545?.lowest).toBe(150);
      expect(slot1545?.p10).toBe(150);
      expect(slot1545?.p25).toBe(150);
      expect(slot1545?.p50).toBe(150);
      expect(slot1545?.p75).toBe(150);
      expect(slot1545?.p90).toBe(150);
      expect(slot1545?.highest).toBe(150);
    });
  });
});
