/**
 * Time in Range AI prompt generation
 * 
 * This module provides the prompt generation logic for Time in Range analysis.
 */

import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';

/**
 * Generate AI prompt for time-in-range analysis
 * 
 * @param tirPercentage - Time in range percentage (0-100)
 * @param language - Response language (english or czech)
 * @returns Formatted prompt for AI analysis
 */
export function generateTimeInRangePrompt(tirPercentage: number, language: ResponseLanguage = 'english'): string {
  const languageInstruction = language === 'czech' 
    ? 'Respond in Czech language (česky).'
    : 'Respond in English.';
  
  return `My percent time-in-range (TIR) from continuous glucose monitoring is ${tirPercentage.toFixed(1)}%. Provide a brief assessment and 2-3 specific, actionable recommendations to improve my glucose management. Remember that all glucose values are in mmol/L (not mg/dL). The target TIR for most adults with diabetes is 70% or higher. Keep your response concise (under 200 words) and practical. Address me directly using "you/your" language. ${languageInstruction}

IMPORTANT: End your response with "--- END OF ANALYSIS ---" on a new line to confirm your analysis is complete.`;
}
