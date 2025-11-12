/**
 * Tests for useBGColorScheme hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBGColorScheme } from './useBGColorScheme';

describe('useBGColorScheme', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
  });

  it('should return monochrome as default color scheme', () => {
    const { result } = renderHook(() => useBGColorScheme());
    expect(result.current.colorScheme).toBe('monochrome');
  });

  it('should update color scheme', () => {
    const { result } = renderHook(() => useBGColorScheme());
    
    act(() => {
      result.current.setColorScheme('basic');
    });
    
    expect(result.current.colorScheme).toBe('basic');
  });

  it('should persist color scheme to cookie', () => {
    const { result } = renderHook(() => useBGColorScheme());
    
    act(() => {
      result.current.setColorScheme('hsv');
    });
    
    // Check if cookie was set
    expect(document.cookie).toContain('glooko-bg-color-scheme=hsv');
  });

  it('should restore color scheme from cookie', () => {
    // Set a cookie manually
    document.cookie = 'glooko-bg-color-scheme=clinical; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useBGColorScheme());
    expect(result.current.colorScheme).toBe('clinical');
  });

  it('should handle all valid color schemes', () => {
    const { result } = renderHook(() => useBGColorScheme());
    
    const schemes: Array<'monochrome' | 'basic' | 'hsv' | 'clinical'> = ['monochrome', 'basic', 'hsv', 'clinical'];
    
    schemes.forEach(scheme => {
      act(() => {
        result.current.setColorScheme(scheme);
      });
      expect(result.current.colorScheme).toBe(scheme);
    });
  });

  it('should use stable callback reference', () => {
    const { result, rerender } = renderHook(() => useBGColorScheme());
    
    const firstCallback = result.current.setColorScheme;
    rerender();
    const secondCallback = result.current.setColorScheme;
    
    expect(firstCallback).toBe(secondCallback);
  });
});
