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
 * in the environment variable AUTH_GOOGLE_CLIENT_ID.
 * 
 * If not configured, Google authentication will be disabled.
 */
const clientId = import.meta.env.AUTH_GOOGLE_CLIENT_ID;

/**
 * Indicates whether Google authentication is available.
 * This will be false if AUTH_GOOGLE_CLIENT_ID is not configured.
 */
export const isGoogleAuthAvailable = !!clientId;

if (!clientId) {
  console.warn(
    'AUTH_GOOGLE_CLIENT_ID environment variable is not configured. ' +
    'Google authentication will be disabled. ' +
    'See docs/GOOGLE_AUTH_SETUP.md for setup instructions.'
  );
}

export const googleClientId = clientId || '';

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
