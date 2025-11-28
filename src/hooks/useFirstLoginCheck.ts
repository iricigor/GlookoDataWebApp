/**
 * Custom hook for checking if the user is logging in for the first time
 * 
 * This hook manages the state for the first login check and integrates
 * with the useAuth hook to trigger the check after successful login.
 */

import { useState, useCallback, useRef } from 'react';
import { checkFirstLogin, type FirstLoginCheckResult } from '../utils/api/userSettingsApi';

/**
 * State for the first login check
 */
export interface FirstLoginCheckState {
  /** Whether the check is currently in progress */
  isChecking: boolean;
  /** Whether the check has completed (successfully or not) */
  hasChecked: boolean;
  /** Whether this is the user's first login */
  isFirstLogin: boolean;
  /** Whether there was an error during the check */
  hasError: boolean;
  /** Error message if the check failed */
  errorMessage: string | null;
  /** Type of error that occurred */
  errorType: 'unauthorized' | 'infrastructure' | 'network' | 'unknown' | null;
  /** HTTP status code when available */
  statusCode: number | null;
}

/**
 * Return type for the useFirstLoginCheck hook
 */
export interface UseFirstLoginCheckReturn extends FirstLoginCheckState {
  /** Trigger the first login check */
  performCheck: (accessToken: string) => Promise<void>;
  /** Reset the state (e.g., after user acknowledges the welcome message) */
  resetState: () => void;
  /** Clear the error state */
  clearError: () => void;
}

/**
 * Initial state for the first login check
 */
const initialState: FirstLoginCheckState = {
  isChecking: false,
  hasChecked: false,
  isFirstLogin: false,
  hasError: false,
  errorMessage: null,
  errorType: null,
  statusCode: null,
};

/**
 * Hook for checking if the current user is logging in for the first time
 * 
 * This hook should be called after successful authentication. It will:
 * 1. Call the Azure Function API to check if the user exists in UserSettings table
 * 2. Return whether this is a first-time login (show welcome popup)
 * 3. Handle errors including infrastructure issues
 * 
 * @returns State and functions for managing the first login check
 */
export function useFirstLoginCheck(): UseFirstLoginCheckReturn {
  const [state, setState] = useState<FirstLoginCheckState>(initialState);
  
  // Use refs to track check state to avoid stale closure issues
  const isCheckingRef = useRef(false);
  const hasCheckedRef = useRef(false);

  /**
   * Perform the first login check
   * 
   * @param accessToken - Access token from MSAL authentication
   */
  const performCheck = useCallback(async (accessToken: string) => {
    // Don't check again if already checking or already checked (using refs for current values)
    if (isCheckingRef.current || hasCheckedRef.current) {
      return;
    }

    // Set refs immediately to prevent race conditions
    isCheckingRef.current = true;

    setState(prev => ({
      ...prev,
      isChecking: true,
      hasError: false,
      errorMessage: null,
      errorType: null,
      statusCode: null,
    }));

    try {
      const result: FirstLoginCheckResult = await checkFirstLogin(accessToken);

      // Mark as checked
      hasCheckedRef.current = true;
      isCheckingRef.current = false;

      if (result.success) {
        setState({
          isChecking: false,
          hasChecked: true,
          isFirstLogin: result.isFirstLogin ?? false,
          hasError: false,
          errorMessage: null,
          errorType: null,
          statusCode: null,
        });
      } else {
        setState({
          isChecking: false,
          hasChecked: true,
          isFirstLogin: false,
          hasError: true,
          errorMessage: result.error ?? 'Unknown error occurred',
          errorType: result.errorType ?? 'unknown',
          statusCode: result.statusCode ?? null,
        });
      }
    } catch (error) {
      hasCheckedRef.current = true;
      isCheckingRef.current = false;

      setState({
        isChecking: false,
        hasChecked: true,
        isFirstLogin: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unexpected error occurred',
        errorType: 'unknown',
        statusCode: null,
      });
    }
  }, []); // No dependencies needed - using refs for mutable state

  /**
   * Reset the state to initial values
   * Call this after the user acknowledges the welcome message or on logout
   */
  const resetState = useCallback(() => {
    isCheckingRef.current = false;
    hasCheckedRef.current = false;
    setState(initialState);
  }, []);

  /**
   * Clear just the error state while keeping other state
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasError: false,
      errorMessage: null,
      errorType: null,
      statusCode: null,
    }));
  }, []);

  return {
    ...state,
    performCheck,
    resetState,
    clearError,
  };
}
