/**
 * User Settings API client for Azure Functions
 * 
 * This module provides an API client for checking user login status
 * and managing user settings using the Azure Function backend connected 
 * to Table Storage.
 */

import type { CloudUserSettings } from '../../types';
import { createApiLogger } from '../logger';

/**
 * Result of checking if a user is a first-time user
 */
export interface FirstLoginCheckResult {
  success: boolean;
  isFirstLogin?: boolean;
  error?: string;
  errorType?: 'unauthorized' | 'infrastructure' | 'network' | 'unknown';
  /** HTTP status code when available */
  statusCode?: number;
}

/**
 * Result of saving user settings
 */
export interface SaveSettingsResult {
  success: boolean;
  error?: string;
  errorType?: 'unauthorized' | 'infrastructure' | 'network' | 'unknown';
  /** HTTP status code when available */
  statusCode?: number;
}

/**
 * Result of loading user settings
 */
export interface LoadSettingsResult {
  success: boolean;
  settings?: CloudUserSettings;
  error?: string;
  errorType?: 'unauthorized' | 'infrastructure' | 'network' | 'unknown';
  /** HTTP status code when available */
  statusCode?: number;
}

/**
 * API response from the Azure Function
 */
interface UserCheckApiResponse {
  isFirstLogin: boolean;
  userId?: string;
}

/**
 * API response for loading settings
 */
interface LoadSettingsApiResponse {
  settings: CloudUserSettings;
}

/**
 * Configuration for the User Settings API
 */
export interface UserSettingsApiConfig {
  /** Base URL for the Azure Function API */
  baseUrl: string;
}

/**
 * Default configuration - uses the Azure Static Web App's API endpoint
 * Azure Static Web Apps proxy API calls to /api/* to the linked Function App
 */
const defaultConfig: UserSettingsApiConfig = {
  baseUrl: '/api',
};

/**
 * Check if the current user is logging in for the first time
 * 
 * This function calls the Azure Function to check the UserSettings table.
 * 
 * @param idToken - The ID token from MSAL authentication (has app's client ID as audience)
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status and isFirstLogin flag or error
 */
