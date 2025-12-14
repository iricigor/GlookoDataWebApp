/**
 * Admin Test AI API client
 * 
 * This module provides a client for testing Pro AI key configuration
 * from the admin page. Supports two test modes:
 * - Infrastructure test: verifies Key Vault access and environment configuration
 * - Full test: includes infrastructure test plus AI provider response
 */

import { createApiLogger } from '../logger';

/**
 * Type of AI test to perform
 */
export type TestAIType = 'infra' | 'full';

/**
 * Result of testing AI provider
 */
export interface TestAIResult {
  success: boolean;
  testType?: TestAIType;
  provider?: string;
  keyVaultName?: string;
  secretName?: string;
  secretExists?: boolean;
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
 * This function calls the Azure Function to test the Pro AI key configuration.
 * Supports two test modes:
 * - 'infra': Tests infrastructure only (Key Vault access, environment variables)
 * - 'full': Tests infrastructure plus sends a test query to the AI provider
 * 
 * The provider is determined by the backend's AI_PROVIDER environment variable.
 * Requires the caller to be authenticated as a Pro user.
 * 
 * @param idToken - The ID token from MSAL authentication
 * @param testType - Type of test to perform ('infra' or 'full', defaults to 'full')
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status, provider, Key Vault config, and message or error
 */
export async function testProAIKey(
  idToken: string,
  testType: TestAIType = 'full',
  config: AdminTestAIConfig = defaultConfig
): Promise<TestAIResult> {
  const endpoint = `${config.baseUrl}/glookoAdmin/test-ai-key?testType=${testType}`;
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
    // Send empty body - provider is determined by backend environment configuration
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'x-correlation-id': apiLogger.correlationId,
      },
      body: JSON.stringify({}),
    });

    const statusCode = response.status;

    // Success case
    if (response.ok) {
      const data = await response.json() as { 
        success: boolean;
        testType: TestAIType;
        provider: string; 
        keyVaultName?: string;
        secretName?: string;
        secretExists?: boolean;
        message?: string;
      };
      apiLogger.logSuccess(statusCode, { 
        testType: data.testType,
        provider: data.provider,
        keyVaultName: data.keyVaultName,
        secretName: data.secretName,
        secretExists: data.secretExists
      });
      return {
        success: data.success,
        testType: data.testType,
        provider: data.provider,
        keyVaultName: data.keyVaultName,
        secretName: data.secretName,
        secretExists: data.secretExists,
        message: data.message,
        statusCode,
      };
    }

    // Error handling
    let errorData: { 
      error?: string; 
      errorType?: string;
      testType?: TestAIType;
      provider?: string;
      keyVaultName?: string;
      secretName?: string;
      secretExists?: boolean;
    } = {};
    try {
      errorData = await response.json();
    } catch (jsonError) {
      // JSON parsing failed - likely not a JSON response
      // Use generic error message based on status code
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
      // Include configuration from error response if available
      testType: errorData.testType,
      provider: errorData.provider,
      keyVaultName: errorData.keyVaultName,
      secretName: errorData.secretName,
      secretExists: errorData.secretExists,
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
