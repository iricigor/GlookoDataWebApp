/**
 * Tests for useInsulinDuration hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInsulinDuration } from './useInsulinDuration';

describe('useInsulinDuration', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = 'glooko-insulin-duration=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('should initialize with default value of 5 hours', () => {
    const { result } = renderHook(() => useInsulinDuration());
    expect(result.current.insulinDuration).toBe(5);
  });

  it('should allow setting a new duration', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(4);
    });
    
    expect(result.current.insulinDuration).toBe(4);
  });

  it('should persist duration in cookie', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(6);
    });
    
    // Check if cookie is set
    expect(document.cookie).toContain('glooko-insulin-duration=6');
  });

  it('should load duration from cookie on initialization', () => {
    // Set cookie value
    document.cookie = 'glooko-insulin-duration=7; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useInsulinDuration());
    expect(result.current.insulinDuration).toBe(7);
  });

  it('should clamp duration to minimum of 1 hour', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(0.5);
    });
    
    expect(result.current.insulinDuration).toBe(1);
  });

  it('should clamp duration to maximum of 10 hours', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(15);
    });
    
    expect(result.current.insulinDuration).toBe(10);
  });

  it('should handle invalid cookie values', () => {
    // Set invalid cookie value
    document.cookie = 'glooko-insulin-duration=invalid; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useInsulinDuration());
    // Should fall back to default
    expect(result.current.insulinDuration).toBe(5);
  });

  it('should handle cookie values outside valid range', () => {
    // Set cookie value outside valid range
    document.cookie = 'glooko-insulin-duration=20; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useInsulinDuration());
    // Should fall back to default
    expect(result.current.insulinDuration).toBe(5);
  });

  it('should update cookie when duration changes', () => {
    const { result } = renderHook(() => useInsulinDuration());
    
    act(() => {
      result.current.setInsulinDuration(3);
    });
    
    expect(document.cookie).toContain('glooko-insulin-duration=3');
    
    act(() => {
      result.current.setInsulinDuration(8);
    });
    
    expect(document.cookie).toContain('glooko-insulin-duration=8');
  });
});
