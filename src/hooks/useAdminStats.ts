/**
 * Custom hook for fetching admin statistics
 * 
 * This hook manages the state for admin statistics fetching and integrates
 * with the useAuth hook to trigger the fetch after successful Pro user authentication.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getLoggedInUsersCount, type LoggedInUsersCountResult } from '../utils/api/adminStatsApi';

/**
 * State for the admin statistics
 */
export interface AdminStatsState {
  /** Whether the fetch is currently in progress */
  isLoading: boolean;
  /** Whether the fetch has completed (successfully or not) */
  hasLoaded: boolean;
  /** Count of logged-in users */
  loggedInUsersCount: number | null;
  /** Whether there was an error during the fetch */
  hasError: boolean;
  /** Error message if the fetch failed */
  errorMessage: string | null;
  /** Error type if the fetch failed */
  errorType: 'unauthorized' | 'authorization' | 'infrastructure' | 'network' | 'unknown' | null;
}

/**
 * Return type for the useAdminStats hook
 */
export interface UseAdminStatsReturn extends AdminStatsState {
  /** Trigger the statistics fetch */
  fetchStats: (idToken: string) => Promise<void>;
  /** Reset the state (e.g., on logout) */
  resetState: () => void;
}

/**
 * Initial state for the admin statistics
 */
const initialState: AdminStatsState = {
  isLoading: false,
  hasLoaded: false,
  loggedInUsersCount: null,
  hasError: false,
  errorMessage: null,
  errorType: null,
};

/**
 * Fetches admin statistics for Pro users and provides controls to run or reset that fetch.
 *
 * When an ID token is provided, the hook will automatically trigger a statistics fetch unless one has already completed.
 *
 * @param idToken - Optional ID token used to authenticate the statistics fetch; supplying a token triggers an automatic fetch when one has not already run
 * @param shouldFetch - Whether to automatically fetch statistics (default: true)
 * @returns An object with the admin statistics state and control functions:
 *  - `isLoading`: whether a fetch is currently in progress
 *  - `hasLoaded`: whether a fetch has completed at least once
 *  - `loggedInUsersCount`: count of logged-in users, or `null`
 *  - `hasError`: whether the last fetch resulted in an error
 *  - `errorMessage`: error message from the last fetch, or `null`
 *  - `errorType`: error type from the last fetch, or `null`
 *  - `fetchStats(idToken: string)`: function to trigger a statistics fetch with a specific token
 *  - `resetState()`: function to reset the hook to its initial state
 */
export function useAdminStats(idToken?: string | null, shouldFetch: boolean = true): UseAdminStatsReturn {
  const [state, setState] = useState<AdminStatsState>(initialState);
  
  // Use refs to track fetch state to avoid stale closure issues
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const currentTokenRef = useRef<string | null>(null);

  /**
   * Perform the statistics fetch
   * 
   * @param token - ID token from MSAL authentication
   */
  const fetchStats = useCallback(async (token: string) => {
    // Don't fetch again if already loading or already loaded with same token
    if (isLoadingRef.current) {
      return;
    }
    
    // If already loaded with the same token, don't fetch again
    if (hasLoadedRef.current && currentTokenRef.current === token) {
      return;
    }

    // Set refs immediately to prevent race conditions
    isLoadingRef.current = true;
    currentTokenRef.current = token;

    setState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      errorMessage: null,
      errorType: null,
    }));

    try {
      const result: LoggedInUsersCountResult = await getLoggedInUsersCount(token);

      // Mark as loaded
      hasLoadedRef.current = true;
      isLoadingRef.current = false;

      if (result.success) {
        setState({
          isLoading: false,
          hasLoaded: true,
          loggedInUsersCount: result.count ?? null,
          hasError: false,
          errorMessage: null,
          errorType: null,
        });
      } else {
        // On error, keep previous count if any
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasLoaded: true,
          hasError: true,
          errorMessage: result.error ?? 'Unknown error occurred',
          errorType: result.errorType ?? 'unknown',
        }));
      }
    } catch (error) {
      hasLoadedRef.current = true;
      isLoadingRef.current = false;

      // On unexpected error
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasLoaded: true,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unexpected error occurred',
        errorType: 'unknown',
      }));
    }
  }, []);

  /**
   * Reset the state to initial values
   * Call this on logout
   */
  const resetState = useCallback(() => {
    isLoadingRef.current = false;
    hasLoadedRef.current = false;
    currentTokenRef.current = null;
    setState(() => ({ ...initialState }));
  }, []);

  // Auto-fetch when idToken is provided and shouldFetch is true
  useEffect(() => {
    if (shouldFetch && idToken && !hasLoadedRef.current && !isLoadingRef.current) {
      fetchStats(idToken);
    }
    
    // Reset state if idToken becomes null (user logged out)
    if (!idToken && hasLoadedRef.current) {
      resetState();
    }
  }, [idToken, shouldFetch, fetchStats, resetState]);

  return {
    ...state,
    fetchStats,
    resetState,
  };
}
