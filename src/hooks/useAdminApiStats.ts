/**
 * Custom hook for fetching admin API statistics
 * 
 * This hook manages the state for API statistics fetching and integrates
 * with the useAuth hook to trigger the fetch after successful Pro user authentication.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getApiStats, type ApiStatsResult, type TimePeriod } from '../utils/api/adminApiStatsApi';

/**
 * State for the admin API statistics
 */
export interface AdminApiStatsState {
  /** Whether the fetch is currently in progress */
  isLoading: boolean;
  /** Whether the fetch has completed (successfully or not) */
  hasLoaded: boolean;
  /** Web calls count */
  webCalls: number | null;
  /** Web errors count */
  webErrors: number | null;
  /** API calls count */
  apiCalls: number | null;
  /** API errors count */
  apiErrors: number | null;
  /** Current time period */
  timePeriod: TimePeriod;
  /** Whether there was an error during the fetch */
  hasError: boolean;
  /** Error message if the fetch failed */
  errorMessage: string | null;
  /** Error type if the fetch failed */
  errorType: 'unauthorized' | 'authorization' | 'infrastructure' | 'network' | 'unknown' | null;
}

/**
 * Return type for the useAdminApiStats hook
 */
export interface UseAdminApiStatsReturn extends AdminApiStatsState {
  /** Trigger the statistics fetch */
  fetchStats: (idToken: string, timePeriod?: TimePeriod) => Promise<void>;
  /** Set the time period for statistics */
  setTimePeriod: (timePeriod: TimePeriod) => void;
  /** Reset the state (e.g., on logout) */
  resetState: () => void;
}

/**
 * Initial state for the admin API statistics
 */
const initialState: AdminApiStatsState = {
  isLoading: false,
  hasLoaded: false,
  webCalls: null,
  webErrors: null,
  apiCalls: null,
  apiErrors: null,
  timePeriod: '1hour',
  hasError: false,
  errorMessage: null,
  errorType: null,
};

/**
 * Fetches admin API statistics for Pro users and provides controls to run or reset that fetch.
 *
 * When an ID token is provided, the hook will automatically trigger a statistics fetch.
 * The hook also handles time period changes and re-fetches data when the period is changed.
 *
 * @param idToken - Optional ID token used to authenticate the statistics fetch
 * @param shouldFetch - Whether to automatically fetch statistics (default: true)
 * @returns An object with the admin API statistics state and control functions
 */
export function useAdminApiStats(idToken?: string | null, shouldFetch: boolean = true): UseAdminApiStatsReturn {
  const [state, setState] = useState<AdminApiStatsState>(initialState);
  
  // Use refs to track fetch state to avoid stale closure issues
  const isLoadingRef = useRef(false);
  const currentTokenRef = useRef<string | null>(null);
  const currentPeriodRef = useRef<TimePeriod>('1hour');

  /**
   * Perform the statistics fetch
   * 
   * @param token - ID token from MSAL authentication
   * @param period - Time period for statistics (defaults to current period)
   */
  const fetchStats = useCallback(async (token: string, period?: TimePeriod) => {
    // Don't fetch again if already loading
    if (isLoadingRef.current) {
      return;
    }

    const targetPeriod = period || currentPeriodRef.current;

    // Set refs immediately to prevent race conditions
    isLoadingRef.current = true;
    currentTokenRef.current = token;
    currentPeriodRef.current = targetPeriod;

    setState(prev => ({
      ...prev,
      isLoading: true,
      timePeriod: targetPeriod,
      hasError: false,
      errorMessage: null,
      errorType: null,
    }));

    try {
      const result: ApiStatsResult = await getApiStats(token, targetPeriod);

      isLoadingRef.current = false;

      if (result.success) {
        setState({
          isLoading: false,
          hasLoaded: true,
          webCalls: result.webCalls ?? null,
          webErrors: result.webErrors ?? null,
          apiCalls: result.apiCalls ?? null,
          apiErrors: result.apiErrors ?? null,
          timePeriod: targetPeriod,
          hasError: false,
          errorMessage: null,
          errorType: null,
        });
      } else {
        // On error, keep previous counts if any
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasLoaded: true,
          timePeriod: targetPeriod,
          hasError: true,
          errorMessage: result.error ?? 'Unknown error occurred',
          errorType: result.errorType ?? 'unknown',
        }));
      }
    } catch (error) {
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
   * Set the time period and trigger a re-fetch if token is available
   */
  const setTimePeriod = useCallback((timePeriod: TimePeriod) => {
    currentPeriodRef.current = timePeriod;
    
    // If we have a token and shouldFetch is true, re-fetch with new period
    if (currentTokenRef.current && shouldFetch) {
      fetchStats(currentTokenRef.current, timePeriod);
    } else {
      // Just update the period in state
      setState(prev => ({ ...prev, timePeriod }));
    }
  }, [fetchStats, shouldFetch]);

  /**
   * Reset the state to initial values
   * Call this on logout
   */
  const resetState = useCallback(() => {
    isLoadingRef.current = false;
    currentTokenRef.current = null;
    currentPeriodRef.current = '1hour';
    setState(() => ({ ...initialState }));
  }, []);

  // Auto-fetch when idToken is provided and shouldFetch is true
  useEffect(() => {
    if (shouldFetch && idToken && !isLoadingRef.current) {
      // Only fetch if token changed or we haven't loaded yet
      if (currentTokenRef.current !== idToken || !state.hasLoaded) {
        fetchStats(idToken);
      }
    }
    
    // Reset state if idToken becomes null (user logged out)
    if (!idToken && state.hasLoaded) {
      resetState();
    }
  }, [idToken, shouldFetch, fetchStats, resetState, state.hasLoaded]);

  return {
    ...state,
    fetchStats,
    setTimePeriod,
    resetState,
  };
}
