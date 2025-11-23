/**
 * Unified AI API utility
 * 
 * This module provides a unified interface for calling different AI providers
 * (Perplexity or Google Gemini) based on user configuration.
 */

import { callPerplexityApi, type PerplexityResult } from './perplexityApi';
import { callGeminiApi, type GeminiResult } from './geminiApi';
import { callGrokApi, type GrokResult } from './grokApi';
import { callDeepSeekApi, type DeepSeekResult } from './deepseekApi';

/**
 * Supported AI providers
 */
export type AIProvider = 'perplexity' | 'gemini' | 'grok' | 'deepseek';

/**
 * Unified AI result type
 */
export type AIResult = PerplexityResult | GeminiResult | GrokResult | DeepSeekResult;

/**
 * Call the appropriate AI API based on provider selection
 * 
 * @param provider - The AI provider to use ('perplexity', 'gemini', 'grok', or 'deepseek')
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
    case 'grok':
      return callGrokApi(apiKey, prompt);
    case 'deepseek':
      return callDeepSeekApi(apiKey, prompt);
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
      return 'Perplexity AI';
    case 'gemini':
      return 'Google Gemini AI';
    case 'grok':
      return 'Grok AI';
    case 'deepseek':
      return 'DeepSeek AI';
    default:
      return provider;
  }
}

/**
 * Determine which provider should be used based on available API keys
 * Uses automatic priority order: Perplexity > Grok > DeepSeek > Gemini
 * 
 * @param perplexityKey - Perplexity API key
 * @param geminiKey - Google Gemini API key
 * @param grokKey - Grok AI API key
 * @param deepseekKey - DeepSeek API key
 * @returns The provider to use, or null if no keys are available
 */
export function determineActiveProvider(
  perplexityKey: string,
  geminiKey: string,
  grokKey: string,
  deepseekKey: string = ''
): AIProvider | null {
  // Priority order: Perplexity > Grok > DeepSeek > Gemini
  if (perplexityKey && perplexityKey.trim() !== '') {
    return 'perplexity';
  }
  if (grokKey && grokKey.trim() !== '') {
    return 'grok';
  }
  if (deepseekKey && deepseekKey.trim() !== '') {
    return 'deepseek';
  }
  if (geminiKey && geminiKey.trim() !== '') {
    return 'gemini';
  }
  return null;
}

/**
 * Get the active provider respecting manual selection when available
 * If a provider is manually selected, it will be used if it has an API key
 * Otherwise, falls back to automatic priority-based selection
 * 
 * @param selectedProvider - Manually selected provider (null for auto-select)
 * @param perplexityKey - Perplexity API key
 * @param geminiKey - Google Gemini API key
 * @param grokKey - Grok AI API key
 * @param deepseekKey - DeepSeek API key
 * @returns The provider to use, or null if no keys are available
 */
export function getActiveProvider(
  selectedProvider: AIProvider | null,
  perplexityKey: string,
  geminiKey: string,
  grokKey: string,
  deepseekKey: string = ''
): AIProvider | null {
  // If a provider is manually selected, use it if it has a key
  if (selectedProvider) {
    const hasKey = (provider: AIProvider): boolean => {
      switch (provider) {
        case 'perplexity':
          return !!(perplexityKey && perplexityKey.trim() !== '');
        case 'grok':
          return !!(grokKey && grokKey.trim() !== '');
        case 'deepseek':
          return !!(deepseekKey && deepseekKey.trim() !== '');
        case 'gemini':
          return !!(geminiKey && geminiKey.trim() !== '');
        default:
          return false;
      }
    };
    
    if (hasKey(selectedProvider)) {
      return selectedProvider;
    }
  }
  
  // Fall back to automatic selection based on priority
  return determineActiveProvider(perplexityKey, geminiKey, grokKey, deepseekKey);
}

/**
 * Get list of available providers (those with API keys configured)
 * 
 * @param perplexityKey - Perplexity API key
 * @param geminiKey - Google Gemini API key
 * @param grokKey - Grok AI API key
 * @param deepseekKey - DeepSeek API key
 * @returns Array of available providers
 */
export function getAvailableProviders(
  perplexityKey: string,
  geminiKey: string,
  grokKey: string,
  deepseekKey: string = ''
): AIProvider[] {
  const providers: AIProvider[] = [];
  
  if (perplexityKey && perplexityKey.trim() !== '') {
    providers.push('perplexity');
  }
  if (grokKey && grokKey.trim() !== '') {
    providers.push('grok');
  }
  if (deepseekKey && deepseekKey.trim() !== '') {
    providers.push('deepseek');
  }
  if (geminiKey && geminiKey.trim() !== '') {
    providers.push('gemini');
  }
  
  return providers;
}
