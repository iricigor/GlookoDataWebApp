/**
 * Perplexity API utility functions
 * 
 * This module provides functions to interact with the Perplexity API
 * for AI-powered analysis of glucose data.
 */

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
}

/**
 * Call Perplexity API with a prompt
 * 
 * @param apiKey - Perplexity API key
 * @param prompt - The prompt to send to the AI
 * @returns Promise with the result containing success status and content or error
 */
export async function callPerplexityApi(
  apiKey: string,
  prompt: string
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
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful medical assistant specializing in diabetes care and continuous glucose monitoring analysis. Provide clear, actionable, and evidence-based recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
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
    const data = await response.json() as PerplexityResponse;
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      const content = data.choices[0].message.content;
      return {
        success: true,
        content: content.trim(),
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

/**
 * Generate AI prompt for time-in-range analysis
 * 
 * @param tirPercentage - Time in range percentage (0-100)
 * @returns Formatted prompt for AI analysis
 */
export function generateTimeInRangePrompt(tirPercentage: number): string {
  return `Given a patient's percent time-in-range (TIR) from continuous glucose monitoring is ${tirPercentage.toFixed(1)}%, provide a brief clinical assessment and 2-3 specific, actionable recommendations to improve their glucose management. The target TIR for most adults with diabetes is 70% or higher. Keep your response concise (under 200 words) and practical.`;
}
