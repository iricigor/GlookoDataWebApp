/**
 * Tests for BG Overview TIR prompt generation
 */

import { describe, it, expect } from 'vitest';
import { generateBGOverviewTIRPrompt } from './bgOverviewTIRPrompt';
import type { TIRStats } from '../../../components/BGOverviewReport/types';
import type { GlucoseThresholds } from '../../../types';

describe('generateBGOverviewTIRPrompt', () => {
  const mockThresholds: GlucoseThresholds = {
    veryLow: 3.0,
    low: 3.9,
    high: 10.0,
    veryHigh: 13.9,
  };

  const mockTIRStats3Category: TIRStats = {
    low: 50,
    inRange: 300,
    high: 150,
    total: 500,
  };

  const mockTIRStats5Category: TIRStats = {
    veryLow: 10,
    low: 40,
    inRange: 300,
    high: 140,
    veryHigh: 10,
    total: 500,
  };

  it('should generate prompt for 3-category mode in mmol/L', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L'
    );

    expect(prompt).toContain('Time in Range (3.9-10.0 mmol/L): 60.0%');
    expect(prompt).toContain('Time Below Range: 10.0%');
    expect(prompt).toContain('Time Above Range: 30.0%');
    expect(prompt).toContain('ONE brief sentence');
    expect(prompt).toContain('THREE specific');
    expect(prompt).toContain('mmol/L (not mg/dL)');
  });

  it('should generate prompt for 5-category mode in mmol/L', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats5Category,
      mockThresholds,
      5,
      'english',
      'mmol/L'
    );

    expect(prompt).toContain('Time in Range (3.9-10.0 mmol/L): 60.0%');
    expect(prompt).toContain('Time Very Low (<3.0 mmol/L): 2.0%');
    expect(prompt).toContain('Time Low: 8.0%');
    expect(prompt).toContain('Time High: 28.0%');
    expect(prompt).toContain('Time Very High (>13.9 mmol/L): 2.0%');
  });

  it('should generate prompt for 3-category mode in mg/dL', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mg/dL'
    );

    expect(prompt).toContain('Time in Range (70-180 mg/dL): 60.0%');
    expect(prompt).toContain('mg/dL (not mmol/L)');
  });

  it('should include day filter context when not "All Days"', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Monday'
    );

    expect(prompt).toContain('This data is filtered to show only Monday');
    expect(prompt).toContain('Acknowledge this');
    expect(prompt).toContain('start of the working week');
  });

  it('should include day-specific activity context for Monday', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Monday'
    );

    expect(prompt).toContain('start of the working week');
    expect(prompt).toContain('morning routines resuming after the weekend');
  });

  it('should include day-specific activity context for Friday', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Friday'
    );

    expect(prompt).toContain('end of the working week');
    expect(prompt).toContain('anticipation of weekend leisure');
  });

  it('should include day-specific activity context for Saturday', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Saturday'
    );

    expect(prompt).toContain('leisure day');
    expect(prompt).toContain('flexible schedules');
  });

  it('should include day-specific activity context for Sunday', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Sunday'
    );

    expect(prompt).toContain('leisure day');
    expect(prompt).toContain('preparation for the upcoming work week');
  });

  it('should include day-specific activity context for mid-week days', () => {
    const tuesdayPrompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Tuesday'
    );

    expect(tuesdayPrompt).toContain('mid-week day');
    expect(tuesdayPrompt).toContain('established work routines');

    const wednesdayPrompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Wednesday'
    );

    expect(wednesdayPrompt).toContain('mid-week day');

    const thursdayPrompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Thursday'
    );

    expect(thursdayPrompt).toContain('mid-week day');
  });

  it('should include day-specific activity context for Workday filter', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Workday'
    );

    expect(prompt).toContain('represents typical workdays');
    expect(prompt).toContain('Monday-Friday');
    expect(prompt).toContain('structured routines');
  });

  it('should include day-specific activity context for Weekend filter', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'Weekend'
    );

    expect(prompt).toContain('weekend days');
    expect(prompt).toContain('Saturday-Sunday');
    expect(prompt).toContain('flexible schedules');
  });

  it('should not include day filter context for "All Days"', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      undefined,
      'All Days'
    );

    expect(prompt).not.toContain('This data is filtered');
    expect(prompt).not.toContain('Acknowledge this in your analysis');
  });

  it('should include language instruction for English', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L'
    );

    expect(prompt).toContain('Respond in English');
  });

  it('should include language instruction for German', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'german',
      'mmol/L'
    );

    expect(prompt).toContain('Respond in German');
    expect(prompt).toContain('Sie/Ihr');
  });

  it('should include language instruction for Czech', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'czech',
      'mmol/L'
    );

    expect(prompt).toContain('Respond in Czech');
    expect(prompt).toContain('Vy/Váš');
  });

  it('should include language instruction for Serbian', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'serbian',
      'mmol/L'
    );

    expect(prompt).toContain('Respond in Serbian');
    expect(prompt).toContain('Vi/Vaš');
  });

  it('should include formatting rules', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L'
    );

    expect(prompt).toContain('IMPORTANT FORMATTING RULES');
    expect(prompt).toContain('Do NOT start with greetings');
    expect(prompt).toContain('Start directly with the analysis');
  });

  it('should include disclaimer instruction', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L'
    );

    expect(prompt).toContain('CONCLUSIO DATAE');
    expect(prompt).toContain('medical disclaimer');
  });

  it('should include 70% TIR target', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L'
    );

    expect(prompt).toContain('70% or higher');
  });

  it('should request concise response', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L'
    );

    expect(prompt).toContain('under 150 words');
  });

  it('should include provider name in disclaimer when provided', () => {
    const prompt = generateBGOverviewTIRPrompt(
      mockTIRStats3Category,
      mockThresholds,
      3,
      'english',
      'mmol/L',
      'perplexity'
    );

    expect(prompt).toContain('Perplexity');
  });
});
