/**
 * Custom hook to detect if dark mode is currently active
 * 
 * This hook reads the theme preference from the cookie and system preferences
 * to determine if dark mode is currently active. It's a lightweight alternative
 * to useTheme when you only need to know if dark mode is active.
 */

import { useState, useEffect } from 'react';

const THEME_COOKIE_NAME = 'glooko-theme-preference';

/**
 * Get theme preference from cookie
 */
function getThemeFromCookie(): 'light' | 'dark' | 'system' | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === THEME_COOKIE_NAME) {
      if (value === 'light' || value === 'dark' || value === 'system') {
        return value;
      }
    }
  }
  return null;
}

/**
 * Detect if user prefers dark mode from system settings
 */
function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Determine if dark mode is currently active based on theme preference
 */
function resolveIsDarkMode(themeMode: 'light' | 'dark' | 'system'): boolean {
  if (themeMode === 'system') {
    return getSystemPrefersDark();
  }
  return themeMode === 'dark';
}

/**
 * Custom hook to detect if dark mode is currently active
 * 
 * @returns boolean indicating if dark mode is active
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDarkMode = useIsDarkMode();
 *   return <div>{isDarkMode ? 'Dark' : 'Light'}</div>;
 * }
 * ```
 */
export function useIsDarkMode(): boolean {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const themeMode = getThemeFromCookie() ?? 'system';
    return resolveIsDarkMode(themeMode);
  });

  useEffect(() => {
    // Update when cookie might have changed (e.g., on window focus or visibility change)
    const updateDarkMode = () => {
      const themeMode = getThemeFromCookie() ?? 'system';
      setIsDarkMode(resolveIsDarkMode(themeMode));
    };

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const themeMode = getThemeFromCookie() ?? 'system';
      if (themeMode === 'system') {
        setIsDarkMode(getSystemPrefersDark());
      }
    };

    // Listen for window focus to detect theme changes made in settings
    const handleFocus = () => {
      updateDarkMode();
    };

    // Listen for visibility change (when user switches back to the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateDarkMode();
      }
    };

    // Listen for storage events (in case theme is changed in another tab)
    const handleStorage = () => {
      updateDarkMode();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);
    mediaQuery.addEventListener('change', handleSystemChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  return isDarkMode;
}
