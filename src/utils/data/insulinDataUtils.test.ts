/**
 * Tests for insulin data utilities
 */

import { describe, it, expect } from 'vitest';
import { aggregateInsulinByDate, prepareInsulinTimelineData, calculateIOB, prepareHourlyIOBData } from './insulinDataUtils';
import type { InsulinReading } from '../../types';

describe('insulinDataUtils', () => {
  describe('aggregateInsulinByDate', () => {
    it('should aggregate insulin readings by date', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 10, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T12:00:00'), dose: 5, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-01T18:00:00'), dose: 8, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-02T08:00:00'), dose: 12, insulinType: 'basal' },
        { timestamp: new Date('2024-01-02T12:00:00'), dose: 6, insulinType: 'bolus' },
      ];

      const result = aggregateInsulinByDate(readings);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        basalTotal: 10,
        bolusTotal: 13,
        totalInsulin: 23,
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        basalTotal: 12,
        bolusTotal: 6,
        totalInsulin: 18,
      });
    });

    it('should handle empty readings array', () => {
      const readings: InsulinReading[] = [];
      const result = aggregateInsulinByDate(readings);
      expect(result).toEqual([]);
    });

    it('should handle dates with only basal insulin', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 10, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T20:00:00'), dose: 12, insulinType: 'basal' },
      ];

      const result = aggregateInsulinByDate(readings);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        basalTotal: 22,
        bolusTotal: 0,
        totalInsulin: 22,
      });
    });

    it('should handle dates with only bolus insulin', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T12:00:00'), dose: 5, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-01T18:00:00'), dose: 8, insulinType: 'bolus' },
      ];

      const result = aggregateInsulinByDate(readings);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        basalTotal: 0,
        bolusTotal: 13,
        totalInsulin: 13,
      });
    });

    it('should round values to 1 decimal place', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 10.567, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T12:00:00'), dose: 5.234, insulinType: 'bolus' },
      ];

      const result = aggregateInsulinByDate(readings);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        basalTotal: 10.6,
        bolusTotal: 5.2,
        totalInsulin: 15.8,
      });
    });

    it('should sort dates chronologically', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-03T08:00:00'), dose: 10, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 12, insulinType: 'basal' },
        { timestamp: new Date('2024-01-02T08:00:00'), dose: 11, insulinType: 'basal' },
      ];

      const result = aggregateInsulinByDate(readings);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[1].date).toBe('2024-01-02');
      expect(result[2].date).toBe('2024-01-03');
    });
  });

  describe('prepareInsulinTimelineData', () => {
    it('should prepare 24-hour timeline data for a specific date', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 2.5, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T08:30:00'), dose: 5.0, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-01T12:00:00'), dose: 2.0, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T12:15:00'), dose: 8.0, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-01T18:00:00'), dose: 6.5, insulinType: 'bolus' },
      ];

      const result = prepareInsulinTimelineData(readings, '2024-01-01');

      // Should return 24 hours of data
      expect(result).toHaveLength(24);
      
      // Check hour 8 (has both basal and bolus)
      const hour8 = result[8];
      expect(hour8.hour).toBe(8);
      expect(hour8.timeLabel).toBe('08:00');
      expect(hour8.basalRate).toBe(2.5);
      expect(hour8.bolusTotal).toBe(5.0);

      // Check hour 12 (has both basal and bolus)
      const hour12 = result[12];
      expect(hour12.hour).toBe(12);
      expect(hour12.timeLabel).toBe('12:00');
      expect(hour12.basalRate).toBe(2.0);
      expect(hour12.bolusTotal).toBe(8.0);

      // Check hour 18 (has only bolus)
      const hour18 = result[18];
      expect(hour18.hour).toBe(18);
      expect(hour18.timeLabel).toBe('18:00');
      expect(hour18.basalRate).toBe(0);
      expect(hour18.bolusTotal).toBe(6.5);

      // Check hour 0 (no data)
      const hour0 = result[0];
      expect(hour0.hour).toBe(0);
      expect(hour0.timeLabel).toBe('00:00');
      expect(hour0.basalRate).toBe(0);
      expect(hour0.bolusTotal).toBe(0);
    });

    it('should filter readings by specified date', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 2.5, insulinType: 'basal' },
        { timestamp: new Date('2024-01-02T08:00:00'), dose: 3.0, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T12:00:00'), dose: 5.0, insulinType: 'bolus' },
      ];

      const result = prepareInsulinTimelineData(readings, '2024-01-01');

      // Should only include data from 2024-01-01
      const hour8 = result[8];
      expect(hour8.basalRate).toBe(2.5);
      expect(hour8.bolusTotal).toBe(0);

      const hour12 = result[12];
      expect(hour12.basalRate).toBe(0);
      expect(hour12.bolusTotal).toBe(5.0);
    });

    it('should handle empty readings array', () => {
      const readings: InsulinReading[] = [];
      const result = prepareInsulinTimelineData(readings, '2024-01-01');

      expect(result).toHaveLength(24);
      result.forEach(hour => {
        expect(hour.basalRate).toBe(0);
        expect(hour.bolusTotal).toBe(0);
      });
    });

    it('should average multiple basal readings in the same hour', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 2.0, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T08:30:00'), dose: 3.0, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T08:45:00'), dose: 4.0, insulinType: 'basal' },
      ];

      const result = prepareInsulinTimelineData(readings, '2024-01-01');
      const hour8 = result[8];

      // Average of 2.0, 3.0, 4.0 should be 3.0
      expect(hour8.basalRate).toBe(3.0);
    });

    it('should sum multiple bolus readings in the same hour', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T12:00:00'), dose: 5.0, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-01T12:30:00'), dose: 3.0, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-01T12:45:00'), dose: 2.5, insulinType: 'bolus' },
      ];

      const result = prepareInsulinTimelineData(readings, '2024-01-01');
      const hour12 = result[12];

      // Sum of 5.0 + 3.0 + 2.5 should be 10.5
      expect(hour12.bolusTotal).toBe(10.5);
    });

    it('should format time labels correctly', () => {
      const readings: InsulinReading[] = [];
      const result = prepareInsulinTimelineData(readings, '2024-01-01');

      expect(result[0].timeLabel).toBe('00:00');
      expect(result[9].timeLabel).toBe('09:00');
      expect(result[23].timeLabel).toBe('23:00');
    });
  });

  describe('German language support', () => {
    it('should extract insulin readings from German CSV file', async () => {
      const JSZip = (await import('jszip')).default;
      const { extractInsulinReadings } = await import('./insulinDataUtils');
      
      const zip = new JSZip();
      
      // Create German basal insulin file
      const basalLines: string[] = [];
      basalLines.push('Name:Test Patient\tDate Range:2025-01-01 - 2025-01-14');
      basalLines.push('Zeitstempel\tInsulin-Typ\tDauer (Minuten)\tRate'); // German headers
      basalLines.push('2025-01-01 08:00:00\tBasal\t60\t1.0');
      basalLines.push('2025-01-01 09:00:00\tBasal\t60\t1.2');
      zip.file('basal_data_1.csv', basalLines.join('\n'));
      
      // Create German bolus insulin file
      const bolusLines: string[] = [];
      bolusLines.push('Name:Test Patient\tDate Range:2025-01-01 - 2025-01-14');
      bolusLines.push('Zeitstempel\tInsulin-Typ\tAbgegebenes Insulin (E)\tSeriennummer'); // German headers
      bolusLines.push('2025-01-01 12:00:00\tBolus\t5.5\t123456');
      bolusLines.push('2025-01-01 18:00:00\tBolus\t7.0\t123456');
      zip.file('bolus_data_1.csv', bolusLines.join('\n'));
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'test.zip', { type: 'application/zip' });
      
      const uploadedFile = {
        id: 'test-id',
        name: 'test.zip',
        size: blob.size,
        uploadTime: new Date(),
        file,
        zipMetadata: {
          isValid: true,
          csvFiles: [
            {
              name: 'basal',
              rowCount: 2,
              columnNames: ['Zeitstempel', 'Insulin-Typ', 'Dauer (Minuten)', 'Rate'],
            },
            {
              name: 'bolus',
              rowCount: 2,
              columnNames: ['Zeitstempel', 'Insulin-Typ', 'Abgegebenes Insulin (E)', 'Seriennummer'],
            }
          ],
        },
      };
      
      const readings = await extractInsulinReadings(uploadedFile);
      
      expect(readings).toHaveLength(4);
      
      // Check basal readings
      const basalReadings = readings.filter(r => r.insulinType === 'basal');
      expect(basalReadings).toHaveLength(2);
      expect(basalReadings[0].dose).toBe(1.0);
      expect(basalReadings[1].dose).toBe(1.2);
      
      // Check bolus readings
      const bolusReadings = readings.filter(r => r.insulinType === 'bolus');
      expect(bolusReadings).toHaveLength(2);
      expect(bolusReadings[0].dose).toBe(5.5);
      expect(bolusReadings[1].dose).toBe(7.0);
    });
  });

  describe('calculateIOB', () => {
    it('should calculate IOB with linear decay', () => {
      // Create a reading 2 hours ago with 10 units
      const now = new Date('2024-01-01T12:00:00');
      const twoHoursAgo = new Date('2024-01-01T10:00:00');
      
      const readings: InsulinReading[] = [
        { timestamp: twoHoursAgo, dose: 10, insulinType: 'bolus' }
      ];

      // With 5-hour duration, after 2 hours: IOB = 10 * (1 - 2/5) = 10 * 0.6 = 6
      const iob = calculateIOB(readings, now, 5);
      expect(iob).toBe(6);
    });

    it('should return 0 IOB when insulin has fully decayed', () => {
      const now = new Date('2024-01-01T12:00:00');
      const sixHoursAgo = new Date('2024-01-01T06:00:00');
      
      const readings: InsulinReading[] = [
        { timestamp: sixHoursAgo, dose: 10, insulinType: 'bolus' }
      ];

      // With 5-hour duration, after 6 hours: IOB = 0
      const iob = calculateIOB(readings, now, 5);
      expect(iob).toBe(0);
    });

    it('should sum IOB from multiple readings', () => {
      const now = new Date('2024-01-01T12:00:00');
      const oneHourAgo = new Date('2024-01-01T11:00:00');
      const threeHoursAgo = new Date('2024-01-01T09:00:00');
      
      const readings: InsulinReading[] = [
        { timestamp: oneHourAgo, dose: 10, insulinType: 'bolus' },
        { timestamp: threeHoursAgo, dose: 5, insulinType: 'basal' }
      ];

      // After 1 hour: 10 * (1 - 1/5) = 8
      // After 3 hours: 5 * (1 - 3/5) = 2
      // Total: 10
      const iob = calculateIOB(readings, now, 5);
      expect(iob).toBe(10);
    });

    it('should ignore readings after target time', () => {
      const now = new Date('2024-01-01T12:00:00');
      const futureTime = new Date('2024-01-01T13:00:00');
      
      const readings: InsulinReading[] = [
        { timestamp: futureTime, dose: 10, insulinType: 'bolus' }
      ];

      const iob = calculateIOB(readings, now, 5);
      expect(iob).toBe(0);
    });

    it('should handle empty readings array', () => {
      const now = new Date('2024-01-01T12:00:00');
      const iob = calculateIOB([], now, 5);
      expect(iob).toBe(0);
    });

    it('should work with different insulin durations', () => {
      const now = new Date('2024-01-01T12:00:00');
      const twoHoursAgo = new Date('2024-01-01T10:00:00');
      
      const readings: InsulinReading[] = [
        { timestamp: twoHoursAgo, dose: 10, insulinType: 'bolus' }
      ];

      // With 4-hour duration, after 2 hours: IOB = 10 * (1 - 2/4) = 5
      const iob = calculateIOB(readings, now, 4);
      expect(iob).toBe(5);
    });
  });

  describe('prepareHourlyIOBData', () => {
    it('should prepare 24 hours of IOB data', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:30:00'), dose: 2.5, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T08:45:00'), dose: 5, insulinType: 'bolus' }
      ];

      const data = prepareHourlyIOBData(readings, '2024-01-01', 5);
      
      expect(data).toHaveLength(24);
      expect(data[0].hour).toBe(0);
      expect(data[23].hour).toBe(23);
    });

    it('should calculate insulin values during each hour', () => {
      // Add readings in hour 8 (8:00-9:00)
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:30:00'), dose: 2.5, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T08:45:00'), dose: 5, insulinType: 'bolus' }
      ];

      const data = prepareHourlyIOBData(readings, '2024-01-01', 5);
      
      // Hour 8 should show basal rate (single reading, so average = value) and bolus sum
      const hour8Data = data[8];
      expect(hour8Data.basalInPreviousHour).toBe(2.5);  // Average of single reading
      expect(hour8Data.bolusInPreviousHour).toBe(5);    // Sum of bolus doses
    });

    it('should average basal readings when multiple readings in same hour', () => {
      // Add multiple basal readings in hour 8
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:15:00'), dose: 2.0, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T08:30:00'), dose: 3.0, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T08:45:00'), dose: 4.0, insulinType: 'basal' }
      ];

      const data = prepareHourlyIOBData(readings, '2024-01-01', 5);
      
      // Hour 8 should show average of basal readings: (2 + 3 + 4) / 3 = 3.0
      const hour8Data = data[8];
      expect(hour8Data.basalInPreviousHour).toBe(3.0);
    });

    it('should calculate active IOB at each hour', () => {
      // Add bolus at 08:00
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 10, insulinType: 'bolus' }
      ];

      const data = prepareHourlyIOBData(readings, '2024-01-01', 5);
      
      // At 10:00 (2 hours later): IOB = 10 * (1 - 2/5) = 6
      const hour10Data = data[10];
      expect(hour10Data.activeIOB).toBe(6);
    });

    it('should format time labels correctly', () => {
      const data = prepareHourlyIOBData([], '2024-01-01', 5);
      
      expect(data[0].timeLabel).toBe('00:00');
      expect(data[9].timeLabel).toBe('09:00');
      expect(data[23].timeLabel).toBe('23:00');
    });

    it('should handle no readings gracefully', () => {
      const data = prepareHourlyIOBData([], '2024-01-01', 5);
      
      expect(data).toHaveLength(24);
      data.forEach(hour => {
        expect(hour.basalInPreviousHour).toBe(0);
        expect(hour.bolusInPreviousHour).toBe(0);
        expect(hour.activeIOB).toBe(0);
      });
    });

    it('should use custom insulin duration', () => {
      // Add bolus at 08:00
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00'), dose: 10, insulinType: 'bolus' }
      ];

      // With 4-hour duration
      const data = prepareHourlyIOBData(readings, '2024-01-01', 4);
      
      // At 10:00 (2 hours later): IOB = 10 * (1 - 2/4) = 5
      const hour10Data = data[10];
      expect(hour10Data.activeIOB).toBe(5);
    });
  });
});
