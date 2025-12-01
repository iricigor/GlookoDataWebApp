/**
 * Tests for useDayNightShading hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDayNightShading } from './useDayNightShading';

describe('useDayNightShading', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return default value (true) when localStorage is empty', () => {
    const { result } = renderHook(() => useDayNightShading());
    expect(result.current.showDayNightShading).toBe(true);
  });

  it('should return stored value from localStorage', () => {
    localStorage.setItem('showDayNightShading', 'false');
    const { result } = renderHook(() => useDayNightShading());
    expect(result.current.showDayNightShading).toBe(false);
  });

  it('should update value and persist to localStorage', () => {
    const { result } = renderHook(() => useDayNightShading());
    
    expect(result.current.showDayNightShading).toBe(true);
    
    act(() => {
      result.current.setShowDayNightShading(false);
    });
    
    expect(result.current.showDayNightShading).toBe(false);
    expect(localStorage.getItem('showDayNightShading')).toBe('false');
  });

  it('should handle toggling from false to true', () => {
    localStorage.setItem('showDayNightShading', 'false');
    const { result } = renderHook(() => useDayNightShading());
    
    expect(result.current.showDayNightShading).toBe(false);
    
    act(() => {
      result.current.setShowDayNightShading(true);
    });
    
    expect(result.current.showDayNightShading).toBe(true);
    expect(localStorage.getItem('showDayNightShading')).toBe('true');
  });
});
