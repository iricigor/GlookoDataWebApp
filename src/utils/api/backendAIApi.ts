/**
 * Backend AI Query API for Pro Users
 * 
 * This module provides a client for calling the backend AI query endpoint
 * which is only available to Pro users. The backend handles API key management
 * and calls to AI providers on behalf of the user.
 */

import { createApiLogger } from '../logger';

/**
 * Configuration for the Backend AI Query API
 */
export interface BackendAIApiConfig {
  /** Base URL for the Azure Function API */
  baseUrl: string;
}

/**
 * Default configuration - uses the Azure Static Web App's API endpoint
 */
const defaultConfig: BackendAIApiConfig = {
  baseUrl: '/api',
};

/**
 * Request body for backend AI query
 */
interface BackendAIQueryRequest {
  prompt: string;
}

/**
 * Response from backend AI query
 */
interface BackendAIQueryResponse {
  success: boolean;
  content: string;
  provider: string;
}

/**
 * Error response from backend
 */
interface BackendAIErrorResponse {
  error: string;
  errorType?: string;
  code?: string;
}

/**
 * Result of calling backend AI query
 */
export interface BackendAIResult {
  success: boolean;
  content?: string;
  provider?: string;
  error?: string;
  errorType?: 'unauthorized' | 'forbidden' | 'rate_limit' | 'validation' | 'provider' | 'infrastructure' | 'network' | 'unknown';
  statusCode?: number;
}

/**
 * Send a prompt to the backend AI query endpoint and return a structured result.
 *
 * The backend will use its configured default provider from environment variables.
 *
 * @param idToken - MSAL ID token used for Authorization header
 * @param prompt - The AI prompt to send to the backend
 * @param config - Optional API configuration; defaults to the module's default (baseUrl '/api')
 * @returns A `BackendAIResult` containing `success` and, on success, `content` and `provider`; on failure, `error`, `errorType`, and optionally `statusCode`
 */
export async function callBackendAI(
  idToken: string,
  prompt: string,
  config: BackendAIApiConfig = defaultConfig
): Promise<BackendAIResult> {
  const endpoint = `${config.baseUrl}/ai/query`;
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
    const requestBody: BackendAIQueryRequest = {
      prompt,
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'x-correlation-id': apiLogger.correlationId,
      },
      body: JSON.stringify(requestBody),
    });
    
    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      // Parse error response
      let errorData: BackendAIErrorResponse | null = null;
      try {
        errorData = await response.json() as BackendAIErrorResponse;
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
      
      if (statusCode === 429) {
        apiLogger.logError(errorMessage, 'rate_limit', statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: 'rate_limit',
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
        const type = errorType === 'provider' ? 'provider' : 'infrastructure';
        apiLogger.logError(errorMessage, type, statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: type,
          statusCode,
        };
      }
      
      // Generic error
      apiLogger.logError(errorMessage, errorType || 'unknown', statusCode);
      return {
        success: false,
        error: errorMessage,
        errorType: (errorType as BackendAIResult['errorType']) || 'unknown',
        statusCode,
      };
    }
    
    // Parse successful response
    const data: BackendAIQueryResponse = await response.json();
    
    if (!data.success || !data.content) {
      apiLogger.logError('Invalid response from backend', 'unknown', 200);
      return {
        success: false,
        error: 'Invalid response from backend',
        errorType: 'unknown',
      };
    }
    
    apiLogger.logSuccess(200, {
      provider: data.provider,
      contentLength: data.content.length,
    });
    
    return {
      success: true,
      content: data.content,
      provider: data.provider,
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