/**
 * Custom hook for checking if the user is a pro user
 * 
 * This hook manages the state for the pro user check and integrates
 * with the useAuth hook to trigger the check after successful login.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { checkProUserStatus, type ProUserCheckResult } from '../utils/api/userSettingsApi';

/**
 * State for the pro user check
 */
export interface ProUserCheckState {
  /** Whether the check is currently in progress */
  isChecking: boolean;
  /** Whether the check has completed (successfully or not) */
  hasChecked: boolean;
  /** Whether the user is a pro user */
  isProUser: boolean;
  /** Secret value from Key Vault (only for pro users) */
  secretValue: string | null;
  /** Whether there was an error during the check */
  hasError: boolean;
  /** Error message if the check failed */
  errorMessage: string | null;
}

/**
 * Return type for the useProUserCheck hook
 */
export interface UseProUserCheckReturn extends ProUserCheckState {
  /** Trigger the pro user check */
  performCheck: (idToken: string) => Promise<void>;
  /** Reset the state (e.g., on logout) */
  resetState: () => void;
}

/**
 * Initial state for the pro user check
 */
const initialState: ProUserCheckState = {
  isChecking: false,
  hasChecked: false,
  isProUser: false,
  secretValue: null,
  hasError: false,
  errorMessage: null,
};

/**
 * Determines whether the current authenticated user is a pro user and provides controls to run or reset that check.
 *
 * When an ID token is provided, the hook will automatically trigger a pro-user status check unless one has already completed.
 *
 * @param idToken - Optional ID token used to authenticate the pro-user check; supplying a token triggers an automatic check when one has not already run
 * @returns An object with the pro-user check state and control functions:
 *  - `isChecking`: whether a check is currently in progress
 *  - `hasChecked`: whether a check has completed at least once
 *  - `isProUser`: whether the user is identified as a pro user
 *  - `secretValue`: a secret value returned for pro users, or `null`
 *  - `hasError`: whether the last check resulted in an error
 *  - `errorMessage`: error message from the last check, or `null`
 *  - `performCheck(idToken: string)`: function to trigger a pro-user check with a specific token
 *  - `resetState()`: function to reset the hook to its initial state
 */
export function useProUserCheck(idToken?: string | null): UseProUserCheckReturn {
  const [state, setState] = useState<ProUserCheckState>(initialState);
  
  // Use refs to track check state to avoid stale closure issues
  const isCheckingRef = useRef(false);
  const hasCheckedRef = useRef(false);
  const currentTokenRef = useRef<string | null>(null);

  /**
   * Perform the pro user check
   * 
   * @param token - ID token from MSAL authentication
   */
  const performCheck = useCallback(async (token: string) => {
    // Don't check again if already checking or already checked with same token
    if (isCheckingRef.current) {
      return;
    }
    
    // If already checked with the same token, don't check again
    if (hasCheckedRef.current && currentTokenRef.current === token) {
      return;
    }

    // Set refs immediately to prevent race conditions
    isCheckingRef.current = true;
    currentTokenRef.current = token;

    setState(prev => ({
      ...prev,
      isChecking: true,
      hasError: false,
      errorMessage: null,
    }));

    try {
      const result: ProUserCheckResult = await checkProUserStatus(token);

      // Mark as checked
      hasCheckedRef.current = true;
      isCheckingRef.current = false;

      if (result.success) {
        setState({
          isChecking: false,
          hasChecked: true,
          isProUser: result.isProUser ?? false,
          secretValue: result.secretValue ?? null,
          hasError: false,
          errorMessage: null,
        });
      } else {
        // On error, default to not pro user but don't break the UI
        setState({
          isChecking: false,
          hasChecked: true,
          isProUser: false,
          secretValue: null,
          hasError: true,
          errorMessage: result.error ?? 'Unknown error occurred',
        });
      }
    } catch (error) {
      hasCheckedRef.current = true;
      isCheckingRef.current = false;

      // On unexpected error, default to not pro user
      setState({
        isChecking: false,
        hasChecked: true,
        isProUser: false,
        secretValue: null,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unexpected error occurred',
      });
    }
  }, []);

  /**
   * Reset the state to initial values
   * Call this on logout
   */
  const resetState = useCallback(() => {
    isCheckingRef.current = false;
    hasCheckedRef.current = false;
    currentTokenRef.current = null;
    setState(() => ({ ...initialState }));
  }, []);

  // Auto-check when idToken is provided
  useEffect(() => {
    if (idToken && !hasCheckedRef.current && !isCheckingRef.current) {
      performCheck(idToken);
    }
    
    // Reset state if idToken becomes null (user logged out)
    if (!idToken && hasCheckedRef.current) {
      resetState();
    }
  }, [idToken, performCheck, resetState]);

  return {
    ...state,
    performCheck,
    resetState,
  };
}