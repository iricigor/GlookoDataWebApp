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
 * Get the disclaimer instruction for AI prompts in the specified language
 * 
 * @param provider - AI provider being used
 * @param language - Response language (english, czech, german, or serbian)
 * @returns Disclaimer instruction string for AI prompt in the requested language
 */
export function getDisclaimerInstruction(provider?: AIProvider, language: ResponseLanguage = 'english'): string {
  const providerName = provider ? getProviderDisplayName(provider) : 'AI';
  
  let disclaimerText: string;
  
  switch (language) {
    case 'czech':
      disclaimerText = `Data poskytuje ${providerName} a nemusí být správná. Vždy se poraďte se svým lékařem nebo poskytovatelem zdravotní péče.`;
      break;
    case 'german':
      disclaimerText = `Daten werden von ${providerName} bereitgestellt und sind möglicherweise nicht korrekt. Konsultieren Sie immer Ihren Arzt oder Ihre Ärztin.`;
      break;
    case 'serbian':
      disclaimerText = `Podatke pruža ${providerName} i mogu biti netačni. Uvek se konsultujte sa svojim lekarom ili pružaocem zdravstvene zaštite.`;
      break;
    case 'english':
    default:
      disclaimerText = `Data is provided by ${providerName} and it might not be correct. Always consult with your doctor or healthcare provider.`;
      break;
  }
  
  return `\n\nIMPORTANT: End your response with a medical disclaimer stating: "${disclaimerText}" Then on a new line, add the marker "--- CONCLUSIO DATAE ---" to confirm your analysis is complete.`;
}
