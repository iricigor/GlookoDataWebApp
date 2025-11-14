/**
 * Tests for base64 encoding/decoding utilities
 */

import { describe, it, expect } from 'vitest';
import { base64Encode, base64Decode } from './base64Utils';

describe('base64Utils', () => {
  describe('base64Encode', () => {
    it('should encode a simple string to base64', () => {
      const result = base64Encode('Hello World');
      expect(result).toBe('SGVsbG8gV29ybGQ=');
    });

    it('should encode empty string', () => {
      const result = base64Encode('');
      expect(result).toBe('');
    });

    it('should encode special characters', () => {
      const result = base64Encode('Test@123!#$');
      expect(result).toBe('VGVzdEAxMjMhIyQ=');
    });

    it('should encode CSV data', () => {
      const csvData = 'Date,Day,BG\n2024-01-01,Monday,85';
      const result = base64Encode(csvData);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should encode multi-line text', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const result = base64Encode(text);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('base64Decode', () => {
    it('should decode a base64 string', () => {
      const result = base64Decode('SGVsbG8gV29ybGQ=');
      expect(result).toBe('Hello World');
    });

    it('should decode empty string', () => {
      const result = base64Decode('');
      expect(result).toBe('');
    });

    it('should decode special characters', () => {
      const result = base64Decode('VGVzdEAxMjMhIyQ=');
      expect(result).toBe('Test@123!#$');
    });

    it('should decode CSV data', () => {
      const expected = 'Date,Day,BG\n2024-01-01,Monday,85';
      const encoded = base64Encode(expected);
      const result = base64Decode(encoded);
      expect(result).toBe(expected);
    });
  });

  describe('round-trip encoding/decoding', () => {
    it('should maintain data integrity through encode/decode cycle', () => {
      const original = 'This is a test message with special chars: @#$%^&*()';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle multi-line text', () => {
      const original = 'Line 1\nLine 2\nLine 3\nLine 4';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle CSV format with headers and data', () => {
      const original = 'Date,Value,Status\n2024-01-01,100,Active\n2024-01-02,200,Inactive';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });
  });
});
