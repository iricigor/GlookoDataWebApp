/**
 * Custom hook for managing theme preferences (light/dark/system)
 * 
 * This hook manages theme state with cookie persistence and system preference detection
 */

import { useState, useEffect, useCallback } from 'react';
import { webLightTheme, webDarkTheme } from '@fluentui/react-components';
import type { Theme } from '@fluentui/react-components';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UseThemeReturn {
  themeMode: ThemeMode;
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
}

const THEME_COOKIE_NAME = 'glooko-theme-preference';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get theme preference from cookie
 */
function getThemeFromCookie(): ThemeMode | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === THEME_COOKIE_NAME) {
      const themeValue = value as ThemeMode;
      if (themeValue === 'light' || themeValue === 'dark' || themeValue === 'system') {
        return themeValue;
      }
    }
  }
  return null;
}

/**
 * Save theme preference to cookie
 */
function saveThemeToCookie(mode: ThemeMode): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${THEME_COOKIE_NAME}=${mode}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Detect if user prefers dark mode from system settings
 */
function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolve the actual theme based on theme mode
 */
function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'system') {
    return getSystemPrefersDark() ? webDarkTheme : webLightTheme;
  }
  return mode === 'dark' ? webDarkTheme : webLightTheme;
}

/**
 * Custom hook for managing theme preferences
 * 
 * @returns Theme mode, resolved theme, and setter function
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { theme, themeMode, setThemeMode } = useTheme();
 *   return (
 *     <FluentProvider theme={theme}>
 *       <YourApp />
 *     </FluentProvider>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  // Initialize from cookie or default to 'system'
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return getThemeFromCookie() ?? 'system';
  });

  const [theme, setTheme] = useState<Theme>(() => resolveTheme(themeMode));

  // Update theme when themeMode changes
  useEffect(() => {
    setTheme(resolveTheme(themeMode));
  }, [themeMode]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setTheme(resolveTheme('system'));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemeToCookie(mode);
  }, []);

  return {
    themeMode,
    theme,
    setThemeMode,
  };
}
