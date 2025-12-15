/**
 * Admin Statistics API client for Azure Functions
 * 
 * This module provides an API client for fetching administrative statistics
 * from the Azure Function backend. Access requires Pro user authentication.
 */

import { createApiLogger } from '../logger';

/**
 * Result of fetching logged-in users count
 */
export interface LoggedInUsersCountResult {
  success: boolean;
  count?: number;
  proUsersCount?: number;
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
interface LoggedInUsersCountApiResponse {
  count: number;
  proUsersCount: number;
  capped?: boolean;
  proUsersCapped?: boolean;
}

/**
 * Configuration for the Admin Statistics API
 */
export interface AdminStatsApiConfig {
  /** Base URL for the Azure Function API */
  baseUrl: string;
}

/**
 * Default configuration - uses the Azure Static Web App's API endpoint
 * Azure Static Web Apps proxy API calls to /api/* to the linked Function App
 */
const defaultConfig: AdminStatsApiConfig = {
  baseUrl: '/api',
};

/**
 * Fetch the count of logged-in users
 * 
 * This function calls the Azure Function to count all users in the UserSettings table.
 * Requires the caller to be authenticated as a Pro user.
 * 
 * @param idToken - The ID token from MSAL authentication (has app's client ID as audience)
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status and count or error
 */
export async function getLoggedInUsersCount(
  idToken: string,
  config: AdminStatsApiConfig = defaultConfig
): Promise<LoggedInUsersCountResult> {
  const endpoint = `${config.baseUrl}/glookoAdmin/stats/logged-in-users`;
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
      const data = await response.json() as LoggedInUsersCountApiResponse;
      apiLogger.logSuccess(statusCode, { count: data.count, proUsersCount: data.proUsersCount, capped: data.capped, proUsersCapped: data.proUsersCapped });
      return {
        success: true,
        count: data.count,
        proUsersCount: data.proUsersCount,
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
      // JSON parsing failed - likely not a JSON response
      // Use generic error message based on status code
      console.warn('Failed to parse error response as JSON:', jsonError);
    }
    
    const errorType = errorData.errorType as LoggedInUsersCountResult['errorType'] || 'unknown';
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
