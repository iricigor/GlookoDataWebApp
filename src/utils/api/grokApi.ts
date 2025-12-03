/**
 * Grok AI API utility functions
 * 
 * This module provides functions to interact with xAI's Grok API
 * for AI-powered analysis of glucose data.
 */

import { callOpenAICompatibleApi, type AIApiResult, type APIKeyVerificationResult } from './baseApiClient';

/**
 * Grok API response structure (OpenAI-compatible)
 * @deprecated Use OpenAICompatibleResponse from baseApiClient instead
 */
export interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Error response from Grok API
 * @deprecated Use ApiError from baseApiClient instead
 */
export interface GrokError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Result of calling Grok API
 */
export type GrokResult = AIApiResult;

/**
 * Call Grok API with a prompt
 * 
 * @param apiKey - Grok API key
 * @param prompt - The prompt to send to the AI
 * @param maxTokens - Maximum number of tokens for the response (default: 4000)
 * @param isRetry - Internal flag to prevent infinite retry loops
 * @returns Promise with the result containing success status and content or error
 */
export async function callGrokApi(
  apiKey: string,
  prompt: string,
  maxTokens: number = 4000,
  isRetry: boolean = false
): Promise<GrokResult> {
  return callOpenAICompatibleApi(
    {
      url: 'https://api.x.ai/v1/chat/completions',
      model: 'grok-3-mini',
      finishReasonTruncated: 'length',
    },
    apiKey,
    prompt,
    maxTokens,
    isRetry
  );
}

/**
 * Verify if a Grok API key is valid by calling the list models endpoint.
 * 
 * This is a lightweight check that doesn't incur any cost or consume tokens.
 * The function makes a GET request to xAI's models endpoint which only
 * requires authentication, not actual API usage.
 * 
 * @param apiKey - Grok API key to verify (from xAI)
 * @returns Promise with the verification result containing valid status and optional error
 * 
 * @example
 * ```typescript
 * const result = await verifyGrokApiKey('xai-...');
 * if (result.valid) {
 *   console.log('API key is valid');
 * } else {
 *   console.error('Invalid key:', result.error);
 * }
 * ```
 */
export async function verifyGrokApiKey(apiKey: string): Promise<APIKeyVerificationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  try {
    const response = await fetch('https://api.x.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
