/**
 * Google Gemini API utility functions
 * 
 * This module provides functions to interact with Google's Gemini API
 * for AI-powered analysis of glucose data.
 */

import { AI_SYSTEM_PROMPT } from './aiPrompts';
import { validateInputs, handleHttpError, handleException, type AIApiResult, type APIKeyVerificationResult } from './baseApiClient';

/**
 * Gemini API response structure
 */
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Error response from Gemini API
 */
export interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Result of calling Gemini API
 */
export type GeminiResult = AIApiResult;

/**
 * Call Google Gemini API with a prompt
 * 
 * @param apiKey - Google Gemini API key
 * @param prompt - The prompt to send to the AI
 * @param maxTokens - Maximum number of tokens for the response (default: 4000)
 * @param isRetry - Internal flag to prevent infinite retry loops
 * @returns Promise with the result containing success status and content or error
 */
export async function callGeminiApi(
  apiKey: string,
  prompt: string,
  maxTokens: number = 4000,
  isRetry: boolean = false
): Promise<GeminiResult> {
  // Validate inputs using common validation
  const validationError = validateInputs(apiKey, prompt);
  if (validationError) {
    return validationError;
  }

  try {
    // Using gemini-2.0-flash-exp model as specified
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${AI_SYSTEM_PROMPT}\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: maxTokens,
          topP: 0.8,
          topK: 40,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    // Handle HTTP errors using common handler
    if (!response.ok) {
      return handleHttpError(response);
    }

    // Parse successful response
    const data = await response.json() as GeminiResponse | GeminiError;
    
    // Check if response contains an error (Gemini can return errors with HTTP 200)
    if ('error' in data && data.error) {
      return {
        success: false,
        error: data.error.message || 'Unknown error from API',
        errorType: 'api',
      };
    }
    
    // Type guard to check if data is a GeminiResponse
    if ('candidates' in data && data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      const candidate = data.candidates[0];
      const content = candidate.content.parts[0].text;
      const truncated = candidate.finishReason === 'MAX_TOKENS';
      
      // If response was truncated and this is not already a retry, retry with double the tokens
      if (truncated && !isRetry && maxTokens < 8000) {
        const newMaxTokens = Math.min(maxTokens * 2, 8000);
        return callGeminiApi(apiKey, prompt, newMaxTokens, true);
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
    // Handle exceptions using common handler
    return handleException(error);
  }
}

/**
 * Verify if a Gemini API key is valid by calling the list models endpoint.
 * This is a lightweight check that doesn't incur any cost.
 * 
 * @param apiKey - Google Gemini API key to verify
 * @returns Promise with the verification result
 */
export async function verifyGeminiApiKey(apiKey: string): Promise<APIKeyVerificationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
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
