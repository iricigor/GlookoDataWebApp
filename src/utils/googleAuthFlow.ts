/**
 * Google OAuth Authorization Code Flow Utilities
 * 
 * This module provides utilities for implementing the OAuth 2.0 Authorization Code Flow
 * with Google as the identity provider.
 * 
 * Flow:
 * 1. User clicks login -> redirectToGoogleAuth()
 * 2. Google authenticates user -> redirects back with code
 * 3. Frontend calls exchangeCodeForTokens() with the code
 * 4. Backend validates code and returns tokens
 * 5. Frontend stores tokens and user is logged in
 */

import { googleClientId, googleScopes } from '../config/googleConfig';

/**
 * Get the redirect URI for OAuth callback
 * This should match one of the URIs configured in Google Cloud Console
 */
export function getRedirectUri(): string {
  // Use the current origin + /auth/callback path
  // In production: https://glooko.iric.online/auth/callback
  // In development: http://localhost:5173/auth/callback
  return `${window.location.origin}/auth/callback`;
}

/**
 * Generate a random state parameter for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store state in session storage for validation after redirect
 */
function storeState(state: string): void {
  sessionStorage.setItem('google_oauth_state', state);
}

/**
 * Retrieve and clear state from session storage
 */
function retrieveAndClearState(): string | null {
  const state = sessionStorage.getItem('google_oauth_state');
  sessionStorage.removeItem('google_oauth_state');
  return state;
}

/**
 * Redirect to Google OAuth authorization endpoint
 * This initiates the authorization code flow
 */
export function redirectToGoogleAuth(): void {
  if (!googleClientId) {
    throw new Error('Google Client ID not configured');
  }

  const state = generateState();
  storeState(state);

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: googleScopes.join(' '),
    state: state,
    // Use 'consent' to always show the consent screen
    // or 'select_account' to always allow account selection
    prompt: 'select_account',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  window.location.href = authUrl;
}

/**
 * Parse the authorization code and state from URL parameters
 * Called on the callback page after Google redirects back
 */
export function parseCallbackParams(): { code: string; state: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return null;
  }

  if (!code || !state) {
    return null;
  }

  // Validate state to prevent CSRF attacks
  const storedState = retrieveAndClearState();
  if (state !== storedState) {
    console.error('State mismatch - possible CSRF attack');
    return null;
  }

  return { code, state };
}

/**
 * Exchange authorization code for tokens via backend
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
  expires_in: number;
}> {
  const response = await fetch('/api/auth/google/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Token exchange failed');
  }

  return await response.json();
}

/**
 * Decode JWT payload (without verification - for extracting user info only)
 * The token should be verified by the backend before trusting the data
 */
export function decodeJWT(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    // Convert base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Pad if needed
    const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    const decoded = atob(paddedBase64);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    throw error;
  }
}
