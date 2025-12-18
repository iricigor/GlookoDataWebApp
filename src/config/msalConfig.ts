/**
 * MSAL Configuration for Microsoft Authentication
 * 
 * This configuration enables authentication with personal Microsoft accounts
 * using the Authorization Code Flow with PKCE (Proof Key for Code Exchange).
 * 
 * Security: Client ID is safe to expose in client-side code for SPAs.
 * No client secrets are used or required for public client applications.
 * 
 * Configuration:
 * - Client ID can be set via VITE_MICROSOFT_CLIENT_ID environment variable
 * - Falls back to hardcoded default if not set
 * - For deployment: Set as build-time environment variable in CI/CD
 */

import { LogLevel } from '@azure/msal-browser';
import type { Configuration } from '@azure/msal-browser';

// Default client ID (fallback if environment variable not set)
const DEFAULT_MICROSOFT_CLIENT_ID = '656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c';

// Get client ID from environment variable or use default
// VITE_ prefix is required for Vite to expose the variable to client-side code
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || DEFAULT_MICROSOFT_CLIENT_ID;

/**
 * Configuration object to be passed to MSAL instance on creation
 */
export const msalConfig: Configuration = {
  auth: {
    // Application (client) ID from Azure App Registration
    // Can be configured via VITE_MICROSOFT_CLIENT_ID environment variable
    clientId: MICROSOFT_CLIENT_ID,
    
    // Authority URL for personal Microsoft accounts
    // Use 'consumers' tenant for personal accounts (outlook.com, hotmail.com, etc.)
    authority: 'https://login.microsoftonline.com/consumers',
    
    // Redirect URI after authentication
    // Must match one of the configured redirect URIs in Azure App Registration
    redirectUri: window.location.origin,
    
    // Post logout redirect URI
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    // Where to store authentication tokens
    // 'sessionStorage' is recommended for better security
    // 'localStorage' for token persistence across browser sessions
    cacheLocation: 'sessionStorage',
    
    // Set to true if using IE11 or Edge Legacy
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
    // Configure popup window interaction to avoid COOP policy issues
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    asyncPopups: false,
  },
};

/**
 * Scopes for login request
 * These scopes determine what user information the app can access
 */
export const loginRequest = {
  scopes: [
    'openid',      // Required for authentication
    'profile',     // Access to user's profile information (name)
    'email',       // Access to user's email address
    'User.Read',   // Read user's basic profile from Microsoft Graph
  ],
};

/**
 * Scopes for Microsoft Graph API requests
 */
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphMePhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value',
};
