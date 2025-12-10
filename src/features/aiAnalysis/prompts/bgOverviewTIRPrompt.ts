/**
 * BG Overview Time in Range AI prompt generation
 * 
 * This module provides the prompt generation logic for inline TIR analysis in the BG Overview report.
 */

import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit, GlucoseThresholds, RangeCategoryMode, AGPDayOfWeekFilter } from '../../../types';
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
 * Get day-specific activity context for working persons
 * Provides typical activities and context for each day of the week
 * 
 * @param dayFilter - The day of week filter applied
 * @returns Activity context string, or empty string if not applicable
 */
function getDayActivityContext(dayFilter: AGPDayOfWeekFilter): string {
  switch (dayFilter) {
    case 'Monday':
      return 'Consider that Monday typically marks the start of the working week, with morning routines resuming after the weekend, potential stress from work transitions, and establishing new weekly patterns.';
    case 'Tuesday':
    case 'Wednesday':
    case 'Thursday':
      return `Consider that ${dayFilter} is a mid-week day, typically involving established work routines, regular meal timing, and consistent daily patterns for most working individuals.`;
    case 'Friday':
      return 'Consider that Friday typically marks the end of the working week, with anticipation of weekend leisure, possible social activities or celebrations, and transitions in routine as the weekend approaches.';
    case 'Saturday':
      return 'Consider that Saturday is typically a leisure day with more flexible schedules, potential variations in meal timing, possible increased physical activity or social events, and different routines compared to weekdays.';
    case 'Sunday':
      return 'Consider that Sunday is typically a leisure day, often involving family time, relaxation, meal preparation for the week ahead, and mental/physical preparation for the upcoming work week.';
    case 'Workday':
      return 'Consider that this data represents typical workdays (Monday-Friday), characterized by structured routines, regular meal timing, work-related stress, and consistent daily schedules.';
    case 'Weekend':
      return 'Consider that this data represents weekend days (Saturday-Sunday), typically featuring more flexible schedules, varied meal timing, leisure activities, and different patterns compared to workdays.';
    default:
      return '';
  }
}

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
 * @param dayFilter - Day of week filter applied to the data (optional)
 * @returns Formatted prompt for AI analysis
 */
export function generateBGOverviewTIRPrompt(
  tirStats: TIRStats,
  thresholds: GlucoseThresholds,
  categoryMode: RangeCategoryMode,
  language: ResponseLanguage = 'english',
  unit: GlucoseUnit = 'mmol/L',
  provider?: AIProvider,
  dayFilter: AGPDayOfWeekFilter = 'All Days'
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

  // Add day filter context if not "All Days"
  const dayActivityContext = getDayActivityContext(dayFilter);
  const dayFilterContext = dayFilter !== 'All Days' 
    ? `\n\nIMPORTANT: This data is filtered to show only ${dayFilter}. ${dayActivityContext} Acknowledge this day-specific context in your analysis and ensure your recommendations consider typical activities and patterns for this day/period.`
    : '';

  return `This analysis examines your continuous glucose monitoring (CGM) data time in range statistics to provide quick, actionable insights for improving glucose management.

My glucose time distribution:
${statsText}${dayFilterContext}

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
