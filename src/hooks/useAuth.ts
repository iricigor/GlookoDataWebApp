import { useState, useEffect, useCallback } from 'react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import type { AccountInfo, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/msalConfig';
import { fetchUserPhoto, getUserDisplayName, getUserEmail } from '../utils/graphUtils';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

export interface AuthState {
  isLoggedIn: boolean;
  userName: string | null;
  userEmail: string | null;
  userPhoto: string | null;
  account: AccountInfo | null;
  accessToken: string | null;
  /** ID token for authenticating with our backend API (audience is our app's client ID) */
  idToken: string | null;
  /** Authentication provider (Microsoft or Google) */
  provider: 'Microsoft' | 'Google' | null;
}

/**
 * Custom hook for managing Microsoft authentication state using MSAL
 * 
 * This hook provides real Microsoft authentication with user profile information.
 * Uses Authorization Code Flow with PKCE for secure authentication in SPAs.
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userName: null,
    userEmail: null,
    userPhoto: null,
    account: null,
    accessToken: null,
    idToken: null,
    provider: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Update auth state with user information
  const updateAuthState = useCallback(async (account: AccountInfo, accessToken: string, idToken: string | undefined) => {
    try {
      const displayName = getUserDisplayName(account);
      const email = getUserEmail(account);
      
      // Fetch user photo
      let photoUrl: string | null = null;
      try {
        photoUrl = await fetchUserPhoto(accessToken);
      } catch (error) {
        console.warn('Failed to fetch user photo:', error);
      }

      setAuthState({
        isLoggedIn: true,
        userName: displayName,
        userEmail: email,
        userPhoto: photoUrl,
        account: account,
        accessToken: accessToken,
        idToken: idToken || null,
        provider: 'Microsoft',
      });
    } catch (error) {
      console.error('Failed to update auth state:', error);
      // Still set basic auth state even if photo fetch fails
      setAuthState({
        isLoggedIn: true,
        userName: getUserDisplayName(account),
        userEmail: getUserEmail(account),
        userPhoto: null,
        account: account,
        accessToken: accessToken,
        idToken: idToken || null,
        provider: 'Microsoft',
      });
    }
  }, []);

  // Initialize MSAL and check for existing authentication
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        
        // Handle redirect response after login
        const response = await msalInstance.handleRedirectPromise();
        
        if (response) {
          // User just logged in via redirect - this is a fresh login
          const account = response.account;
          if (account) {
            await updateAuthState(account, response.accessToken, response.idToken);
            setJustLoggedIn(true);
          }
        } else {
          // Check if user is already logged in (restoring session)
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            const account = accounts[0];
            
            // Try to acquire token silently
            try {
              const tokenResponse = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: account,
              });
              // This is restoring a session, not a fresh login - don't set justLoggedIn
              await updateAuthState(account, tokenResponse.accessToken, tokenResponse.idToken);
            } catch (error) {
              // If silent token acquisition fails, user needs to login again
              console.warn('Silent token acquisition failed:', error);
              setAuthState({
                isLoggedIn: false,
                userName: null,
                userEmail: null,
                userPhoto: null,
                account: null,
                accessToken: null,
                idToken: null,
                provider: null,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeMsal();
  }, [updateAuthState]);

  // Listen for MSAL authentication events to sync state across all hook instances
  useEffect(() => {
    const callbackId = msalInstance.addEventCallback((event: EventMessage) => {
      // Handle successful login events from any source (popup, redirect, silent)
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as AuthenticationResult;
        if (payload.account) {
          updateAuthState(payload.account, payload.accessToken, payload.idToken);
          setJustLoggedIn(true);
        }
      }
      
      // Handle logout events
      if (event.eventType === EventType.LOGOUT_SUCCESS) {
        setAuthState({
          isLoggedIn: false,
          userName: null,
          userEmail: null,
          userPhoto: null,
          account: null,
          accessToken: null,
          idToken: null,
          provider: null,
        });
        setJustLoggedIn(false);
      }
      
      // Handle account changes (e.g., switching accounts)
      if (event.eventType === EventType.ACCOUNT_ADDED || event.eventType === EventType.ACCOUNT_REMOVED) {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const account = accounts[0];
          // Acquire token silently for the new account
          msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: account,
          }).then(tokenResponse => {
            updateAuthState(account, tokenResponse.accessToken, tokenResponse.idToken);
          }).catch(error => {
            console.warn('Failed to acquire token after account change:', error);
          });
        } else {
          // No accounts - user logged out
          setAuthState({
            isLoggedIn: false,
            userName: null,
            userEmail: null,
            userPhoto: null,
            account: null,
            accessToken: null,
            idToken: null,
            provider: null,
          });
          setJustLoggedIn(false);
        }
      }
    });

    // Cleanup: remove event callback when component unmounts
    return () => {
      if (callbackId) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, [updateAuthState]); // Include updateAuthState in dependencies

  // Login with Microsoft
  const login = useCallback(async () => {
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      
      if (response && response.account) {
        // This is a fresh login via popup
        await updateAuthState(response.account, response.accessToken, response.idToken);
        setJustLoggedIn(true);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [updateAuthState]);

  // Logout from Microsoft
  const logout = useCallback(async () => {
    try {
      // Clean up photo URL if exists
      if (authState.userPhoto) {
        URL.revokeObjectURL(authState.userPhoto);
      }

      const account = authState.account;
      const provider = authState.provider;
      
      // Clear local state first
      setAuthState({
        isLoggedIn: false,
        userName: null,
        userEmail: null,
        userPhoto: null,
        account: null,
        accessToken: null,
        idToken: null,
        provider: null,
      });
      setJustLoggedIn(false);

      // Logout from Microsoft
      if (account && provider === 'Microsoft') {
        await msalInstance.logoutPopup({ account });
      }
      // For Google, token is already cleared, no need for additional logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [authState.userPhoto, authState.account, authState.provider]);

  // Clear the justLoggedIn flag after it has been consumed
  const acknowledgeLogin = useCallback(() => {
    setJustLoggedIn(false);
  }, []);

  /**
   * Decodes a base64url-encoded string (JWT payload) with proper UTF-8 handling
   * 
   * atob() doesn't handle UTF-8 properly (only works with ASCII/Latin1).
   * For UTF-8 characters like "Irić", we need to:
   * 1. Decode base64 to binary string
   * 2. Convert binary string to byte array
   * 3. Decode byte array as UTF-8
   * 
   * @param base64url - Base64url-encoded string
   * @returns Decoded UTF-8 string
   */
  const decodeBase64Url = (base64url: string): string => {
    // Convert base64url to standard base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const paddingLength = base64.length % 4;
    if (paddingLength === 2) {
      base64 += '==';
    } else if (paddingLength === 3) {
      base64 += '=';
    }
    
    // Decode base64 to binary string (Latin1/ASCII)
    const binaryString = atob(base64);
    
    // Convert binary string to byte array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode byte array as UTF-8
    return new TextDecoder('utf-8').decode(bytes);
  };

  /**
   * Login with Google OAuth
   * 
   * Authenticates the user using Google OAuth by decoding the JWT credential
   * and extracting user information. The Google "sub" (subject) claim is used
   * as the canonical user identifier for authentication and authorization.
   * 
   * @param credential - JWT credential string from Google OAuth (ID token)
   * @returns Promise that resolves when login is complete
   * @throws {Error} If credential decoding or parsing fails
   * 
   * @example
   * ```typescript
   * // Called from GoogleLogin component's onSuccess callback
   * const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
   *   if (credentialResponse.credential) {
   *     await loginWithGoogle(credentialResponse.credential);
   *   }
   * };
   * ```
   */
  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      // Decode the JWT credential to extract user information
      // JWT format: header.payload.signature
      const payloadBase64 = credential.split('.')[1];
      const payloadJson = decodeBase64Url(payloadBase64);
      const payload = JSON.parse(payloadJson);
      
      // Extract user information from Google JWT
      // Use 'sub' (subject) as the canonical user identifier
      // Note: The backend will extract and use 'sub' from the JWT credential
      // when validating the token and identifying the user
      const userName = payload.name || payload.email?.split('@')[0] || 'User';
      const userEmail = payload.email || null;
      const userPhoto = payload.picture || null;
      
      // Verify the sub claim exists (required for user identification)
      if (!payload.sub) {
        throw new Error('Google JWT missing required "sub" claim');
      }
      
      // For Google, we use the credential as the ID token
      // The credential (JWT) can be used to authenticate with our backend
      // The 'sub' claim should be used for user identification, not email domain
      setAuthState({
        isLoggedIn: true,
        userName,
        userEmail,
        userPhoto,
        account: null, // Google doesn't use MSAL AccountInfo
        accessToken: credential, // Use credential as access token
        idToken: credential, // Use credential as ID token for backend
        provider: 'Google',
      });
      setJustLoggedIn(true);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }, []);

  return {
    isLoggedIn: authState.isLoggedIn,
    userName: authState.userName,
    userEmail: authState.userEmail,
    userPhoto: authState.userPhoto,
    accessToken: authState.accessToken,
    idToken: authState.idToken,
    provider: authState.provider,
    isInitialized,
    justLoggedIn,
    login,
    loginWithGoogle,
    logout,
    acknowledgeLogin,
  };
}
