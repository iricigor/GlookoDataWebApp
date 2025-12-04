/**
 * Tests for hyposReportPrompt generation
 */

import { describe, it, expect } from 'vitest';
import { generateHyposReportPrompt } from './hyposReportPrompt';
import { base64Encode } from '../../../utils/formatting';

describe('hyposReportPrompt', () => {
  describe('generateHyposReportPrompt', () => {
    const sampleEventsData = `Event_ID,Start_Time,Nadir_Value_mg_dL,Duration_Mins,Max_RoC_mg_dL_min,Time_To_Nadir_Mins,Initial_RoC_mg_dL_min,Last_Bolus_Units,Last_Bolus_Mins_Prior,Second_Bolus_Units,Second_Bolus_Mins_Prior,Programmed_Basal_U_hr,Basal_Units_H5_Prior,Basal_Units_H3_Prior,Basal_Units_H1_Prior,Time_of_Day_Code,G_T_Minus_60,G_T_Minus_30,G_T_Minus_10,G_Nadir_Plus_15
E-001,2024-01-15T03:45:00.000Z,52,30,2.5,15,1.8,N/A,N/A,N/A,N/A,0.8,0.8,0.8,0.8,3,108,90,72,75
E-002,2024-01-15T14:30:00.000Z,58,25,1.5,10,1.2,5.0,180,2.0,300,0.8,0.8,0.8,0.8,14,120,98,70,80`;

    it('should decode base64 data and include in prompt', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('E-001');
      expect(result).toContain('E-002');
      expect(result).toContain('2024-01-15');
    });

    it('should include event count in prompt', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 164);
      
      expect(result).toContain('N=164 hypoglycemic events');
    });

    it('should include role description', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('Certified Diabetes Care and Education Specialist');
      expect(result).toContain('CDCES');
    });

    it('should include primary suspect categories', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('Bolus Overlap/Stacking');
      expect(result).toContain('Bolus Overdose/Timing');
      expect(result).toContain('Basal Excess');
      expect(result).toContain('Time/Hormonal Shift');
    });

    it('should include column-oriented JSON format', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('column-oriented JSON format');
      expect(result).toContain('```json');
      expect(result).toContain('"columns":');
      expect(result).toContain('"data":');
      expect(result).toContain('"eventId"');
      expect(result).toContain('"primarySuspect"');
      expect(result).toContain('"mealTime"');
    });

    it('should include formatting rules', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('Do NOT start your response with greetings');
      expect(result).toContain('Do NOT include procedural statements');
    });

    it('should include safety guardrails', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('Avoid Absolute Medical Advice');
      expect(result).toContain('Avoid Diagnosis');
      expect(result).toContain('Acknowledge Limits');
    });

    it('should include dataset field descriptions', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('Event_ID');
      expect(result).toContain('Nadir_Value_mg_dL');
      expect(result).toContain('Time_of_Day_Code');
      expect(result).toContain('Last_Bolus_Units');
    });

    it('should include completion marker instruction', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('--- CONCLUSIO DATAE ---');
    });

    it('should default to English language', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('Respond in English');
    });

    it('should generate Czech prompt when specified', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2, 'czech');
      
      expect(result).toContain('Respond in Czech language');
      expect(result).toContain('česky');
    });

    it('should generate German prompt when specified', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2, 'german');
      
      expect(result).toContain('Respond in German language');
      expect(result).toContain('auf Deutsch');
    });

    it('should generate Serbian prompt when specified', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2, 'serbian');
      
      expect(result).toContain('Respond in Serbian language');
      expect(result).toContain('Latin script');
    });

    it('should include you/your language instruction', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('you/your');
    });

    it('should use mg/dL for nadir unit', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2, 'english', 'mmol/L');
      
      // Nadir values in the CSV are in mg/dL
      expect(result).toContain('mg/dL');
    });

    it('should include example table rows', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      // Should have example dates
      expect(result).toContain('2024-01-15');
      // Should have example times
      expect(result).toContain('03:45');
    });

    it('should include meal time deduction rules', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('Meal Time Deduction');
      expect(result).toContain('> 2.0U');
      expect(result).toContain('90 and 240 minutes');
    });

    it('should include nocturnal time range', () => {
      const base64Data = base64Encode(sampleEventsData);
      const result = generateHyposReportPrompt(base64Data, 2);
      
      expect(result).toContain('00-06');
      expect(result).toContain('Time_of_Day_Code');
    });
  });
});
