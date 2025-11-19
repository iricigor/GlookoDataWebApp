/**
 * Unit tests for useDateRange hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateRange } from './useDateRange';

describe('useDateRange', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
    });
  });

  it('should initialize with empty dates when no fileId provided', () => {
    const { result } = renderHook(() => useDateRange(undefined));
    
    expect(result.current.startDate).toBe('');
    expect(result.current.endDate).toBe('');
    expect(result.current.minDate).toBe('');
    expect(result.current.maxDate).toBe('');
  });

  it('should initialize with empty dates when fileId provided but no cookie exists', () => {
    const { result } = renderHook(() => useDateRange('file-123'));
    
    expect(result.current.startDate).toBe('');
    expect(result.current.endDate).toBe('');
    expect(result.current.minDate).toBe('');
    expect(result.current.maxDate).toBe('');
  });

  it('should set date range and persist to cookie', () => {
    const { result } = renderHook(() => useDateRange('file-123'));
    
    act(() => {
      result.current.setDateRange('2024-01-01', '2024-12-31');
    });
    
    expect(result.current.startDate).toBe('2024-01-01');
    expect(result.current.endDate).toBe('2024-12-31');
    expect(result.current.minDate).toBe('2024-01-01');
    expect(result.current.maxDate).toBe('2024-12-31');
    
    // Verify cookie was set
    expect(document.cookie).toContain('glooko-date-range-file-123');
  });

  it('should set date range with custom start and end dates', () => {
    const { result } = renderHook(() => useDateRange('file-123'));
    
    act(() => {
      result.current.setDateRange('2024-01-01', '2024-12-31', '2024-03-01', '2024-09-30');
    });
    
    expect(result.current.startDate).toBe('2024-03-01');
    expect(result.current.endDate).toBe('2024-09-30');
    expect(result.current.minDate).toBe('2024-01-01');
    expect(result.current.maxDate).toBe('2024-12-31');
  });

  it('should update start date independently', () => {
    const { result } = renderHook(() => useDateRange('file-123'));
    
    act(() => {
      result.current.setDateRange('2024-01-01', '2024-12-31');
    });
    
    act(() => {
      result.current.setStartDate('2024-02-15');
    });
    
    expect(result.current.startDate).toBe('2024-02-15');
    expect(result.current.endDate).toBe('2024-12-31');
  });

  it('should update end date independently', () => {
    const { result } = renderHook(() => useDateRange('file-123'));
    
    act(() => {
      result.current.setDateRange('2024-01-01', '2024-12-31');
    });
    
    act(() => {
      result.current.setEndDate('2024-11-30');
    });
    
    expect(result.current.startDate).toBe('2024-01-01');
    expect(result.current.endDate).toBe('2024-11-30');
  });

  it('should clear date range', () => {
    const { result } = renderHook(() => useDateRange('file-123'));
    
    act(() => {
      result.current.setDateRange('2024-01-01', '2024-12-31');
    });
    
    expect(result.current.startDate).toBe('2024-01-01');
    
    act(() => {
      result.current.clearDateRange();
    });
    
    expect(result.current.startDate).toBe('');
    expect(result.current.endDate).toBe('');
    expect(result.current.minDate).toBe('');
    expect(result.current.maxDate).toBe('');
  });

  it('should persist date range across hook re-renders', () => {
    const { result: result1 } = renderHook(() => useDateRange('file-123'));
    
    act(() => {
      result1.current.setDateRange('2024-01-01', '2024-12-31', '2024-03-15', '2024-10-20');
    });
    
    // Create a new hook instance with the same fileId
    const { result: result2 } = renderHook(() => useDateRange('file-123'));
    
    // Should load from cookie
    expect(result2.current.startDate).toBe('2024-03-15');
    expect(result2.current.endDate).toBe('2024-10-20');
    expect(result2.current.minDate).toBe('2024-01-01');
    expect(result2.current.maxDate).toBe('2024-12-31');
  });

  it('should maintain separate date ranges for different files', () => {
    const { result: result1 } = renderHook(() => useDateRange('file-1'));
    const { result: result2 } = renderHook(() => useDateRange('file-2'));
    
    act(() => {
      result1.current.setDateRange('2024-01-01', '2024-06-30');
    });
    
    act(() => {
      result2.current.setDateRange('2024-07-01', '2024-12-31');
    });
    
    expect(result1.current.startDate).toBe('2024-01-01');
    expect(result1.current.endDate).toBe('2024-06-30');
    
    expect(result2.current.startDate).toBe('2024-07-01');
    expect(result2.current.endDate).toBe('2024-12-31');
  });

  it('should update state when fileId changes', () => {
    const { result, rerender } = renderHook(
      ({ fileId }) => useDateRange(fileId),
      { initialProps: { fileId: 'file-1' } }
    );
    
    act(() => {
      result.current.setDateRange('2024-01-01', '2024-06-30');
    });
    
    expect(result.current.startDate).toBe('2024-01-01');
    
    // Change fileId
    rerender({ fileId: 'file-2' });
    
    // Should reset to empty since file-2 has no saved range
    expect(result.current.startDate).toBe('');
    expect(result.current.endDate).toBe('');
  });

  it('should not save to cookie when fileId is undefined', () => {
    const { result } = renderHook(() => useDateRange(undefined));
    
    act(() => {
      result.current.setDateRange('2024-01-01', '2024-12-31');
    });
    
    // Should update state but not save to cookie
    expect(result.current.startDate).toBe('2024-01-01');
    expect(document.cookie).not.toContain('glooko-date-range-undefined');
  });

  it('should handle invalid cookie data gracefully', () => {
    // Set an invalid cookie
    document.cookie = 'glooko-date-range-file-123=invalid-json; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useDateRange('file-123'));
    
    // Should initialize with empty values
    expect(result.current.startDate).toBe('');
    expect(result.current.endDate).toBe('');
  });

  it('should handle cookie with missing fields', () => {
    // Set a cookie with incomplete data
    const incompleteData = JSON.stringify({ startDate: '2024-01-01' });
    document.cookie = `glooko-date-range-file-123=${encodeURIComponent(incompleteData)}; path=/; SameSite=Strict`;
    
    const { result } = renderHook(() => useDateRange('file-123'));
    
    // Should initialize with empty values
    expect(result.current.startDate).toBe('');
    expect(result.current.endDate).toBe('');
  });
});
