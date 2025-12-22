/**
 * Google OAuth Configuration for Google Authentication
 * 
 * This configuration enables authentication with Google accounts
 * using the OAuth 2.0 Authorization Code Flow.
 * 
 * Security: Client ID is safe to expose in client-side code for public applications.
 * No client secrets are used or required for public client applications.
 */

/**
 * Google OAuth Client ID
 * This must be obtained from Google Cloud Console and configured
 * in the environment or hardcoded for the application.
 */
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

/**
 * Scopes for Google OAuth
 * These scopes determine what user information the app can access
 */
export const googleScopes = [
  'openid',      // Required for authentication
  'profile',     // Access to user's profile information (name)
  'email',       // Access to user's email address
];

/**
 * Google OAuth configuration
 */
export const googleOAuthConfig = {
  clientId: googleClientId,
  scopes: googleScopes,
  // Redirect URI is handled by @react-oauth/google
  // It uses the current page URL by default
};
