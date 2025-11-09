import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlucoseThresholds, validateGlucoseThresholds } from './useGlucoseThresholds';
import type { GlucoseThresholds } from '../types';

// Helper to clear cookies
function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.trim().split('=')[0];
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

describe('validateGlucoseThresholds', () => {
  it('should return null for valid default thresholds', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 13.9,
      high: 10.0,
      low: 3.9,
      veryLow: 3.0,
    };
    expect(validateGlucoseThresholds(thresholds)).toBeNull();
  });

  it('should reject very low threshold equal to zero', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 13.9,
      high: 10.0,
      low: 3.9,
      veryLow: 0,
    };
    expect(validateGlucoseThresholds(thresholds)).toContain('greater than zero');
  });

  it('should reject very low threshold below zero', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 13.9,
      high: 10.0,
      low: 3.9,
      veryLow: -1.0,
    };
    expect(validateGlucoseThresholds(thresholds)).toContain('greater than zero');
  });

  it('should reject low threshold equal to very low', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 13.9,
      high: 10.0,
      low: 3.0,
      veryLow: 3.0,
    };
    expect(validateGlucoseThresholds(thresholds)).toContain('Low threshold must be greater than very low');
  });

  it('should reject low threshold less than very low', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 13.9,
      high: 10.0,
      low: 2.5,
      veryLow: 3.0,
    };
    expect(validateGlucoseThresholds(thresholds)).toContain('Low threshold must be greater than very low');
  });

  it('should reject high threshold equal to low', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 13.9,
      high: 3.9,
      low: 3.9,
      veryLow: 3.0,
    };
    expect(validateGlucoseThresholds(thresholds)).toContain('High threshold must be greater than low');
  });

  it('should reject high threshold less than low', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 13.9,
      high: 3.0,
      low: 3.9,
      veryLow: 2.5,
    };
    expect(validateGlucoseThresholds(thresholds)).toContain('High threshold must be greater than low');
  });

  it('should reject very high threshold equal to high', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 10.0,
      high: 10.0,
      low: 3.9,
      veryLow: 3.0,
    };
    expect(validateGlucoseThresholds(thresholds)).toContain('Very high threshold must be greater than high');
  });

  it('should reject very high threshold less than high', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 9.0,
      high: 10.0,
      low: 3.9,
      veryLow: 3.0,
    };
    expect(validateGlucoseThresholds(thresholds)).toContain('Very high threshold must be greater than high');
  });

  it('should accept valid custom thresholds', () => {
    const thresholds: GlucoseThresholds = {
      veryHigh: 15.0,
      high: 12.0,
      low: 4.5,
      veryLow: 3.5,
    };
    expect(validateGlucoseThresholds(thresholds)).toBeNull();
  });
});

describe('useGlucoseThresholds', () => {
  beforeEach(() => {
    clearCookies();
  });

  it('should initialize with default thresholds', () => {
    const { result } = renderHook(() => useGlucoseThresholds());
    
    expect(result.current.thresholds).toEqual({
      veryHigh: 13.9,
      high: 10.0,
      low: 3.9,
      veryLow: 3.0,
    });
    expect(result.current.isValid).toBe(true);
  });

  it('should update a single threshold', () => {
    const { result } = renderHook(() => useGlucoseThresholds());
    
    act(() => {
      result.current.updateThreshold('high', 11.0);
    });

    expect(result.current.thresholds.high).toBe(11.0);
    expect(result.current.isValid).toBe(true);
  });

  it('should set isValid to false for invalid threshold update', () => {
    const { result } = renderHook(() => useGlucoseThresholds());
    
    act(() => {
      result.current.updateThreshold('veryLow', 0);
    });

    expect(result.current.isValid).toBe(false);
  });

  it('should update all thresholds at once', () => {
    const { result } = renderHook(() => useGlucoseThresholds());
    
    const newThresholds: GlucoseThresholds = {
      veryHigh: 15.0,
      high: 12.0,
      low: 4.5,
      veryLow: 3.5,
    };

    act(() => {
      result.current.setThresholds(newThresholds);
    });

    expect(result.current.thresholds).toEqual(newThresholds);
    expect(result.current.isValid).toBe(true);
  });

  it('should persist valid thresholds to cookie', () => {
    const { result } = renderHook(() => useGlucoseThresholds());
    
    act(() => {
      result.current.updateThreshold('high', 11.0);
    });

    // Re-render hook to check if value persists
    const { result: result2 } = renderHook(() => useGlucoseThresholds());
    expect(result2.current.thresholds.high).toBe(11.0);
  });

  it('should not persist invalid thresholds to cookie', () => {
    const { result } = renderHook(() => useGlucoseThresholds());
    
    // Set valid threshold first
    act(() => {
      result.current.updateThreshold('high', 11.0);
    });

    // Try to set invalid threshold
    act(() => {
      result.current.updateThreshold('veryLow', 0);
    });

    // Re-render hook - should have the last valid value
    const { result: result2 } = renderHook(() => useGlucoseThresholds());
    expect(result2.current.thresholds.high).toBe(11.0);
    expect(result2.current.thresholds.veryLow).toBe(3.0); // Default value, not invalid 0
  });

  it('should validate thresholds using validateThresholds method', () => {
    const { result } = renderHook(() => useGlucoseThresholds());
    
    const invalidThresholds: GlucoseThresholds = {
      veryHigh: 13.9,
      high: 10.0,
      low: 3.9,
      veryLow: 0,
    };

    const error = result.current.validateThresholds(invalidThresholds);
    expect(error).not.toBeNull();
    expect(error).toContain('greater than zero');
  });
});
