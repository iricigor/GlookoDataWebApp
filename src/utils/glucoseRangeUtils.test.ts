/**
 * Unit tests for glucose range utilities
 */

import { describe, it, expect } from 'vitest';
import {
  categorizeGlucose,
  calculateGlucoseRangeStats,
  getDayOfWeek,
  isWorkday,
  groupByDayOfWeek,
  formatDate,
  groupByDate,
  getWeekStart,
  getWeekEnd,
  formatWeekRange,
  groupByWeek,
  calculatePercentage,
} from './glucoseRangeUtils';
import type { GlucoseReading, GlucoseThresholds } from '../types';

// Standard thresholds in mmol/L
const standardThresholds: GlucoseThresholds = {
  veryLow: 3.0,
  low: 3.9,
  high: 10.0,
  veryHigh: 13.9,
};

describe('glucoseRangeUtils', () => {
  describe('categorizeGlucose', () => {
    it('should categorize glucose in 3-category mode', () => {
      // low < 3.9 mmol/L (~70.27 mg/dL)
      expect(categorizeGlucose(60, standardThresholds, 3)).toBe('low');
      expect(categorizeGlucose(70, standardThresholds, 3)).toBe('low');
      
      // inRange: 3.9-10.0 mmol/L (~70.27-180.18 mg/dL)
      expect(categorizeGlucose(71, standardThresholds, 3)).toBe('inRange');
      expect(categorizeGlucose(100, standardThresholds, 3)).toBe('inRange');
      expect(categorizeGlucose(180, standardThresholds, 3)).toBe('inRange');
      
      // high > 10.0 mmol/L (~180.18 mg/dL)
      expect(categorizeGlucose(181, standardThresholds, 3)).toBe('high');
      expect(categorizeGlucose(250, standardThresholds, 3)).toBe('high');
    });

    it('should categorize glucose in 5-category mode', () => {
      // veryLow < 3.0 mmol/L (~54.05 mg/dL)
      expect(categorizeGlucose(50, standardThresholds, 5)).toBe('veryLow');
      expect(categorizeGlucose(53, standardThresholds, 5)).toBe('veryLow');
      
      // low: 3.0-3.9 mmol/L (~54.05-70.27 mg/dL)
      expect(categorizeGlucose(55, standardThresholds, 5)).toBe('low');
      expect(categorizeGlucose(70, standardThresholds, 5)).toBe('low');
      
      // inRange: 3.9-10.0 mmol/L (~70.27-180.18 mg/dL)
      expect(categorizeGlucose(71, standardThresholds, 5)).toBe('inRange');
      expect(categorizeGlucose(180, standardThresholds, 5)).toBe('inRange');
      
      // high: 10.0-13.9 mmol/L (~180.18-250.45 mg/dL)
      expect(categorizeGlucose(181, standardThresholds, 5)).toBe('high');
      expect(categorizeGlucose(250, standardThresholds, 5)).toBe('high');
      
      // veryHigh > 13.9 mmol/L (~250.45 mg/dL)
      expect(categorizeGlucose(251, standardThresholds, 5)).toBe('veryHigh');
      expect(categorizeGlucose(300, standardThresholds, 5)).toBe('veryHigh');
    });
  });

  describe('calculateGlucoseRangeStats', () => {
    it('should calculate stats for 3-category mode', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-01T10:00:00'), value: 60 },  // low
        { timestamp: new Date('2025-01-01T11:00:00'), value: 100 }, // inRange
        { timestamp: new Date('2025-01-01T12:00:00'), value: 150 }, // inRange
        { timestamp: new Date('2025-01-01T13:00:00'), value: 200 }, // high
      ];

      const stats = calculateGlucoseRangeStats(readings, standardThresholds, 3);

      expect(stats.low).toBe(1);
      expect(stats.inRange).toBe(2);
      expect(stats.high).toBe(1);
      expect(stats.total).toBe(4);
      expect(stats.veryLow).toBeUndefined();
      expect(stats.veryHigh).toBeUndefined();
    });

    it('should calculate stats for 5-category mode', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-01T10:00:00'), value: 50 },  // veryLow
        { timestamp: new Date('2025-01-01T11:00:00'), value: 60 },  // low
        { timestamp: new Date('2025-01-01T12:00:00'), value: 100 }, // inRange
        { timestamp: new Date('2025-01-01T13:00:00'), value: 200 }, // high
        { timestamp: new Date('2025-01-01T14:00:00'), value: 300 }, // veryHigh
      ];

      const stats = calculateGlucoseRangeStats(readings, standardThresholds, 5);

      expect(stats.veryLow).toBe(1);
      expect(stats.low).toBe(1);
      expect(stats.inRange).toBe(1);
      expect(stats.high).toBe(1);
      expect(stats.veryHigh).toBe(1);
      expect(stats.total).toBe(5);
    });

    it('should handle empty readings array', () => {
      const stats3 = calculateGlucoseRangeStats([], standardThresholds, 3);
      expect(stats3.total).toBe(0);
      expect(stats3.low).toBe(0);
      expect(stats3.inRange).toBe(0);
      expect(stats3.high).toBe(0);

      const stats5 = calculateGlucoseRangeStats([], standardThresholds, 5);
      expect(stats5.total).toBe(0);
      expect(stats5.veryLow).toBe(0);
      expect(stats5.low).toBe(0);
      expect(stats5.inRange).toBe(0);
      expect(stats5.high).toBe(0);
      expect(stats5.veryHigh).toBe(0);
    });
  });

  describe('getDayOfWeek', () => {
    it('should return correct day of week', () => {
      expect(getDayOfWeek(new Date('2025-01-06'))).toBe('Monday');
      expect(getDayOfWeek(new Date('2025-01-07'))).toBe('Tuesday');
      expect(getDayOfWeek(new Date('2025-01-08'))).toBe('Wednesday');
      expect(getDayOfWeek(new Date('2025-01-09'))).toBe('Thursday');
      expect(getDayOfWeek(new Date('2025-01-10'))).toBe('Friday');
      expect(getDayOfWeek(new Date('2025-01-11'))).toBe('Saturday');
      expect(getDayOfWeek(new Date('2025-01-12'))).toBe('Sunday');
    });
  });

  describe('isWorkday', () => {
    it('should identify workdays correctly', () => {
      expect(isWorkday('Monday')).toBe(true);
      expect(isWorkday('Tuesday')).toBe(true);
      expect(isWorkday('Wednesday')).toBe(true);
      expect(isWorkday('Thursday')).toBe(true);
      expect(isWorkday('Friday')).toBe(true);
      expect(isWorkday('Saturday')).toBe(false);
      expect(isWorkday('Sunday')).toBe(false);
    });
  });

  describe('groupByDayOfWeek', () => {
    it('should group readings by day of week', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-06T10:00:00'), value: 100 }, // Monday
        { timestamp: new Date('2025-01-06T14:00:00'), value: 150 }, // Monday
        { timestamp: new Date('2025-01-07T10:00:00'), value: 120 }, // Tuesday
        { timestamp: new Date('2025-01-11T10:00:00'), value: 200 }, // Saturday
      ];

      const reports = groupByDayOfWeek(readings, standardThresholds, 3);

      expect(reports).toHaveLength(9); // 7 days + Workday + Weekend

      // Monday should have 2 readings
      const monday = reports.find(r => r.day === 'Monday');
      expect(monday?.stats.total).toBe(2);

      // Tuesday should have 1 reading
      const tuesday = reports.find(r => r.day === 'Tuesday');
      expect(tuesday?.stats.total).toBe(1);

      // Workday should have 3 readings
      const workday = reports.find(r => r.day === 'Workday');
      expect(workday?.stats.total).toBe(3);

      // Weekend should have 1 reading
      const weekend = reports.find(r => r.day === 'Weekend');
      expect(weekend?.stats.total).toBe(1);
    });

    it('should handle empty readings array', () => {
      const reports = groupByDayOfWeek([], standardThresholds, 3);
      expect(reports).toHaveLength(9);
      reports.forEach(report => {
        expect(report.stats.total).toBe(0);
      });
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      expect(formatDate(new Date('2025-01-06'))).toBe('2025-01-06');
      expect(formatDate(new Date('2025-12-31'))).toBe('2025-12-31');
      expect(formatDate(new Date('2025-07-15T14:30:00'))).toBe('2025-07-15');
    });
  });

  describe('groupByDate', () => {
    it('should group readings by date', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-06T10:00:00'), value: 100 },
        { timestamp: new Date('2025-01-06T14:00:00'), value: 150 },
        { timestamp: new Date('2025-01-07T10:00:00'), value: 120 },
        { timestamp: new Date('2025-01-07T14:00:00'), value: 180 },
        { timestamp: new Date('2025-01-08T10:00:00'), value: 200 },
      ];

      const reports = groupByDate(readings, standardThresholds, 3);

      expect(reports).toHaveLength(3);
      expect(reports[0].date).toBe('2025-01-06');
      expect(reports[0].stats.total).toBe(2);
      expect(reports[1].date).toBe('2025-01-07');
      expect(reports[1].stats.total).toBe(2);
      expect(reports[2].date).toBe('2025-01-08');
      expect(reports[2].stats.total).toBe(1);
    });

    it('should sort reports by date chronologically', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-08T10:00:00'), value: 100 },
        { timestamp: new Date('2025-01-06T10:00:00'), value: 150 },
        { timestamp: new Date('2025-01-07T10:00:00'), value: 120 },
      ];

      const reports = groupByDate(readings, standardThresholds, 3);

      expect(reports[0].date).toBe('2025-01-06');
      expect(reports[1].date).toBe('2025-01-07');
      expect(reports[2].date).toBe('2025-01-08');
    });

    it('should handle empty readings array', () => {
      const reports = groupByDate([], standardThresholds, 3);
      expect(reports).toHaveLength(0);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25.0);
      expect(calculatePercentage(1, 3)).toBe(33.3);
      expect(calculatePercentage(2, 3)).toBe(66.7);
      expect(calculatePercentage(1, 6)).toBe(16.7);
    });

    it('should handle zero total', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should handle zero count', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });
  });

  describe('getWeekStart', () => {
    it('should return Monday for any day in the week', () => {
      // Week of Jan 6-12, 2025 (Monday to Sunday)
      expect(formatDate(getWeekStart(new Date('2025-01-06')))).toBe('2025-01-06'); // Monday
      expect(formatDate(getWeekStart(new Date('2025-01-07')))).toBe('2025-01-06'); // Tuesday
      expect(formatDate(getWeekStart(new Date('2025-01-08')))).toBe('2025-01-06'); // Wednesday
      expect(formatDate(getWeekStart(new Date('2025-01-09')))).toBe('2025-01-06'); // Thursday
      expect(formatDate(getWeekStart(new Date('2025-01-10')))).toBe('2025-01-06'); // Friday
      expect(formatDate(getWeekStart(new Date('2025-01-11')))).toBe('2025-01-06'); // Saturday
      expect(formatDate(getWeekStart(new Date('2025-01-12')))).toBe('2025-01-06'); // Sunday
    });

    it('should handle week crossing year boundary', () => {
      // Week of Dec 30, 2024 - Jan 5, 2025
      expect(formatDate(getWeekStart(new Date('2025-01-01')))).toBe('2024-12-30'); // Wednesday
    });
  });

  describe('getWeekEnd', () => {
    it('should return Sunday for any day in the week', () => {
      // Week of Jan 6-12, 2025
      expect(formatDate(getWeekEnd(new Date('2025-01-06')))).toBe('2025-01-12'); // Monday
      expect(formatDate(getWeekEnd(new Date('2025-01-07')))).toBe('2025-01-12'); // Tuesday
      expect(formatDate(getWeekEnd(new Date('2025-01-12')))).toBe('2025-01-12'); // Sunday
    });
  });

  describe('formatWeekRange', () => {
    it('should format week range within same month', () => {
      const start = new Date('2025-01-06'); // Jan 6 (Monday)
      const end = new Date('2025-01-12');   // Jan 12 (Sunday)
      expect(formatWeekRange(start, end)).toBe('Jan 6-12');
    });

    it('should format week range across different months', () => {
      const start = new Date('2025-01-27'); // Jan 27 (Monday)
      const end = new Date('2025-02-02');   // Feb 2 (Sunday)
      expect(formatWeekRange(start, end)).toBe('Jan 27-Feb 2');
    });

    it('should format week range in October (as per requirement example)', () => {
      const start = new Date('2024-10-07'); // Oct 7 (Monday)
      const end = new Date('2024-10-13');   // Oct 13 (Sunday)
      expect(formatWeekRange(start, end)).toBe('Oct 7-13');
    });
  });

  describe('groupByWeek', () => {
    it('should group readings by week', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-06T10:00:00'), value: 100 }, // Week 1 (Jan 6-12)
        { timestamp: new Date('2025-01-06T14:00:00'), value: 150 }, // Week 1
        { timestamp: new Date('2025-01-08T10:00:00'), value: 120 }, // Week 1
        { timestamp: new Date('2025-01-13T10:00:00'), value: 180 }, // Week 2 (Jan 13-19)
        { timestamp: new Date('2025-01-14T10:00:00'), value: 200 }, // Week 2
      ];

      const reports = groupByWeek(readings, standardThresholds, 3);

      expect(reports).toHaveLength(2);
      
      // First week
      expect(reports[0].weekStart).toBe('2025-01-06');
      expect(reports[0].weekEnd).toBe('2025-01-12');
      expect(reports[0].weekLabel).toBe('Jan 6-12');
      expect(reports[0].stats.total).toBe(3);

      // Second week
      expect(reports[1].weekStart).toBe('2025-01-13');
      expect(reports[1].weekEnd).toBe('2025-01-19');
      expect(reports[1].weekLabel).toBe('Jan 13-19');
      expect(reports[1].stats.total).toBe(2);
    });

    it('should sort reports by week chronologically', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-15T10:00:00'), value: 100 }, // Week 2
        { timestamp: new Date('2025-01-08T10:00:00'), value: 150 }, // Week 1
        { timestamp: new Date('2025-01-22T10:00:00'), value: 120 }, // Week 3
      ];

      const reports = groupByWeek(readings, standardThresholds, 3);

      expect(reports).toHaveLength(3);
      expect(reports[0].weekStart).toBe('2025-01-06');
      expect(reports[1].weekStart).toBe('2025-01-13');
      expect(reports[2].weekStart).toBe('2025-01-20');
    });

    it('should handle week spanning across months', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-27T10:00:00'), value: 100 },
        { timestamp: new Date('2025-02-01T10:00:00'), value: 150 },
      ];

      const reports = groupByWeek(readings, standardThresholds, 3);

      expect(reports).toHaveLength(1);
      expect(reports[0].weekLabel).toBe('Jan 27-Feb 2');
      expect(reports[0].stats.total).toBe(2);
    });

    it('should handle empty readings array', () => {
      const reports = groupByWeek([], standardThresholds, 3);
      expect(reports).toHaveLength(0);
    });

    it('should correctly calculate stats in 5-category mode', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-06T10:00:00'), value: 50 },  // veryLow
        { timestamp: new Date('2025-01-06T11:00:00'), value: 60 },  // low
        { timestamp: new Date('2025-01-06T12:00:00'), value: 100 }, // inRange
        { timestamp: new Date('2025-01-06T13:00:00'), value: 200 }, // high
        { timestamp: new Date('2025-01-06T14:00:00'), value: 300 }, // veryHigh
      ];

      const reports = groupByWeek(readings, standardThresholds, 5);

      expect(reports).toHaveLength(1);
      expect(reports[0].stats.veryLow).toBe(1);
      expect(reports[0].stats.low).toBe(1);
      expect(reports[0].stats.inRange).toBe(1);
      expect(reports[0].stats.high).toBe(1);
      expect(reports[0].stats.veryHigh).toBe(1);
      expect(reports[0].stats.total).toBe(5);
    });
  });
});
