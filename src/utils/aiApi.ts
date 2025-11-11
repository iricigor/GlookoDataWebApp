/**
 * Unified AI API utility
 * 
 * This module provides a unified interface for calling different AI providers
 * (Perplexity or Google Gemini) based on user configuration.
 */

import { callPerplexityApi, type PerplexityResult } from './perplexityApi';
import { callGeminiApi, type GeminiResult } from './geminiApi';

/**
 * Supported AI providers
 */
export type AIProvider = 'perplexity' | 'gemini';

/**
 * Unified AI result type
 */
export type AIResult = PerplexityResult | GeminiResult;

/**
 * Call the appropriate AI API based on provider selection
 * 
 * @param provider - The AI provider to use ('perplexity' or 'gemini')
 * @param apiKey - The API key for the selected provider
 * @param prompt - The prompt to send to the AI
 * @returns Promise with the result containing success status and content or error
 */
export async function callAIApi(
  provider: AIProvider,
  apiKey: string,
  prompt: string
): Promise<AIResult> {
  switch (provider) {
    case 'perplexity':
      return callPerplexityApi(apiKey, prompt);
    case 'gemini':
      return callGeminiApi(apiKey, prompt);
    default:
      return {
        success: false,
        error: `Unknown AI provider: ${provider}`,
        errorType: 'unknown',
      };
  }
}

/**
 * Get the display name for an AI provider
 * 
 * @param provider - The AI provider
 * @returns The display name
 */
export function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case 'perplexity':
      return 'Perplexity';
    case 'gemini':
      return 'Google Gemini';
    default:
      return provider;
  }
}

/**
 * Determine which provider should be used based on available API keys
 * 
 * @param perplexityKey - Perplexity API key
 * @param geminiKey - Google Gemini API key
 * @returns The provider to use, or null if no keys are available
 */
export function determineActiveProvider(
  perplexityKey: string,
  geminiKey: string
): AIProvider | null {
  // Prioritize Perplexity if both are available
  if (perplexityKey && perplexityKey.trim() !== '') {
    return 'perplexity';
  }
  if (geminiKey && geminiKey.trim() !== '') {
    return 'gemini';
  }
  return null;
}
