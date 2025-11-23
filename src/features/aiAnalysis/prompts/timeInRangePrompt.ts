/**
 * Time in Range AI prompt generation
 * 
 * This module provides the prompt generation logic for Time in Range analysis.
 */

import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit, GlucoseRangeStats, GlucoseThresholds } from '../../../types';
import { getLanguageInstruction } from './promptUtils';
import { calculatePercentage } from '../../../utils/data';

/**
 * Conversion factor from mmol/L to mg/dL
 */
const MMOL_TO_MGDL_FACTOR = 18;

/**
 * Generate AI prompt for time-in-range analysis
 * 
 * @param stats - Glucose range statistics
 * @param thresholds - Glucose thresholds
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit (mmol/L or mg/dL)
 * @returns Formatted prompt for AI analysis
 */
export function generateTimeInRangePrompt(
  stats: GlucoseRangeStats,
  thresholds: GlucoseThresholds,
  language: ResponseLanguage = 'english',
  unit: GlucoseUnit = 'mmol/L'
): string {
  const languageInstruction = getLanguageInstruction(language);
  
  const unitInstruction = unit === 'mg/dL'
    ? 'Remember that all glucose values are in mg/dL (not mmol/L).'
    : 'Remember that all glucose values are in mmol/L (not mg/dL).';
  
  const tirPercentage = calculatePercentage(stats.inRange, stats.total);
  const tarPercentage = calculatePercentage(stats.high, stats.total);
  
  // Format target range based on unit
  const targetRangeStr = unit === 'mg/dL'
    ? `${(thresholds.low * MMOL_TO_MGDL_FACTOR).toFixed(0)}-${(thresholds.high * MMOL_TO_MGDL_FACTOR).toFixed(0)} mg/dL`
    : `${thresholds.low.toFixed(1)}-${thresholds.high.toFixed(1)} mmol/L`;
  
  const highThresholdStr = unit === 'mg/dL'
    ? `${(thresholds.high * MMOL_TO_MGDL_FACTOR).toFixed(0)} mg/dL`
    : `${thresholds.high.toFixed(1)} mmol/L`;
  
  return `My percent time-in-range (TIR) from continuous glucose monitoring is ${tirPercentage.toFixed(1)}%, based on a target range of ${targetRangeStr}. My Time Above Range (>${highThresholdStr}) is ${tarPercentage.toFixed(1)}%. Provide a brief assessment and 2-3 specific, actionable and behavioral recommendations to improve your glucose management. Be encouraging but realistic. ${unitInstruction} The target TIR for most adults with diabetes is 70% or higher. Keep your response concise (under 200 words) and practical. Address me directly using "you/your" language. ${languageInstruction} Respond only with the assessment + recommendations, no intro, no disclaimers, no extra text.

IMPORTANT: End your response with "--- END OF ANALYSIS ---" on a new line to confirm your analysis is complete.`;
}
