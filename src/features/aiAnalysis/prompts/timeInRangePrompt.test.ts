/**
 * Tests for Time in Range prompt generation
 */

import { describe, it, expect } from 'vitest';
import { generateTimeInRangePrompt } from './timeInRangePrompt';
import type { GlucoseRangeStats, GlucoseThresholds } from '../../../types';

// Mock data for tests
const mockStats: GlucoseRangeStats = {
  low: 10,
  inRange: 75,
  high: 15,
  total: 100,
};

const mockThresholds: GlucoseThresholds = {
  veryLow: 3.0,
  low: 3.9,
  high: 10.0,
  veryHigh: 13.9,
};

describe('timeInRangePrompt', () => {
  describe('generateTimeInRangePrompt', () => {
    it('should generate a prompt with the TIR percentage', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('75.0%');
      expect(result).toContain('time-in-range');
      expect(result).toContain('TIR');
    });

    it('should include TAR (Time Above Range) percentage', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('Time Above Range');
      expect(result).toContain('15.0%'); // 15 out of 100
    });

    it('should include target range based on thresholds', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('3.9-10.0 mmol/L');
      expect(result).toContain('based on a target range');
    });

    it('should include high threshold in TAR description', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('>10.0 mmol/L');
    });

    it('should include mmol/L reminder', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('mmol/L');
    });

    it('should use second person language', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('you');
      expect(result.toLowerCase()).not.toContain('patient');
    });

    it('should mention target TIR of 70%', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('70%');
    });

    it('should request concise response', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('concise');
      expect(result).toContain('200 words');
    });

    it('should request specific, actionable and behavioral recommendations', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('specific, actionable and behavioral recommendations');
    });

    it('should include "be encouraging but realistic" instruction', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('Be encouraging but realistic');
    });

    it('should include "respond only with" instruction', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('Respond only with the assessment + recommendations, no intro, no extra text');
    });

    it('should handle zero TIR', () => {
      const zeroStats: GlucoseRangeStats = {
        low: 20,
        inRange: 0,
        high: 80,
        total: 100,
      };
      const result = generateTimeInRangePrompt(zeroStats, mockThresholds);
      
      expect(result).toContain('0.0%');
      expect(result).toBeTruthy();
    });

    it('should handle 100% TIR', () => {
      const perfectStats: GlucoseRangeStats = {
        low: 0,
        inRange: 100,
        high: 0,
        total: 100,
      };
      const result = generateTimeInRangePrompt(perfectStats, mockThresholds);
      
      expect(result).toContain('100.0%');
      expect(result).toBeTruthy();
    });

    it('should include completion marker instruction', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('--- CONCLUSIO DATAE ---');
      expect(result).toContain('End your response with');
    });

    it('should default to English language', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds);
      
      expect(result).toContain('Respond in English');
    });

    it('should generate English prompt when specified', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'english');
      
      expect(result).toContain('Respond in English');
      expect(result).not.toContain('česky');
    });

    it('should generate Czech prompt when specified', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'czech');
      
      expect(result).toContain('Respond in Czech language');
      expect(result).toContain('česky');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate German prompt when specified', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'german');
      
      expect(result).toContain('Respond in German language');
      expect(result).toContain('auf Deutsch');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate Serbian prompt when specified', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'serbian');
      
      expect(result).toContain('Respond in Serbian language');
      expect(result).toContain('Latin script');
      expect(result).toContain('srpskom latiničnim pismom');
      expect(result).not.toContain('Respond in English');
    });

    it('should handle mg/dL unit conversion', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'english', 'mg/dL');
      
      expect(result).toContain('mg/dL');
      expect(result).toContain('70-180 mg/dL'); // 3.9*18 = 70.2, 10*18 = 180
      expect(result).toContain('>180 mg/dL');
      expect(result).toContain('Remember that all glucose values are in mg/dL (not mmol/L)');
    });

    it('should format mg/dL target range correctly', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'english', 'mg/dL');
      
      // Check for properly rounded values
      expect(result).toMatch(/70-180 mg\/dL/); // Should be rounded to nearest integer
    });

    it('should include English disclaimer when English language specified', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'english', 'mmol/L', 'perplexity');
      
      expect(result).toContain('Data is provided by Perplexity AI');
      expect(result).toContain('it might not be correct');
      expect(result).toContain('Always consult with your doctor');
    });

    it('should include Czech disclaimer when Czech language specified', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'czech', 'mmol/L', 'gemini');
      
      expect(result).toContain('Data poskytuje Google Gemini AI');
      expect(result).toContain('nemusí být správná');
      expect(result).toContain('Vždy se poraďte se svým lékařem');
    });

    it('should include German disclaimer when German language specified', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'german', 'mmol/L', 'grok');
      
      expect(result).toContain('Daten werden von Grok AI bereitgestellt');
      expect(result).toContain('möglicherweise nicht korrekt');
      expect(result).toContain('Konsultieren Sie immer Ihren Arzt');
    });

    it('should include Serbian disclaimer when Serbian language specified', () => {
      const result = generateTimeInRangePrompt(mockStats, mockThresholds, 'serbian', 'mmol/L', 'deepseek');
      
      expect(result).toContain('Podatke pruža DeepSeek AI');
      expect(result).toContain('mogu biti netačni');
      expect(result).toContain('Uvek se konsultujte sa svojim lekarom');
    });
  });
});
