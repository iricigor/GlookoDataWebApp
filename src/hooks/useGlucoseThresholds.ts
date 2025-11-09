/**
 * Custom hook for managing blood glucose threshold preferences
 * 
 * This hook manages glucose threshold state with cookie persistence
 */

import { useState, useCallback } from 'react';
import type { GlucoseThresholds } from '../types';

export interface UseGlucoseThresholdsReturn {
  thresholds: GlucoseThresholds;
  setThresholds: (thresholds: GlucoseThresholds) => void;
  updateThreshold: (key: keyof GlucoseThresholds, value: number) => void;
  validateThresholds: (thresholds: GlucoseThresholds) => string | null;
  isValid: boolean;
}

const THRESHOLDS_COOKIE_NAME = 'glooko-glucose-thresholds';
const COOKIE_EXPIRY_DAYS = 365;

// Default thresholds as per requirements
const DEFAULT_THRESHOLDS: GlucoseThresholds = {
  veryHigh: 13.9,
  high: 10.0,
  low: 3.9,
  veryLow: 3.0,
};

/**
 * Get thresholds from cookie
 */
function getThresholdsFromCookie(): GlucoseThresholds | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === THRESHOLDS_COOKIE_NAME) {
      try {
        const parsed = JSON.parse(decodeURIComponent(value));
        // Validate the parsed object has all required fields
        if (
          typeof parsed.veryHigh === 'number' &&
          typeof parsed.high === 'number' &&
          typeof parsed.low === 'number' &&
          typeof parsed.veryLow === 'number'
        ) {
          return parsed as GlucoseThresholds;
        }
      } catch {
        // Invalid JSON in cookie, ignore
      }
    }
  }
  return null;
}

/**
 * Save thresholds to cookie
 */
function saveThresholdsToCookie(thresholds: GlucoseThresholds): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  const value = encodeURIComponent(JSON.stringify(thresholds));
  document.cookie = `${THRESHOLDS_COOKIE_NAME}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Validate glucose thresholds according to the rules
 * - Values from top must be higher than bottom ones
 * - Very low must be higher than zero
 * 
 * @returns Error message if invalid, null if valid
 */
export function validateGlucoseThresholds(thresholds: GlucoseThresholds): string | null {
  // Very low must be higher than zero
  if (thresholds.veryLow <= 0) {
    return 'Very low threshold must be greater than zero';
  }

  // Low must be higher than very low
  if (thresholds.low <= thresholds.veryLow) {
    return 'Low threshold must be greater than very low threshold';
  }

  // High must be higher than low
  if (thresholds.high <= thresholds.low) {
    return 'High threshold must be greater than low threshold';
  }

  // Very high must be higher than high
  if (thresholds.veryHigh <= thresholds.high) {
    return 'Very high threshold must be greater than high threshold';
  }

  return null;
}

/**
 * Custom hook for managing glucose threshold preferences
 * 
 * @returns Thresholds, setter functions, and validation
 * 
 * @example
 * ```tsx
 * function Settings() {
 *   const { thresholds, updateThreshold, isValid } = useGlucoseThresholds();
 *   return (
 *     <div>
 *       <input 
 *         value={thresholds.high}
 *         onChange={(e) => updateThreshold('high', parseFloat(e.target.value))}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useGlucoseThresholds(): UseGlucoseThresholdsReturn {
  // Initialize from cookie or default
  const [thresholds, setThresholdsState] = useState<GlucoseThresholds>(() => {
    return getThresholdsFromCookie() ?? DEFAULT_THRESHOLDS;
  });

  const [isValid, setIsValid] = useState(() => {
    return validateGlucoseThresholds(thresholds) === null;
  });

  const setThresholds = useCallback((newThresholds: GlucoseThresholds) => {
    setThresholdsState(newThresholds);
    const validationError = validateGlucoseThresholds(newThresholds);
    setIsValid(validationError === null);
    if (validationError === null) {
      saveThresholdsToCookie(newThresholds);
    }
  }, []);

  const updateThreshold = useCallback((key: keyof GlucoseThresholds, value: number) => {
    const newThresholds = { ...thresholds, [key]: value };
    setThresholdsState(newThresholds);
    const validationError = validateGlucoseThresholds(newThresholds);
    setIsValid(validationError === null);
    if (validationError === null) {
      saveThresholdsToCookie(newThresholds);
    }
  }, [thresholds]);

  return {
    thresholds,
    setThresholds,
    updateThreshold,
    validateThresholds: validateGlucoseThresholds,
    isValid,
  };
}
