/**
 * Tests for hypoglycemia AI data extraction utilities
 */

import { describe, it, expect } from 'vitest';
import {
  extractHypoEventData,
  calculateDailyHypoSummaries,
  calculateOverallHypoStats,
  extractHypoAnalysisDatasets,
  convertHypoEventsToCSV,
  convertHypoSummariesToCSV,
} from './hypoAIDataUtils';
import type { GlucoseReading, GlucoseThresholds } from '../../types';
import type { HypoPeriod } from './hypoDataUtils';

// Helper to create glucose readings
function createReading(value: number, timestamp: Date): GlucoseReading {
  return { value, timestamp };
}

// Create readings array from values (5-minute intervals starting from baseDate)
function createReadings(values: number[], baseDate = new Date('2024-01-15T08:00:00')): GlucoseReading[] {
  return values.map((value, index) => 
    createReading(value, new Date(baseDate.getTime() + index * 5 * 60 * 1000))
  );
}

// Standard thresholds
const thresholds: GlucoseThresholds = {
  veryHigh: 13.9,
  high: 10.0,
  low: 3.9,
  veryLow: 3.0,
};

describe('hypoAIDataUtils', () => {
  describe('extractHypoEventData', () => {
    it('should return empty array for empty readings', () => {
      const result = extractHypoEventData([], []);
      expect(result).toEqual([]);
    });

    it('should return empty array for no hypo periods', () => {
      const readings = createReadings([5.0, 5.5, 6.0]);
      const result = extractHypoEventData(readings, []);
      expect(result).toEqual([]);
    });

    it('should extract readings around hypo period', () => {
      // Create 2 hours of readings (24 readings at 5-min intervals)
      const baseDate = new Date('2024-01-15T08:00:00');
      const readings: GlucoseReading[] = [];
      for (let i = 0; i < 24; i++) {
        // Normal readings except for a hypo period around readings 12-14
        let value = 5.5;
        if (i >= 12 && i <= 14) {
          value = 3.2; // Hypo
        }
        readings.push(createReading(value, new Date(baseDate.getTime() + i * 5 * 60 * 1000)));
      }

      // Create a hypo period
      const hypoPeriod: HypoPeriod = {
        startTime: readings[12].timestamp,
        endTime: readings[14].timestamp,
        durationMinutes: 10,
        nadir: 3.2,
        nadirTime: readings[13].timestamp,
        isSevere: false,
        nadirIndex: 13,
        nadirTimeDecimal: readings[13].timestamp.getHours() + readings[13].timestamp.getMinutes() / 60,
      };

      const result = extractHypoEventData(readings, [hypoPeriod]);

      expect(result).toHaveLength(1);
      expect(result[0].eventId).toBe(1);
      expect(result[0].hypoPeriod).toBe(hypoPeriod);
      expect(result[0].readings.length).toBeGreaterThan(3); // Should include surrounding readings
    });

    it('should mark nadir reading correctly', () => {
      const baseDate = new Date('2024-01-15T08:00:00');
      const readings: GlucoseReading[] = [];
      for (let i = 0; i < 24; i++) {
        let value = 5.5;
        if (i >= 12 && i <= 14) {
          value = i === 13 ? 2.8 : 3.5; // Nadir at index 13
        }
        readings.push(createReading(value, new Date(baseDate.getTime() + i * 5 * 60 * 1000)));
      }

      const hypoPeriod: HypoPeriod = {
        startTime: readings[12].timestamp,
        endTime: readings[14].timestamp,
        durationMinutes: 10,
        nadir: 2.8,
        nadirTime: readings[13].timestamp,
        isSevere: true,
        nadirIndex: 13,
        nadirTimeDecimal: readings[13].timestamp.getHours() + readings[13].timestamp.getMinutes() / 60,
      };

      const result = extractHypoEventData(readings, [hypoPeriod]);

      expect(result).toHaveLength(1);
      const nadirReading = result[0].readings.find(r => r.isNadir);
      expect(nadirReading).toBeDefined();
      expect(nadirReading!.value).toBe(2.8);
      expect(nadirReading!.minutesFromNadir).toBe(0);
    });

    it('should calculate minutes from nadir correctly', () => {
      const baseDate = new Date('2024-01-15T08:00:00');
      const readings = createReadings([5.5, 5.0, 4.5, 3.5, 3.2, 3.8, 4.5, 5.0], baseDate);

      const hypoPeriod: HypoPeriod = {
        startTime: readings[3].timestamp,
        endTime: readings[5].timestamp,
        durationMinutes: 10,
        nadir: 3.2,
        nadirTime: readings[4].timestamp,
        isSevere: false,
        nadirIndex: 4,
        nadirTimeDecimal: 0,
      };

      const result = extractHypoEventData(readings, [hypoPeriod]);

      expect(result).toHaveLength(1);
      const eventReadings = result[0].readings;
      
      // Check that readings before nadir have negative minutes
      const beforeNadir = eventReadings.filter(r => r.minutesFromNadir < 0);
      expect(beforeNadir.length).toBeGreaterThan(0);
      
      // Check that readings after nadir have positive minutes
      const afterNadir = eventReadings.filter(r => r.minutesFromNadir > 0);
      expect(afterNadir.length).toBeGreaterThan(0);
    });
  });

  describe('calculateDailyHypoSummaries', () => {
    it('should return empty array for empty readings', () => {
      const result = calculateDailyHypoSummaries([], thresholds);
      expect(result).toEqual([]);
    });

    it('should calculate summary for day with no hypos', () => {
      const readings = createReadings([5.0, 5.5, 6.0, 5.5, 5.0]);
      
      const result = calculateDailyHypoSummaries(readings, thresholds);
      
      expect(result).toHaveLength(1);
      expect(result[0].totalCount).toBe(0);
      expect(result[0].severeCount).toBe(0);
      expect(result[0].nonSevereCount).toBe(0);
      expect(result[0].lowestValue).toBeNull();
    });

    it('should calculate summary for day with hypos', () => {
      // Create readings with a hypo period
      const readings = createReadings([
        5.0, 5.0,     // Normal
        3.5, 3.4, 3.3, // 3 consecutive low readings
        4.5, 4.6, 4.7, // Recovery
        5.0, 5.0,     // Normal
      ]);
      
      const result = calculateDailyHypoSummaries(readings, thresholds);
      
      expect(result).toHaveLength(1);
      expect(result[0].totalCount).toBeGreaterThan(0);
    });

    it('should include day of week', () => {
      // Monday = 2024-01-15
      const readings = createReadings([5.0, 5.5, 6.0], new Date('2024-01-15T08:00:00'));
      
      const result = calculateDailyHypoSummaries(readings, thresholds);
      
      expect(result[0].dayOfWeek).toBe('Monday');
    });

    it('should calculate LBGI for each day', () => {
      const readings = createReadings([5.0, 5.5, 6.0, 5.5, 5.0]);
      
      const result = calculateDailyHypoSummaries(readings, thresholds);
      
      expect(result[0].lbgi).toBeDefined();
      expect(typeof result[0].lbgi).toBe('number');
    });

    it('should handle multiple days', () => {
      const day1 = new Date('2024-01-15T08:00:00');
      const day2 = new Date('2024-01-16T08:00:00');
      
      const readings = [
        ...createReadings([5.0, 5.5, 6.0], day1),
        ...createReadings([5.5, 6.0, 5.5], day2),
      ];
      
      const result = calculateDailyHypoSummaries(readings, thresholds);
      
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-16');
    });
  });

  describe('calculateOverallHypoStats', () => {
    it('should return zeros for empty summaries', () => {
      const result = calculateOverallHypoStats([]);
      
      expect(result.totalDays).toBe(0);
      expect(result.daysWithHypos).toBe(0);
      expect(result.totalHypoEvents).toBe(0);
      expect(result.averageLBGI).toBe(0);
    });

    it('should calculate overall statistics correctly', () => {
      const summaries = [
        {
          date: '2024-01-15',
          dayOfWeek: 'Monday',
          severeCount: 1,
          nonSevereCount: 2,
          totalCount: 3,
          lowestValue: 2.8,
          longestDurationMinutes: 45,
          totalDurationMinutes: 90,
          lbgi: 3.5,
        },
        {
          date: '2024-01-16',
          dayOfWeek: 'Tuesday',
          severeCount: 0,
          nonSevereCount: 1,
          totalCount: 1,
          lowestValue: 3.5,
          longestDurationMinutes: 30,
          totalDurationMinutes: 30,
          lbgi: 2.1,
        },
        {
          date: '2024-01-17',
          dayOfWeek: 'Wednesday',
          severeCount: 0,
          nonSevereCount: 0,
          totalCount: 0,
          lowestValue: null,
          longestDurationMinutes: 0,
          totalDurationMinutes: 0,
          lbgi: 1.2,
        },
      ];
      
      const result = calculateOverallHypoStats(summaries);
      
      expect(result.totalDays).toBe(3);
      expect(result.daysWithHypos).toBe(2);
      expect(result.totalHypoEvents).toBe(4);
      expect(result.totalSevereEvents).toBe(1);
      expect(result.daysWithLBGIAbove2_5).toBe(1); // Only first day > 2.5
    });

    it('should calculate average LBGI correctly', () => {
      const summaries = [
        { date: '2024-01-15', dayOfWeek: 'Monday', severeCount: 0, nonSevereCount: 0, totalCount: 0, lowestValue: null, longestDurationMinutes: 0, totalDurationMinutes: 0, lbgi: 2.0 },
        { date: '2024-01-16', dayOfWeek: 'Tuesday', severeCount: 0, nonSevereCount: 0, totalCount: 0, lowestValue: null, longestDurationMinutes: 0, totalDurationMinutes: 0, lbgi: 4.0 },
      ];
      
      const result = calculateOverallHypoStats(summaries);
      
      expect(result.averageLBGI).toBe(3.0);
    });
  });

  describe('extractHypoAnalysisDatasets', () => {
    it('should return complete datasets structure', () => {
      const readings = createReadings([5.0, 5.5, 6.0, 5.5, 5.0]);
      
      const result = extractHypoAnalysisDatasets(readings, thresholds);
      
      expect(result).toHaveProperty('hypoEvents');
      expect(result).toHaveProperty('dailySummaries');
      expect(result).toHaveProperty('overallStats');
    });

    it('should handle empty readings', () => {
      const result = extractHypoAnalysisDatasets([], thresholds);
      
      expect(result.hypoEvents).toEqual([]);
      expect(result.dailySummaries).toEqual([]);
      expect(result.overallStats.totalDays).toBe(0);
    });

    it('should sort readings by timestamp', () => {
      // Create readings in random order
      const readings = [
        createReading(5.5, new Date('2024-01-15T08:10:00')),
        createReading(5.0, new Date('2024-01-15T08:00:00')),
        createReading(6.0, new Date('2024-01-15T08:05:00')),
      ];
      
      const result = extractHypoAnalysisDatasets(readings, thresholds);
      
      // Should still work correctly
      expect(result.dailySummaries).toHaveLength(1);
    });
  });

  describe('convertHypoEventsToCSV', () => {
    it('should return empty string for empty events', () => {
      const result = convertHypoEventsToCSV([]);
      expect(result).toBe('');
    });

    it('should include correct headers', () => {
      const events = [{
        eventId: 1,
        hypoPeriod: {} as HypoPeriod,
        readings: [{
          timestamp: new Date('2024-01-15T08:00:00'),
          value: 3.2,
          isNadir: true,
          minutesFromNadir: 0,
          eventId: 1,
        }],
      }];
      
      const result = convertHypoEventsToCSV(events);
      
      expect(result).toContain('Event ID');
      expect(result).toContain('Timestamp');
      expect(result).toContain('CGM Glucose Value');
      expect(result).toContain('Is Nadir');
      expect(result).toContain('Minutes From Nadir');
    });

    it('should format readings correctly', () => {
      const events = [{
        eventId: 1,
        hypoPeriod: {} as HypoPeriod,
        readings: [{
          timestamp: new Date('2024-01-15T08:00:00Z'),
          value: 3.2,
          isNadir: true,
          minutesFromNadir: 0,
          eventId: 1,
        }],
      }];
      
      const result = convertHypoEventsToCSV(events);
      
      expect(result).toContain('1'); // Event ID
      expect(result).toContain('3.2'); // Glucose value
      expect(result).toContain('true'); // Is nadir
    });
  });

  describe('convertHypoSummariesToCSV', () => {
    it('should return empty string for empty summaries', () => {
      const result = convertHypoSummariesToCSV([]);
      expect(result).toBe('');
    });

    it('should include correct headers', () => {
      const summaries = [{
        date: '2024-01-15',
        dayOfWeek: 'Monday',
        severeCount: 1,
        nonSevereCount: 2,
        totalCount: 3,
        lowestValue: 2.8,
        longestDurationMinutes: 45,
        totalDurationMinutes: 90,
        lbgi: 3.5,
      }];
      
      const result = convertHypoSummariesToCSV(summaries);
      
      expect(result).toContain('Date');
      expect(result).toContain('Day Of Week');
      expect(result).toContain('Severe Count');
      expect(result).toContain('Non-Severe Count');
      expect(result).toContain('Total Count');
      expect(result).toContain('Lowest Value');
      expect(result).toContain('LBGI');
    });

    it('should format summary correctly', () => {
      const summaries = [{
        date: '2024-01-15',
        dayOfWeek: 'Monday',
        severeCount: 1,
        nonSevereCount: 2,
        totalCount: 3,
        lowestValue: 2.8,
        longestDurationMinutes: 45,
        totalDurationMinutes: 90,
        lbgi: 3.5,
      }];
      
      const result = convertHypoSummariesToCSV(summaries);
      
      expect(result).toContain('2024-01-15');
      expect(result).toContain('Monday');
      expect(result).toContain('3.50'); // LBGI with 2 decimal places
    });

    it('should handle null lowest value', () => {
      const summaries = [{
        date: '2024-01-15',
        dayOfWeek: 'Monday',
        severeCount: 0,
        nonSevereCount: 0,
        totalCount: 0,
        lowestValue: null,
        longestDurationMinutes: 0,
        totalDurationMinutes: 0,
        lbgi: 1.0,
      }];
      
      const result = convertHypoSummariesToCSV(summaries);
      
      expect(result).toContain('N/A');
    });
  });
});
