/**
 * Custom hook for managing UI language preferences (English/German)
 * 
 * This hook manages UI language state with LocalStorage persistence.
 * It is separate from AI response language which controls content localization.
 * This hook controls the i18next UI localization.
 */

import { useState, useCallback, useEffect } from 'react';
import i18n from '../i18n';

export type UILanguage = 'en' | 'de';

export interface UseUILanguageReturn {
  uiLanguage: UILanguage;
  setUILanguage: (language: UILanguage) => void;
}

const UI_LANGUAGE_STORAGE_KEY = 'glookoUILanguagePreference';

/**
 * Get UI language preference from LocalStorage
 */
function getLanguageFromStorage(): UILanguage | null {
  try {
    const stored = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'de') {
      return stored;
    }
  } catch (error) {
    console.error('Failed to read UI language from localStorage:', error);
  }
  return null;
}

/**
 * Save UI language preference to LocalStorage
 */
function saveLanguageToStorage(language: UILanguage): void {
  try {
    localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save UI language to localStorage:', error);
  }
}

/**
 * Hook to manage UI language preference
 */
export function useUILanguage(): UseUILanguageReturn {
  const [uiLanguage, setUILanguageState] = useState<UILanguage>(() => {
    // Initialize from LocalStorage or default to English
    return getLanguageFromStorage() || 'en';
  });

  // Initialize i18next with stored language on mount
  useEffect(() => {
    const storedLanguage = getLanguageFromStorage();
    if (storedLanguage && i18n.language !== storedLanguage) {
      i18n.changeLanguage(storedLanguage);
    }
  }, []);

  const setUILanguage = useCallback((language: UILanguage) => {
    setUILanguageState(language);
    saveLanguageToStorage(language);
    // Change i18next language
    i18n.changeLanguage(language);
  }, []);

  return {
    uiLanguage,
    setUILanguage,
  };
}
