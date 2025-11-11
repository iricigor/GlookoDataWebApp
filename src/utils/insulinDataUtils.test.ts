/**
 * Tests for insulin data utilities
 */

import { describe, it, expect } from 'vitest';
import { aggregateInsulinByDate } from './insulinDataUtils';
import type { InsulinReading } from '../types';

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
});
