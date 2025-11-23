/**
 * Custom hook for managing cookie consent preferences
 * 
 * This hook manages whether the user has acknowledged the cookie disclaimer
 * Note: This consent is stored in localStorage (not cookies) to avoid the irony
 * of needing cookies to track cookie consent
 */

import { useState, useEffect, useCallback } from 'react';

const COOKIE_CONSENT_KEY = 'glooko-cookie-consent-acknowledged';

export interface UseCookieConsentReturn {
  hasConsented: boolean;
  acknowledgeConsent: () => void;
}

/**
 * Get cookie consent status from localStorage
 */
function getConsentFromStorage(): boolean {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored === 'true';
  } catch (error) {
    // If localStorage is not available, assume not consented
    console.warn('localStorage not available for cookie consent', error);
    return false;
  }
}

/**
 * Save cookie consent status to localStorage
 */
function saveConsentToStorage(): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
  } catch (error) {
    // If localStorage is not available, silently fail
    console.warn('Failed to save cookie consent to localStorage', error);
  }
}

/**
 * Custom hook for managing cookie consent
 * 
 * @returns Object with consent status and acknowledge function
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { hasConsented, acknowledgeConsent } = useCookieConsent();
 *   
 *   return (
 *     <>
 *       {!hasConsented && (
 *         <CookieBanner onAccept={acknowledgeConsent} />
 *       )}
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */
export function useCookieConsent(): UseCookieConsentReturn {
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    return getConsentFromStorage();
  });

  // Check localStorage on mount in case it was set in another tab
  useEffect(() => {
    setHasConsented(getConsentFromStorage());
  }, []);

  const acknowledgeConsent = useCallback(() => {
    saveConsentToStorage();
    setHasConsented(true);
  }, []);

  return {
    hasConsented,
    acknowledgeConsent,
  };
}
