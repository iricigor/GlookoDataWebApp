/**
 * Unified AI API utility
 * 
 * This module provides a unified interface for calling different AI providers
 * (Perplexity or Google Gemini) based on user configuration.
 */

import { callPerplexityApi, verifyPerplexityApiKey, type PerplexityResult } from './perplexityApi';
import { callGeminiApi, verifyGeminiApiKey, type GeminiResult } from './geminiApi';
import { callGrokApi, verifyGrokApiKey, type GrokResult } from './grokApi';
import { callDeepSeekApi, verifyDeepSeekApiKey, type DeepSeekResult } from './deepseekApi';
import { type APIKeyVerificationResult } from './baseApiClient';

/**
 * Supported AI providers
 */
export type AIProvider = 'perplexity' | 'gemini' | 'grok' | 'deepseek';

/**
 * Unified AI result type
 */
export type AIResult = PerplexityResult | GeminiResult | GrokResult | DeepSeekResult;

/**
 * Helper function to detect if an error is related to request size being too large
 * @param errorMessage - The error message from the API
 * @returns true if the error is related to request size
 */
export function isRequestTooLargeError(errorMessage: string | undefined): boolean {
  if (!errorMessage) return false;
  
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes('too large') ||
    lowerMessage.includes('too long') ||
    lowerMessage.includes('exceeds') ||
    lowerMessage.includes('maximum') ||
    lowerMessage.includes('limit') ||
    lowerMessage.includes('token') && (lowerMessage.includes('limit') || lowerMessage.includes('exceed')) ||
    lowerMessage.includes('payload') && lowerMessage.includes('large') ||
    lowerMessage.includes('request') && lowerMessage.includes('size')
  );
}

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

/**
 * Verify an API key for the specified AI provider.
 *
 * @param provider - The AI provider to verify (`'perplexity'`, `'gemini'`, `'grok'`, or `'deepseek'`)
 * @param apiKey - The API key to verify
 * @returns The verification result with `valid` set to `true` if the key is valid, otherwise `valid` is `false` and `error` may contain a message
 */
export async function verifyApiKey(
  provider: AIProvider,
  apiKey: string
): Promise<APIKeyVerificationResult> {
  switch (provider) {
    case 'perplexity':
      return verifyPerplexityApiKey(apiKey);
    case 'gemini':
      return verifyGeminiApiKey(apiKey);
    case 'grok':
      return verifyGrokApiKey(apiKey);
    case 'deepseek':
      return verifyDeepSeekApiKey(apiKey);
    default:
      return { valid: false, error: `Unknown provider: ${provider}` };
  }
}

/**
 * Route a prompt to either the backend (for Pro users) or the client-side provider API.
 *
 * When `isProUser` is true, `useProKeys` is true, and an `idToken` is provided, the request is forwarded to the backend
 * where provider keys are managed; otherwise the call is performed client-side using the supplied `apiKey`.
 *
 * @param provider - The AI provider to use ('perplexity', 'gemini', 'grok', or 'deepseek')
 * @param prompt - The prompt to send to the AI
 * @param options - Call options
 * @param options.apiKey - User's client-side API key (required for non‑Pro calls)
 * @param options.idToken - ID token used to authenticate backend (Pro) requests
 * @param options.isProUser - Set to true to enable Pro routing when `idToken` and `useProKeys` are provided
 * @param options.useProKeys - Set to true to use Pro backend keys (only applies to Pro users)
 * @returns An AIResult object containing `success`, `content` on success, `error` with `errorType` on failure
 */
export async function callAIWithRouting(
  provider: AIProvider,
  prompt: string,
  options: {
    apiKey?: string;
    idToken?: string;
    isProUser?: boolean;
    useProKeys?: boolean;
  }
): Promise<AIResult> {
  const { apiKey, idToken, isProUser, useProKeys = true } = options;
  
  // If user is a Pro user with an ID token and has opted to use Pro keys, use backend API
  if (isProUser && useProKeys && idToken) {
    // Dynamic import to avoid circular dependencies
    const { callBackendAI } = await import('./backendAIApi');
    
    const result = await callBackendAI(idToken, prompt, provider);
    
    // Convert backend result to AIResult format
    // Map backend error types to standard AI error types
    let mappedErrorType: 'unauthorized' | 'network' | 'api' | 'unknown' = 'unknown';
    if (result.errorType) {
      switch (result.errorType) {
        case 'unauthorized':
          mappedErrorType = 'unauthorized';
          break;
        case 'network':
          mappedErrorType = 'network';
          break;
        case 'forbidden':
        case 'rate_limit':
        case 'validation':
        case 'provider':
        case 'infrastructure':
          mappedErrorType = 'api';
          break;
        default:
          mappedErrorType = 'unknown';
      }
    }
    
    return {
      success: result.success,
      content: result.content,
      error: result.error,
      errorType: mappedErrorType,
    };
  }
  
  // Otherwise, use client-side API call with user's API key
  if (!apiKey) {
    return {
      success: false,
      error: 'API key is required when not using Pro backend keys',
      errorType: 'api',
    };
  }
  
  return callAIApi(provider, apiKey, prompt);
}
