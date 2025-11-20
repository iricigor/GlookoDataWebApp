/**
 * Custom hook for managing insulin duration preference
 * 
 * This hook manages insulin duration state (in hours) with cookie persistence.
 * The duration is used for IOB (Insulin On Board) calculations.
 */

import { useState, useCallback } from 'react';

export interface UseInsulinDurationReturn {
  insulinDuration: number;
  setInsulinDuration: (duration: number) => void;
}

const INSULIN_DURATION_COOKIE_NAME = 'glooko-insulin-duration';
const COOKIE_EXPIRY_DAYS = 365;
const DEFAULT_DURATION = 5; // Default 5 hours
const MIN_DURATION = 1;     // Minimum 1 hour
const MAX_DURATION = 10;    // Maximum 10 hours

/**
 * Get insulin duration preference from cookie
 */
function getDurationFromCookie(): number | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === INSULIN_DURATION_COOKIE_NAME) {
      const duration = parseFloat(value);
      if (!isNaN(duration) && duration >= MIN_DURATION && duration <= MAX_DURATION) {
        return duration;
      }
    }
  }
  return null;
}

/**
 * Save insulin duration preference to cookie
 */
function saveDurationToCookie(duration: number): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${INSULIN_DURATION_COOKIE_NAME}=${duration}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Hook to manage insulin duration preference
 */
export function useInsulinDuration(): UseInsulinDurationReturn {
  const [insulinDuration, setInsulinDurationState] = useState<number>(() => {
    // Initialize from cookie or default to 5 hours
    return getDurationFromCookie() ?? DEFAULT_DURATION;
  });

  const setInsulinDuration = useCallback((duration: number) => {
    // Validate and clamp duration to valid range
    const validDuration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, duration));
    setInsulinDurationState(validDuration);
    saveDurationToCookie(validDuration);
  }, []);

  return {
    insulinDuration,
    setInsulinDuration,
  };
}
