/**
 * Tests for useFirstLoginCheck hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFirstLoginCheck } from './useFirstLoginCheck';

// Mock the API client
vi.mock('../utils/api/userSettingsApi', () => ({
  checkFirstLogin: vi.fn(),
}));

import { checkFirstLogin } from '../utils/api/userSettingsApi';

const mockCheckFirstLogin = vi.mocked(checkFirstLogin);

describe('useFirstLoginCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFirstLoginCheck());
    
    expect(result.current.isChecking).toBe(false);
    expect(result.current.hasChecked).toBe(false);
    expect(result.current.isFirstLogin).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.errorType).toBeNull();
    expect(result.current.statusCode).toBeNull();
  });

  it('should set isChecking to true during check', async () => {
    // Create a promise that we can control
    let resolveCheck: (value: { success: boolean; isFirstLogin: boolean }) => void;
    const checkPromise = new Promise<{ success: boolean; isFirstLogin: boolean }>((resolve) => {
      resolveCheck = resolve;
    });
    mockCheckFirstLogin.mockReturnValueOnce(checkPromise);

    const { result } = renderHook(() => useFirstLoginCheck());
    
    act(() => {
      result.current.performCheck('test-token');
    });
    
    expect(result.current.isChecking).toBe(true);
    
    // Complete the check
    await act(async () => {
      resolveCheck!({ success: true, isFirstLogin: true });
      await checkPromise;
    });
    
    expect(result.current.isChecking).toBe(false);
  });

  it('should set isFirstLogin to true for new users', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: true,
      isFirstLogin: true,
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.isFirstLogin).toBe(true);
      expect(result.current.hasError).toBe(false);
    });
  });

  it('should set isFirstLogin to false for returning users', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: true,
      isFirstLogin: false,
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.isFirstLogin).toBe(false);
      expect(result.current.hasError).toBe(false);
    });
  });

  it('should handle infrastructure errors', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: false,
      error: 'Cannot connect to Table Storage',
      errorType: 'infrastructure',
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Cannot connect to Table Storage');
      expect(result.current.errorType).toBe('infrastructure');
    });
  });

  it('should handle unauthorized errors', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: false,
      error: 'Unauthorized access',
      errorType: 'unauthorized',
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorType).toBe('unauthorized');
    });
  });

  it('should handle network errors', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: false,
      error: 'Network error',
      errorType: 'network',
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorType).toBe('network');
    });
  });

  it('should handle exceptions during check', async () => {
    mockCheckFirstLogin.mockRejectedValueOnce(new Error('Unexpected error'));

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Unexpected error');
      expect(result.current.errorType).toBe('unknown');
    });
  });

  it('should reset state when resetState is called', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: true,
      isFirstLogin: true,
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.isFirstLogin).toBe(true);
    });
    
    act(() => {
      result.current.resetState();
    });
    
    expect(result.current.isChecking).toBe(false);
    expect(result.current.hasChecked).toBe(false);
    expect(result.current.isFirstLogin).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.errorType).toBeNull();
  });

  it('should clear error when clearError is called', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: false,
      error: 'Some error',
      errorType: 'infrastructure',
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.hasError).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.errorType).toBeNull();
    // Other state should remain
    expect(result.current.hasChecked).toBe(true);
  });

  it('should not make duplicate calls while checking', async () => {
    let resolveCheck: (value: { success: boolean; isFirstLogin: boolean }) => void;
    const checkPromise = new Promise<{ success: boolean; isFirstLogin: boolean }>((resolve) => {
      resolveCheck = resolve;
    });
    mockCheckFirstLogin.mockReturnValueOnce(checkPromise);

    const { result } = renderHook(() => useFirstLoginCheck());
    
    // Start first check
    act(() => {
      result.current.performCheck('test-token');
    });
    
    // Try to start second check while first is in progress
    act(() => {
      result.current.performCheck('test-token');
    });
    
    // Complete the first check
    await act(async () => {
      resolveCheck!({ success: true, isFirstLogin: true });
      await checkPromise;
    });
    
    // Should only have been called once
    expect(mockCheckFirstLogin).toHaveBeenCalledTimes(1);
  });

  it('should not make duplicate calls after check has completed', async () => {
    mockCheckFirstLogin.mockResolvedValue({
      success: true,
      isFirstLogin: true,
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    // First check
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
    });
    
    // Try to start second check after first has completed
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    // Should only have been called once
    expect(mockCheckFirstLogin).toHaveBeenCalledTimes(1);
  });

  it('should handle undefined isFirstLogin in response', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: true,
      // isFirstLogin is undefined
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.isFirstLogin).toBe(false); // Default to false
    });
  });

  it('should handle undefined error message', async () => {
    mockCheckFirstLogin.mockResolvedValueOnce({
      success: false,
      // error is undefined
    });

    const { result } = renderHook(() => useFirstLoginCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Unknown error occurred');
    });
  });
});
