/**
 * Tests for Time in Range prompt generation
 */

import { describe, it, expect } from 'vitest';
import { generateTimeInRangePrompt } from './timeInRangePrompt';

describe('timeInRangePrompt', () => {
  describe('generateTimeInRangePrompt', () => {
    it('should generate a prompt with the TIR percentage', () => {
      const result = generateTimeInRangePrompt(75.5);
      
      expect(result).toContain('75.5%');
      expect(result).toContain('time-in-range');
      expect(result).toContain('TIR');
    });

    it('should include mmol/L reminder', () => {
      const result = generateTimeInRangePrompt(80);
      
      expect(result).toContain('mmol/L');
    });

    it('should use second person language', () => {
      const result = generateTimeInRangePrompt(65);
      
      expect(result).toContain('you');
      expect(result.toLowerCase()).not.toContain('patient');
    });

    it('should mention target TIR of 70%', () => {
      const result = generateTimeInRangePrompt(60);
      
      expect(result).toContain('70%');
    });

    it('should request concise response', () => {
      const result = generateTimeInRangePrompt(70);
      
      expect(result).toContain('concise');
      expect(result).toContain('200 words');
    });

    it('should format percentage with one decimal place', () => {
      const result = generateTimeInRangePrompt(72.345);
      
      expect(result).toContain('72.3%');
      expect(result).not.toContain('72.345%');
    });

    it('should handle zero TIR', () => {
      const result = generateTimeInRangePrompt(0);
      
      expect(result).toContain('0.0%');
      expect(result).toBeTruthy();
    });

    it('should handle 100% TIR', () => {
      const result = generateTimeInRangePrompt(100);
      
      expect(result).toContain('100.0%');
      expect(result).toBeTruthy();
    });

    it('should include completion marker instruction', () => {
      const result = generateTimeInRangePrompt(75);
      
      expect(result).toContain('--- END OF ANALYSIS ---');
      expect(result).toContain('End your response with');
    });
  });
});
