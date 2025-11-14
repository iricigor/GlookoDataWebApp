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
      
      expect(result).toContain('expert diabetes data analyst');
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
      expect(result).toContain('most frequent Rate');
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
      
      expect(result).toContain('--- END OF ANALYSIS ---');
      expect(result).toContain('End your response with');
    });
  });
});
