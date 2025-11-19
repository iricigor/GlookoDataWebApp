/**
 * Custom hook for managing glucose unit preferences (mmol/L or mg/dL)
 * 
 * This hook manages glucose unit state with cookie persistence
 */

import { useState, useCallback } from 'react';
import type { GlucoseUnit } from '../types';

export interface UseGlucoseUnitReturn {
  glucoseUnit: GlucoseUnit;
  setGlucoseUnit: (unit: GlucoseUnit) => void;
}

const GLUCOSE_UNIT_COOKIE_NAME = 'glooko-glucose-unit';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get glucose unit preference from cookie
 */
function getUnitFromCookie(): GlucoseUnit | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === GLUCOSE_UNIT_COOKIE_NAME) {
      const unitValue = value as GlucoseUnit;
      if (unitValue === 'mmol/L' || unitValue === 'mg/dL') {
        return unitValue;
      }
    }
  }
  return null;
}

/**
 * Save glucose unit preference to cookie
 */
function saveUnitToCookie(unit: GlucoseUnit): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${GLUCOSE_UNIT_COOKIE_NAME}=${unit}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Hook to manage glucose unit preference
 */
export function useGlucoseUnit(): UseGlucoseUnitReturn {
  const [glucoseUnit, setGlucoseUnitState] = useState<GlucoseUnit>(() => {
    // Initialize from cookie or default to mmol/L
    return getUnitFromCookie() || 'mmol/L';
  });

  const setGlucoseUnit = useCallback((unit: GlucoseUnit) => {
    setGlucoseUnitState(unit);
    saveUnitToCookie(unit);
  }, []);

  return {
    glucoseUnit,
    setGlucoseUnit,
  };
}
