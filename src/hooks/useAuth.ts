import { useState, useEffect, useCallback } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';
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
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

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
  }, []);

  // Update auth state with user information
  const updateAuthState = async (account: AccountInfo, accessToken: string, idToken: string) => {
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
        idToken: idToken,
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
        idToken: idToken,
      });
    }
  };

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
  }, []);

  // Logout from Microsoft
  const logout = useCallback(async () => {
    try {
      // Clean up photo URL if exists
      if (authState.userPhoto) {
        URL.revokeObjectURL(authState.userPhoto);
      }

      const account = authState.account;
      
      // Clear local state first
      setAuthState({
        isLoggedIn: false,
        userName: null,
        userEmail: null,
        userPhoto: null,
        account: null,
        accessToken: null,
        idToken: null,
      });
      setJustLoggedIn(false);

      // Logout from Microsoft
      if (account) {
        await msalInstance.logoutPopup({ account });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [authState.userPhoto, authState.account]);

  // Clear the justLoggedIn flag after it has been consumed
  const acknowledgeLogin = useCallback(() => {
    setJustLoggedIn(false);
  }, []);

  return {
    isLoggedIn: authState.isLoggedIn,
    userName: authState.userName,
    userEmail: authState.userEmail,
    userPhoto: authState.userPhoto,
    accessToken: authState.accessToken,
    idToken: authState.idToken,
    isInitialized,
    justLoggedIn,
    login,
    logout,
    acknowledgeLogin,
  };
}
