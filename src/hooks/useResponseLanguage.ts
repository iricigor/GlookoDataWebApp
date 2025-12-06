/**
 * Custom hook for managing AI response language preferences (English/Czech)
 * 
 * This hook manages response language state with cookie persistence.
 * Supports automatic syncing with UI language.
 */

import { useState, useCallback, useEffect } from 'react';
import type { UILanguage } from './useUILanguage';

export type ResponseLanguage = 'english' | 'czech' | 'german' | 'serbian';

export interface UseResponseLanguageReturn {
  responseLanguage: ResponseLanguage;
  setResponseLanguage: (language: ResponseLanguage) => void;
  syncWithUILanguage: boolean;
  setSyncWithUILanguage: (sync: boolean) => void;
}

const RESPONSE_LANGUAGE_COOKIE_NAME = 'glooko-response-language';
const SYNC_WITH_UI_COOKIE_NAME = 'glooko-sync-ai-with-ui';
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
      if (languageValue === 'english' || languageValue === 'czech' || languageValue === 'german' || languageValue === 'serbian') {
        return languageValue;
      }
    }
  }
  return null;
}

/**
 * Get sync preference from cookie
 */
function getSyncFromCookie(): boolean {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === SYNC_WITH_UI_COOKIE_NAME) {
      return value === 'true';
    }
  }
  // Default to true for new users
  return true;
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
 * Save sync preference to cookie
 */
function saveSyncToCookie(sync: boolean): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${SYNC_WITH_UI_COOKIE_NAME}=${sync}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Map UI language to AI response language
 */
export function mapUILanguageToResponseLanguage(uiLanguage: UILanguage): ResponseLanguage {
  return uiLanguage === 'de' ? 'german' : 'english';
}

/**
 * Hook to manage response language preference
 * 
 * @param uiLanguage - Current UI language (for syncing)
 */
export function useResponseLanguage(uiLanguage: UILanguage): UseResponseLanguageReturn {
  const [syncWithUILanguage, setSyncWithUILanguageState] = useState<boolean>(() => {
    const savedSync = getSyncFromCookie();
    const savedLanguage = getLanguageFromCookie();
    
    // If there's a saved language that doesn't match UI language, user likely disabled sync
    if (savedLanguage) {
      const expectedLanguage = mapUILanguageToResponseLanguage(uiLanguage);
      if (savedLanguage !== expectedLanguage) {
        // Language was manually set, so sync should be false
        return false;
      }
    }
    
    return savedSync;
  });

  const [responseLanguage, setResponseLanguageState] = useState<ResponseLanguage>(() => {
    // Check if we have a saved preference
    const savedLanguage = getLanguageFromCookie();
    if (savedLanguage) {
      return savedLanguage;
    }
    
    // If no saved preference and sync is enabled, use UI language
    if (getSyncFromCookie()) {
      return mapUILanguageToResponseLanguage(uiLanguage);
    }
    
    // Default to English
    return 'english';
  });

  // Sync AI language with UI language when UI changes (if sync is enabled)
  useEffect(() => {
    if (syncWithUILanguage) {
      const newLanguage = mapUILanguageToResponseLanguage(uiLanguage);
      if (newLanguage !== responseLanguage) {
        setResponseLanguageState(newLanguage);
        saveLanguageToCookie(newLanguage);
      }
    }
  }, [uiLanguage, syncWithUILanguage, responseLanguage]);

  const setResponseLanguage = useCallback((language: ResponseLanguage) => {
    setResponseLanguageState(language);
    saveLanguageToCookie(language);
    // When user manually selects a language, disable sync
    if (syncWithUILanguage) {
      setSyncWithUILanguageState(false);
      saveSyncToCookie(false);
    }
  }, [syncWithUILanguage]);

  const setSyncWithUILanguage = useCallback((sync: boolean) => {
    setSyncWithUILanguageState(sync);
    saveSyncToCookie(sync);
    
    // If enabling sync, immediately sync to current UI language
    if (sync) {
      const newLanguage = mapUILanguageToResponseLanguage(uiLanguage);
      setResponseLanguageState(newLanguage);
      saveLanguageToCookie(newLanguage);
    }
  }, [uiLanguage]);

  return {
    responseLanguage,
    setResponseLanguage,
    syncWithUILanguage,
    setSyncWithUILanguage,
  };
}
