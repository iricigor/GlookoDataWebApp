/**
 * Admin Traffic Statistics API client for Azure Functions
 * 
 * This module provides an API client for fetching API and web traffic statistics
 * from Application Insights via the Azure Function backend. 
 * Access requires Pro user authentication.
 */

import { createApiLogger } from '../logger';

/**
 * Time period for statistics
 */
export type TimePeriod = '1hour' | '1day';

/**
 * Result of fetching API statistics
 */
export interface ApiStatsResult {
  success: boolean;
  webCalls?: number;
  webErrors?: number;
  apiCalls?: number;
  apiErrors?: number;
  timePeriod?: TimePeriod;
  error?: string;
  errorType?: 'unauthorized' | 'authorization' | 'infrastructure' | 'network' | 'unknown';
  /** HTTP status code when available */
  statusCode?: number;
}

/**
 * API response from the Azure Function
 */
interface ApiStatsApiResponse {
  webCalls: number;
  webErrors: number;
  apiCalls: number;
  apiErrors: number;
  timePeriod: TimePeriod;
}

/**
 * Configuration for the Admin API Statistics API
 */
export interface AdminApiStatsApiConfig {
  /** Base URL for the Azure Function API */
  baseUrl: string;
}

/**
 * Default configuration - uses the Azure Static Web App's API endpoint
 */
const defaultConfig: AdminApiStatsApiConfig = {
  baseUrl: '/api',
};

/**
 * Fetch API and web traffic statistics
 * 
 * This function calls the Azure Function to query Application Insights for
 * API call and error statistics over the specified time period.
 * Requires the caller to be authenticated as a Pro user.
 * 
 * @param idToken - The ID token from MSAL authentication
 * @param timePeriod - Time period for statistics (1hour or 1day)
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status and statistics or error
 */
export async function getApiStats(
  idToken: string,
  timePeriod: TimePeriod = '1hour',
  config: AdminApiStatsApiConfig = defaultConfig
): Promise<ApiStatsResult> {
  const endpoint = `${config.baseUrl}/glookoAdmin/stats/traffic?timePeriod=${timePeriod}`;
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

  apiLogger.logStart('GET');

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'x-correlation-id': apiLogger.correlationId,
      },
    });

    const statusCode = response.status;

    // Success case
    if (response.ok) {
      const data = await response.json() as ApiStatsApiResponse;
      apiLogger.logSuccess(statusCode, { 
        webCalls: data.webCalls, 
        webErrors: data.webErrors,
        apiCalls: data.apiCalls,
        apiErrors: data.apiErrors,
        timePeriod: data.timePeriod
      });
      return {
        success: true,
        webCalls: data.webCalls,
        webErrors: data.webErrors,
        apiCalls: data.apiCalls,
        apiErrors: data.apiErrors,
        timePeriod: data.timePeriod,
        statusCode,
      };
    }

    // Error handling
    let errorData: { error?: string; errorType?: string } = {};
    try {
      errorData = await response.json();
    } catch (jsonError) {
      console.warn('Failed to parse error response as JSON:', jsonError);
    }
    
    const errorType = errorData.errorType as ApiStatsResult['errorType'] || 'unknown';
    const errorMessage = errorData.error || `Request failed with status ${statusCode}`;

    apiLogger.logError(errorMessage, errorType, statusCode);

    // Map status codes to error types
    let mappedErrorType = errorType;
    if (statusCode === 401) {
      mappedErrorType = 'unauthorized';
    } else if (statusCode === 403) {
      mappedErrorType = 'authorization';
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
