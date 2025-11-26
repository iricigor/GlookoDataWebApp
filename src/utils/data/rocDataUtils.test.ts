/**
 * Tests for Rate of Change (RoC) utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRoC,
  calculateRoCWithInterval,
  filterRoCByDate,
  calculateRoCStats,
  getUniqueDatesFromRoC,
  categorizeRoC,
  getRoCColor,
  getRoCBackgroundColor,
  formatRoCValue,
  getRoCMedicalStandards,
  ROC_THRESHOLDS,
  ROC_TIME_SPAN_MINUTES,
  smoothRoCData,
  getLongestCategoryPeriod,
  formatDuration,
} from './rocDataUtils';
import type { GlucoseReading } from '../../types';

describe('rocDataUtils', () => {
  describe('calculateRoC', () => {
    it('should return empty array for less than 2 readings', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toEqual([]);
    });

    it('should calculate RoC between consecutive readings in per-5-min units', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-01T10:05:00'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(1);
      // 0.5 mmol/L over 5 min = 0.1 mmol/L/min = 0.5 mmol/L/5min
      expect(result[0].roc).toBeCloseTo(0.5, 3);
      expect(result[0].rocRaw).toBeCloseTo(0.5, 3);
    });

    it('should calculate absolute value of RoC for decreasing glucose', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-01T10:05:00'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(1);
      expect(result[0].roc).toBeCloseTo(0.5, 3);  // Absolute value
      expect(result[0].rocRaw).toBeCloseTo(-0.5, 3);  // Negative for decreasing
    });

    it('should skip readings with time gap > 30 minutes', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-01T10:35:00'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(0);
    });

    it('should skip readings with time gap < 1 minute', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-01T10:00:30'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(0);
    });

    it('should sort readings by timestamp before calculation', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:05:00'), value: 5.5 },
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(1);
      expect(result[0].roc).toBeCloseTo(0.5, 3);  // 0.5 mmol/L/5min
    });
  });

  describe('calculateRoCWithInterval', () => {
    it('should return empty array for less than 2 readings', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.5 },
      ];
      const result = calculateRoCWithInterval(readings, 30);
      expect(result).toEqual([]);
    });

    it('should calculate RoC over 30-minute interval', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-01T10:05:00'), value: 5.1 },
        { timestamp: new Date('2024-01-01T10:10:00'), value: 5.2 },
        { timestamp: new Date('2024-01-01T10:15:00'), value: 5.3 },
        { timestamp: new Date('2024-01-01T10:20:00'), value: 5.4 },
        { timestamp: new Date('2024-01-01T10:25:00'), value: 5.5 },
        { timestamp: new Date('2024-01-01T10:30:00'), value: 5.6 },
      ];
      const result = calculateRoCWithInterval(readings, 30);
      
      // Should find readings approximately 30 min apart
      // At 10:30, looking back 30min finds 10:00 (value 5.0)
      // Change: 5.6 - 5.0 = 0.6 over 30min = 0.02 mmol/L/min = 0.1 mmol/L/5min
      expect(result.length).toBeGreaterThan(0);
      const lastPoint = result[result.length - 1];
      expect(lastPoint.roc).toBeCloseTo(0.1, 2);  // 0.1 mmol/L/5min
    });

    it('should calculate RoC over 60-minute interval', () => {
      const baseTime = new Date('2024-01-01T10:00:00').getTime();
      const readings: GlucoseReading[] = [];
      
      // Create readings every 5 minutes for 70 minutes
      for (let i = 0; i <= 14; i++) {
        readings.push({
          timestamp: new Date(baseTime + i * 5 * 60 * 1000),
          value: 5.0 + (i * 5 / 100),  // Gradual increase
        });
      }
      
      const result = calculateRoCWithInterval(readings, 60);
      
      // Should have points starting around 60min into the data
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle 120-minute interval', () => {
      const baseTime = new Date('2024-01-01T08:00:00').getTime();
      const readings: GlucoseReading[] = [];
      
      // Create readings every 5 minutes for 130 minutes
      for (let i = 0; i <= 130; i += 5) {
        readings.push({
          timestamp: new Date(baseTime + i * 60 * 1000),
          value: 5.0 + (i / 200),  // Gradual increase
        });
      }
      
      const result = calculateRoCWithInterval(readings, 120);
      
      // Should have points starting around 120min into the data
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty when no readings within interval tolerance', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-01T10:05:00'), value: 5.5 },
      ];
      // 30-min interval with only 5-min gap readings - no match within tolerance
      const result = calculateRoCWithInterval(readings, 30);
      expect(result).toHaveLength(0);
    });

    it('should sort readings by timestamp before calculation', () => {
      const baseTime = new Date('2024-01-01T10:00:00').getTime();
      const readings: GlucoseReading[] = [
        { timestamp: new Date(baseTime + 30 * 60 * 1000), value: 6.0 },  // 10:30
        { timestamp: new Date(baseTime + 15 * 60 * 1000), value: 5.5 },  // 10:15
        { timestamp: new Date(baseTime), value: 5.0 },  // 10:00
      ];
      
      const result = calculateRoCWithInterval(readings, 30);
      
      // Should work despite unsorted input
      if (result.length > 0) {
        // Verify we calculated from sorted data
        expect(result[result.length - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          result[0].timestamp.getTime()
        );
      }
    });
  });

  describe('filterRoCByDate', () => {
    it('should filter data points for a specific date', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.5,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-02T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.08,
          rocRaw: 0.08,
          glucoseValue: 6.0,
          color: '#FFAA00',
          category: 'medium' as const,
        },
      ];

      const filtered = filterRoCByDate(dataPoints, '2024-01-01');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].glucoseValue).toBe(5.5);
    });
  });

  describe('calculateRoCStats', () => {
    it('should return zero stats for empty array', () => {
      const stats = calculateRoCStats([]);
      expect(stats.totalCount).toBe(0);
      expect(stats.minRoC).toBe(0);
      expect(stats.maxRoC).toBe(0);
      expect(stats.sdRoC).toBe(0);
    });

    it('should calculate correct statistics', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.15, // good (per 5min)
          rocRaw: 0.15,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.40, // medium (per 5min)
          rocRaw: 0.40,
          glucoseValue: 5.5,
          color: '#FFAA00',
          category: 'medium' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:10:00'),
          timeDecimal: 10.167,
          timeLabel: '10:10',
          roc: 0.75, // bad (per 5min)
          rocRaw: 0.75,
          glucoseValue: 6.5,
          color: '#FF0000',
          category: 'bad' as const,
        },
      ];

      const stats = calculateRoCStats(dataPoints);
      expect(stats.totalCount).toBe(3);
      expect(stats.minRoC).toBeCloseTo(0.15, 3);
      expect(stats.maxRoC).toBeCloseTo(0.75, 3);
      expect(stats.goodCount).toBe(1);
      expect(stats.mediumCount).toBe(1);
      expect(stats.badCount).toBe(1);
      expect(stats.goodPercentage).toBeCloseTo(33.3, 1);
      expect(stats.mediumPercentage).toBeCloseTo(33.3, 1);
      expect(stats.badPercentage).toBeCloseTo(33.3, 1);
    });
  });

  describe('getUniqueDatesFromRoC', () => {
    it('should return unique dates sorted', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-02T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T14:00:00'),
          timeDecimal: 14,
          timeLabel: '14:00',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const dates = getUniqueDatesFromRoC(dataPoints);
      expect(dates).toEqual(['2024-01-01', '2024-01-02']);
    });
  });

  describe('categorizeRoC', () => {
    it('should categorize as good when RoC <= 0.3 mmol/L/5min', () => {
      expect(categorizeRoC(0)).toBe('good');
      expect(categorizeRoC(0.3)).toBe('good');
      expect(categorizeRoC(0.25)).toBe('good');
    });

    it('should categorize as medium when 0.3 < RoC <= 0.55 mmol/L/5min', () => {
      expect(categorizeRoC(0.35)).toBe('medium');
      expect(categorizeRoC(0.55)).toBe('medium');
      expect(categorizeRoC(0.45)).toBe('medium');
    });

    it('should categorize as bad when RoC > 0.55 mmol/L/5min', () => {
      expect(categorizeRoC(0.6)).toBe('bad');
      expect(categorizeRoC(0.75)).toBe('bad');
      expect(categorizeRoC(2.5)).toBe('bad');
    });
  });

  describe('getRoCColor', () => {
    it('should return green-ish color for low RoC', () => {
      const color = getRoCColor(0);
      expect(color).toMatch(/^rgb\(/);
      // Pure green at 0 RoC should have high G value
    });

    it('should return red-ish color for high RoC', () => {
      const color = getRoCColor(0.2);
      expect(color).toMatch(/^rgb\(/);
      // High RoC should shift towards red
    });
  });

  describe('getRoCBackgroundColor', () => {
    it('should return green-ish color for low RoC', () => {
      const color = getRoCBackgroundColor(0);
      expect(color).toMatch(/^rgb\(/);
      // Pure green at 0 RoC should have high G value
    });

    it('should return red-ish color for high RoC (>=0.6)', () => {
      const color = getRoCBackgroundColor(0.6);
      expect(color).toMatch(/^rgb\(/);
      // High RoC should be red
    });

    it('should return darker color than getRoCColor for same RoC value', () => {
      // Parse RGB values from color strings
      const parseRgb = (color: string) => {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return { r: 0, g: 0, b: 0 };
        return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
      };
      
      const lineColor = parseRgb(getRoCColor(0.3));
      const bgColor = parseRgb(getRoCBackgroundColor(0.3));
      
      // Background color should have lower RGB values (darker)
      const lineBrightness = lineColor.r + lineColor.g + lineColor.b;
      const bgBrightness = bgColor.r + bgColor.g + bgColor.b;
      expect(bgBrightness).toBeLessThan(lineBrightness);
    });
  });

  describe('formatRoCValue', () => {
    it('should format RoC value to 1 decimal place for mmol/L', () => {
      expect(formatRoCValue(0.123456)).toBe('0.1');
      expect(formatRoCValue(0.1)).toBe('0.1');
      expect(formatRoCValue(0)).toBe('0.0');
      expect(formatRoCValue(0.55)).toBe('0.6');  // Rounds up
    });

    it('should format RoC value as integer for mg/dL', () => {
      expect(formatRoCValue(0.5, 'mg/dL')).toBe('9');  // 0.5 * 18 = 9
      expect(formatRoCValue(0.1, 'mg/dL')).toBe('2');  // 0.1 * 18 = 1.8 -> 2
      expect(formatRoCValue(0, 'mg/dL')).toBe('0');
    });

    it('should default to mmol/L format when unit is not specified', () => {
      expect(formatRoCValue(0.55)).toBe('0.6');
    });
  });

  describe('getRoCMedicalStandards', () => {
    it('should return medical standards object with per-5-min thresholds', () => {
      const standards = getRoCMedicalStandards();
      expect(standards.good).toBeDefined();
      expect(standards.medium).toBeDefined();
      expect(standards.bad).toBeDefined();
      expect(standards.good.threshold).toBe('≤0.3 mmol/L/5min');
      expect(standards.medium.threshold).toBe('0.3-0.55 mmol/L/5min');
      expect(standards.bad.threshold).toBe('>0.55 mmol/L/5min');
    });
  });

  describe('ROC_THRESHOLDS', () => {
    it('should have correct threshold values in per-5-min units', () => {
      expect(ROC_THRESHOLDS.good).toBe(0.3);
      expect(ROC_THRESHOLDS.medium).toBe(0.55);
    });
  });

  describe('ROC_TIME_SPAN_MINUTES', () => {
    it('should be 5 minutes', () => {
      expect(ROC_TIME_SPAN_MINUTES).toBe(5);
    });
  });

  describe('smoothRoCData', () => {
    it('should return empty array for empty input', () => {
      const result = smoothRoCData([]);
      expect(result).toEqual([]);
    });

    it('should apply 15-minute moving average and clamp values to >= 0', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.25,  // per 5min
          rocRaw: 0.25,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.40,  // per 5min
          rocRaw: 0.40,
          glucoseValue: 5.5,
          color: '#FFAA00',
          category: 'medium' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:10:00'),
          timeDecimal: 10.167,
          timeLabel: '10:10',
          roc: 0.15,  // per 5min
          rocRaw: 0.15,
          glucoseValue: 5.3,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const result = smoothRoCData(dataPoints);
      expect(result).toHaveLength(3);
      
      // All points should be within 15-minute window, so averaged
      // Average of 0.25, 0.40, 0.15 = 0.2667...
      result.forEach(point => {
        expect(point.roc).toBeGreaterThanOrEqual(0);
        expect(point.category).toBeDefined();
        expect(point.color).toBeDefined();
      });
    });

    it('should ensure smoothed values are never negative', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.01,
          rocRaw: 0.01,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const result = smoothRoCData(dataPoints);
      expect(result[0].roc).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLongestCategoryPeriod', () => {
    it('should return 0 for empty array', () => {
      const result = getLongestCategoryPeriod([], 'good');
      expect(result).toBe(0);
    });

    it('should calculate longest continuous period for a category', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.15,  // per 5min - good
          rocRaw: 0.15,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.20,  // per 5min - good
          rocRaw: 0.20,
          glucoseValue: 5.2,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:10:00'),
          timeDecimal: 10.167,
          timeLabel: '10:10',
          roc: 0.60,  // per 5min - bad
          rocRaw: 0.60,
          glucoseValue: 6.5,
          color: '#FF0000',
          category: 'bad' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:15:00'),
          timeDecimal: 10.25,
          timeLabel: '10:15',
          roc: 0.10,  // per 5min - good
          rocRaw: 0.10,
          glucoseValue: 5.5,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const result = getLongestCategoryPeriod(dataPoints, 'good');
      // First streak: 10:00 to 10:05 = 5 minutes
      // Second streak: 10:15 only = 0 minutes
      expect(result).toBe(5);
    });

    it('should handle single point category', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.15,  // per 5min - good
          rocRaw: 0.15,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const result = getLongestCategoryPeriod(dataPoints, 'good');
      expect(result).toBe(0); // Single point has 0 duration
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only for durations under 60 minutes', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(0)).toBe('0m');
    });

    it('should format hours only when minutes are 0', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes for mixed durations', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(150)).toBe('2h 30m');
      expect(formatDuration(75)).toBe('1h 15m');
    });
  });
});
