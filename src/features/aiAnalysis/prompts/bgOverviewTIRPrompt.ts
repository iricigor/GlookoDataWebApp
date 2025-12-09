/**
 * BG Overview Time in Range AI prompt generation
 * 
 * This module provides the prompt generation logic for inline TIR analysis in the BG Overview report.
 */

import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit, GlucoseThresholds, RangeCategoryMode } from '../../../types';
import type { AIProvider } from '../../../utils/api/aiApi';
import type { TIRStats } from '../../../components/BGOverviewReport/types';
import { getLanguageInstruction, getDisclaimerInstruction } from './promptUtils';
import { calculatePercentage } from '../../../utils/data';

/**
 * Conversion factor from mmol/L to mg/dL
 * Standard glucose conversion: 1 mmol/L = 18 mg/dL
 */
const MMOL_TO_MGDL_FACTOR = 18;

/**
 * Generate AI prompt for BG Overview Time in Range analysis
 * 
 * This prompt is designed for quick, actionable insights displayed inline in the TIR card.
 * It focuses on providing one sentence analysis and three specific behavioral recommendations.
 * 
 * @param tirStats - Time in Range statistics
 * @param thresholds - Glucose thresholds
 * @param categoryMode - Range category mode (3 or 5 categories)
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit (mmol/L or mg/dL)
 * @param provider - AI provider being used (optional)
 * @returns Formatted prompt for AI analysis
 */
export function generateBGOverviewTIRPrompt(
  tirStats: TIRStats,
  thresholds: GlucoseThresholds,
  categoryMode: RangeCategoryMode,
  language: ResponseLanguage = 'english',
  unit: GlucoseUnit = 'mmol/L',
  provider?: AIProvider
): string {
  const languageInstruction = getLanguageInstruction(language);
  const disclaimerInstruction = getDisclaimerInstruction(provider, language);
  
  const unitInstruction = unit === 'mg/dL'
    ? 'Remember that all glucose values are in mg/dL (not mmol/L).'
    : 'Remember that all glucose values are in mmol/L (not mg/dL).';
  
  // Calculate percentages for all categories
  const tirPercentage = calculatePercentage(tirStats.inRange, tirStats.total);
  const lowPercentage = calculatePercentage(tirStats.low, tirStats.total);
  const highPercentage = calculatePercentage(tirStats.high, tirStats.total);
  
  // Format target range based on unit
  const targetRangeStr = unit === 'mg/dL'
    ? `${(thresholds.low * MMOL_TO_MGDL_FACTOR).toFixed(0)}-${(thresholds.high * MMOL_TO_MGDL_FACTOR).toFixed(0)} mg/dL`
    : `${thresholds.low.toFixed(1)}-${thresholds.high.toFixed(1)} mmol/L`;
  
  // Build statistics text based on category mode
  let statsText = `Time in Range (${targetRangeStr}): ${tirPercentage.toFixed(1)}%
Time Below Range: ${lowPercentage.toFixed(1)}%
Time Above Range: ${highPercentage.toFixed(1)}%`;

  // Add very low and very high if in 5-category mode
  if (categoryMode === 5 && tirStats.veryLow !== undefined && tirStats.veryHigh !== undefined) {
    const veryLowPercentage = calculatePercentage(tirStats.veryLow, tirStats.total);
    const veryHighPercentage = calculatePercentage(tirStats.veryHigh, tirStats.total);
    
    const veryLowThresholdStr = unit === 'mg/dL'
      ? `${(thresholds.veryLow! * MMOL_TO_MGDL_FACTOR).toFixed(0)} mg/dL`
      : `${thresholds.veryLow!.toFixed(1)} mmol/L`;
      
    const veryHighThresholdStr = unit === 'mg/dL'
      ? `${(thresholds.veryHigh! * MMOL_TO_MGDL_FACTOR).toFixed(0)} mg/dL`
      : `${thresholds.veryHigh!.toFixed(1)} mmol/L`;
    
    statsText = `Time in Range (${targetRangeStr}): ${tirPercentage.toFixed(1)}%
Time Very Low (<${veryLowThresholdStr}): ${veryLowPercentage.toFixed(1)}%
Time Low: ${lowPercentage.toFixed(1)}%
Time High: ${highPercentage.toFixed(1)}%
Time Very High (>${veryHighThresholdStr}): ${veryHighPercentage.toFixed(1)}%`;
  }

  return `This analysis examines your continuous glucose monitoring (CGM) data time in range statistics to provide quick, actionable insights for improving glucose management.

My glucose time distribution:
${statsText}

Based on these statistics, provide:
1. ONE brief sentence summarizing the overall glucose control pattern
2. THREE specific, actionable, and behavioral recommendations to improve glucose management

Guidelines:
- Be encouraging but realistic
- Keep recommendations practical and focused on behavior changes
- ${unitInstruction}
- Target TIR for most adults with diabetes: 70% or higher
- Keep total response under 150 words
- Address me directly using "you/your" language
${languageInstruction}

IMPORTANT FORMATTING RULES:
- Do NOT start with greetings like "Hello", "Good morning", etc.
- Do NOT include procedural statements like "I am analyzing", "Let me look at", etc.
- Start directly with the analysis sentence
- Format recommendations as a numbered list
- Respond only with the analysis + recommendations, no intro, no extra text${disclaimerInstruction}`;
}
