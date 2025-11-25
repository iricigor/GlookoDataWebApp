/**
 * Tests for Meal Timing prompt generation
 */

import { describe, it, expect } from 'vitest';
import { generateMealTimingPrompt } from './mealTimingPrompt';
import { base64Encode } from '../../../utils/formatting';

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
      expect(result).toContain('Last 3 Complete Days');
      expect(result).toContain('3 COMPLETE days');
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
      
      expect(result).toContain('Weekday vs Weekend Meal Timing Analysis');
      expect(result).toContain('pre-bolus');
      expect(result).toContain('Weekday Analysis');
      expect(result).toContain('Weekend Analysis');
    });

    it('should include nocturnal basal efficacy requirement', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Basal Rate Check');
      expect(result).toContain('Dawn Phenomenon');
      expect(result).toContain('Overnight Stability');
      expect(result).toContain('00:00-06:00');
    });

    it('should include split output structure', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Output Structure');
      expect(result).toContain('3-Point Summary');
      expect(result).toContain('Actionable Insights');
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
      
      expect(result).toContain('--- CONCLUSIO DATAE ---');
      expect(result).toContain('End your response with');
    });

    it('should default to English language', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Respond in English');
    });

    it('should generate English prompt when specified', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal, 'english');
      
      expect(result).toContain('Respond in English');
      expect(result).not.toContain('česky');
    });

    it('should generate Czech prompt when specified', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal, 'czech');
      
      expect(result).toContain('Respond in Czech language');
      expect(result).toContain('česky');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate German prompt when specified', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal, 'german');
      
      expect(result).toContain('Respond in German language');
      expect(result).toContain('auf Deutsch');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate Serbian prompt when specified', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal, 'serbian');
      
      expect(result).toContain('Respond in Serbian language');
      expect(result).toContain('Latin script');
      expect(result).toContain('srpskom latiničnim pismom');
      expect(result).not.toContain('Respond in English');
    });

    it('should include meal detection criteria with stricter bolus threshold', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Meal Detection Criteria');
      expect(result).toContain('≥ 3.0 U');
      expect(result).toContain('DO NOT count correction boluses or snacks');
    });

    it('should include pre-bolus explanation', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Pre-bolus');
      expect(result).toContain('Positive values (+)');
      expect(result).toContain('Negative values (-)');
    });

    it('should include hypoglycemia risk analysis', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Hypoglycemia Risk Analysis');
      expect(result).toContain('low BG');
      expect(result).toContain('hypoglycemic events');
    });

    it('should include missing basal data handling', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Missing Basal Data Handling');
      expect(result).toContain('basal data is incomplete or missing');
    });

    it('should include recommendations format', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Actionable Insights');
      expect(result).toContain('Extremely specific');
      expect(result).toContain('Ranked by expected impact on TIR');
      expect(result).toContain('Include expected improvement');
    });

    it('should include quick wins table format', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Quick Wins Table');
      expect(result).toContain('Expected TIR gain');
      expect(result).toContain('Breakfast pre-bolus');
    });

    it('should use correct thresholds for mmol/L', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal, 'english', 'mmol/L');
      
      expect(result).toContain('3.9');
      expect(result).toContain('10.0');
      expect(result).toContain('1.5');
    });

    it('should use correct thresholds for mg/dL', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal, 'english', 'mg/dL');
      
      expect(result).toContain('70');
      expect(result).toContain('180');
      expect(result).toContain('27');
    });

    it('should include data context explanation', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Data Context');
      expect(result).toContain('CGM glucose readings');
      expect(result).toContain('bolus insulin timing');
    });

    it('should include no-greetings instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Do NOT start your response with greetings');
      expect(result).toContain('Hello');
    });

    it('should include no-procedural-text instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Do NOT include procedural statements');
    });

    it('should include TIR reference verification', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Time in Range Reference');
      expect(result).toContain('Calculate overall TIR');
      expect(result).toContain('verify');
    });

    it('should include table format requirements', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Table Format Requirements');
      expect(result).toContain('ddd MMM-dd');
      expect(result).toContain('Round to nearest 30 minutes');
      expect(result).toContain('ONE decimal place');
      expect(result).toContain('Peak Height');
      expect(result).toContain('Time to Peak');
    });

    it('should include pre-bolus explanation instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Add an explanation row under the table');
      expect(result).toContain('Positive values (+)');
      expect(result).toContain('Negative values (-)');
      expect(result).toContain('BEFORE glucose rise');
      expect(result).toContain('AFTER glucose rise');
    });

    it('should filter out snacks from meal analysis', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('MAIN MEALS ONLY (no snacks)');
      expect(result).toContain('Breakfast/Lunch/Dinner only (no snacks)');
    });
  });
});
