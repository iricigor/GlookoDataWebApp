/**
 * Tests for CSV utility functions
 */

import { describe, it, expect } from 'vitest';
import { convertToCSV } from './csvUtils';

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
});
