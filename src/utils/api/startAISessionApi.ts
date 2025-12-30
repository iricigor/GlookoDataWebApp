/**
 * Start AI Session API Client
 * 
 * This module provides a client for calling the startAISession backend endpoint
 * which initiates an AI session and returns a temporary token.
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
 * Request body for start AI session
 */
interface StartAISessionRequest {
  testData?: string;
}

/**
 * Response from start AI session
 */
interface StartAISessionResponse {
  success: boolean;
  token: string;
  expiresAt: string;
  initialResponse: string;
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
  token?: string;
  expiresAt?: string;
  initialResponse?: string;
  error?: string;
  errorType?: 'unauthorized' | 'forbidden' | 'validation' | 'infrastructure' | 'network' | 'unknown';
  statusCode?: number;
}

/**
 * Start an AI session and return a temporary token.
 *
 * @param idToken - MSAL ID token used for Authorization header
 * @param testData - Optional test data to include in the initial prompt
 * @param config - Optional API configuration; defaults to the module's default (baseUrl '/api')
 * @returns A `StartAISessionResult` containing `success` and, on success, `token`, `expiresAt`, and `initialResponse`; on failure, `error`, `errorType`, and optionally `statusCode`
 */
export async function startAISession(
  idToken: string,
  testData?: string,
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
  
  apiLogger.logStart('POST');
  
  try {
    const requestBody: StartAISessionRequest = {};
    if (testData) {
      requestBody.testData = testData;
    }
    
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
    
    // Parse successful response
    const data: StartAISessionResponse = await response.json();
    
    if (!data.success || !data.token || !data.expiresAt || !data.initialResponse) {
      apiLogger.logError('Invalid response from backend', 'unknown', 200);
      return {
        success: false,
        error: 'Invalid response from backend',
        errorType: 'unknown',
      };
    }
    
    apiLogger.logSuccess(200, {
      expiresAt: data.expiresAt,
      responseLength: data.initialResponse.length,
    });
    
    return {
      success: true,
      token: data.token,
      expiresAt: data.expiresAt,
      initialResponse: data.initialResponse,
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
