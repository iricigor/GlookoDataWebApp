/**
 * Hook for managing Pro user API key preference
 * 
 * This hook manages the user's preference for using Pro backend keys vs their own API keys.
 * For Pro users only - determines whether to route AI calls through backend or client-side.
 */

import { useState, useEffect, useCallback } from 'react';

const USE_PRO_KEYS_COOKIE = 'useProKeys';
const DEFAULT_USE_PRO_KEYS = true; // Default to using Pro keys
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get preference from cookie
 */
function getProKeysFromCookie(): boolean | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === USE_PRO_KEYS_COOKIE) {
      return value === 'true';
    }
  }
  return null;
}

/**
 * Save preference to cookie
 */
function setProKeysCookie(value: boolean): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${USE_PRO_KEYS_COOKIE}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Hook that manages whether Pro users prefer to use backend keys or their own API keys
 * 
 * @returns Tuple of [useProKeys, setUseProKeys] where useProKeys is boolean and setUseProKeys is a setter function
 */
export function useProKeys(): [boolean, (value: boolean) => void] {
  // Initialize from cookie, defaulting to true (use Pro keys)
  const [useProKeys, setUseProKeysState] = useState<boolean>(() => {
    const cookieValue = getProKeysFromCookie();
    return cookieValue !== null ? cookieValue : DEFAULT_USE_PRO_KEYS;
  });

  // Update cookie when value changes
  const setUseProKeys = useCallback((value: boolean) => {
    setUseProKeysState(value);
    setProKeysCookie(value);
  }, []);

  // Sync with cookie on mount
  useEffect(() => {
    const cookieValue = getProKeysFromCookie();
    if (cookieValue !== null) {
      setUseProKeysState(cookieValue);
    }
  }, []);

  return [useProKeys, setUseProKeys];
}
