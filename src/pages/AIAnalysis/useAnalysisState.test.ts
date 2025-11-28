/**
 * Tests for useAnalysisState hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalysisState, DEFAULT_COOLDOWN_DURATION } from './useAnalysisState';

describe('useAnalysisState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAnalysisState());
    
    expect(result.current.analyzing).toBe(false);
    expect(result.current.response).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.cooldownActive).toBe(false);
    expect(result.current.cooldownSeconds).toBe(0);
    expect(result.current.ready).toBe(false);
    expect(result.current.retryInfo).toBeNull();
  });

  it('should export default cooldown duration', () => {
    expect(DEFAULT_COOLDOWN_DURATION).toBe(3);
  });

  it('should start analysis correctly', () => {
    const { result } = renderHook(() => useAnalysisState());
    
    act(() => {
      result.current.startAnalysis();
    });
    
    expect(result.current.analyzing).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(false);
    expect(result.current.retryInfo).toBeNull();
  });

  it('should complete analysis with response', () => {
    const { result } = renderHook(() => useAnalysisState());
    
    act(() => {
      result.current.startAnalysis();
    });
    
    act(() => {
      result.current.completeAnalysis('Test response');
    });
    
    expect(result.current.analyzing).toBe(false);
    expect(result.current.response).toBe('Test response');
    expect(result.current.error).toBeNull();
  });

  it('should set error and preserve previous response by default', () => {
    const { result } = renderHook(() => useAnalysisState());
    
    act(() => {
      result.current.completeAnalysis('Previous response');
    });
    
    act(() => {
      result.current.setAnalysisError('Test error');
    });
    
    expect(result.current.analyzing).toBe(false);
    expect(result.current.error).toBe('Test error');
    expect(result.current.response).toBe('Previous response');
  });

  it('should set error and clear response when requested', () => {
    const { result } = renderHook(() => useAnalysisState());
    
    act(() => {
      result.current.completeAnalysis('Previous response');
    });
    
    act(() => {
      result.current.setAnalysisError('Test error', false);
    });
    
    expect(result.current.analyzing).toBe(false);
    expect(result.current.error).toBe('Test error');
    expect(result.current.response).toBeNull();
  });

  it('should trigger cooldown correctly', () => {
    const { result } = renderHook(() => useAnalysisState());
    
    act(() => {
      result.current.triggerCooldown();
    });
    
    expect(result.current.cooldownActive).toBe(true);
    expect(result.current.cooldownSeconds).toBe(3);
  });

  it('should count down cooldown and set ready when done', async () => {
    const { result } = renderHook(() => useAnalysisState());
    
    act(() => {
      result.current.triggerCooldown();
    });
    
    expect(result.current.cooldownSeconds).toBe(3);
    expect(result.current.cooldownActive).toBe(true);
    
    // Advance 1 second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.cooldownSeconds).toBe(2);
    
    // Advance another second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.cooldownSeconds).toBe(1);
    
    // Advance final second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.cooldownSeconds).toBe(0);
    expect(result.current.cooldownActive).toBe(false);
    expect(result.current.ready).toBe(true);
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useAnalysisState());
    
    // Set some state
    act(() => {
      result.current.completeAnalysis('Test response');
      result.current.setRetryInfo('Retry info');
    });
    
    expect(result.current.response).toBe('Test response');
    expect(result.current.retryInfo).toBe('Retry info');
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.analyzing).toBe(false);
    expect(result.current.response).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.cooldownActive).toBe(false);
    expect(result.current.cooldownSeconds).toBe(0);
    expect(result.current.ready).toBe(false);
    expect(result.current.retryInfo).toBeNull();
  });

  it('should set retry info correctly', () => {
    const { result } = renderHook(() => useAnalysisState());
    
    act(() => {
      result.current.setRetryInfo('Dataset too large. Retrying...');
    });
    
    expect(result.current.retryInfo).toBe('Dataset too large. Retrying...');
    
    act(() => {
      result.current.setRetryInfo(null);
    });
    
    expect(result.current.retryInfo).toBeNull();
  });

  it('should use custom cooldown duration when provided', () => {
    const { result } = renderHook(() => useAnalysisState({ cooldownDuration: 5 }));
    
    act(() => {
      result.current.triggerCooldown();
    });
    
    expect(result.current.cooldownActive).toBe(true);
    expect(result.current.cooldownSeconds).toBe(5);
  });
});
