/**
 * Tests for useGeekStats hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useGeekStats } from './useGeekStats';

describe('useGeekStats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return false by default (geek stats hidden)', () => {
    const { result } = renderHook(() => useGeekStats());
    expect(result.current.showGeekStats).toBe(false);
  });

  it('should return stored value from localStorage', () => {
    localStorage.setItem('showGeekStats', 'true');
    const { result } = renderHook(() => useGeekStats());
    expect(result.current.showGeekStats).toBe(true);
  });

  it('should update value and persist to localStorage', () => {
    const { result } = renderHook(() => useGeekStats());
    
    expect(result.current.showGeekStats).toBe(false);
    
    act(() => {
      result.current.setShowGeekStats(true);
    });
    
    expect(result.current.showGeekStats).toBe(true);
    expect(localStorage.getItem('showGeekStats')).toBe('true');
  });

  it('should handle toggling from true to false', () => {
    localStorage.setItem('showGeekStats', 'true');
    const { result } = renderHook(() => useGeekStats());
    
    expect(result.current.showGeekStats).toBe(true);
    
    act(() => {
      result.current.setShowGeekStats(false);
    });
    
    expect(result.current.showGeekStats).toBe(false);
    expect(localStorage.getItem('showGeekStats')).toBe('false');
  });
});
