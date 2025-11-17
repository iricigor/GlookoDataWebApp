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
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MSAL and check for existing authentication
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        
        // Handle redirect response after login
        const response = await msalInstance.handleRedirectPromise();
        
        if (response) {
          // User just logged in via redirect
          const account = response.account;
          if (account) {
            await updateAuthState(account, response.accessToken);
          }
        } else {
          // Check if user is already logged in
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            const account = accounts[0];
            
            // Try to acquire token silently
            try {
              const tokenResponse = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: account,
              });
              await updateAuthState(account, tokenResponse.accessToken);
            } catch (error) {
              // If silent token acquisition fails, user needs to login again
              console.warn('Silent token acquisition failed:', error);
              setAuthState({
                isLoggedIn: false,
                userName: null,
                userEmail: null,
                userPhoto: null,
                account: null,
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
  const updateAuthState = async (account: AccountInfo, accessToken: string) => {
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
      });
    }
  };

  // Login with Microsoft
  const login = useCallback(async () => {
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      
      if (response && response.account) {
        await updateAuthState(response.account, response.accessToken);
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
      });

      // Logout from Microsoft
      if (account) {
        await msalInstance.logoutPopup({ account });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [authState.userPhoto, authState.account]);

  return {
    isLoggedIn: authState.isLoggedIn,
    userName: authState.userName,
    userEmail: authState.userEmail,
    userPhoto: authState.userPhoto,
    isInitialized,
    login,
    logout,
  };
}
