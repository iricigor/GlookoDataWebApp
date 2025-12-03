/**
 * Perplexity API utility functions
 * 
 * This module provides functions to interact with the Perplexity API
 * for AI-powered analysis of glucose data.
 */

import { callOpenAICompatibleApi, type AIApiResult, type APIKeyVerificationResult } from './baseApiClient';

/**
 * Perplexity API response structure
 * @deprecated Use OpenAICompatibleResponse from baseApiClient instead
 */
export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
}

/**
 * Error response from Perplexity API
 * @deprecated Use ApiError from baseApiClient instead
 */
export interface PerplexityError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Result of calling Perplexity API
 */
export type PerplexityResult = AIApiResult;

/**
 * Call Perplexity API with a prompt
 * 
 * @param apiKey - Perplexity API key
 * @param prompt - The prompt to send to the AI
 * @param maxTokens - Maximum number of tokens for the response (default: 4000)
 * @param isRetry - Internal flag to prevent infinite retry loops
 * @returns Promise with the result containing success status and content or error
 */
export async function callPerplexityApi(
  apiKey: string,
  prompt: string,
  maxTokens: number = 4000,
  isRetry: boolean = false
): Promise<PerplexityResult> {
  return callOpenAICompatibleApi(
    {
      url: 'https://api.perplexity.ai/chat/completions',
      model: 'sonar',
      finishReasonTruncated: 'length',
    },
    apiKey,
    prompt,
    maxTokens,
    isRetry
  );
}

/**
 * Verify if a Perplexity API key is valid by making a minimal API call.
 * 
 * Unlike other providers, Perplexity doesn't have a list models endpoint,
 * so we use a minimal chat completion request with max_tokens=1 to minimize cost.
 * This approach uses very few tokens (typically less than 10 total) to verify
 * the API key is valid and has the necessary permissions.
 * 
 * @param apiKey - Perplexity API key to verify
 * @returns Promise with the verification result containing valid status and optional error
 * 
 * @example
 * ```typescript
 * const result = await verifyPerplexityApiKey('pplx-...');
 * if (result.valid) {
 *   console.log('API key is valid');
 * } else {
 *   console.error('Invalid key:', result.error);
 * }
 * ```
 */
export async function verifyPerplexityApiKey(apiKey: string): Promise<APIKeyVerificationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid API key' };
    }

    return { valid: false, error: `API error: ${response.status}` };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { valid: false, error: 'Network error' };
    }
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
