/**
 * Shared utilities for AI prompt generation
 */

import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';

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
