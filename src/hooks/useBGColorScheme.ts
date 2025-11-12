/**
 * Custom hook for managing BG graph color scheme preferences
 * 
 * This hook manages color scheme state with cookie persistence
 */

import { useState, useCallback } from 'react';

export type BGColorScheme = 'monochrome' | 'basic' | 'hsv' | 'clinical';

export interface UseBGColorSchemeReturn {
  colorScheme: BGColorScheme;
  setColorScheme: (scheme: BGColorScheme) => void;
}

const BG_COLOR_SCHEME_COOKIE_NAME = 'glooko-bg-color-scheme';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get color scheme preference from cookie
 */
function getSchemeFromCookie(): BGColorScheme | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === BG_COLOR_SCHEME_COOKIE_NAME) {
      const schemeValue = value as BGColorScheme;
      if (schemeValue === 'monochrome' || schemeValue === 'basic' || schemeValue === 'hsv' || schemeValue === 'clinical') {
        return schemeValue;
      }
    }
  }
  return null;
}

/**
 * Save color scheme preference to cookie
 */
function saveSchemeToCookie(scheme: BGColorScheme): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${BG_COLOR_SCHEME_COOKIE_NAME}=${scheme}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Hook to manage BG color scheme preference
 */
export function useBGColorScheme(): UseBGColorSchemeReturn {
  const [colorScheme, setColorSchemeState] = useState<BGColorScheme>(() => {
    // Initialize from cookie or default to monochrome
    return getSchemeFromCookie() || 'monochrome';
  });

  const setColorScheme = useCallback((scheme: BGColorScheme) => {
    setColorSchemeState(scheme);
    saveSchemeToCookie(scheme);
  }, []);

  return {
    colorScheme,
    setColorScheme,
  };
}
