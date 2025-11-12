/**
 * Tests for AI Prompt Generation Utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  base64Encode, 
  base64Decode,
  generateTimeInRangePrompt, 
  generateGlucoseInsulinPrompt,
  generateMealTimingPrompt
} from './promptUtils';

describe('promptUtils', () => {
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

    it('should encode and decode correctly (round trip)', () => {
      const original = 'Date,Day,BG\n2024-01-01,Monday,85';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe('generateTimeInRangePrompt', () => {
    it('should generate a prompt with the TIR percentage', () => {
      const prompt = generateTimeInRangePrompt(65.5);
      expect(prompt).toContain('65.5%');
      expect(prompt).toContain('time-in-range');
      expect(prompt).toContain('continuous glucose monitoring');
    });

    it('should include mmol/L unit specification', () => {
      const prompt = generateTimeInRangePrompt(80);
      expect(prompt).toContain('mmol/L');
      expect(prompt).toContain('not mg/dL');
    });

    it('should use second-person language (you/your)', () => {
      const prompt = generateTimeInRangePrompt(75);
      expect(prompt).toContain('My');
      expect(prompt).toContain('you/your');
      expect(prompt).not.toContain('patient');
    });

    it('should include assessment and recommendations context', () => {
      const prompt = generateTimeInRangePrompt(80);
      expect(prompt).toContain('assessment');
      expect(prompt).toContain('recommendations');
      expect(prompt).toContain('70%');
    });

    it('should format percentage to one decimal place', () => {
      const prompt = generateTimeInRangePrompt(66.66666);
      expect(prompt).toContain('66.7%');
    });
  });

  describe('generateGlucoseInsulinPrompt', () => {
    it('should generate a prompt with decoded CSV data', () => {
      const csvData = 'Date,Day,BG\n2024-01-01,Monday,85';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('Date,Day,BG');
      expect(prompt).toContain('2024-01-01,Monday,85');
      expect(prompt).toContain('Temporal Trends');
      expect(prompt).toContain('Insulin Efficacy Tiers');
      expect(prompt).toContain('Anomalies and Key Events');
      expect(prompt).toContain('Actionable Summary');
    });

    it('should include role and goal section', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('Role and Goal');
      expect(prompt).toContain('Data Analyst and Diabetes Management Specialist');
    });

    it('should include mmol/L unit specification', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('mmol/L');
      expect(prompt).toContain('not mg/dL');
    });

    it('should use second-person language', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('you/your');
    });

    it('should request analysis of best and worst days', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('3 best days');
      expect(prompt).toContain('3 worst days');
      expect(prompt).toContain('highest BG In Range');
      expect(prompt).toContain('lowest BG In Range');
    });

    it('should request tiering analysis', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('Total Dose Tiering');
      expect(prompt).toContain('Low, Medium, and High Total Insulin tiers');
      expect(prompt).toContain('Bolus Ratio Impact');
      expect(prompt).toContain('Bolus-to-Total-Insulin Ratio');
    });

    it('should request insulin dose averages for best and worst days', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('average Basal dose');
      expect(prompt).toContain('average Bolus dose');
      expect(prompt).toContain('3 best days');
      expect(prompt).toContain('3 worst days');
      expect(prompt).toContain('key difference');
    });

    it('should request actionable recommendations', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('3-point summary');
      expect(prompt).toContain('2-3 specific, actionable recommendations');
      expect(prompt).toContain('tier and outlier data');
    });
  });

  describe('generateMealTimingPrompt', () => {
    const mockCgmData = 'Timestamp,CGM Glucose Value\n2024-01-01 08:00,5.5\n2024-01-01 08:05,5.8';
    const mockBolusData = 'Timestamp,Insulin Delivered\n2024-01-01 08:00,5.0';
    const mockBasalData = 'Timestamp,Insulin Delivered\n2024-01-01 08:00,0.5';
    
    it('should generate a prompt with all three datasets', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain(mockCgmData);
      expect(prompt).toContain(mockBolusData);
      expect(prompt).toContain(mockBasalData);
      expect(prompt).toContain('Dataset 1: CGM Data');
      expect(prompt).toContain('Dataset 2: Bolus Data');
      expect(prompt).toContain('Dataset 3: Basal Data');
    });

    it('should include role and goal section', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain('Role and Goal');
      expect(prompt).toContain('Data Analyst and Diabetes Management Specialist');
    });

    it('should include temporal trends analysis', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain('Temporal Trends');
      expect(prompt).toContain('Day-Specific Performance');
      expect(prompt).toContain('BG Control Ranking');
      expect(prompt).toContain('Mon-Sun');
    });

    it('should include insulin efficacy tiering', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain('Insulin Efficacy Tiering');
      expect(prompt).toContain('Total Dose Tier Analysis');
      expect(prompt).toContain('Low, Medium, and High Total Daily Insulin');
    });

    it('should include post-meal timing analysis', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain('Post-Meal Timing Efficacy');
      expect(prompt).toContain('Pre-Bolus');
      expect(prompt).toContain('Breakfast, Lunch, and Dinner');
      expect(prompt).toContain('Spike Rate');
    });

    it('should include nocturnal basal analysis', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain('Nocturnal Basal Efficacy');
      expect(prompt).toContain('03:00 AM');
      expect(prompt).toContain('Dawn Phenomenon');
    });

    it('should include mmol/L unit specification', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain('mmol/L');
      expect(prompt).toContain('not mg/dL');
    });

    it('should use second-person language', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain('you/your');
    });

    it('should request actionable recommendations', () => {
      const base64Cgm = base64Encode(mockCgmData);
      const base64Bolus = base64Encode(mockBolusData);
      const base64Basal = base64Encode(mockBasalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toContain('3-Point Summary');
      expect(prompt).toContain('3-4 Actionable Recommendations');
      expect(prompt).toContain('Timing');
      expect(prompt).toContain('Basal');
      expect(prompt).toContain('Dosing');
    });
  });
});
