/**
 * Tests for Pump Settings Verification prompt generation
 */

import { describe, it, expect } from 'vitest';
import { generatePumpSettingsPrompt } from './pumpSettingsPrompt';
import { base64Encode } from '../../../utils/formatting';

describe('pumpSettingsPrompt', () => {
  describe('generatePumpSettingsPrompt', () => {
    const sampleCgmData = `Timestamp,CGM Glucose Value (mmol/L)
2024-01-01 08:00:00,5.5
2024-01-01 08:05:00,5.8`;

    const sampleBolusData = `Timestamp,Insulin Delivered (U)
2024-01-01 07:55:00,5.0
2024-01-01 12:00:00,6.5`;

    const sampleBasalData = `Timestamp,Insulin Delivered (U)
2024-01-01 00:00:00,0.8
2024-01-01 01:00:00,0.8`;

    it('should decode all three datasets and include in prompt', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('CGM Glucose Value');
      expect(result).toContain('Insulin Delivered');
      expect(result).toContain('2024-01-01');
    });

    it('should include role and goal section', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('expert endocrinologist');
      expect(result).toContain('certified diabetes pump trainer');
      expect(result).toContain('three datasets');
    });

    it('should include step 1: detect day/night split', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 1: Detect Day/Night Split');
      expect(result).toContain('Day period');
      expect(result).toContain('Night period');
    });

    it('should include step 2: infer basal profile', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 2: Infer Basal Profile');
      expect(result).toContain('median Rate');
    });

    it('should include step 3: infer ISF', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 3: Infer Insulin Sensitivity Factor');
      expect(result).toContain('pure correction boluses');
      expect(result).toContain('median ISF');
    });

    it('should include step 4: validate ISF accuracy', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 4: Validate ISF Accuracy');
      expect(result).toContain('Expected U');
      expect(result).toContain('Actual');
    });

    it('should include step 5: infer carb ratio', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 5: Infer Carb Ratio');
      expect(result).toContain('ICR');
    });

    it('should include step 6: define time segments', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 6: Define Time Segments');
      expect(result).toContain('Workday');
      expect(result).toContain('Weekend');
      expect(result).toContain('4 segments');
    });

    it('should include step 7: CGM summary per segment', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 7: CGM Summary');
      expect(result).toContain('Time in Range');
      expect(result).toContain('GMI');
    });

    it('should include step 8: optimal settings evaluation', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 8: Are Settings Optimal?');
      expect(result).toContain('Segmented Evaluation');
      expect(result).toContain('worse on weekends');
    });

    it('should include step 9: extended recommendations', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('STEP 9: Extended Recommendations');
      expect(result).toContain('Basal rates');
      expect(result).toContain('Behavioral adjustments');
      expect(result).toContain('Temporary profiles');
    });

    it('should include final output format section', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('FINAL OUTPUT FORMAT');
      expect(result).toContain('DETECTED DAY/NIGHT SPLIT');
      expect(result).toContain('INFERRED PUMP SETTINGS');
      expect(result).toContain('ISF VALIDATION');
      expect(result).toContain('CGM SUMMARY');
      expect(result).toContain('SEGMENTED ASSESSMENT');
      expect(result).toContain('RECOMMENDATIONS');
    });

    it('should include all three dataset sections', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Dataset 1: CGM Data');
      expect(result).toContain('Dataset 2: Bolus Data');
      expect(result).toContain('Dataset 3: Basal Data');
    });

    it('should include target glucose of 6.1 mmol/L', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('6.1 mmol/L');
      expect(result).toContain('target glucose');
    });

    it('should include mmol/L reminder', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('mmol/L');
      expect(result).toContain('not mg/dL');
    });

    it('should use second person language reminder', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('you/your');
    });

    it('should mention workdays vs weekends comparison', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('workdays');
      expect(result).toContain('Mon–Fri');
      expect(result).toContain('weekends');
      expect(result).toContain('Sat–Sun');
    });

    it('should include completion marker instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('--- CONCLUSIO DATAE ---');
      expect(result).toContain('End your response with');
    });

    it('should default to English language', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Respond in English');
    });

    it('should generate English prompt when specified', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal, 'english');
      
      expect(result).toContain('Respond in English');
      expect(result).not.toContain('česky');
    });

    it('should generate Czech prompt when specified', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal, 'czech');
      
      expect(result).toContain('Respond in Czech language');
      expect(result).toContain('česky');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate German prompt when specified', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal, 'german');
      
      expect(result).toContain('Respond in German language');
      expect(result).toContain('auf Deutsch');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate Serbian prompt when specified', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal, 'serbian');
      
      expect(result).toContain('Respond in Serbian language');
      expect(result).toContain('Latin script');
      expect(result).toContain('srpskom latiničnim pismom');
      expect(result).not.toContain('Respond in English');
    });

    it('should include severe hypoglycemia threshold (<3.0 mmol/L)', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('3.0');
      expect(result).toContain('Severe hypo');
      expect(result).toContain('severe hypoglycemia');
    });

    it('should include severe hyperglycemia threshold (>13.9 mmol/L)', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('13.9');
      expect(result).toContain('Severe hyper');
      expect(result).toContain('severe hyperglycemia');
    });

    it('should include Coefficient of Variation (CV%) in CGM metrics', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Coefficient of Variation');
      expect(result).toContain('CV %');
      expect(result).toContain('(SD / Mean) × 100');
    });

    it('should filter out low-dose corrections (<0.3 U) in ISF step', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Insulin Delivered ≥ 0.3 U');
      expect(result).toContain('filter out micro-corrections');
    });

    it('should filter out combo/extended boluses (>30%) in ICR step', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('No extended bolus portion >30%');
      expect(result).toContain('filter out combo/extended meal boluses');
    });

    it('should require statistical description of weekday/weekend differences', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Statistically describe the differences');
      expect(result).toContain('statistical description of weekday/weekend differences');
    });

    it('should limit recommendations to maximum 6 items', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('maximum 6 prioritized');
      expect(result).toContain('Limit to 6 recommendations maximum');
      expect(result).toContain('MAX 6 ITEMS');
    });

    it('should include pattern analysis requirements', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Post-meal peaks');
      expect(result).toContain('Overnight drift');
      expect(result).toContain('Stacking corrections');
      expect(result).toContain('Late pre-bolus evidence');
      expect(result).toContain('hypoglycemia 02:00–06:00');
    });

    it('should include ISF percentile range reporting', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('25th–75th percentile range');
      expect(result).toContain('number of corrections used');
    });

    it('should use mg/dL thresholds when unit is mg/dL', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal, 'english', 'mg/dL');
      
      expect(result).toContain('110 mg/dL');
      expect(result).toContain('70 mg/dL');
      expect(result).toContain('54 mg/dL');
      expect(result).toContain('180 mg/dL');
      expect(result).toContain('250 mg/dL');
      expect(result).toContain('126 mg/dL');
    });

    it('should include enhanced basal detection with clustering', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Convert every 5–15 min delivery to instantaneous rate');
      expect(result).toContain('Round time to nearest 30 min');
      expect(result).toContain('two most common rate clusters');
      expect(result).toContain('exact switch times');
    });

    it('should include rigorous analysis instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Analyze rigorously with maximum statistical detail');
    });

    it('should include data context explanation', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Data Context');
      expect(result).toContain('CGM readings');
      expect(result).toContain('bolus insulin records');
      expect(result).toContain('basal delivery data');
    });

    it('should include no-greetings instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Do NOT start your response with greetings');
      expect(result).toContain('Hello');
    });

    it('should include no-procedural-text instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Do NOT include procedural statements');
    });

    it('should include TIR reference verification', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Time in Range Reference');
      expect(result).toContain('Calculate overall TIR');
      expect(result).toContain('verify');
    });

    it('should include table formatting instruction', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Use tables wherever possible');
    });

    it('should include estimation uncertainty note for overall analysis', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('IMPORTANT NOTE ON ESTIMATED SETTINGS');
      expect(result).toContain('inherent uncertainty');
    });

    it('should include timing estimation uncertainty explanation', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('Timing Estimation');
      expect(result).toContain('day/night boundary is EARLIER');
      expect(result).toContain('day/night boundary is LATER');
    });

    it('should include basal rate estimation uncertainty explanation', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('estimated basal rate is HIGHER');
      expect(result).toContain('estimated basal rate is LOWER');
    });

    it('should include ISF estimation uncertainty explanation', () => {
      const base64Cgm = base64Encode(sampleCgmData);
      const base64Bolus = base64Encode(sampleBolusData);
      const base64Basal = base64Encode(sampleBasalData);
      
      const result = generatePumpSettingsPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(result).toContain('estimated ISF is HIGHER');
      expect(result).toContain('estimated ISF is LOWER');
    });
  });
});
