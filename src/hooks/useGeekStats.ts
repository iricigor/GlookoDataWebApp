/**
 * Custom hook for managing geek stats preference
 * Controls visibility of technical details like AI prompts and detailed data tables
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'showGeekStats';
const DEFAULT_VALUE = false; // Hidden by default

export function useGeekStats() {
  const [showGeekStats, setShowGeekStatsState] = useState<boolean>(() => {
    // Initialize from localStorage, default to false (hidden)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return DEFAULT_VALUE;
  });

  // Sync to localStorage when value changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(showGeekStats));
  }, [showGeekStats]);

  const setShowGeekStats = useCallback((value: boolean) => {
    setShowGeekStatsState(value);
  }, []);

  return { showGeekStats, setShowGeekStats };
}
