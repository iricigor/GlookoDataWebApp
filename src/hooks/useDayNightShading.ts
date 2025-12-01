/**
 * Custom hook for managing day/night shading preference on 24-hour graphs
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'showDayNightShading';
const DEFAULT_VALUE = true;

export function useDayNightShading() {
  const [showDayNightShading, setShowDayNightShadingState] = useState<boolean>(() => {
    // Initialize from localStorage, default to true
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return DEFAULT_VALUE;
  });

  // Sync to localStorage when value changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(showDayNightShading));
  }, [showDayNightShading]);

  const setShowDayNightShading = useCallback((value: boolean) => {
    setShowDayNightShadingState(value);
  }, []);

  return { showDayNightShading, setShowDayNightShading };
}
