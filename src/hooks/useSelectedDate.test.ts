/**
 * Tests for useSelectedDate hook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelectedDate } from './useSelectedDate';

describe('useSelectedDate', () => {
  // Store original document.cookie
  let originalCookie: string;

  beforeEach(() => {
    originalCookie = document.cookie;
    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=; max-age=0; path=/`;
    });
  });

  afterEach(() => {
    // Restore original cookies
    document.cookie = originalCookie;
  });

  it('should initialize with undefined when no fileId', () => {
    const { result } = renderHook(() => useSelectedDate(undefined));
    expect(result.current.selectedDate).toBeUndefined();
  });

  it('should initialize with undefined when no saved date', () => {
    const { result } = renderHook(() => useSelectedDate('file1'));
    expect(result.current.selectedDate).toBeUndefined();
  });

  it('should load saved date from cookie', () => {
    // Manually set a cookie
    document.cookie = 'selectedDate_file1=2025-01-15; path=/';
    
    const { result } = renderHook(() => useSelectedDate('file1'));
    expect(result.current.selectedDate).toBe('2025-01-15');
  });

  it('should save date to cookie when set', () => {
    const { result } = renderHook(() => useSelectedDate('file1'));
    
    act(() => {
      result.current.setSelectedDate('2025-01-20');
    });

    expect(result.current.selectedDate).toBe('2025-01-20');
    
    // Check cookie was set
    expect(document.cookie).toContain('selectedDate_file1=2025-01-20');
  });

  it('should remove cookie when date is set to undefined', () => {
    // First set a date
    const { result } = renderHook(() => useSelectedDate('file1'));
    
    act(() => {
      result.current.setSelectedDate('2025-01-15');
    });
    
    expect(document.cookie).toContain('selectedDate_file1=2025-01-15');
    
    // Then set to undefined
    act(() => {
      result.current.setSelectedDate(undefined);
    });

    expect(result.current.selectedDate).toBeUndefined();
    // Cookie should be cleared (max-age=0)
  });

  it('should not save to cookie when fileId is undefined', () => {
    const { result } = renderHook(() => useSelectedDate(undefined));
    
    act(() => {
      result.current.setSelectedDate('2025-01-20');
    });

    expect(result.current.selectedDate).toBe('2025-01-20');
    // Should not create a cookie with undefined fileId
    expect(document.cookie).not.toContain('selectedDate_undefined');
  });

  it('should clear date when fileId changes to undefined', () => {
    document.cookie = 'selectedDate_file1=2025-01-15; path=/';
    
    const { result, rerender } = renderHook(
      ({ fileId }) => useSelectedDate(fileId),
      { initialProps: { fileId: 'file1' as string | undefined } }
    );

    expect(result.current.selectedDate).toBe('2025-01-15');

    // Change fileId to undefined
    rerender({ fileId: undefined });
    expect(result.current.selectedDate).toBeUndefined();
  });

  it('should load different date when fileId changes', () => {
    document.cookie = 'selectedDate_file1=2025-01-15; path=/';
    document.cookie = 'selectedDate_file2=2025-02-20; path=/';

    const { result, rerender } = renderHook(
      ({ fileId }) => useSelectedDate(fileId),
      { initialProps: { fileId: 'file1' as string | undefined } }
    );

    expect(result.current.selectedDate).toBe('2025-01-15');

    // Change to file2
    rerender({ fileId: 'file2' as string | undefined });
    expect(result.current.selectedDate).toBe('2025-02-20');
  });

  it('should handle multiple date updates', () => {
    const { result } = renderHook(() => useSelectedDate('file1'));

    act(() => {
      result.current.setSelectedDate('2025-01-10');
    });
    expect(result.current.selectedDate).toBe('2025-01-10');

    act(() => {
      result.current.setSelectedDate('2025-01-15');
    });
    expect(result.current.selectedDate).toBe('2025-01-15');

    act(() => {
      result.current.setSelectedDate('2025-01-20');
    });
    expect(result.current.selectedDate).toBe('2025-01-20');
    
    expect(document.cookie).toContain('selectedDate_file1=2025-01-20');
  });

  it('should handle encoded date values', () => {
    // Set a date that needs encoding (though dates typically don't, this tests the encoding/decoding)
    const { result } = renderHook(() => useSelectedDate('file1'));
    
    act(() => {
      result.current.setSelectedDate('2025-01-20');
    });

    expect(result.current.selectedDate).toBe('2025-01-20');
    
    // Read it back
    const { result: result2 } = renderHook(() => useSelectedDate('file1'));
    expect(result2.current.selectedDate).toBe('2025-01-20');
  });
});
