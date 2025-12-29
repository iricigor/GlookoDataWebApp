/**
 * Unified Admin Statistics API client for Azure Functions
 * 
 * This module provides an API client for fetching all administrative statistics
 * in a single call from the Azure Function backend. Access requires Pro user authentication.
 */

import { createApiLogger } from '../logger';

/**
 * Time period for API/Web statistics
 */
export type TimePeriod = '1hour' | '1day';

/**
 * Result of fetching unified admin statistics
 */
export interface UnifiedAdminStatsResult {
  success: boolean;
  loggedInUsersCount?: number;
  proUsersCount?: number;
  webCalls?: number;
  webErrors?: number;
  apiCalls?: number;
  apiErrors?: number;
  timePeriod?: TimePeriod;
  capped?: boolean;
  proUsersCapped?: boolean;
  error?: string;
  errorType?: 'unauthorized' | 'authorization' | 'infrastructure' | 'network' | 'unknown';
  /** HTTP status code when available */
  statusCode?: number;
}

/**
 * API response from the Azure Function
 */
interface UnifiedAdminStatsApiResponse {
  loggedInUsersCount: number;
  proUsersCount: number;
  webCalls: number;
  webErrors: number;
  apiCalls: number;
  apiErrors: number;
  timePeriod: TimePeriod;
  capped?: boolean;
  proUsersCapped?: boolean;
}

/**
 * Configuration for the Unified Admin Statistics API
 */
export interface UnifiedAdminStatsApiConfig {
  /** Base URL for the Azure Function API */
  baseUrl: string;
}

/**
 * Default configuration - uses the Azure Static Web App's API endpoint
 */
const defaultConfig: UnifiedAdminStatsApiConfig = {
  baseUrl: '/api',
};

/**
 * Fetch all administrative statistics in a single call
 * 
 * This function calls the Azure Function to get:
 * - Count of logged-in users
 * - Count of Pro users
 * - API call and error statistics from Application Insights
 * 
 * Requires the caller to be authenticated as a Pro user.
 * 
 * @param idToken - The ID token from MSAL authentication
 * @param timePeriod - Time period for API/Web statistics (1hour or 1day)
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status and all statistics or error
 */
export async function getUnifiedAdminStats(
  idToken: string,
  timePeriod: TimePeriod = '1hour',
  config: UnifiedAdminStatsApiConfig = defaultConfig
): Promise<UnifiedAdminStatsResult> {
  const endpoint = `${config.baseUrl}/glookoAdmin/stats?timePeriod=${timePeriod}`;
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
      const data = await response.json() as UnifiedAdminStatsApiResponse;
      apiLogger.logSuccess(statusCode, { 
        loggedInUsersCount: data.loggedInUsersCount,
        proUsersCount: data.proUsersCount,
        webCalls: data.webCalls, 
        webErrors: data.webErrors,
        apiCalls: data.apiCalls,
        apiErrors: data.apiErrors,
        timePeriod: data.timePeriod,
        capped: data.capped,
        proUsersCapped: data.proUsersCapped
      });
      return {
        success: true,
        loggedInUsersCount: data.loggedInUsersCount,
        proUsersCount: data.proUsersCount,
        webCalls: data.webCalls,
        webErrors: data.webErrors,
        apiCalls: data.apiCalls,
        apiErrors: data.apiErrors,
        timePeriod: data.timePeriod,
        capped: data.capped,
        proUsersCapped: data.proUsersCapped,
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
    
    const errorType = errorData.errorType as UnifiedAdminStatsResult['errorType'] || 'unknown';
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
