/**
 * Base API client for AI providers
 * 
 * This module provides a generic base client for calling AI APIs with common logic
 * for validation, error handling, and response processing.
 */

import { AI_SYSTEM_PROMPT } from './aiPrompts';

/**
 * Common result interface for all AI API calls
 */
export interface AIApiResult {
  success: boolean;
  content?: string;
  error?: string;
  errorType?: 'unauthorized' | 'network' | 'api' | 'unknown';
  truncated?: boolean;
}

/**
 * Result interface for API key verification
 * 
 * This interface represents the outcome of verifying an API key
 * against a provider's authentication endpoint.
 */
export interface APIKeyVerificationResult {
  /** Whether the API key is valid and can be used for API calls */
  valid: boolean;
  /** Error message if validation failed (undefined when valid is true) */
  error?: string;
}

/**
 * Configuration for an OpenAI-compatible API provider
 */
export interface OpenAICompatibleConfig {
  url: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  finishReasonTruncated?: string;
}

/**
 * OpenAI-compatible API response structure
 */
export interface OpenAICompatibleResponse {
  id: string;
  object?: string;
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
 * Standard error response format
 */
export interface ApiError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Validate common inputs (API key and prompt)
 * 
 * @param apiKey - API key to validate
 * @param prompt - Prompt to validate
 * @returns Error result if validation fails, null if valid
 */
export function validateInputs(apiKey: string, prompt: string): AIApiResult | null {
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'API key is required',
      errorType: 'unauthorized',
    };
  }

  if (!prompt || prompt.trim() === '') {
    return {
      success: false,
      error: 'Prompt is required',
      errorType: 'api',
    };
  }

  return null;
}

/**
 * Handle HTTP errors from API response
 * 
 * @param response - Fetch response object
 * @returns Error result
 */
export async function handleHttpError(response: Response): Promise<AIApiResult> {
  if (response.status === 401 || response.status === 403) {
    return {
      success: false,
      error: 'Invalid API key or unauthorized access. Please check your API key in Settings.',
      errorType: 'unauthorized',
    };
  }

  // Try to parse error message from response
  try {
    const errorData = await response.json() as ApiError;
    return {
      success: false,
      error: errorData.error?.message || `API error: ${response.status} ${response.statusText}`,
      errorType: 'api',
    };
  } catch {
    return {
      success: false,
      error: `API error: ${response.status} ${response.statusText}`,
      errorType: 'api',
    };
  }
}

/**
 * Handle network and other exceptions
 * 
 * @param error - Error object
 * @returns Error result
 */
export function handleException(error: unknown): AIApiResult {
  // Handle network errors or other exceptions
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      success: false,
      error: 'Network error. Please check your internet connection.',
      errorType: 'network',
    };
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
    errorType: 'unknown',
  };
}

/**
 * Call an OpenAI-compatible API with a prompt
 * This function handles the common logic for APIs that follow the OpenAI format.
 * 
 * @param config - API configuration (URL, model, etc.)
 * @param apiKey - API key for authentication
 * @param prompt - The prompt to send to the AI
 * @param maxTokens - Maximum number of tokens for the response (default: 4000)
 * @param isRetry - Internal flag to prevent infinite retry loops
 * @returns Promise with the result containing success status and content or error
 */
export async function callOpenAICompatibleApi(
  config: OpenAICompatibleConfig,
  apiKey: string,
  prompt: string,
  maxTokens: number = 4000,
  isRetry: boolean = false
): Promise<AIApiResult> {
  // Validate inputs
  const validationError = validateInputs(apiKey, prompt);
  if (validationError) {
    return validationError;
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: config.systemPrompt || AI_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: config.temperature ?? 0.2,
        max_tokens: maxTokens,
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      return handleHttpError(response);
    }

    // Parse successful response
    const data = await response.json() as OpenAICompatibleResponse | ApiError;
    
    // Check if response contains an error (some APIs can return errors with HTTP 200)
    if ('error' in data && data.error) {
      return {
        success: false,
        error: data.error.message || 'Unknown error from API',
        errorType: 'api',
      };
    }
    
    // Type guard to check if data is a valid response
    if ('choices' in data && data.choices && data.choices.length > 0 && data.choices[0].message) {
      const choice = data.choices[0];
      const content = choice.message.content;
      const finishReasonTruncated = config.finishReasonTruncated || 'length';
      const truncated = choice.finish_reason === finishReasonTruncated;
      
      // If response was truncated and this is not already a retry, retry with double the tokens
      if (truncated && !isRetry && maxTokens < 8000) {
        const newMaxTokens = Math.min(maxTokens * 2, 8000);
        return callOpenAICompatibleApi(config, apiKey, prompt, newMaxTokens, true);
      }
      
      // If response was truncated but we can't retry (already retried or at max), add a warning
      let finalContent = content.trim();
      if (truncated) {
        finalContent += '\n\n⚠️ **Note:** This response was truncated due to length limits. The analysis may be incomplete.';
      }
      
      return {
        success: true,
        content: finalContent,
        truncated,
      };
    }

    return {
      success: false,
      error: 'Invalid response format from API',
      errorType: 'api',
    };

  } catch (error) {
    return handleException(error);
  }
}
