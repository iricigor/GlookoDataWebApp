/**
 * Tests for useIsDarkMode hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsDarkMode } from './useIsDarkMode';

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

describe('useIsDarkMode', () => {
  // Store original cookie
  let originalCookie: string;

  beforeEach(() => {
    originalCookie = document.cookie;
    // Mock matchMedia to return light theme by default
    mockMatchMedia(false);
    // Clear all cookies (only if there are cookies to clear)
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  });

  afterEach(() => {
    // Restore original cookies
    document.cookie = originalCookie;
  });

  it('should default to system preference (false) when no cookie is set', () => {
    const { result } = renderHook(() => useIsDarkMode());
    // Should return false since matchMedia is mocked to return false
    expect(result.current).toBe(false);
  });

  it('should return true when dark theme is set in cookie', () => {
    document.cookie = 'glooko-theme-preference=dark; path=/';
    const { result } = renderHook(() => useIsDarkMode());
    expect(result.current).toBe(true);
  });

  it('should return false when light theme is set in cookie', () => {
    document.cookie = 'glooko-theme-preference=light; path=/';
    const { result } = renderHook(() => useIsDarkMode());
    expect(result.current).toBe(false);
  });

  it('should update when window focus event fires after cookie change', async () => {
    document.cookie = 'glooko-theme-preference=light; path=/';
    const { result } = renderHook(() => useIsDarkMode());
    
    expect(result.current).toBe(false);
    
    // Update cookie to dark
    document.cookie = 'glooko-theme-preference=dark; path=/';
    
    // Trigger a focus event to simulate the user switching back to the window
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    
    expect(result.current).toBe(true);
  });

  it('should return false for system preference when system prefers light', () => {
    mockMatchMedia(false); // System prefers light
    document.cookie = 'glooko-theme-preference=system; path=/';
    const { result } = renderHook(() => useIsDarkMode());
    expect(result.current).toBe(false);
  });

  it('should return true for system preference when system prefers dark', () => {
    mockMatchMedia(true); // System prefers dark
    document.cookie = 'glooko-theme-preference=system; path=/';
    const { result } = renderHook(() => useIsDarkMode());
    expect(result.current).toBe(true);
  });

  it('should fallback to system preference for invalid cookie values', () => {
    mockMatchMedia(false); // System prefers light
    document.cookie = 'glooko-theme-preference=invalid; path=/';
    const { result } = renderHook(() => useIsDarkMode());
    // Should fall back to system preference (false)
    expect(result.current).toBe(false);
  });
});
