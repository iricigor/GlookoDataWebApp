/**
 * Tests for useProUserCheck hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProUserCheck } from './useProUserCheck';

// Mock the API client
vi.mock('../utils/api/userSettingsApi', () => ({
  checkProUserStatus: vi.fn(),
}));

import { checkProUserStatus } from '../utils/api/userSettingsApi';

const mockCheckProUserStatus = vi.mocked(checkProUserStatus);

describe('useProUserCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useProUserCheck());
    
    expect(result.current.isChecking).toBe(false);
    expect(result.current.hasChecked).toBe(false);
    expect(result.current.isProUser).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it('should auto-check when idToken is provided', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: true,
      isProUser: true,
    });

    const { result } = renderHook(() => useProUserCheck('test-token'));
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.isProUser).toBe(true);
    });
    
    expect(mockCheckProUserStatus).toHaveBeenCalledWith('test-token');
  });

  it('should not check when idToken is null', () => {
    const { result } = renderHook(() => useProUserCheck(null));
    
    expect(result.current.isChecking).toBe(false);
    expect(result.current.hasChecked).toBe(false);
    expect(mockCheckProUserStatus).not.toHaveBeenCalled();
  });

  it('should not check when idToken is undefined', () => {
    const { result } = renderHook(() => useProUserCheck(undefined));
    
    expect(result.current.isChecking).toBe(false);
    expect(result.current.hasChecked).toBe(false);
    expect(mockCheckProUserStatus).not.toHaveBeenCalled();
  });

  it('should set isChecking to true during check', async () => {
    // Create a promise that we can control
    let resolveCheck: (value: { success: boolean; isProUser: boolean }) => void;
    const checkPromise = new Promise<{ success: boolean; isProUser: boolean }>((resolve) => {
      resolveCheck = resolve;
    });
    mockCheckProUserStatus.mockReturnValueOnce(checkPromise);

    const { result } = renderHook(() => useProUserCheck());
    
    act(() => {
      result.current.performCheck('test-token');
    });
    
    expect(result.current.isChecking).toBe(true);
    
    // Complete the check
    await act(async () => {
      resolveCheck!({ success: true, isProUser: true });
      await checkPromise;
    });
    
    expect(result.current.isChecking).toBe(false);
  });

  it('should set isProUser to true for pro users', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: true,
      isProUser: true,
    });

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.isProUser).toBe(true);
      expect(result.current.hasError).toBe(false);
    });
  });

  it('should set isProUser to false for regular users', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: true,
      isProUser: false,
    });

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.isProUser).toBe(false);
      expect(result.current.hasError).toBe(false);
    });
  });

  it('should handle infrastructure errors gracefully', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: false,
      error: 'Cannot connect to Table Storage',
      errorType: 'infrastructure',
    });

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.isProUser).toBe(false); // Default to false on error
      expect(result.current.errorMessage).toBe('Cannot connect to Table Storage');
    });
  });

  it('should handle unauthorized errors gracefully', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: false,
      error: 'Unauthorized access',
      errorType: 'unauthorized',
    });

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
      expect(result.current.isProUser).toBe(false); // Default to false on error
    });
  });

  it('should handle network errors gracefully', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: false,
      error: 'Network error',
      errorType: 'network',
    });

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
      expect(result.current.isProUser).toBe(false); // Default to false on error
    });
  });

  it('should handle exceptions during check', async () => {
    mockCheckProUserStatus.mockRejectedValueOnce(new Error('Unexpected error'));

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.isProUser).toBe(false); // Default to false on error
      expect(result.current.errorMessage).toBe('Unexpected error');
    });
  });

  it('should reset state when resetState is called', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: true,
      isProUser: true,
    });

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.isProUser).toBe(true);
    });
    
    act(() => {
      result.current.resetState();
    });
    
    expect(result.current.isChecking).toBe(false);
    expect(result.current.hasChecked).toBe(false);
    expect(result.current.isProUser).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it('should not make duplicate calls while checking', async () => {
    let resolveCheck: (value: { success: boolean; isProUser: boolean }) => void;
    const checkPromise = new Promise<{ success: boolean; isProUser: boolean }>((resolve) => {
      resolveCheck = resolve;
    });
    mockCheckProUserStatus.mockReturnValueOnce(checkPromise);

    const { result } = renderHook(() => useProUserCheck());
    
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
      resolveCheck!({ success: true, isProUser: true });
      await checkPromise;
    });
    
    // Should only have been called once
    expect(mockCheckProUserStatus).toHaveBeenCalledTimes(1);
  });

  it('should not make duplicate calls with same token after check completed', async () => {
    mockCheckProUserStatus.mockResolvedValue({
      success: true,
      isProUser: true,
    });

    const { result } = renderHook(() => useProUserCheck());
    
    // First check
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
    });
    
    // Try to start second check with same token
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    // Should only have been called once
    expect(mockCheckProUserStatus).toHaveBeenCalledTimes(1);
  });

  it('should handle undefined isProUser in response', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: true,
      // isProUser is undefined
    });

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.isProUser).toBe(false); // Default to false
    });
  });

  it('should handle undefined error message', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: false,
      // error is undefined
    });

    const { result } = renderHook(() => useProUserCheck());
    
    await act(async () => {
      await result.current.performCheck('test-token');
    });
    
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Unknown error occurred');
    });
  });

  it('should reset state when idToken changes from value to null', async () => {
    mockCheckProUserStatus.mockResolvedValueOnce({
      success: true,
      isProUser: true,
    });

    const { result, rerender } = renderHook(
      ({ token }) => useProUserCheck(token),
      { initialProps: { token: 'test-token' as string | null } }
    );
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(true);
      expect(result.current.isProUser).toBe(true);
    });
    
    // Simulate user logout - token becomes null
    rerender({ token: null });
    
    await waitFor(() => {
      expect(result.current.hasChecked).toBe(false);
      expect(result.current.isProUser).toBe(false);
    });
  });
});
