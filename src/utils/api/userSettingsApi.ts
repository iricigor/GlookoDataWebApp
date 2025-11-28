/**
 * User Settings API client for Azure Functions
 * 
 * This module provides an API client for checking user login status
 * using the Azure Function backend connected to Table Storage.
 */

/**
 * Result of checking if a user is a first-time user
 */
export interface FirstLoginCheckResult {
  success: boolean;
  isFirstLogin?: boolean;
  error?: string;
  errorType?: 'unauthorized' | 'infrastructure' | 'network' | 'unknown';
}

/**
 * API response from the Azure Function
 */
interface UserCheckApiResponse {
  isFirstLogin: boolean;
  userId?: string;
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
 * @param accessToken - The access token from MSAL authentication
 * @param config - Optional API configuration (defaults to /api)
 * @returns Promise with the result containing success status and isFirstLogin flag or error
 */
export async function checkFirstLogin(
  accessToken: string,
  config: UserSettingsApiConfig = defaultConfig
): Promise<FirstLoginCheckResult> {
  // Validate access token
  if (!accessToken || accessToken.trim() === '') {
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
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Unauthorized access. Please log in again.',
          errorType: 'unauthorized',
        };
      }

      // Handle infrastructure errors (e.g., can't reach table storage)
      if (response.status >= 500) {
        return {
          success: false,
          error: 'Internal server error. The infrastructure may not be ready or there are access issues.',
          errorType: 'infrastructure',
        };
      }

      // Try to parse error message from response
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `API error: ${response.status}`;
        
        // Check if the error indicates infrastructure issues
        if (errorMessage.includes('Table') || 
            errorMessage.includes('Storage') || 
            errorMessage.includes('connection') ||
            errorMessage.includes('infrastructure')) {
          return {
            success: false,
            error: errorMessage,
            errorType: 'infrastructure',
          };
        }
        
        return {
          success: false,
          error: errorMessage,
          errorType: 'unknown',
        };
      } catch {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
          errorType: 'unknown',
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

    // For 404 errors (API endpoint not deployed yet), treat as infrastructure error
    if (error instanceof Error && error.message.includes('404')) {
      return {
        success: false,
        error: 'API endpoint not available. The infrastructure may not be deployed yet.',
        errorType: 'infrastructure',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: 'unknown',
    };
  }
}
