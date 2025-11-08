/**
 * Unit tests for useTheme custom hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('useTheme', () => {
  // Clear cookies before each test
  beforeEach(() => {
    // Mock matchMedia to return light theme by default
    mockMatchMedia(false);
    
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  });

  afterEach(() => {
    // Clean up cookies after tests
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  });

  describe('initialization', () => {
    it('should initialize with system theme mode by default', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe('system');
    });

    it('should initialize with a valid theme object', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBeDefined();
      expect(result.current.theme).toHaveProperty('colorNeutralForeground1');
    });

    it('should provide a setThemeMode function', () => {
      const { result } = renderHook(() => useTheme());
      expect(typeof result.current.setThemeMode).toBe('function');
    });
  });

  describe('theme switching', () => {
    it('should switch to light theme', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setThemeMode('light');
      });
      
      expect(result.current.themeMode).toBe('light');
      expect(result.current.theme).toBeDefined();
    });

    it('should switch to dark theme', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setThemeMode('dark');
      });
      
      expect(result.current.themeMode).toBe('dark');
      expect(result.current.theme).toBeDefined();
    });

    it('should switch between themes multiple times', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setThemeMode('light');
      });
      expect(result.current.themeMode).toBe('light');
      
      act(() => {
        result.current.setThemeMode('dark');
      });
      expect(result.current.themeMode).toBe('dark');
      
      act(() => {
        result.current.setThemeMode('system');
      });
      expect(result.current.themeMode).toBe('system');
    });
  });

  describe('cookie persistence', () => {
    it('should save theme preference to cookie', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setThemeMode('dark');
      });
      
      expect(document.cookie).toContain('glooko-theme-preference=dark');
    });

    it('should load theme preference from cookie', () => {
      // Set cookie before rendering hook
      document.cookie = 'glooko-theme-preference=light; path=/; SameSite=Strict';
      
      const { result } = renderHook(() => useTheme());
      
      expect(result.current.themeMode).toBe('light');
    });

    it('should update cookie when theme changes', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setThemeMode('light');
      });
      expect(document.cookie).toContain('glooko-theme-preference=light');
      
      act(() => {
        result.current.setThemeMode('dark');
      });
      expect(document.cookie).toContain('glooko-theme-preference=dark');
    });
  });

  describe('theme object validation', () => {
    it('should return different theme objects for light and dark modes', () => {
      const { result: lightResult } = renderHook(() => useTheme());
      
      act(() => {
        lightResult.current.setThemeMode('light');
      });
      const lightTheme = lightResult.current.theme;

      const { result: darkResult } = renderHook(() => useTheme());
      
      act(() => {
        darkResult.current.setThemeMode('dark');
      });
      const darkTheme = darkResult.current.theme;

      // Themes should be different objects
      expect(lightTheme).not.toBe(darkTheme);
    });

    it('should have theme tokens defined', () => {
      const { result } = renderHook(() => useTheme());
      
      // Check that common Fluent UI tokens exist
      expect(result.current.theme.colorNeutralForeground1).toBeDefined();
      expect(result.current.theme.colorBrandForeground1).toBeDefined();
    });
  });
});
