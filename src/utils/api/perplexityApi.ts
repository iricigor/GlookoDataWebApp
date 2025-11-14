/**
 * Perplexity API utility functions
 * 
 * This module provides functions to interact with the Perplexity API
 * for AI-powered analysis of glucose data.
 */

import { AI_SYSTEM_PROMPT } from './aiPrompts';

/**
 * Perplexity API response structure
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
export interface PerplexityResult {
  success: boolean;
  content?: string;
  error?: string;
  errorType?: 'unauthorized' | 'network' | 'api' | 'unknown';
  truncated?: boolean;
}

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
  // Validate inputs
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

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: AI_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Invalid API key or unauthorized access. Please check your API key in Settings.',
          errorType: 'unauthorized',
        };
      }

      // Try to parse error message from response
      try {
        const errorData = await response.json() as PerplexityError;
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

    // Parse successful response
    const data = await response.json() as PerplexityResponse | PerplexityError;
    
    // Check if response contains an error (some APIs can return errors with HTTP 200)
    if ('error' in data && data.error) {
      return {
        success: false,
        error: data.error.message || 'Unknown error from API',
        errorType: 'api',
      };
    }
    
    // Type guard to check if data is a PerplexityResponse
    if ('choices' in data && data.choices && data.choices.length > 0 && data.choices[0].message) {
      const choice = data.choices[0];
      const content = choice.message.content;
      const truncated = choice.finish_reason === 'length';
      
      // If response was truncated and this is not already a retry, retry with double the tokens
      if (truncated && !isRetry && maxTokens < 8000) {
        const newMaxTokens = Math.min(maxTokens * 2, 8000);
        return callPerplexityApi(apiKey, prompt, newMaxTokens, true);
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
}
