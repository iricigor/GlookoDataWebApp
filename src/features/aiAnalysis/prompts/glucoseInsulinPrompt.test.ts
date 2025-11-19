/**
 * Tests for Glucose & Insulin prompt generation
 */

import { describe, it, expect } from 'vitest';
import { generateGlucoseInsulinPrompt } from './glucoseInsulinPrompt';
import { base64Encode } from '../../../utils/formatting';

describe('glucoseInsulinPrompt', () => {
  describe('generateGlucoseInsulinPrompt', () => {
    const sampleCsvData = `Date,Day of Week,BG Below (%),BG In Range (%),BG Above (%),Basal Insulin,Bolus Insulin,Total Insulin
2024-01-01,Monday,5,70,25,20,15,35
2024-01-02,Tuesday,3,75,22,21,16,37`;

    it('should decode base64 data and include CSV in prompt', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('2024-01-01');
      expect(result).toContain('Monday');
      expect(result).toContain('Basal Insulin');
    });

    it('should include role and goal section', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('Role and Goal');
      expect(result).toContain('Data Analyst');
      expect(result).toContain('Diabetes Management Specialist');
    });

    it('should include temporal trends requirement', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('Temporal Trends');
      expect(result).toContain('Day of Week');
    });

    it('should include insulin efficacy tiers requirement', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('Insulin Efficacy Tiers');
      expect(result).toContain('Total Dose Tiering');
    });

    it('should include anomalies requirement', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('Anomalies');
      expect(result).toContain('3 best days');
      expect(result).toContain('3 worst days');
    });

    it('should include actionable summary requirement', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('Actionable Summary');
      expect(result).toContain('3-point summary');
    });

    it('should include mmol/L reminder', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('mmol/L');
    });

    it('should use second person language reminder', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('you/your');
    });

    it('should include CSV dataset section', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('Dataset');
      expect(result).toContain('CSV format');
      expect(result).toContain('```csv');
    });

    it('should include completion marker instruction', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('--- END OF ANALYSIS ---');
      expect(result).toContain('End your response with');
    });

    it('should default to English language', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data);
      
      expect(result).toContain('Respond in English');
    });

    it('should generate English prompt when specified', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data, 'english');
      
      expect(result).toContain('Respond in English');
      expect(result).not.toContain('česky');
    });

    it('should generate Czech prompt when specified', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data, 'czech');
      
      expect(result).toContain('Respond in Czech language');
      expect(result).toContain('česky');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate German prompt when specified', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data, 'german');
      
      expect(result).toContain('Respond in German language');
      expect(result).toContain('auf Deutsch');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate Serbian prompt when specified', () => {
      const base64Data = base64Encode(sampleCsvData);
      const result = generateGlucoseInsulinPrompt(base64Data, 'serbian');
      
      expect(result).toContain('Respond in Serbian language');
      expect(result).toContain('Latin script');
      expect(result).toContain('srpskom latiničnim pismom');
      expect(result).not.toContain('Respond in English');
    });
  });
});
