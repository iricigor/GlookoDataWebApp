/**
 * DeepSeek API utility functions
 * 
 * This module provides functions to interact with DeepSeek's API
 * for AI-powered analysis of glucose data.
 */

import { callOpenAICompatibleApi, type AIApiResult } from './baseApiClient';

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
