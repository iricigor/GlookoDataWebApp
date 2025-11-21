/**
 * Custom hook for managing insulin duration setting
 * 
 * This hook manages the insulin duration (in hours) for IOB calculations
 * with cookie persistence
 */

import { useState, useCallback } from 'react';

export interface UseInsulinDurationReturn {
  insulinDuration: number;
  setInsulinDuration: (duration: number) => void;
}

const INSULIN_DURATION_COOKIE_NAME = 'glooko-insulin-duration';
const COOKIE_EXPIRY_DAYS = 365;
const DEFAULT_INSULIN_DURATION = 5; // Default 5 hours

/**
 * Get insulin duration from cookie
 */
function getDurationFromCookie(): number | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === INSULIN_DURATION_COOKIE_NAME) {
      const duration = parseFloat(value);
      if (!isNaN(duration) && duration > 0) {
        return duration;
      }
    }
  }
  return null;
}

/**
 * Save insulin duration to cookie
 */
function saveDurationToCookie(duration: number): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${INSULIN_DURATION_COOKIE_NAME}=${duration}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Hook to manage insulin duration setting
 */
export function useInsulinDuration(): UseInsulinDurationReturn {
  const [insulinDuration, setInsulinDurationState] = useState<number>(() => {
    // Initialize from cookie or default to 5 hours
    return getDurationFromCookie() || DEFAULT_INSULIN_DURATION;
  });

  const setInsulinDuration = useCallback((duration: number) => {
    // Validate duration (must be positive)
    if (duration <= 0) {
      return;
    }
    setInsulinDurationState(duration);
    saveDurationToCookie(duration);
  }, []);

  return {
    insulinDuration,
    setInsulinDuration,
  };
}
