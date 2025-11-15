import { useState, useEffect } from 'react';

const AUTH_STORAGE_KEY = 'glooko-auth-state';

export interface AuthState {
  isLoggedIn: boolean;
  userName: string | null;
}

/**
 * Custom hook for managing authentication state
 * 
 * This is a fake authentication system for UI demonstration purposes only.
 * No actual authentication or security is implemented.
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Load initial state from localStorage
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthState;
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    }
    return { isLoggedIn: false, userName: null };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }, [authState]);

  const login = (userName: string) => {
    setAuthState({ isLoggedIn: true, userName });
  };

  const logout = () => {
    setAuthState({ isLoggedIn: false, userName: null });
  };

  return {
    isLoggedIn: authState.isLoggedIn,
    userName: authState.userName,
    login,
    logout,
  };
}
