/**
 * Custom hook for managing Perplexity API key
 * 
 * This hook manages API key state with cookie persistence
 */

import { useState, useCallback } from 'react';

export interface UsePerplexityApiKeyReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const API_KEY_COOKIE_NAME = 'glooko-perplexity-api-key';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get API key from cookie
 */
function getApiKeyFromCookie(): string {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === API_KEY_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return '';
}

/**
 * Save API key to cookie
 */
function saveApiKeyToCookie(key: string): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${API_KEY_COOKIE_NAME}=${encodeURIComponent(key)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Hook to manage Perplexity API key
 */
export function usePerplexityApiKey(): UsePerplexityApiKeyReturn {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    // Initialize from cookie or default to empty string
    return getApiKeyFromCookie();
  });

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    saveApiKeyToCookie(key);
  }, []);

  return {
    apiKey,
    setApiKey,
  };
}
