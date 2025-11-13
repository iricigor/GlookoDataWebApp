/**
 * Tests for Meal Timing prompt generation
 */

import { describe, it, expect } from 'vitest';
import { generateMealTimingPrompt } from './mealTimingPrompt';
import { base64Encode } from '../utils/base64Utils';

describe('mealTimingPrompt', () => {
  describe('generateMealTimingPrompt', () => {
    const sampleCgmData = `Timestamp,CGM Glucose Value
2024-01-01 08:00:00,5.5
2024-01-01 08:05:00,5.8`;

    const sampleBolusData = `Timestamp,Insulin Delivered
2024-01-01 07:55:00,5.0
2024-01-01 12:00:00,6.5`;

    const sampleBasalData = `Timestamp,Insulin Delivered
2024-01-01 00:00:00,0.8
2024-01-01 01:00:00,0.8`;

    it('should decode all three datasets and include in prompt', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('CGM Glucose Value');
      expect(result).toContain('Insulin Delivered');
      expect(result).toContain('2024-01-01');
    });

    it('should include role and goal section', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Role and Goal');
      expect(result).toContain('Data Analyst');
      expect(result).toContain('Diabetes Management Specialist');
    });

    it('should include detailed meal analysis requirement', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Detailed Meal Analysis');
      expect(result).toContain('Last 3 Days');
      expect(result).toContain('meal events');
    });

    it('should include temporal trends requirement', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Temporal Trends');
      expect(result).toContain('Day-Specific Performance');
    });

    it('should include insulin efficacy tiering requirement', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Insulin Efficacy Tiering');
      expect(result).toContain('Total Dose Tier Analysis');
    });

    it('should include post-meal timing efficacy requirement', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Post-Meal Timing Efficacy');
      expect(result).toContain('Pre-Bolus');
    });

    it('should include nocturnal basal efficacy requirement', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Nocturnal Basal Efficacy');
      expect(result).toContain('Dawn Phenomenon');
    });

    it('should include actionable summary requirement', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Actionable Summary and Recommendations');
      expect(result).toContain('3-Point Summary');
    });

    it('should include all three dataset sections', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Dataset 1: CGM Data');
      expect(result).toContain('Dataset 2: Bolus Data');
      expect(result).toContain('Dataset 3: Basal Data');
    });

    it('should include mmol/L reminder', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('mmol/L');
    });

    it('should use second person language reminder', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('you/your');
    });

    it('should include completion marker instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('--- END OF ANALYSIS ---');
      expect(result).toContain('End your response with');
    });
  });
});
