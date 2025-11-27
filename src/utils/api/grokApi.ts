/**
 * Grok AI API utility functions
 * 
 * This module provides functions to interact with xAI's Grok API
 * for AI-powered analysis of glucose data.
 */

import { callOpenAICompatibleApi, type AIApiResult } from './baseApiClient';

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
