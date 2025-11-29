/**
 * User Settings API client for Azure Functions
 * 
 * This module provides an API client for checking user login status
 * and managing user settings using the Azure Function backend connected 
 * to Table Storage.
 */

import type { CloudUserSettings } from '../../types';

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
  // Validate ID token
  if (!idToken || idToken.trim() === '') {
    return {
      success: false,
      error: 'Authentication required',
      errorType: 'unauthorized',
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/user/check-first-login`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Unauthorized access. Please log in again.',
          errorType: 'unauthorized',
          statusCode,
        };
      }

      // Handle infrastructure errors (e.g., can't reach table storage)
      if (response.status >= 500) {
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
          return {
            success: false,
            error: errorMessage,
            errorType: 'infrastructure',
            statusCode,
          };
        }
        
        return {
          success: false,
          error: errorMessage,
          errorType: apiErrorType || 'unknown',
          statusCode,
        };
      } catch {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
          errorType: 'unknown',
          statusCode,
        };
      }
    }

    // Parse successful response
    const data: UserCheckApiResponse = await response.json();
    
    return {
      success: true,
      isFirstLogin: data.isFirstLogin,
    };

  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
        errorType: 'network',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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
  // Validate ID token
  if (!idToken || idToken.trim() === '') {
    return {
      success: false,
      error: 'Authentication required',
      errorType: 'unauthorized',
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/user/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings, email }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Unauthorized access. Please log in again.',
          errorType: 'unauthorized',
          statusCode,
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          error: 'Internal server error. Settings could not be saved.',
          errorType: 'infrastructure',
          statusCode,
        };
      }

      try {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || errorData.message || `API error: ${response.status}`,
          errorType: errorData.errorType || 'unknown',
          statusCode,
        };
      } catch {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
          errorType: 'unknown',
          statusCode,
        };
      }
    }

    return { success: true };

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
        errorType: 'network',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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
  // Validate ID token
  if (!idToken || idToken.trim() === '') {
    return {
      success: false,
      error: 'Authentication required',
      errorType: 'unauthorized',
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/user/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      const statusCode = response.status;
      
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Unauthorized access. Please log in again.',
          errorType: 'unauthorized',
          statusCode,
        };
      }

      // 404 means no settings saved yet - this is OK, return empty success
      if (response.status === 404) {
        return {
          success: true,
          settings: undefined,
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          error: 'Internal server error. Settings could not be loaded.',
          errorType: 'infrastructure',
          statusCode,
        };
      }

      try {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || errorData.message || `API error: ${response.status}`,
          errorType: errorData.errorType || 'unknown',
          statusCode,
        };
      } catch {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
          errorType: 'unknown',
          statusCode,
        };
      }
    }

    // Parse successful response
    const data: LoadSettingsApiResponse = await response.json();
    
    return {
      success: true,
      settings: data.settings,
    };

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
        errorType: 'network',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: 'unknown',
    };
  }
}
