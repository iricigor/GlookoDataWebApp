/**
 * Start AI Session API Client
 * 
 * This module provides a client for calling the startAISession backend endpoint
 * which acts as a secure proxy to Gemini AI. The backend validates Pro users and
 * forwards requests to Gemini without logging user data.
 */

import { createApiLogger } from '../logger';

/**
 * Configuration for the Start AI Session API
 */
export interface StartAISessionApiConfig {
  /** Base URL for the Azure Function API */
  baseUrl: string;
}

/**
 * Default configuration - uses the Azure Static Web App's API endpoint
 */
const defaultConfig: StartAISessionApiConfig = {
  baseUrl: '/api',
};

/**
 * Gemini API request structure (sent to our proxy)
 */
interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
    role?: string;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

/**
 * Gemini API response structure (received from our proxy)
 */
interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role?: string;
    };
    finishReason?: string;
    index?: number;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Error response from backend
 */
interface StartAISessionErrorResponse {
  error: string;
  errorType?: string;
  code?: string;
}

/**
 * Result of calling start AI session
 */
export interface StartAISessionResult {
  success: boolean;
  response?: string;
  error?: string;
  errorType?: 'unauthorized' | 'forbidden' | 'validation' | 'infrastructure' | 'network' | 'unknown';
  statusCode?: number;
}

/**
 * Send an AI analysis request through the backend proxy to Gemini AI.
 * The backend validates Pro user status and forwards the request to Gemini.
 * User data is sent directly to Gemini and not logged by our backend.
 *
 * @param idToken - MSAL ID token used for Authorization header
 * @param prompt - User prompt for AI analysis (required)
 * @param systemPrompt - Optional system prompt to prepend
 * @param config - Optional API configuration; defaults to the module's default (baseUrl '/api')
 * @returns A `StartAISessionResult` containing `success` and, on success, `response`; on failure, `error`, `errorType`, and optionally `statusCode`
 */
export async function startAISession(
  idToken: string,
  prompt: string,
  systemPrompt?: string,
  config: StartAISessionApiConfig = defaultConfig
): Promise<StartAISessionResult> {
  const endpoint = `${config.baseUrl}/ai/start-session`;
  const apiLogger = createApiLogger(endpoint);
  
  // Validate ID token
  if (!idToken || idToken.trim() === '') {
    apiLogger.logError('Authentication required - missing token', 'unauthorized');
    return {
      success: false,
      error: 'Authentication required',
      errorType: 'unauthorized',
    };
  }
  
  // Validate prompt
  if (!prompt || prompt.trim() === '') {
    apiLogger.logError('Prompt is required', 'validation');
    return {
      success: false,
      error: 'Prompt is required',
      errorType: 'validation',
    };
  }
  
  apiLogger.logStart('POST');
  
  try {
    // Build the full prompt with optional system prompt
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    
    // Create Gemini API request format
    const geminiRequest: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
        topP: 0.8,
        topK: 40,
      },
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'x-correlation-id': apiLogger.correlationId,
      },
      body: JSON.stringify(geminiRequest),
    });
    
    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      // Parse error response
      let errorData: StartAISessionErrorResponse | null = null;
      try {
        errorData = await response.json() as StartAISessionErrorResponse;
      } catch {
        // Failed to parse error response
      }
      
      const errorMessage = errorData?.error || `API error: ${response.status} ${response.statusText}`;
      const errorType = errorData?.errorType;
      
      // Handle specific error types
      if (statusCode === 401 || statusCode === 403) {
        const type = statusCode === 401 ? 'unauthorized' : 'forbidden';
        apiLogger.logError(errorMessage, type, statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: type,
          statusCode,
        };
      }
      
      if (statusCode === 400) {
        apiLogger.logError(errorMessage, 'validation', statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: 'validation',
          statusCode,
        };
      }
      
      if (statusCode >= 500) {
        apiLogger.logError(errorMessage, 'infrastructure', statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: 'infrastructure',
          statusCode,
        };
      }
      
      // Generic error
      apiLogger.logError(errorMessage, errorType || 'unknown', statusCode);
      return {
        success: false,
        error: errorMessage,
        errorType: (errorType as StartAISessionResult['errorType']) || 'unknown',
        statusCode,
      };
    }
    
    // Parse Gemini response
    const data: GeminiResponse = await response.json();
    
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      apiLogger.logError('Invalid response from Gemini API', 'unknown', 200);
      return {
        success: false,
        error: 'Invalid response from Gemini API',
        errorType: 'unknown',
      };
    }
    
    apiLogger.logSuccess(200, {
      responseLength: responseText.length,
    });
    
    return {
      success: true,
      response: responseText,
    };
    
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      apiLogger.logError('Network error. Please check your internet connection.', 'network');
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
        errorType: 'network',
      };
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    apiLogger.logError(errorMessage, 'unknown');
    return {
      success: false,
      error: errorMessage,
      errorType: 'unknown',
    };
  }
}
