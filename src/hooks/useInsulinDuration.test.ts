/**
 * Unit tests for useInsulinDuration hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInsulinDuration } from './useInsulinDuration';

describe('useInsulinDuration', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
  });

  it('should initialize with default value (5 hours)', () => {
    const { result } = renderHook(() => useInsulinDuration());
    expect(result.current.insulinDuration).toBe(5);
  });

  it('should update insulin duration', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(4);
    });
    
    expect(result.current.insulinDuration).toBe(4);
  });

  it('should persist insulin duration to cookie', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(6);
    });
    
    // Check if cookie was set
    const cookies = document.cookie.split(';');
    const insulinCookie = cookies.find(cookie => cookie.trim().startsWith('glooko-insulin-duration='));
    expect(insulinCookie).toBeDefined();
    expect(insulinCookie).toContain('glooko-insulin-duration=6');
  });

  it('should load insulin duration from cookie', () => {
    // Set cookie manually
    document.cookie = 'glooko-insulin-duration=7; path=/';
    
    const { result } = renderHook(() => useInsulinDuration());
    expect(result.current.insulinDuration).toBe(7);
  });

  it('should not update with invalid duration (zero)', () => {
    const { result } = renderHook(() => useInsulinDuration());
    const initialDuration = result.current.insulinDuration;
    
    act(() => {
      result.current.setInsulinDuration(0);
    });
    
    expect(result.current.insulinDuration).toBe(initialDuration);
  });

  it('should not update with invalid duration (negative)', () => {
    const { result } = renderHook(() => useInsulinDuration());
    const initialDuration = result.current.insulinDuration;
    
    act(() => {
      result.current.setInsulinDuration(-1);
    });
    
    expect(result.current.insulinDuration).toBe(initialDuration);
  });

  it('should accept decimal values', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(4.5);
    });
    
    expect(result.current.insulinDuration).toBe(4.5);
  });

  it('should handle large values', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(10);
    });
    
    expect(result.current.insulinDuration).toBe(10);
  });
});
