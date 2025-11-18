/**
 * Custom hook for managing AI response language preferences (English/Czech)
 * 
 * This hook manages response language state with cookie persistence
 */

import { useState, useCallback } from 'react';

export type ResponseLanguage = 'english' | 'czech';

export interface UseResponseLanguageReturn {
  responseLanguage: ResponseLanguage;
  setResponseLanguage: (language: ResponseLanguage) => void;
}

const RESPONSE_LANGUAGE_COOKIE_NAME = 'glooko-response-language';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get response language preference from cookie
 */
function getLanguageFromCookie(): ResponseLanguage | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === RESPONSE_LANGUAGE_COOKIE_NAME) {
      const languageValue = value as ResponseLanguage;
      if (languageValue === 'english' || languageValue === 'czech') {
        return languageValue;
      }
    }
  }
  return null;
}

/**
 * Save response language preference to cookie
 */
function saveLanguageToCookie(language: ResponseLanguage): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${RESPONSE_LANGUAGE_COOKIE_NAME}=${language}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Hook to manage response language preference
 */
export function useResponseLanguage(): UseResponseLanguageReturn {
  const [responseLanguage, setResponseLanguageState] = useState<ResponseLanguage>(() => {
    // Initialize from cookie or default to English
    return getLanguageFromCookie() || 'english';
  });

  const setResponseLanguage = useCallback((language: ResponseLanguage) => {
    setResponseLanguageState(language);
    saveLanguageToCookie(language);
  }, []);

  return {
    responseLanguage,
    setResponseLanguage,
  };
}
