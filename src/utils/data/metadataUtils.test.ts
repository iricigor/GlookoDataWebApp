/**
 * Unit tests for metadata parsing utilities
 */

import { describe, it, expect } from 'vitest';
import { parseMetadata, isValidMetadata, formatMetadataForDisplay } from './metadataUtils';

describe('metadataUtils', () => {
  describe('parseMetadata', () => {
    it('should parse comma-separated metadata with name and date range', () => {
      const metadataLine = 'Name:John Doe, Date Range:2025-01-01 - 2025-01-31';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('John Doe');
      expect(result.dateRange).toBe('2025-01-01 - 2025-01-31');
      expect(result.startDate).toBe('2025-01-01');
      expect(result.endDate).toBe('2025-01-31');
    });

    it('should parse tab-separated metadata with name and date range', () => {
      const metadataLine = 'Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('Igor Irić');
      expect(result.dateRange).toBe('2025-07-29 - 2025-10-26');
      expect(result.startDate).toBe('2025-07-29');
      expect(result.endDate).toBe('2025-10-26');
    });

    it('should handle metadata with only name', () => {
      const metadataLine = 'Name:Jane Smith';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('Jane Smith');
      expect(result.dateRange).toBeUndefined();
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('should handle metadata with only date range', () => {
      const metadataLine = 'Date Range:2025-02-01 - 2025-02-28';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBeUndefined();
      expect(result.dateRange).toBe('2025-02-01 - 2025-02-28');
      expect(result.startDate).toBe('2025-02-01');
      expect(result.endDate).toBe('2025-02-28');
    });

    it('should handle metadata with extra whitespace', () => {
      const metadataLine = '  Name: John Doe  ,  Date Range: 2025-01-01 - 2025-01-31  ';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('John Doe');
      expect(result.dateRange).toBe('2025-01-01 - 2025-01-31');
    });

    it('should handle metadata with tabs and extra whitespace', () => {
      const metadataLine = 'Name:Igor Irić\t\tDate Range:2025-07-29 - 2025-10-26\t';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('Igor Irić');
      expect(result.dateRange).toBe('2025-07-29 - 2025-10-26');
    });

    it('should handle case-insensitive field names', () => {
      const metadataLine = 'name:John Doe, date range:2025-01-01 - 2025-01-31';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('John Doe');
      expect(result.dateRange).toBe('2025-01-01 - 2025-01-31');
    });

    it('should handle metadata with special characters in name', () => {
      const metadataLine = 'Name:O\'Brien, Date Range:2025-01-01 - 2025-01-31';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('O\'Brien');
      expect(result.dateRange).toBe('2025-01-01 - 2025-01-31');
    });

    it('should handle metadata with unicode characters in name', () => {
      const metadataLine = 'Name:Igor Irić, Date Range:2025-01-01 - 2025-01-31';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('Igor Irić');
    });

    it('should handle date range with no spaces (still valid format)', () => {
      const metadataLine = 'Name:John Doe, Date Range:2025-01-01-2025-01-31';
      const result = parseMetadata(metadataLine);

      expect(result.dateRange).toBe('2025-01-01-2025-01-31');
      // Dates are still parsed even with no spaces
      expect(result.startDate).toBe('2025-01-01');
      expect(result.endDate).toBe('2025-01-31');
    });

    it('should handle date range with multiple spaces', () => {
      const metadataLine = 'Name:John Doe, Date Range:2025-01-01   -   2025-01-31';
      const result = parseMetadata(metadataLine);

      expect(result.dateRange).toBe('2025-01-01   -   2025-01-31');
      expect(result.startDate).toBe('2025-01-01');
      expect(result.endDate).toBe('2025-01-31');
    });

    it('should return empty object for empty string', () => {
      const result = parseMetadata('');

      expect(result).toEqual({});
    });

    it('should return empty object for whitespace only', () => {
      const result = parseMetadata('   ');

      expect(result).toEqual({});
    });

    it('should handle metadata with no colons', () => {
      const metadataLine = 'Invalid metadata without colons';
      const result = parseMetadata(metadataLine);

      expect(result).toEqual({});
    });

    it('should handle metadata with empty values', () => {
      const metadataLine = 'Name:, Date Range:';
      const result = parseMetadata(metadataLine);

      expect(result).toEqual({});
    });

    it('should ignore unknown fields', () => {
      const metadataLine = 'Name:John Doe, Unknown Field:Some Value, Date Range:2025-01-01 - 2025-01-31';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('John Doe');
      expect(result.dateRange).toBe('2025-01-01 - 2025-01-31');
      expect(Object.keys(result)).toHaveLength(4); // name, dateRange, startDate, endDate
    });

    it('should handle real-world example from Glooko export (comma)', () => {
      const metadataLine = 'Name:Igor Irić, Date Range:2025-07-29 - 2025-10-26';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('Igor Irić');
      expect(result.dateRange).toBe('2025-07-29 - 2025-10-26');
      expect(result.startDate).toBe('2025-07-29');
      expect(result.endDate).toBe('2025-10-26');
    });

    it('should handle real-world example from Glooko export (tab)', () => {
      const metadataLine = 'Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26';
      const result = parseMetadata(metadataLine);

      expect(result.name).toBe('Igor Irić');
      expect(result.dateRange).toBe('2025-07-29 - 2025-10-26');
      expect(result.startDate).toBe('2025-07-29');
      expect(result.endDate).toBe('2025-10-26');
    });
  });

  describe('isValidMetadata', () => {
    it('should return true for metadata with name', () => {
      const metadata = { name: 'John Doe' };
      expect(isValidMetadata(metadata)).toBe(true);
    });

    it('should return true for metadata with date range', () => {
      const metadata = { dateRange: '2025-01-01 - 2025-01-31' };
      expect(isValidMetadata(metadata)).toBe(true);
    });

    it('should return true for metadata with both name and date range', () => {
      const metadata = {
        name: 'John Doe',
        dateRange: '2025-01-01 - 2025-01-31',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      expect(isValidMetadata(metadata)).toBe(true);
    });

    it('should return false for empty metadata', () => {
      const metadata = {};
      expect(isValidMetadata(metadata)).toBe(false);
    });

    it('should return false for metadata with only dates but no dateRange', () => {
      const metadata = { startDate: '2025-01-01', endDate: '2025-01-31' };
      expect(isValidMetadata(metadata)).toBe(false);
    });
  });

  describe('formatMetadataForDisplay', () => {
    it('should format metadata with name and date range', () => {
      const metadata = {
        name: 'John Doe',
        dateRange: '2025-01-01 - 2025-01-31',
      };
      const result = formatMetadataForDisplay(metadata);

      expect(result).toBe('Name: John Doe | Date Range: 2025-01-01 - 2025-01-31');
    });

    it('should format metadata with only name', () => {
      const metadata = { name: 'John Doe' };
      const result = formatMetadataForDisplay(metadata);

      expect(result).toBe('Name: John Doe');
    });

    it('should format metadata with only date range', () => {
      const metadata = { dateRange: '2025-01-01 - 2025-01-31' };
      const result = formatMetadataForDisplay(metadata);

      expect(result).toBe('Date Range: 2025-01-01 - 2025-01-31');
    });

    it('should return empty string for empty metadata', () => {
      const metadata = {};
      const result = formatMetadataForDisplay(metadata);

      expect(result).toBe('');
    });

    it('should not include start/end dates in formatted output', () => {
      const metadata = {
        name: 'John Doe',
        dateRange: '2025-01-01 - 2025-01-31',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      const result = formatMetadataForDisplay(metadata);

      expect(result).toBe('Name: John Doe | Date Range: 2025-01-01 - 2025-01-31');
      expect(result).not.toContain('startDate');
      expect(result).not.toContain('endDate');
    });
  });
});