export async function checkFirstLogin(
  idToken: string,
  config: UserSettingsApiConfig = defaultConfig
): Promise<FirstLoginCheckResult> {
  const endpoint = `${config.baseUrl}/user/check-first-login`;
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

    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      if (response.status === 401 || response.status === 403) {
        apiLogger.logError('Unauthorized access', 'unauthorized', statusCode);
        return {
          success: false,
          error: 'Unauthorized access. Please log in again.',
          errorType: 'unauthorized',
          statusCode,
        };
      }

      // Handle infrastructure errors (e.g., can't reach table storage)
      if (response.status >= 500) {
        apiLogger.logError('Internal server error', 'infrastructure', statusCode);
        return {
          success: false,
          error: 'Internal server error. The infrastructure may not be ready or there are access issues.',
          errorType: 'infrastructure',
          statusCode,
        };
      }

      // Try to parse error message from response
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `API error: ${response.status}`;
        
        // Prefer structured error type/code from API response if available
        const apiErrorType = errorData.errorType || errorData.code || errorData.type;
        
        if (apiErrorType === 'infrastructure') {
          apiLogger.logError(errorMessage, 'infrastructure', statusCode);
          return {
            success: false,
            error: errorMessage,
            errorType: 'infrastructure',
            statusCode,
          };
        }
        
        // Fallback: substring matching only if no structured error type
        if (!apiErrorType && (
            errorMessage.includes('Table') || 
            errorMessage.includes('Storage') || 
            errorMessage.includes('connection') ||
            errorMessage.includes('infrastructure'))) {
          apiLogger.logError(errorMessage, 'infrastructure', statusCode);
          return {
            success: false,
            error: errorMessage,
            errorType: 'infrastructure',
            statusCode,
          };
        }
        
        apiLogger.logError(errorMessage, apiErrorType || 'unknown', statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: apiErrorType || 'unknown',
          statusCode,
        };
      } catch {
        const errorMessage = `API error: ${response.status} ${response.statusText}`;
        apiLogger.logError(errorMessage, 'unknown', response.status);
        return {
          success: false,
          error: errorMessage,
          errorType: 'unknown',
          statusCode: response.status,
        };
      }
    }

    // Parse successful response
    const data: UserCheckApiResponse = await response.json();
    
    apiLogger.logSuccess(200, { isFirstLogin: data.isFirstLogin });
    return {
      success: true,
      isFirstLogin: data.isFirstLogin,
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

/**
 * Save user settings to cloud storage
 * 
 * This function calls the Azure Function to save settings to the UserSettings table.
 * 
 * @param idToken - The ID token from MSAL authentication
 * @param settings - The user settings to save
 * @param email - The user's email address (for reference)
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status or error
 */
export async function saveUserSettings(
  idToken: string,
  settings: CloudUserSettings,
  email: string,
  config: UserSettingsApiConfig = defaultConfig
): Promise<SaveSettingsResult> {
  const endpoint = `${config.baseUrl}/user/settings`;
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

  apiLogger.logStart('PUT');

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'x-correlation-id': apiLogger.correlationId,
      },
      body: JSON.stringify({ settings, email }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      if (response.status === 401 || response.status === 403) {
        apiLogger.logError('Unauthorized access', 'unauthorized', statusCode);
        return {
          success: false,
          error: 'Unauthorized access. Please log in again.',
          errorType: 'unauthorized',
          statusCode,
        };
      }

      if (response.status >= 500) {
        apiLogger.logError('Internal server error. Settings could not be saved.', 'infrastructure', statusCode);
        return {
          success: false,
          error: 'Internal server error. Settings could not be saved.',
          errorType: 'infrastructure',
          statusCode,
        };
      }

      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `API error: ${response.status}`;
        apiLogger.logError(errorMessage, errorData.errorType || 'unknown', statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: errorData.errorType || 'unknown',
          statusCode,
        };
      } catch {
        const errorMessage = `API error: ${response.status} ${response.statusText}`;
        apiLogger.logError(errorMessage, 'unknown', response.status);
        return {
          success: false,
          error: errorMessage,
          errorType: 'unknown',
          statusCode: response.status,
        };
      }
    }

    apiLogger.logSuccess(200);
    return { success: true };

  } catch (error) {
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

/**
 * Load user settings from cloud storage
 * 
 * This function calls the Azure Function to load settings from the UserSettings table.
 * 
 * @param idToken - The ID token from MSAL authentication
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing settings or error
 */
export async function loadUserSettings(
  idToken: string,
  config: UserSettingsApiConfig = defaultConfig
): Promise<LoadSettingsResult> {
  const endpoint = `${config.baseUrl}/user/settings`;
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
        'x-correlation-id': apiLogger.correlationId,
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      if (response.status === 401 || response.status === 403) {
        apiLogger.logError('Unauthorized access', 'unauthorized', statusCode);
        return {
          success: false,
          error: 'Unauthorized access. Please log in again.',
          errorType: 'unauthorized',
          statusCode,
        };
      }

      // 404 means no settings saved yet - this is OK, return empty success
      if (response.status === 404) {
        apiLogger.logSuccess(404, { settingsFound: false });
        return {
          success: true,
          settings: undefined,
        };
      }

      if (response.status >= 500) {
        apiLogger.logError('Internal server error. Settings could not be loaded.', 'infrastructure', statusCode);
        return {
          success: false,
          error: 'Internal server error. Settings could not be loaded.',
          errorType: 'infrastructure',
          statusCode,
        };
      }

      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `API error: ${response.status}`;
        apiLogger.logError(errorMessage, errorData.errorType || 'unknown', statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: errorData.errorType || 'unknown',
          statusCode,
        };
      } catch {
        const errorMessage = `API error: ${response.status} ${response.statusText}`;
        apiLogger.logError(errorMessage, 'unknown', response.status);
        return {
          success: false,
          error: errorMessage,
          errorType: 'unknown',
          statusCode: response.status,
        };
      }
    }

    // Parse successful response
    const data: LoadSettingsApiResponse = await response.json();
    
    apiLogger.logSuccess(200, { settingsFound: true });
    return {
      success: true,
      settings: data.settings,
    };

  } catch (error) {
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

/**
 * Result of checking if a user is a pro user
 */
export interface ProUserCheckResult {
  success: boolean;
  isProUser?: boolean;
  error?: string;
  errorType?: 'unauthorized' | 'infrastructure' | 'network' | 'unknown';
  /** HTTP status code when available */
  statusCode?: number;
}

/**
 * API response for pro user check
 */
interface ProUserCheckApiResponse {
  isProUser: boolean;
  userId?: string;
}

/**
 * Check if the current user is a pro user
 * 
 * This function calls the Azure Function to check the ProUsers table.
 * 
 * @param idToken - The ID token from MSAL authentication (has app's client ID as audience)
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status and isProUser flag or error
 */
export async function checkProUserStatus(
  idToken: string,
  config: UserSettingsApiConfig = defaultConfig
): Promise<ProUserCheckResult> {
  const endpoint = `${config.baseUrl}/user/check-pro-status`;
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

    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      if (statusCode === 401 || statusCode === 403) {
        apiLogger.logError('Unauthorized access', 'unauthorized', statusCode);
        return {
          success: false,
          error: 'Unauthorized access. Please log in again.',
          errorType: 'unauthorized',
          statusCode,
        };
      }

      // Handle infrastructure errors (e.g., can't reach table storage)
      if (statusCode >= 500) {
        apiLogger.logError('Internal server error', 'infrastructure', statusCode);
        return {
          success: false,
          error: 'Internal server error. The infrastructure may not be ready or there are access issues.',
          errorType: 'infrastructure',
          statusCode,
        };
      }

      // Try to parse error message from response
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `API error: ${statusCode}`;
        
        // Prefer structured error type/code from API response if available
        const apiErrorType = errorData.errorType || errorData.code || errorData.type;
        
        if (apiErrorType === 'infrastructure') {
          apiLogger.logError(errorMessage, 'infrastructure', statusCode);
          return {
            success: false,
            error: errorMessage,
            errorType: 'infrastructure',
            statusCode,
          };
        }
        
        apiLogger.logError(errorMessage, apiErrorType || 'unknown', statusCode);
        return {
          success: false,
          error: errorMessage,
          errorType: apiErrorType || 'unknown',
          statusCode,
        };
      } catch {
        const errorMessage = `API error: ${response.status} ${response.statusText}`;
        apiLogger.logError(errorMessage, 'unknown', response.status);
        return {
          success: false,
          error: errorMessage,
          errorType: 'unknown',
          statusCode: response.status,
        };
      }
    }

    // Parse successful response
    const data: ProUserCheckApiResponse = await response.json();
    
    apiLogger.logSuccess(200, { isProUser: data.isProUser });
    return {
      success: true,
      isProUser: data.isProUser,
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
