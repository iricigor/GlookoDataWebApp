/**
 * Custom hook for managing AI analysis state with cooldown functionality
 */

import { useState, useEffect, useCallback } from 'react';
import type { AnalysisState } from './types';
import { initialAnalysisState } from './types';

const COOLDOWN_DURATION = 3;

interface UseAnalysisStateReturn extends AnalysisState {
  startAnalysis: () => void;
  completeAnalysis: (response: string) => void;
  setAnalysisError: (error: string, preservePreviousResponse?: boolean) => void;
  triggerCooldown: () => void;
  reset: () => void;
  setRetryInfo: (info: string | null) => void;
}

/**
 * Hook to manage the state of an AI analysis prompt including cooldown
 */
export function useAnalysisState(): UseAnalysisStateReturn {
  const [state, setState] = useState<AnalysisState>(initialAnalysisState);

  // Handle cooldown timer
  useEffect(() => {
    if (state.cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          cooldownSeconds: prev.cooldownSeconds - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.cooldownActive && state.cooldownSeconds === 0) {
      setState(prev => ({
        ...prev,
        cooldownActive: false,
        ready: true,
      }));
    }
  }, [state.cooldownSeconds, state.cooldownActive]);

  const startAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      analyzing: true,
      error: null,
      ready: false,
      retryInfo: null,
    }));
  }, []);

  const completeAnalysis = useCallback((response: string) => {
    setState(prev => ({
      ...prev,
      analyzing: false,
      response,
      error: null,
      retryInfo: null,
    }));
  }, []);

  const setAnalysisError = useCallback((error: string, preservePreviousResponse = true) => {
    setState(prev => ({
      ...prev,
      analyzing: false,
      error,
      retryInfo: null,
      // Preserve previous response if requested
      response: preservePreviousResponse ? prev.response : null,
    }));
  }, []);

  const triggerCooldown = useCallback(() => {
    setState(prev => ({
      ...prev,
      cooldownActive: true,
      cooldownSeconds: COOLDOWN_DURATION,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialAnalysisState);
  }, []);

  const setRetryInfo = useCallback((info: string | null) => {
    setState(prev => ({
      ...prev,
      retryInfo: info,
    }));
  }, []);

  return {
    ...state,
    startAnalysis,
    completeAnalysis,
    setAnalysisError,
    triggerCooldown,
    reset,
    setRetryInfo,
  };
}
