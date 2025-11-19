/**
 * Unit tests for useGlucoseUnit hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlucoseUnit } from './useGlucoseUnit';

describe('useGlucoseUnit', () => {
  // Clear cookies before each test
  beforeEach(() => {
    document.cookie = 'glooko-glucose-unit=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('should default to mmol/L when no cookie is set', () => {
    const { result } = renderHook(() => useGlucoseUnit());
    expect(result.current.glucoseUnit).toBe('mmol/L');
  });

  it('should read mmol/L from cookie', () => {
    // Set cookie before rendering
    document.cookie = 'glooko-glucose-unit=mmol/L; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useGlucoseUnit());
    expect(result.current.glucoseUnit).toBe('mmol/L');
  });

  it('should read mg/dL from cookie', () => {
    // Set cookie before rendering
    document.cookie = 'glooko-glucose-unit=mg/dL; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useGlucoseUnit());
    expect(result.current.glucoseUnit).toBe('mg/dL');
  });

  it('should update unit to mg/dL', () => {
    const { result } = renderHook(() => useGlucoseUnit());
    
    act(() => {
      result.current.setGlucoseUnit('mg/dL');
    });
    
    expect(result.current.glucoseUnit).toBe('mg/dL');
  });

  it('should update unit to mmol/L', () => {
    const { result } = renderHook(() => useGlucoseUnit());
    
    // First set to mg/dL
    act(() => {
      result.current.setGlucoseUnit('mg/dL');
    });
    
    // Then back to mmol/L
    act(() => {
      result.current.setGlucoseUnit('mmol/L');
    });
    
    expect(result.current.glucoseUnit).toBe('mmol/L');
  });

  it('should persist unit change to cookie', () => {
    const { result } = renderHook(() => useGlucoseUnit());
    
    act(() => {
      result.current.setGlucoseUnit('mg/dL');
    });
    
    // Check that cookie was set
    const cookies = document.cookie.split(';');
    const unitCookie = cookies.find(c => c.trim().startsWith('glooko-glucose-unit='));
    expect(unitCookie).toBeDefined();
    expect(unitCookie?.trim()).toContain('mg/dL');
  });

  it('should ignore invalid cookie values and default to mmol/L', () => {
    // Set invalid cookie value
    document.cookie = 'glooko-glucose-unit=invalid; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useGlucoseUnit());
    expect(result.current.glucoseUnit).toBe('mmol/L');
  });

  it('should persist across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useGlucoseUnit());
    
    act(() => {
      result1.current.setGlucoseUnit('mg/dL');
    });
    
    // Create new instance
    const { result: result2 } = renderHook(() => useGlucoseUnit());
    expect(result2.current.glucoseUnit).toBe('mg/dL');
  });

  it('should maintain stable setGlucoseUnit function reference', () => {
    const { result, rerender } = renderHook(() => useGlucoseUnit());
    
    const firstSetter = result.current.setGlucoseUnit;
    
    act(() => {
      result.current.setGlucoseUnit('mg/dL');
    });
    
    rerender();
    
    const secondSetter = result.current.setGlucoseUnit;
    expect(firstSetter).toBe(secondSetter);
  });
});
