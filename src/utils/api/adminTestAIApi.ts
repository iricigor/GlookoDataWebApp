/**
 * Admin Test AI API client
 * 
 * This module provides a client for testing Pro AI key configuration
 * from the admin page.
 */

import { createApiLogger } from '../logger';

/**
 * Result of testing AI provider
 */
export interface TestAIResult {
  success: boolean;
  provider?: string;
  message?: string;
  error?: string;
  errorType?: 'unauthorized' | 'authorization' | 'validation' | 'infrastructure' | 'provider' | 'network' | 'unknown';
  statusCode?: number;
}

/**
 * Configuration for the Admin Test AI API
 */
export interface AdminTestAIConfig {
  /** Base URL for the Azure Function API */
  baseUrl: string;
}

/**
 * Default configuration - uses the Azure Static Web App's API endpoint
 */
const defaultConfig: AdminTestAIConfig = {
  baseUrl: '/api',
};

/**
 * Test Pro AI key configuration
 * 
 * This function calls the Azure Function to test the Pro AI key by sending
 * a simple test query. Requires the caller to be authenticated as a Pro user.
 * 
 * @param idToken - The ID token from MSAL authentication
 * @param provider - Optional AI provider to test (defaults to perplexity)
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status and message or error
 */
export async function testProAIKey(
  idToken: string,
  provider?: string,
  config: AdminTestAIConfig = defaultConfig
): Promise<TestAIResult> {
  const endpoint = `${config.baseUrl}/admin/test-ai`;
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
    const requestBody = provider ? { provider } : {};
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'x-correlation-id': apiLogger.correlationId,
      },
      body: JSON.stringify(requestBody),
    });

    const statusCode = response.status;

    // Success case
    if (response.ok) {
      const data = await response.json() as { success: boolean; provider: string; message: string };
      apiLogger.logSuccess(statusCode, { provider: data.provider });
      return {
        success: true,
        provider: data.provider,
        message: data.message,
        statusCode,
      };
    }

    // Error handling
    let errorData: { error?: string; errorType?: string } = {};
    try {
      errorData = await response.json();
    } catch (jsonError) {
      // JSON parsing failed
      console.warn('Failed to parse error response as JSON:', jsonError);
    }
    
    const errorType = errorData.errorType as TestAIResult['errorType'] || 'unknown';
    const errorMessage = errorData.error || `Request failed with status ${statusCode}`;

    apiLogger.logError(errorMessage, errorType, statusCode);

    // Map status codes to error types
    let mappedErrorType = errorType;
    if (statusCode === 401) {
      mappedErrorType = 'unauthorized';
    } else if (statusCode === 403) {
      mappedErrorType = 'authorization';
    } else if (statusCode === 400) {
      mappedErrorType = 'validation';
    } else if (statusCode === 503) {
      mappedErrorType = 'provider';
    } else if (statusCode >= 500) {
      mappedErrorType = 'infrastructure';
    }

    return {
      success: false,
      error: errorMessage,
      errorType: mappedErrorType,
      statusCode,
    };
  } catch (error: unknown) {
    // Network or other errors
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
    apiLogger.logError(errorMessage, 'network');
    
    return {
      success: false,
      error: errorMessage,
      errorType: 'network',
    };
  }
}
