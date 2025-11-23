/**
 * Shared utilities for AI prompt generation
 */

import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { AIProvider } from '../../../utils/api/aiApi';
import { getProviderDisplayName } from '../../../utils/api/aiApi';

/**
 * Get the language instruction for AI prompts based on the selected language
 * 
 * @param language - Response language (english, czech, german, or serbian)
 * @returns Language instruction string for AI prompt
 */
export function getLanguageInstruction(language: ResponseLanguage): string {
  switch (language) {
    case 'czech':
      return 'Respond in Czech language (česky).';
    case 'german':
      return 'Respond in German language (auf Deutsch).';
    case 'serbian':
      return 'Respond in Serbian language using Latin script (na srpskom latiničnim pismom).';
    case 'english':
    default:
      return 'Respond in English.';
  }
}

/**
 * Get the disclaimer instruction for AI prompts
 * 
 * @param provider - AI provider being used
 * @returns Disclaimer instruction string for AI prompt
 */
export function getDisclaimerInstruction(provider?: AIProvider): string {
  const providerName = provider ? getProviderDisplayName(provider) : 'AI';
  return `\n\nIMPORTANT: End your response with a medical disclaimer stating: "Data is provided by ${providerName} and it might not be correct. Always consult with your doctor or healthcare provider." Then on a new line, add the marker "--- CONCLUSIO DATAE ---" to confirm your analysis is complete.`;
}
