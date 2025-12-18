/**
 * Tests for Hypoglycemia Analysis prompt generation
 */

import { describe, it, expect } from 'vitest';
import { generateHyposPrompt } from './hyposPrompt';
import { base64Encode } from '../../../utils/formatting';

describe('hyposPrompt', () => {
  describe('generateHyposPrompt', () => {
    const sampleHypoEventsData = `Event ID,Timestamp,CGM Glucose Value,Is Nadir,Minutes From Nadir
1,2024-01-01 08:00:00,5.5,false,-60
1,2024-01-01 08:30:00,4.2,false,-30
1,2024-01-01 09:00:00,3.2,true,0
1,2024-01-01 09:30:00,4.0,false,30
1,2024-01-01 10:00:00,5.0,false,60`;

    const sampleHypoSummaryData = `Date,Day Of Week,Severe Count,Non-Severe Count,Total Count,Lowest Value,Longest Duration,Total Duration,LBGI
2024-01-01,Monday,1,2,3,2.8,45,90,3.5
2024-01-02,Tuesday,0,1,1,3.5,30,30,2.1
2024-01-03,Wednesday,0,0,0,0,0,0,1.2`;

    it('should decode both datasets and include in prompt', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('CGM Glucose Value');
      expect(result).toContain('LBGI');
      expect(result).toContain('2024-01-01');
    });

    it('should include system prompt and task section', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('expert endocrinologist');
      expect(result).toContain('type-1 diabetes');
      expect(result).toContain('CGM/insulin pump data analysis');
      expect(result).toContain('Task');
    });

    it('should include hypoglycemia risk assessment section', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Current Hypoglycemia Risk Assessment');
      expect(result).toContain('Overall LBGI');
      expect(result).toContain('consensus targets');
    });

    it('should include pattern analysis section', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Pattern Analysis');
      expect(result).toContain('Time-of-day distribution');
      expect(result).toContain('nocturnal'); // lowercase in "nocturnal hypos"
      expect(result).toContain('00:00–06:00');
      expect(result).toContain('Identify specific high-risk time windows');
    });

    it('should include preceding factors analysis', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('trajectory analysis');
      expect(result).toContain('Rapid drop percentage');
      expect(result).toContain('Gradual decline percentage');
    });

    it('should include insulin stacking analysis', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Active insulin stacking');
      expect(result).toContain('insulin-on-board');
    });

    it('should include clustering analysis', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('clustering');
      expect(result).toContain('>2 hypos/day');
    });

    it('should include risk stratification section', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Risk Stratification');
      expect(result).toContain('Low risk');
      expect(result).toContain('Moderate risk');
      expect(result).toContain('High risk');
      expect(result).toContain('Very high risk');
    });

    it('should include recommendations section', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Recommendations');
      expect(result).toContain('3-5 specific');
      expect(result).toContain('actionable');
    });

    it('should include output structure with trajectory analysis', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Output Structure');
      expect(result).toContain('Risk Summary Table');
      expect(result).toContain('Time Distribution Analysis');
      expect(result).toContain('Trajectory Analysis');
      expect(result).toContain('Pattern Findings');
      expect(result).toContain('Risk Classification');
      expect(result).toContain('Prioritized Recommendations');
    });

    it('should include both dataset sections', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Dataset 1: Hypo Events');
      expect(result).toContain('Dataset 2: Daily Hypo Summaries');
    });

    it('should include Dataset 3 when hypo event summary is provided', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      const sampleEventSummary = `Event ID,Start Time,Nadir,Last Bolus Time,Bolus Dose
1,2024-01-01 09:00:00,3.2,2024-01-01 06:00:00,5.0`;
      const base64EventSummary = base64Encode(sampleEventSummary);
      
      const result = generateHyposPrompt(base64Events, base64Summary, 'english', 'mmol/L', undefined, base64EventSummary);
      
      expect(result).toContain('Dataset 3: Hypo Event Summary with Bolus Context');
      expect(result).toContain('2-4 hours before each hypo');
    });

    it('should not include Dataset 3 when hypo event summary is not provided', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).not.toContain('Dataset 3');
    });

    it('should include mmol/L reminder by default', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('mmol/L');
    });

    it('should use second person language reminder', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('you/your');
    });

    it('should include completion marker instruction', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('--- CONCLUSIO DATAE ---');
      expect(result).toContain('End your response with');
    });

    it('should default to English language', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Respond in English');
    });

    it('should generate Czech prompt when specified', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary, 'czech');
      
      expect(result).toContain('Respond in Czech language');
      expect(result).toContain('česky');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate German prompt when specified', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary, 'german');
      
      expect(result).toContain('Respond in German language');
      expect(result).toContain('auf Deutsch');
      expect(result).not.toContain('Respond in English');
    });

    it('should generate Serbian prompt when specified', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary, 'serbian');
      
      expect(result).toContain('Respond in Serbian language');
      expect(result).toContain('Latin script');
      expect(result).not.toContain('Respond in English');
    });

    it('should use correct thresholds for mmol/L', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary, 'english', 'mmol/L');
      
      expect(result).toContain('3.9');
      expect(result).toContain('3.0');
      expect(result).toContain('<4%');
      expect(result).toContain('<1%');
    });

    it('should use correct thresholds for mg/dL', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary, 'english', 'mg/dL');
      
      expect(result).toContain('70');
      expect(result).toContain('54');
    });

    it('should include data context explanation', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Data Context');
      expect(result).toContain('hypoglycemia events');
      expect(result).toContain('patterns');
    });

    it('should include no-greetings instruction', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Do NOT start your response with greetings');
      expect(result).toContain('Hello');
    });

    it('should include no-procedural-text instruction', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Do NOT include procedural statements');
    });

    it('should include table formatting instruction', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Use tables wherever possible');
    });

    it('should include recovery patterns analysis', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Recovery patterns');
      expect(result).toContain('recover from hypo');
      expect(result).toContain('rebound hyperglycemia');
    });

    it('should include LBGI risk thresholds', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('LBGI');
      expect(result).toContain('2.5');
      expect(result).toContain('5.0');
    });

    it('should include data-only statement', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('Base every statement on the provided data only');
      expect(result).toContain('cannot be determined from provided data');
    });

    it('should include specific recommendation examples', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('carb ratio');
      expect(result).toContain('basal rates');
      expect(result).toContain('extended bolus');
    });

    it('should reference surrounding CGM data window', () => {
      const base64Events = base64Encode(sampleHypoEventsData);
      const base64Summary = base64Encode(sampleHypoSummaryData);
      
      const result = generateHyposPrompt(base64Events, base64Summary);
      
      expect(result).toContain('1 hour before');
      expect(result).toContain('1 hour after');
    });
  });
});
