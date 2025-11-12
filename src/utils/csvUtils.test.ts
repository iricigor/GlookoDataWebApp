/**
 * Tests for CSV utility functions
 */

import { describe, it, expect } from 'vitest';
import { 
  convertToCSV, 
  convertDailyReportsToCSV,
  convertGlucoseReadingsToCSV,
  convertBolusReadingsToCSV,
  convertBasalReadingsToCSV
} from './csvUtils';
import type { DailyReport, GlucoseReading, InsulinReading } from '../types';

describe('csvUtils', () => {
  describe('convertToCSV', () => {
    it('should convert simple 2D array to CSV', () => {
      const data = [
        ['Name', 'Age', 'City'],
        ['John', '30', 'New York'],
        ['Jane', '25', 'Los Angeles'],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name,Age,City\nJohn,30,New York\nJane,25,Los Angeles');
    });

    it('should handle cells with commas by wrapping in quotes', () => {
      const data = [
        ['Name', 'Address'],
        ['John Doe', 'New York, NY'],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name,Address\nJohn Doe,"New York, NY"');
    });

    it('should handle cells with quotes by escaping them', () => {
      const data = [
        ['Name', 'Quote'],
        ['John', 'He said "Hello"'],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name,Quote\nJohn,"He said ""Hello"""');
    });

    it('should handle cells with newlines by wrapping in quotes', () => {
      const data = [
        ['Name', 'Description'],
        ['John', 'Line 1\nLine 2'],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name,Description\nJohn,"Line 1\nLine 2"');
    });

    it('should handle empty cells', () => {
      const data = [
        ['Name', 'Age', 'City'],
        ['John', '', 'New York'],
        ['', '25', ''],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name,Age,City\nJohn,,New York\n,25,');
    });

    it('should handle null and undefined values', () => {
      const data = [
        ['Name', 'Age', 'City'],
        ['John', null as unknown as string, 'New York'],
        [undefined as unknown as string, '25', ''],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name,Age,City\nJohn,,New York\n,25,');
    });

    it('should handle numbers', () => {
      const data = [
        ['Name', 'Age', 'Score'],
        ['John', 30, 95.5],
        ['Jane', 25, 88.3],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name,Age,Score\nJohn,30,95.5\nJane,25,88.3');
    });

    it('should return empty string for empty array', () => {
      const result = convertToCSV([]);
      
      expect(result).toBe('');
    });

    it('should handle single row', () => {
      const data = [['Header 1', 'Header 2', 'Header 3']];

      const result = convertToCSV(data);
      
      expect(result).toBe('Header 1,Header 2,Header 3');
    });

    it('should handle single column', () => {
      const data = [
        ['Name'],
        ['John'],
        ['Jane'],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name\nJohn\nJane');
    });

    it('should handle complex mixed content', () => {
      const data = [
        ['Day', 'Low', 'In Range', 'Total'],
        ['Monday', '10% (50)', '85% (425)', '500'],
        ['Tuesday', '5% (25)', '90% (450)', '500'],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Day,Low,In Range,Total\nMonday,10% (50),85% (425),500\nTuesday,5% (25),90% (450),500');
    });

    it('should handle cells with both commas and quotes', () => {
      const data = [
        ['Name', 'Quote'],
        ['John', 'He said, "Hello, World!"'],
      ];

      const result = convertToCSV(data);
      
      expect(result).toBe('Name,Quote\nJohn,"He said, ""Hello, World!"""');
    });
  });

  describe('convertDailyReportsToCSV', () => {
    it('should convert daily reports to CSV with headers', () => {
      const reports: DailyReport[] = [
        {
          date: '2024-01-01',
          stats: { low: 10, inRange: 85, high: 5, total: 100 },
          basalInsulin: 20.5,
          bolusInsulin: 15.3,
          totalInsulin: 35.8,
        },
        {
          date: '2024-01-02',
          stats: { low: 5, inRange: 90, high: 5, total: 100 },
          basalInsulin: 21.0,
          bolusInsulin: 16.0,
          totalInsulin: 37.0,
        },
      ];

      const result = convertDailyReportsToCSV(reports);
      
      // Check headers
      expect(result).toContain('Date,Day of Week,BG Below (%),BG In Range (%),BG Above (%)');
      expect(result).toContain('Basal Insulin,Bolus Insulin,Total Insulin');
      
      // Check data rows
      expect(result).toContain('2024-01-01,Monday,10,85,5,20.50,15.30,35.80');
      expect(result).toContain('2024-01-02,Tuesday,5,90,5,21.00,16.00,37.00');
    });

    it('should handle missing insulin data', () => {
      const reports: DailyReport[] = [
        {
          date: '2024-01-01',
          stats: { low: 10, inRange: 85, high: 5, total: 100 },
        },
      ];

      const result = convertDailyReportsToCSV(reports);
      
      expect(result).toContain('Date,Day of Week,BG Below (%),BG In Range (%),BG Above (%)');
      expect(result).toContain('2024-01-01,Monday,10,85,5,,,');
    });

    it('should handle empty array', () => {
      const result = convertDailyReportsToCSV([]);
      
      expect(result).toBe('');
    });

    it('should calculate percentages correctly', () => {
      const reports: DailyReport[] = [
        {
          date: '2024-01-01',
          stats: { low: 25, inRange: 50, high: 25, total: 100 },
          basalInsulin: 20.0,
          bolusInsulin: 15.0,
          totalInsulin: 35.0,
        },
      ];

      const result = convertDailyReportsToCSV(reports);
      
      expect(result).toContain('2024-01-01,Monday,25,50,25,20.00,15.00,35.00');
    });

    it('should handle different days of the week correctly', () => {
      const reports: DailyReport[] = [
        {
          date: '2024-01-07', // Sunday
          stats: { low: 10, inRange: 80, high: 10, total: 100 },
        },
        {
          date: '2024-01-13', // Saturday
          stats: { low: 15, inRange: 75, high: 10, total: 100 },
        },
      ];

      const result = convertDailyReportsToCSV(reports);
      
      expect(result).toContain('2024-01-07,Sunday');
      expect(result).toContain('2024-01-13,Saturday');
    });

    it('should format insulin values with 2 decimal places', () => {
      const reports: DailyReport[] = [
        {
          date: '2024-01-01',
          stats: { low: 10, inRange: 80, high: 10, total: 100 },
          basalInsulin: 20.123456,
          bolusInsulin: 15.987654,
          totalInsulin: 36.111110,
        },
      ];

      const result = convertDailyReportsToCSV(reports);
      
      expect(result).toContain('20.12,15.99,36.11');
    });
  });

  describe('convertGlucoseReadingsToCSV', () => {
    it('should convert glucose readings to CSV with headers', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00Z'), value: 6.5 },
        { timestamp: new Date('2024-01-01T08:05:00Z'), value: 7.2 },
        { timestamp: new Date('2024-01-01T08:10:00Z'), value: 8.1 },
      ];

      const result = convertGlucoseReadingsToCSV(readings);
      
      expect(result).toContain('Timestamp,CGM Glucose Value (mmol/L)');
      expect(result).toContain('2024-01-01T08:00:00.000Z,6.5');
      expect(result).toContain('2024-01-01T08:05:00.000Z,7.2');
      expect(result).toContain('2024-01-01T08:10:00.000Z,8.1');
    });

    it('should handle empty array', () => {
      const result = convertGlucoseReadingsToCSV([]);
      expect(result).toBe('');
    });

    it('should format glucose values with 1 decimal place', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00Z'), value: 6.123456 },
      ];

      const result = convertGlucoseReadingsToCSV(readings);
      
      expect(result).toContain('6.1');
    });
  });

  describe('convertBolusReadingsToCSV', () => {
    it('should convert bolus readings to CSV with headers', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00Z'), dose: 5.0, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-01T12:00:00Z'), dose: 6.5, insulinType: 'bolus' },
        { timestamp: new Date('2024-01-01T18:00:00Z'), dose: 8.0, insulinType: 'bolus' },
      ];

      const result = convertBolusReadingsToCSV(readings);
      
      expect(result).toContain('Timestamp,Insulin Delivered (U)');
      expect(result).toContain('2024-01-01T08:00:00.000Z,5.00');
      expect(result).toContain('2024-01-01T12:00:00.000Z,6.50');
      expect(result).toContain('2024-01-01T18:00:00.000Z,8.00');
    });

    it('should handle empty array', () => {
      const result = convertBolusReadingsToCSV([]);
      expect(result).toBe('');
    });

    it('should format dose values with 2 decimal places', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T08:00:00Z'), dose: 5.123456, insulinType: 'bolus' },
      ];

      const result = convertBolusReadingsToCSV(readings);
      
      expect(result).toContain('5.12');
    });
  });

  describe('convertBasalReadingsToCSV', () => {
    it('should convert basal readings to CSV with headers', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T00:00:00Z'), dose: 1.0, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T01:00:00Z'), dose: 1.2, insulinType: 'basal' },
        { timestamp: new Date('2024-01-01T02:00:00Z'), dose: 0.9, insulinType: 'basal' },
      ];

      const result = convertBasalReadingsToCSV(readings);
      
      expect(result).toContain('Timestamp,Insulin Delivered (U)');
      expect(result).toContain('2024-01-01T00:00:00.000Z,1.00');
      expect(result).toContain('2024-01-01T01:00:00.000Z,1.20');
      expect(result).toContain('2024-01-01T02:00:00.000Z,0.90');
    });

    it('should handle empty array', () => {
      const result = convertBasalReadingsToCSV([]);
      expect(result).toBe('');
    });

    it('should format dose values with 2 decimal places', () => {
      const readings: InsulinReading[] = [
        { timestamp: new Date('2024-01-01T00:00:00Z'), dose: 1.123456, insulinType: 'basal' },
      ];

      const result = convertBasalReadingsToCSV(readings);
      
      expect(result).toContain('1.12');
    });
  });
});
