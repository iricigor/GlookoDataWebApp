/**
 * Google Authentication Configuration
 * 
 * This configuration is prepared for future Google OAuth implementation.
 * Currently, Google login is not implemented (shows "Coming Soon" in UI).
 * 
 * Configuration:
 * - Client ID can be set via VITE_GOOGLE_CLIENT_ID environment variable
 * - Falls back to empty string if not set (authentication will be disabled)
 * - For deployment: Set as build-time environment variable in CI/CD
 * 
 * Security: Client ID is safe to expose in client-side code for OAuth 2.0 public clients.
 * No client secrets are used or required for browser-based applications.
 */

// Get Google client ID from environment variable
// VITE_ prefix is required for Vite to expose the variable to client-side code
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Google OAuth Configuration
 * 
 * To enable Google authentication:
 * 1. Create OAuth 2.0 credentials in Google Cloud Console
 * 2. Add authorized JavaScript origins (your app's domain)
 * 3. Add authorized redirect URIs
 * 4. Set VITE_GOOGLE_CLIENT_ID in deployment environment
 */
export const googleAuthConfig = {
  /**
   * Google OAuth 2.0 Client ID
   * Format: XXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
   */
  clientId: GOOGLE_CLIENT_ID,
  
  /**
   * Check if Google authentication is configured and enabled
   */
  isEnabled: () => GOOGLE_CLIENT_ID.length > 0,
  
  /**
   * OAuth 2.0 scopes to request
   * These determine what user information the app can access
   */
  scopes: [
    'openid',                                    // Required for authentication
    'profile',                                   // Access to user's profile information
    'email',                                     // Access to user's email address
  ],
  
  /**
   * Google Identity Services configuration
   * See: https://developers.google.com/identity/gsi/web/reference/js-reference
   */
  gsiConfig: {
    // Automatically select user if only one Google account is signed in
    auto_select: false,
    
    // Cancel the prompt if the user clicks outside the dialog
    cancel_on_tap_outside: true,
    
    // The text to display on the sign-in button
    // Options: 'signin_with', 'signup_with', 'continue_with', 'signin'
    context: 'signin',
  },
};

/**
 * Helper function to get the client ID
 * Useful for conditional rendering based on whether Google auth is configured
 */
export const getGoogleClientId = (): string => GOOGLE_CLIENT_ID;

/**
 * Check if Google authentication is available
 */
export const isGoogleAuthAvailable = (): boolean => googleAuthConfig.isEnabled();
