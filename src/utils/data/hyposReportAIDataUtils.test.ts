/**
 * Tests for hyposReportAIDataUtils
 */

import { describe, it, expect } from 'vitest';
import {
  extractDetailedHypoEvents,
  convertDetailedHypoEventsToCSV,
  getHypoEventCountForDate,
  hasHypoEventsForDate,
  parseHypoAIResponseByDate,
} from './hyposReportAIDataUtils';
import type { GlucoseReading, GlucoseThresholds, InsulinReading } from '../../types';

describe('hyposReportAIDataUtils', () => {
  const defaultThresholds: GlucoseThresholds = {
    veryHigh: 13.9,
    high: 10.0,
    low: 3.9,
    veryLow: 3.0,
  };

  // Create sample glucose readings that simulate a hypo event
  function createHypoReadings(startDate: Date): GlucoseReading[] {
    const readings: GlucoseReading[] = [];
    const baseTime = startDate.getTime();
    
    // Normal readings leading up to hypo
    for (let i = 0; i < 12; i++) {
      readings.push({
        timestamp: new Date(baseTime + i * 5 * 60 * 1000), // Every 5 minutes
        value: 6.0 - (i * 0.2), // Gradually decreasing from 6.0
      });
    }
    
    // Hypo readings (below 3.9)
    for (let i = 0; i < 6; i++) {
      readings.push({
        timestamp: new Date(baseTime + (12 + i) * 5 * 60 * 1000),
        value: 3.5 - (i * 0.1), // Going down to 3.0 (nadir)
      });
    }
    
    // Recovery readings
    for (let i = 0; i < 12; i++) {
      readings.push({
        timestamp: new Date(baseTime + (18 + i) * 5 * 60 * 1000),
        value: 3.0 + (i * 0.3), // Recovering from 3.0
      });
    }
    
    return readings;
  }

  describe('extractDetailedHypoEvents', () => {
    it('should return empty array when no readings', () => {
      const result = extractDetailedHypoEvents([], defaultThresholds);
      expect(result).toEqual([]);
    });

    it('should return empty array when no hypo events', () => {
      const normalReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-01T10:05:00'), value: 6.2 },
        { timestamp: new Date('2024-01-01T10:10:00'), value: 6.1 },
      ];
      const result = extractDetailedHypoEvents(normalReadings, defaultThresholds);
      expect(result).toEqual([]);
    });

    it('should extract detailed hypo event data', () => {
      const readings = createHypoReadings(new Date('2024-01-15T10:00:00'));
      const result = extractDetailedHypoEvents(readings, defaultThresholds);
      
      expect(result.length).toBeGreaterThan(0);
      if (result.length > 0) {
        const event = result[0];
        expect(event.eventId).toBe('E-001');
        expect(event.nadirValueMgdl).toBeGreaterThan(50); // ~3.0 mmol/L = ~54 mg/dL
        expect(event.durationMins).toBeGreaterThan(0);
        expect(event.timeOfDayCode).toBeGreaterThanOrEqual(0);
        expect(event.timeOfDayCode).toBeLessThanOrEqual(23);
      }
    });

    it('should filter events by date when dateFilter provided', () => {
      const readings1 = createHypoReadings(new Date('2024-01-15T10:00:00'));
      const readings2 = createHypoReadings(new Date('2024-01-16T14:00:00'));
      const allReadings = [...readings1, ...readings2];
      
      const resultAll = extractDetailedHypoEvents(allReadings, defaultThresholds);
      const resultFiltered = extractDetailedHypoEvents(allReadings, defaultThresholds, [], [], '2024-01-15');
      
      expect(resultFiltered.length).toBeLessThan(resultAll.length);
    });

    it('should include bolus data when provided', () => {
      const readings = createHypoReadings(new Date('2024-01-15T10:00:00'));
      const bolusReadings: InsulinReading[] = [
        {
          timestamp: new Date('2024-01-15T07:00:00'), // 3 hours before
          dose: 5.0,
          insulinType: 'bolus',
        },
      ];
      
      const result = extractDetailedHypoEvents(readings, defaultThresholds, bolusReadings);
      
      if (result.length > 0) {
        // The bolus should be found since it's within 6 hours before the event
        expect(result[0].lastBolusUnits).toBeDefined();
      }
    });

    it('should include CGM curve data at specific time offsets', () => {
      const readings = createHypoReadings(new Date('2024-01-15T10:00:00'));
      const result = extractDetailedHypoEvents(readings, defaultThresholds);
      
      if (result.length > 0) {
        const event = result[0];
        // These may be null if readings don't align exactly, but the fields should exist
        expect('gTMinus60' in event).toBe(true);
        expect('gTMinus30' in event).toBe(true);
        expect('gTMinus10' in event).toBe(true);
        expect('gNadirPlus15' in event).toBe(true);
      }
    });
  });

  describe('convertDetailedHypoEventsToCSV', () => {
    it('should return empty string for empty events', () => {
      const result = convertDetailedHypoEventsToCSV([]);
      expect(result).toBe('');
    });

    it('should generate CSV with headers and data', () => {
      const readings = createHypoReadings(new Date('2024-01-15T10:00:00'));
      const events = extractDetailedHypoEvents(readings, defaultThresholds);
      const csv = convertDetailedHypoEventsToCSV(events);
      
      if (events.length > 0) {
        expect(csv).toContain('Event_ID');
        expect(csv).toContain('Start_Time');
        expect(csv).toContain('Nadir_Value_mg_dL');
        expect(csv).toContain('E-001');
      }
    });

    it('should include all required columns', () => {
      const readings = createHypoReadings(new Date('2024-01-15T10:00:00'));
      const events = extractDetailedHypoEvents(readings, defaultThresholds);
      const csv = convertDetailedHypoEventsToCSV(events);
      
      if (events.length > 0) {
        const requiredColumns = [
          'Event_ID',
          'Start_Time',
          'Nadir_Value_mg_dL',
          'Duration_Mins',
          'Max_RoC_mg_dL_min',
          'Time_To_Nadir_Mins',
          'Last_Bolus_Units',
          'Time_of_Day_Code',
          'G_T_Minus_60',
          'G_T_Minus_30',
        ];
        
        requiredColumns.forEach(col => {
          expect(csv).toContain(col);
        });
      }
    });
  });

  describe('getHypoEventCountForDate', () => {
    it('should return 0 when no readings', () => {
      const count = getHypoEventCountForDate([], defaultThresholds, '2024-01-15');
      expect(count).toBe(0);
    });

    it('should return 0 when no hypos on the date', () => {
      const normalReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T10:05:00'), value: 6.2 },
      ];
      const count = getHypoEventCountForDate(normalReadings, defaultThresholds, '2024-01-15');
      expect(count).toBe(0);
    });

    it('should count hypos on a specific date', () => {
      const readings = createHypoReadings(new Date('2024-01-15T10:00:00'));
      const count = getHypoEventCountForDate(readings, defaultThresholds, '2024-01-15');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('hasHypoEventsForDate', () => {
    it('should return false when no hypos', () => {
      const result = hasHypoEventsForDate([], defaultThresholds, '2024-01-15');
      expect(result).toBe(false);
    });

    it('should return true when hypos exist', () => {
      const readings = createHypoReadings(new Date('2024-01-15T10:00:00'));
      const result = hasHypoEventsForDate(readings, defaultThresholds, '2024-01-15');
      expect(result).toBe(true);
    });
  });

  describe('parseHypoAIResponseByDate', () => {
    it('should return empty map for response without table', () => {
      const response = 'Some text without a table';
      const result = parseHypoAIResponseByDate(response);
      expect(result.size).toBe(0);
    });

    it('should parse markdown table format', () => {
      const response = `
Here is the analysis:

| Date | Event Time | Nadir Value | Primary Suspect | Deducted Meal Time | Actionable Insight |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2024-01-15 | 03:45 | 52 mg/dL | Basal Excess | N/A | Reduce overnight basal by 10% |
| 2024-01-15 | 14:30 | 58 mg/dL | Bolus Overlap | 12:45 | Extend bolus duration |
| 2024-01-16 | 10:00 | 60 mg/dL | Unknown | N/A | Monitor patterns |
`;
      const result = parseHypoAIResponseByDate(response);
      
      expect(result.has('2024-01-15')).toBe(true);
      expect(result.has('2024-01-16')).toBe(true);
      
      const jan15Events = result.get('2024-01-15');
      expect(jan15Events).toBeDefined();
      expect(jan15Events!.length).toBe(2);
      expect(jan15Events![0].eventTime).toBe('03:45');
      expect(jan15Events![0].primarySuspect).toBe('Basal Excess');
      expect(jan15Events![0].deductedMealTime).toBeNull(); // N/A becomes null
      
      expect(jan15Events![1].eventTime).toBe('14:30');
      expect(jan15Events![1].deductedMealTime).toBe('12:45');
    });

    it('should handle empty table', () => {
      const response = `
| Date | Event Time | Nadir Value | Primary Suspect | Deducted Meal Time | Actionable Insight |
| :--- | :--- | :--- | :--- | :--- | :--- |
`;
      const result = parseHypoAIResponseByDate(response);
      expect(result.size).toBe(0);
    });

    it('should parse JSON array format in code block', () => {
      const response = `
Here is the analysis:

\`\`\`json
[
  {
    "date": "2024-01-15",
    "eventTime": "03:45",
    "nadirValue": "52 mg/dL",
    "primarySuspect": "Basal Excess (Nocturnal)",
    "deductedMealTime": null,
    "actionableInsight": "Reduce overnight basal by 10%"
  },
  {
    "date": "2024-01-15",
    "eventTime": "14:30",
    "nadirValue": "58 mg/dL",
    "primarySuspect": "Bolus Overlap (B1+B2)",
    "deductedMealTime": "12:45",
    "actionableInsight": "Extend bolus duration"
  },
  {
    "date": "2024-01-16",
    "eventTime": "10:00",
    "nadirValue": "60 mg/dL",
    "primarySuspect": "Time/Hormonal Shift",
    "deductedMealTime": null,
    "actionableInsight": "Monitor patterns"
  }
]
\`\`\`
`;
      const result = parseHypoAIResponseByDate(response);
      
      expect(result.has('2024-01-15')).toBe(true);
      expect(result.has('2024-01-16')).toBe(true);
      
      const jan15Events = result.get('2024-01-15');
      expect(jan15Events).toBeDefined();
      expect(jan15Events!.length).toBe(2);
      expect(jan15Events![0].eventTime).toBe('03:45');
      expect(jan15Events![0].primarySuspect).toBe('Basal Excess (Nocturnal)');
      expect(jan15Events![0].deductedMealTime).toBeNull();
      
      expect(jan15Events![1].eventTime).toBe('14:30');
      expect(jan15Events![1].deductedMealTime).toBe('12:45');
    });

    it('should parse raw JSON array without code block', () => {
      const response = `
Here is the analysis:
[{"date": "2024-01-15", "eventTime": "03:45", "nadirValue": "52 mg/dL", "primarySuspect": "Basal Excess", "deductedMealTime": null, "actionableInsight": "Reduce basal"}]
`;
      const result = parseHypoAIResponseByDate(response);
      
      expect(result.has('2024-01-15')).toBe(true);
      const jan15Events = result.get('2024-01-15');
      expect(jan15Events).toBeDefined();
      expect(jan15Events!.length).toBe(1);
      expect(jan15Events![0].eventTime).toBe('03:45');
    });

    it('should prefer JSON over markdown table when both present', () => {
      const response = `
\`\`\`json
[{"date": "2024-01-15", "eventTime": "10:00", "nadirValue": "55 mg/dL", "primarySuspect": "JSON Source", "deductedMealTime": null, "actionableInsight": "From JSON"}]
\`\`\`

| Date | Event Time | Nadir Value | Primary Suspect | Deducted Meal Time | Actionable Insight |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2024-01-15 | 11:00 | 60 mg/dL | Table Source | N/A | From Table |
`;
      const result = parseHypoAIResponseByDate(response);
      
      const jan15Events = result.get('2024-01-15');
      expect(jan15Events).toBeDefined();
      expect(jan15Events!.length).toBe(1);
      expect(jan15Events![0].primarySuspect).toBe('JSON Source'); // JSON takes precedence
    });

    it('should fall back to markdown table if JSON is invalid', () => {
      const response = `
\`\`\`json
[{"date": "2024-01-15", invalid json here}]
\`\`\`

| Date | Event Time | Nadir Value | Primary Suspect | Deducted Meal Time | Actionable Insight |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2024-01-15 | 11:00 | 60 mg/dL | Table Fallback | N/A | Works as fallback |
`;
      const result = parseHypoAIResponseByDate(response);
      
      const jan15Events = result.get('2024-01-15');
      expect(jan15Events).toBeDefined();
      expect(jan15Events!.length).toBe(1);
      expect(jan15Events![0].primarySuspect).toBe('Table Fallback');
    });

    it('should skip invalid items in JSON array', () => {
      const response = `
\`\`\`json
[
  {"date": "2024-01-15", "eventTime": "03:45", "nadirValue": "52 mg/dL", "primarySuspect": "Valid", "deductedMealTime": null, "actionableInsight": "Good"},
  {"date": "2024-01-15", "eventTime": "10:00"},
  {"invalid": "object"},
  {"date": "2024-01-16", "eventTime": "08:00", "nadirValue": "55 mg/dL", "primarySuspect": "Also Valid", "deductedMealTime": null, "actionableInsight": "Good too"}
]
\`\`\`
`;
      const result = parseHypoAIResponseByDate(response);
      
      expect(result.has('2024-01-15')).toBe(true);
      expect(result.has('2024-01-16')).toBe(true);
      
      const jan15Events = result.get('2024-01-15');
      expect(jan15Events!.length).toBe(1); // Only the valid one
      
      const jan16Events = result.get('2024-01-16');
      expect(jan16Events!.length).toBe(1);
    });

    it('should handle empty JSON array', () => {
      const response = `
\`\`\`json
[]
\`\`\`
`;
      const result = parseHypoAIResponseByDate(response);
      expect(result.size).toBe(0);
    });
  });
});
