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
  getUniqueDates,
  filterReadingsByDate,
  formatDateDisplay,
  filterReadingsToLastNDays,
  calculateTIRByTimePeriods,
  calculateHourlyTIR,
  calculateHourlyTIRGrouped,
  calculateAverageGlucose,
  calculateEstimatedHbA1c,
  convertHbA1cToMmolMol,
  calculateDaysWithData,
  MIN_DAYS_FOR_RELIABLE_HBA1C,
  calculateCV,
  CV_TARGET_THRESHOLD,
  calculateBGRI,
  calculateLBGI,
  calculateHBGI,
  calculateJIndex,
} from './glucoseRangeUtils';
import { MMOL_TO_MGDL } from './glucoseUnitUtils';
import type { GlucoseReading, GlucoseThresholds } from '../../types';

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
      // low < 3.9 mmol/L
      expect(categorizeGlucose(3.0, standardThresholds, 3)).toBe('low');
      expect(categorizeGlucose(3.5, standardThresholds, 3)).toBe('low');
      
      // inRange: 3.9-10.0 mmol/L
      expect(categorizeGlucose(4.0, standardThresholds, 3)).toBe('inRange');
      expect(categorizeGlucose(5.5, standardThresholds, 3)).toBe('inRange');
      expect(categorizeGlucose(10.0, standardThresholds, 3)).toBe('inRange');
      
      // high > 10.0 mmol/L
      expect(categorizeGlucose(10.1, standardThresholds, 3)).toBe('high');
      expect(categorizeGlucose(14.0, standardThresholds, 3)).toBe('high');
    });

    it('should categorize glucose in 5-category mode', () => {
      // veryLow < 3.0 mmol/L
      expect(categorizeGlucose(2.5, standardThresholds, 5)).toBe('veryLow');
      expect(categorizeGlucose(2.9, standardThresholds, 5)).toBe('veryLow');
      
      // low: 3.0-3.9 mmol/L
      expect(categorizeGlucose(3.0, standardThresholds, 5)).toBe('low');
      expect(categorizeGlucose(3.8, standardThresholds, 5)).toBe('low');
      
      // inRange: 3.9-10.0 mmol/L
      expect(categorizeGlucose(4.0, standardThresholds, 5)).toBe('inRange');
      expect(categorizeGlucose(10.0, standardThresholds, 5)).toBe('inRange');
      
      // high: 10.0-13.9 mmol/L
      expect(categorizeGlucose(10.1, standardThresholds, 5)).toBe('high');
      expect(categorizeGlucose(13.0, standardThresholds, 5)).toBe('high');
      
      // veryHigh > 13.9 mmol/L
      expect(categorizeGlucose(14.0, standardThresholds, 5)).toBe('veryHigh');
      expect(categorizeGlucose(16.0, standardThresholds, 5)).toBe('veryHigh');
    });
  });

  describe('calculateGlucoseRangeStats', () => {
    it('should calculate stats for 3-category mode', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-01T10:00:00'), value: 3.3 },  // low
        { timestamp: new Date('2025-01-01T11:00:00'), value: 5.5 }, // inRange
        { timestamp: new Date('2025-01-01T12:00:00'), value: 8.3 }, // inRange
        { timestamp: new Date('2025-01-01T13:00:00'), value: 11.1 }, // high
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
        { timestamp: new Date('2025-01-01T10:00:00'), value: 2.8 },  // veryLow
        { timestamp: new Date('2025-01-01T11:00:00'), value: 3.3 },  // low
        { timestamp: new Date('2025-01-01T12:00:00'), value: 5.5 }, // inRange
        { timestamp: new Date('2025-01-01T13:00:00'), value: 11.1 }, // high
        { timestamp: new Date('2025-01-01T14:00:00'), value: 16.7 }, // veryHigh
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
        { timestamp: new Date('2025-01-06T10:00:00'), value: 5.5 }, // Monday
        { timestamp: new Date('2025-01-06T14:00:00'), value: 8.3 }, // Monday
        { timestamp: new Date('2025-01-07T10:00:00'), value: 6.7 }, // Tuesday
        { timestamp: new Date('2025-01-11T10:00:00'), value: 11.1 }, // Saturday
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
        { timestamp: new Date('2025-01-06T10:00:00'), value: 5.5 },
        { timestamp: new Date('2025-01-06T14:00:00'), value: 8.3 },
        { timestamp: new Date('2025-01-07T10:00:00'), value: 6.7 },
        { timestamp: new Date('2025-01-07T14:00:00'), value: 10.0 },
        { timestamp: new Date('2025-01-08T10:00:00'), value: 11.1 },
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
        { timestamp: new Date('2025-01-08T10:00:00'), value: 5.5 },
        { timestamp: new Date('2025-01-06T10:00:00'), value: 8.3 },
        { timestamp: new Date('2025-01-07T10:00:00'), value: 6.7 },
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
        { timestamp: new Date('2025-01-06T10:00:00'), value: 5.5 }, // Week 1 (Jan 6-12)
        { timestamp: new Date('2025-01-06T14:00:00'), value: 8.3 }, // Week 1
        { timestamp: new Date('2025-01-08T10:00:00'), value: 6.7 }, // Week 1
        { timestamp: new Date('2025-01-13T10:00:00'), value: 10.0 }, // Week 2 (Jan 13-19)
        { timestamp: new Date('2025-01-14T10:00:00'), value: 11.1 }, // Week 2
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
        { timestamp: new Date('2025-01-15T10:00:00'), value: 5.5 }, // Week 2
        { timestamp: new Date('2025-01-08T10:00:00'), value: 8.3 }, // Week 1
        { timestamp: new Date('2025-01-22T10:00:00'), value: 6.7 }, // Week 3
      ];

      const reports = groupByWeek(readings, standardThresholds, 3);

      expect(reports).toHaveLength(3);
      expect(reports[0].weekStart).toBe('2025-01-06');
      expect(reports[1].weekStart).toBe('2025-01-13');
      expect(reports[2].weekStart).toBe('2025-01-20');
    });

    it('should handle week spanning across months', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-27T10:00:00'), value: 5.5 },
        { timestamp: new Date('2025-02-01T10:00:00'), value: 8.3 },
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
        { timestamp: new Date('2025-01-06T10:00:00'), value: 2.8 },  // veryLow
        { timestamp: new Date('2025-01-06T11:00:00'), value: 3.3 },  // low
        { timestamp: new Date('2025-01-06T12:00:00'), value: 5.5 }, // inRange
        { timestamp: new Date('2025-01-06T13:00:00'), value: 11.1 }, // high
        { timestamp: new Date('2025-01-06T14:00:00'), value: 16.7 }, // veryHigh
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

  describe('getUniqueDates', () => {
    it('should return empty array for no readings', () => {
      const dates = getUniqueDates([]);
      expect(dates).toEqual([]);
    });

    it('should return unique dates sorted chronologically', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-16T09:00:00'), value: 5.8 },
        { timestamp: new Date('2024-01-14T12:00:00'), value: 6.2 },
        { timestamp: new Date('2024-01-15T18:00:00'), value: 5.9 },
      ];

      const dates = getUniqueDates(readings);

      expect(dates).toEqual(['2024-01-14', '2024-01-15', '2024-01-16']);
    });

    it('should handle single date', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 6.0 },
      ];

      const dates = getUniqueDates(readings);

      expect(dates).toEqual(['2024-01-15']);
    });
  });

  describe('filterReadingsByDate', () => {
    it('should filter readings for specific date', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-16T09:00:00'), value: 5.8 },
        { timestamp: new Date('2024-01-14T12:00:00'), value: 6.2 },
      ];

      const filtered = filterReadingsByDate(readings, '2024-01-15');

      expect(filtered).toHaveLength(2);
      expect(filtered[0].value).toBe(5.5);
      expect(filtered[1].value).toBe(6.0);
    });

    it('should return empty array for date with no readings', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];

      const filtered = filterReadingsByDate(readings, '2024-01-20');

      expect(filtered).toEqual([]);
    });
  });

  describe('formatDateDisplay', () => {
    it('should format date with day of week', () => {
      // 2024-01-15 is a Monday
      expect(formatDateDisplay('2024-01-15')).toBe('Monday, 15-01-2024');
      
      // 2024-01-20 is a Saturday
      expect(formatDateDisplay('2024-01-20')).toBe('Saturday, 20-01-2024');
      
      // 2024-01-21 is a Sunday
      expect(formatDateDisplay('2024-01-21')).toBe('Sunday, 21-01-2024');
    });

    it('should handle dates with leading zeros', () => {
      expect(formatDateDisplay('2024-01-05')).toBe('Friday, 05-01-2024');
    });
  });

  describe('filterReadingsToLastNDays', () => {
    it('should return empty array for no readings', () => {
      const filtered = filterReadingsToLastNDays([], 7);
      expect(filtered).toEqual([]);
    });

    it('should filter readings to last N days', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-05T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-08T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-10T10:00:00'), value: 5.5 },
      ];

      const filtered = filterReadingsToLastNDays(readings, 3);
      expect(filtered).toHaveLength(2); // Only 01-08 and 01-10
    });

    it('should use provided reference date', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-05T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-08T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-10T10:00:00'), value: 5.5 },
      ];

      const refDate = new Date('2024-01-08T10:00:00');
      const filtered = filterReadingsToLastNDays(readings, 3, refDate);
      expect(filtered).toHaveLength(2); // 01-05 and 01-08
    });
  });

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

  describe('calculateAverageGlucose', () => {
    it('should return null for empty readings', () => {
      expect(calculateAverageGlucose([])).toBeNull();
    });

    it('should calculate average glucose correctly', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      expect(calculateAverageGlucose(readings)).toBe(6.0);
    });

    it('should handle single reading', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateAverageGlucose(readings)).toBe(5.5);
    });
  });

  describe('calculateEstimatedHbA1c', () => {
    it('should calculate estimated HbA1c using ADA formula', () => {
      // For average glucose of 5.4 mmol/L (about 97 mg/dL), HbA1c should be around 5.0%
      // Formula: (5.4 + 2.59) / 1.59 = 5.03
      const result = calculateEstimatedHbA1c(5.4);
      expect(result).toBeCloseTo(5.03, 1);
    });

    it('should calculate correct HbA1c for higher glucose levels', () => {
      // For average glucose of 8.6 mmol/L (about 155 mg/dL), HbA1c should be around 7.0%
      // Formula: (8.6 + 2.59) / 1.59 = 7.04
      const result = calculateEstimatedHbA1c(8.6);
      expect(result).toBeCloseTo(7.04, 1);
    });

    it('should calculate correct HbA1c for low average glucose', () => {
      // For average glucose of 3.5 mmol/L (about 63 mg/dL)
      // Formula: (3.5 + 2.59) / 1.59 = 3.83
      const result = calculateEstimatedHbA1c(3.5);
      expect(result).toBeCloseTo(3.83, 1);
    });
  });

  describe('convertHbA1cToMmolMol', () => {
    it('should convert HbA1c 5.0% to approximately 31 mmol/mol', () => {
      // Formula: (5.0 - 2.15) × 10.929 = 31.15
      const result = convertHbA1cToMmolMol(5.0);
      expect(result).toBeCloseTo(31.15, 0);
    });

    it('should convert HbA1c 7.0% to approximately 53 mmol/mol', () => {
      // Formula: (7.0 - 2.15) × 10.929 = 53.0
      const result = convertHbA1cToMmolMol(7.0);
      expect(result).toBeCloseTo(53.0, 0);
    });

    it('should convert HbA1c 6.5% to approximately 48 mmol/mol', () => {
      // Formula: (6.5 - 2.15) × 10.929 = 47.5
      const result = convertHbA1cToMmolMol(6.5);
      expect(result).toBeCloseTo(47.5, 0);
    });
  });

  describe('calculateDaysWithData', () => {
    it('should return 0 for empty readings', () => {
      expect(calculateDaysWithData([])).toBe(0);
    });

    it('should count unique days correctly', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-16T09:00:00'), value: 5.8 },
        { timestamp: new Date('2024-01-16T14:00:00'), value: 6.2 },
        { timestamp: new Date('2024-01-17T08:00:00'), value: 5.9 },
      ];
      expect(calculateDaysWithData(readings)).toBe(3);
    });

    it('should handle single day', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      expect(calculateDaysWithData(readings)).toBe(1);
    });
  });

  describe('MIN_DAYS_FOR_RELIABLE_HBA1C', () => {
    it('should be 60 days', () => {
      expect(MIN_DAYS_FOR_RELIABLE_HBA1C).toBe(60);
    });
  });

  describe('CV_TARGET_THRESHOLD', () => {
    it('should be 36%', () => {
      expect(CV_TARGET_THRESHOLD).toBe(36);
    });
  });

  describe('calculateCV', () => {
    it('should return null for empty readings', () => {
      expect(calculateCV([])).toBeNull();
    });

    it('should return null for single reading (need at least 2)', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateCV(readings)).toBeNull();
    });

    it('should calculate CV% correctly for two readings', () => {
      // Two readings: 4.0 and 6.0 mmol/L
      // Mean = 5.0, SD = sqrt(((4-5)^2 + (6-5)^2) / 1) = sqrt(2) ≈ 1.414
      // CV = (1.414 / 5.0) * 100 ≈ 28.28%
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 4.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      const cv = calculateCV(readings);
      expect(cv).toBeCloseTo(28.28, 1);
    });

    it('should calculate CV% correctly for multiple readings', () => {
      // Readings: 5.0, 6.0, 7.0 mmol/L
      // Mean = 6.0
      // Variance = ((5-6)^2 + (6-6)^2 + (7-6)^2) / 2 = (1 + 0 + 1) / 2 = 1
      // SD = sqrt(1) = 1.0
      // CV = (1.0 / 6.0) * 100 ≈ 16.67%
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      const cv = calculateCV(readings);
      expect(cv).toBeCloseTo(16.67, 1);
    });

    it('should return 0 for identical readings (no variability)', () => {
      // All readings are 5.5 mmol/L
      // SD = 0, CV = 0%
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
      ];
      const cv = calculateCV(readings);
      expect(cv).toBe(0);
    });

    it('should indicate stable control when CV ≤ 36%', () => {
      // Readings with low variability
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T13:00:00'), value: 5.8 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 5.2 },
      ];
      const cv = calculateCV(readings);
      expect(cv).not.toBeNull();
      expect(cv!).toBeLessThanOrEqual(CV_TARGET_THRESHOLD);
    });

    it('should indicate high variability when CV > 36%', () => {
      // Readings with high variability
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 3.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 8.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 4.0 },
        { timestamp: new Date('2024-01-15T13:00:00'), value: 12.0 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 5.0 },
      ];
      const cv = calculateCV(readings);
      expect(cv).not.toBeNull();
      expect(cv!).toBeGreaterThan(CV_TARGET_THRESHOLD);
    });
  });

  describe('MMOL_TO_MGDL', () => {
    it('should be approximately 18.018', () => {
      expect(MMOL_TO_MGDL).toBeCloseTo(18.018, 3);
    });
  });

  describe('calculateBGRI', () => {
    it('should return null for empty readings', () => {
      expect(calculateBGRI([])).toBeNull();
    });

    it('should calculate LBGI, HBGI, and BGRI for normal glucose values', () => {
      // Readings around 100 mg/dL (5.5 mmol/L) - near euglycemic level
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
      ];
      const result = calculateBGRI(readings);
      
      expect(result).not.toBeNull();
      expect(result!.lbgi).toBeGreaterThanOrEqual(0);
      expect(result!.hbgi).toBeGreaterThanOrEqual(0);
      expect(result!.bgri).toBeCloseTo(result!.lbgi + result!.hbgi, 5);
    });

    it('should calculate higher LBGI for hypoglycemic readings', () => {
      // Low glucose readings (hypoglycemia range)
      const lowReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 3.0 },  // ~54 mg/dL
        { timestamp: new Date('2024-01-15T11:00:00'), value: 3.5 },  // ~63 mg/dL
        { timestamp: new Date('2024-01-15T12:00:00'), value: 3.2 },  // ~58 mg/dL
      ];
      
      // Normal glucose readings
      const normalReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.8 },
      ];
      
      const lowResult = calculateBGRI(lowReadings);
      const normalResult = calculateBGRI(normalReadings);
      
      expect(lowResult!.lbgi).toBeGreaterThan(normalResult!.lbgi);
    });

    it('should calculate higher HBGI for hyperglycemic readings', () => {
      // High glucose readings (hyperglycemia range)
      const highReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 15.0 },  // ~270 mg/dL
        { timestamp: new Date('2024-01-15T11:00:00'), value: 16.0 },  // ~288 mg/dL
        { timestamp: new Date('2024-01-15T12:00:00'), value: 14.0 },  // ~252 mg/dL
      ];
      
      // Normal glucose readings
      const normalReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.8 },
      ];
      
      const highResult = calculateBGRI(highReadings);
      const normalResult = calculateBGRI(normalReadings);
      
      expect(highResult!.hbgi).toBeGreaterThan(normalResult!.hbgi);
    });

    it('should have BGRI equal to LBGI + HBGI', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 3.5 },  // Low
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },  // Normal
        { timestamp: new Date('2024-01-15T12:00:00'), value: 12.0 }, // High
      ];
      const result = calculateBGRI(readings);
      
      expect(result).not.toBeNull();
      expect(result!.bgri).toBeCloseTo(result!.lbgi + result!.hbgi, 10);
    });

    it('should handle mixed readings correctly', () => {
      // Mix of low, normal, and high readings
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T08:00:00'), value: 2.8 },   // Very low
        { timestamp: new Date('2024-01-15T09:00:00'), value: 5.5 },   // Normal
        { timestamp: new Date('2024-01-15T10:00:00'), value: 7.0 },   // Normal
        { timestamp: new Date('2024-01-15T11:00:00'), value: 15.0 },  // High
      ];
      const result = calculateBGRI(readings);
      
      expect(result).not.toBeNull();
      // Both LBGI and HBGI should be > 0 due to mixed values
      expect(result!.lbgi).toBeGreaterThan(0);
      expect(result!.hbgi).toBeGreaterThan(0);
    });

    it('should return low risk values for well-controlled readings', () => {
      // Well-controlled glucose around 100 mg/dL (5.5 mmol/L)
      const readings: GlucoseReading[] = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(`2024-01-15T${(10 + i).toString().padStart(2, '0')}:00:00`),
        value: 5.5 + (i % 2 === 0 ? 0.2 : -0.2),  // Small variation around 5.5
      }));
      
      const result = calculateBGRI(readings);
      
      expect(result).not.toBeNull();
      // Low risk indices for well-controlled glucose
      expect(result!.lbgi).toBeLessThan(2.5);  // Low hypoglycemia risk
      expect(result!.hbgi).toBeLessThan(4.5);  // Low hyperglycemia risk
    });
  });

  describe('calculateLBGI', () => {
    it('should return null for empty readings', () => {
      expect(calculateLBGI([])).toBeNull();
    });

    it('should return LBGI value', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      const lbgi = calculateLBGI(readings);
      
      expect(lbgi).not.toBeNull();
      expect(typeof lbgi).toBe('number');
    });
  });

  describe('calculateHBGI', () => {
    it('should return null for empty readings', () => {
      expect(calculateHBGI([])).toBeNull();
    });

    it('should return HBGI value', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      const hbgi = calculateHBGI(readings);
      
      expect(hbgi).not.toBeNull();
      expect(typeof hbgi).toBe('number');
    });
  });

  describe('calculateJIndex', () => {
    it('should return null for empty readings', () => {
      expect(calculateJIndex([])).toBeNull();
    });

    it('should return null for single reading (need at least 2)', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateJIndex(readings)).toBeNull();
    });

    it('should calculate J-Index for multiple readings', () => {
      // Readings: 5.0, 6.0, 7.0 mmol/L
      // Mean = 6.0 mmol/L = 108 mg/dL
      // SD = 1.0 mmol/L = 18 mg/dL
      // J-Index = 0.001 × (108 + 18)² = 0.001 × 15876 = 15.876
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      const jIndex = calculateJIndex(readings);
      
      expect(jIndex).not.toBeNull();
      expect(jIndex).toBeGreaterThan(0);
      // Expected: ~15.9 (accounting for exact conversion factor)
      expect(jIndex!).toBeCloseTo(15.9, 0);
    });

    it('should return lower J-Index for stable readings', () => {
      // All readings close to 5.5 mmol/L (low variability)
      const stableReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.4 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.6 },
      ];
      
      // Readings with higher variability
      const variableReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 4.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      
      const stableJIndex = calculateJIndex(stableReadings);
      const variableJIndex = calculateJIndex(variableReadings);
      
      expect(stableJIndex).not.toBeNull();
      expect(variableJIndex).not.toBeNull();
      expect(stableJIndex!).toBeLessThan(variableJIndex!);
    });

    it('should return higher J-Index for higher mean glucose', () => {
      // Normal mean (~5.5 mmol/L)
      const normalReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 6.0 },
      ];
      
      // High mean (~10 mmol/L)
      const highReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 9.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 10.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 10.5 },
      ];
      
      const normalJIndex = calculateJIndex(normalReadings);
      const highJIndex = calculateJIndex(highReadings);
      
      expect(normalJIndex).not.toBeNull();
      expect(highJIndex).not.toBeNull();
      expect(highJIndex!).toBeGreaterThan(normalJIndex!);
    });

    it('should calculate J-Index correctly for typical diabetes range', () => {
      // Mean ~8.6 mmol/L (~155 mg/dL), SD ~1.5 mmol/L (~27 mg/dL)
      // J-Index = 0.001 × (155 + 27)² = 0.001 × 33124 = 33.12
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 7.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 8.6 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 10.2 },
      ];
      const jIndex = calculateJIndex(readings);
      
      expect(jIndex).not.toBeNull();
      // J-Index > 30 indicates fair-to-poor control
      expect(jIndex!).toBeGreaterThan(25);
      expect(jIndex!).toBeLessThan(40);
    });

    it('should be 0 when all readings are identical (but SD would be 0)', () => {
      // All readings identical - SD = 0
      // J-Index = 0.001 × (Mean + 0)² = 0.001 × Mean²
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
      ];
      const jIndex = calculateJIndex(readings);
      
      expect(jIndex).not.toBeNull();
      // Mean = 5.5 mmol/L = ~99 mg/dL, SD = 0
      // J-Index = 0.001 × 99² = ~9.8
      expect(jIndex!).toBeCloseTo(9.8, 0);
    });
  });
});
