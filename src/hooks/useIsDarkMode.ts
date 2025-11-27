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
    // Update when cookie might have changed (e.g., on window focus)
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

    // Check for theme changes periodically (cookie changes don't have events)
    const interval = setInterval(updateDarkMode, 1000);

    mediaQuery.addEventListener('change', handleSystemChange);
    
    return () => {
      clearInterval(interval);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  return isDarkMode;
}
