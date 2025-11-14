/**
 * Grok AI API utility functions
 * 
 * This module provides functions to interact with xAI's Grok API
 * for AI-powered analysis of glucose data.
 */

import { AI_SYSTEM_PROMPT } from './aiPrompts';

/**
 * Grok API response structure (OpenAI-compatible)
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
export interface GrokResult {
  success: boolean;
  content?: string;
  error?: string;
  errorType?: 'unauthorized' | 'network' | 'api' | 'unknown';
  truncated?: boolean;
}

/**
 * Call Grok API with a prompt
 * 
 * @param apiKey - Grok API key
 * @param prompt - The prompt to send to the AI
 * @returns Promise with the result containing success status and content or error
 */
export async function callGrokApi(
  apiKey: string,
  prompt: string
): Promise<GrokResult> {
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
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
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
        max_tokens: 4000,
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
        const errorData = await response.json() as GrokError;
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
    const data = await response.json() as GrokResponse | GrokError;
    
    // Check if response contains an error (some APIs can return errors with HTTP 200)
    if ('error' in data && data.error) {
      return {
        success: false,
        error: data.error.message || 'Unknown error from API',
        errorType: 'api',
      };
    }
    
    // Type guard to check if data is a GrokResponse
    if ('choices' in data && data.choices && data.choices.length > 0 && data.choices[0].message) {
      const choice = data.choices[0];
      const content = choice.message.content;
      const truncated = choice.finish_reason === 'length';
      
      // If response was truncated due to token limit, add a warning
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
