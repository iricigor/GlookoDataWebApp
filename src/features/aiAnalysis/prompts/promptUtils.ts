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
      return 'Respond in Czech language (česky). IMPORTANT: Use formal mode of address (vykání - use "Vy/Váš" instead of "ty/tvůj").';
    case 'german':
      return 'Respond in German language (auf Deutsch). IMPORTANT: Use formal mode of address (Siezen - use "Sie/Ihr" instead of "du/dein").';
    case 'serbian':
      return 'Respond in Serbian language using Latin script (na srpskom latiničnim pismom). IMPORTANT: Use formal mode of address (persiranje - use "Vi/Vaš" instead of "ti/tvoj").';
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
  
  // When provider is not specified (Pro users with backend keys), add explicit instruction
  // to use the exact text "AI" and not substitute it with any specific provider name.
  // Note: This instruction is for the AI model itself (part of system prompt), not user-facing text.
  // The AI will still output the disclaimer in the correct language as specified in disclaimerText.
  const exactTextInstruction = !provider 
    ? ` Use the exact text "AI" in the disclaimer - do NOT substitute it with any specific provider name like "Grok AI", "Gemini", "Perplexity", etc.`
    : '';
  
  return `\n\nIMPORTANT: End your response with a medical disclaimer stating: "${disclaimerText}"${exactTextInstruction} Then add the completion marker "--- CONCLUSIO DATAE ---" on its own separate line to confirm your analysis is complete.`;
}
