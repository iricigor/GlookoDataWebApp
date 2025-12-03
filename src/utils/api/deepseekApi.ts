/**
 * DeepSeek API utility functions
 * 
 * This module provides functions to interact with DeepSeek's API
 * for AI-powered analysis of glucose data.
 */

import { callOpenAICompatibleApi, type AIApiResult, type APIKeyVerificationResult } from './baseApiClient';

/**
 * DeepSeek API response structure (OpenAI-compatible)
 * @deprecated Use OpenAICompatibleResponse from baseApiClient instead
 */
export interface DeepSeekResponse {
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
 * Error response from DeepSeek API
 * @deprecated Use ApiError from baseApiClient instead
 */
export interface DeepSeekError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Result of calling DeepSeek API
 */
export type DeepSeekResult = AIApiResult;

/**
 * Call DeepSeek API with a prompt
 * 
 * @param apiKey - DeepSeek API key
 * @param prompt - The prompt to send to the AI
 * @param maxTokens - Maximum number of tokens for the response (default: 4000)
 * @param isRetry - Internal flag to prevent infinite retry loops
 * @returns Promise with the result containing success status and content or error
 */
export async function callDeepSeekApi(
  apiKey: string,
  prompt: string,
  maxTokens: number = 4000,
  isRetry: boolean = false
): Promise<DeepSeekResult> {
  return callOpenAICompatibleApi(
    {
      url: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat',
      finishReasonTruncated: 'length',
    },
    apiKey,
    prompt,
    maxTokens,
    isRetry
  );
}

/**
 * Verify if a DeepSeek API key is valid by calling the list models endpoint.
 * This is a lightweight check that doesn't incur any cost.
 * 
 * @param apiKey - DeepSeek API key to verify
 * @returns Promise with the verification result
 */
export async function verifyDeepSeekApiKey(apiKey: string): Promise<APIKeyVerificationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  try {
    const response = await fetch('https://api.deepseek.com/models', {
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
