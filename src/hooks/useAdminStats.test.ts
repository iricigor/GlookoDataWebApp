/**
 * Tests for useAdminStats hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminStats } from './useAdminStats';

// Mock the API client
vi.mock('../utils/api/adminStatsApi', () => ({
  getLoggedInUsersCount: vi.fn(),
}));

import { getLoggedInUsersCount } from '../utils/api/adminStatsApi';

const mockGetLoggedInUsersCount = vi.mocked(getLoggedInUsersCount);

describe('useAdminStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAdminStats());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasLoaded).toBe(false);
    expect(result.current.loggedInUsersCount).toBeNull();
    expect(result.current.hasError).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.errorType).toBeNull();
  });

  it('should auto-fetch when idToken is provided and shouldFetch is true', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: true,
      count: 42,
    });

    const { result } = renderHook(() => useAdminStats('test-token', true));
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.loggedInUsersCount).toBe(42);
      expect(result.current.hasError).toBe(false);
    });
    
    expect(mockGetLoggedInUsersCount).toHaveBeenCalledWith('test-token');
  });

  it('should not fetch when idToken is null', () => {
    const { result } = renderHook(() => useAdminStats(null, true));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasLoaded).toBe(false);
    expect(mockGetLoggedInUsersCount).not.toHaveBeenCalled();
  });

  it('should not fetch when shouldFetch is false', () => {
    const { result } = renderHook(() => useAdminStats('test-token', false));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasLoaded).toBe(false);
    expect(mockGetLoggedInUsersCount).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: false,
      error: 'Access denied',
      errorType: 'authorization',
    });

    const { result } = renderHook(() => useAdminStats('test-token', true));
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Access denied');
      expect(result.current.errorType).toBe('authorization');
    });
  });

  it('should handle unauthorized errors', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: false,
      error: 'Unauthorized access',
      errorType: 'unauthorized',
    });

    const { result } = renderHook(() => useAdminStats('invalid-token', true));
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorType).toBe('unauthorized');
    });
  });

  it('should handle infrastructure errors', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: false,
      error: 'Service unavailable',
      errorType: 'infrastructure',
    });

    const { result } = renderHook(() => useAdminStats('test-token', true));
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorType).toBe('infrastructure');
    });
  });

  it('should handle network errors', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: false,
      error: 'Network error',
      errorType: 'network',
    });

    const { result } = renderHook(() => useAdminStats('test-token', true));
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorType).toBe('network');
    });
  });

  it('should reset state when idToken becomes null', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: true,
      count: 42,
    });

    const { result, rerender } = renderHook(
      ({ token }) => useAdminStats(token, true),
      { initialProps: { token: 'test-token' } }
    );
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
    });

    // User logs out
    rerender({ token: null });
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(false);
      expect(result.current.loggedInUsersCount).toBeNull();
    });
  });

  it('should refetch when token changes', async () => {
    mockGetLoggedInUsersCount
      .mockResolvedValueOnce({ success: true, count: 42 })
      .mockResolvedValueOnce({ success: true, count: 100 });

    const { result, rerender } = renderHook(
      ({ token }) => useAdminStats(token, true),
      { initialProps: { token: 'token1' } }
    );
    
    await waitFor(() => {
      expect(result.current.loggedInUsersCount).toBe(42);
    });

    // Different user logs in
    rerender({ token: 'token2' });
    
    await waitFor(() => {
      expect(result.current.loggedInUsersCount).toBe(100);
    });

    expect(mockGetLoggedInUsersCount).toHaveBeenCalledTimes(2);
  });

  it('should not refetch with same token', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: true,
      count: 42,
    });

    const { result, rerender } = renderHook(
      ({ token }) => useAdminStats(token, true),
      { initialProps: { token: 'test-token' } }
    );
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
    });

    // Rerender with same token
    rerender({ token: 'test-token' });
    
    // Should not call API again
    expect(mockGetLoggedInUsersCount).toHaveBeenCalledTimes(1);
  });

  it('should handle unexpected errors in API call', async () => {
    mockGetLoggedInUsersCount.mockRejectedValueOnce(new Error('Unexpected error'));

    const { result } = renderHook(() => useAdminStats('test-token', true));
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Unexpected error');
      expect(result.current.errorType).toBe('unknown');
    });
  });

  it('should handle non-Error exceptions', async () => {
    mockGetLoggedInUsersCount.mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useAdminStats('test-token', true));
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Unexpected error occurred');
    });
  });

  it('should provide fetchStats function for manual fetching', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: true,
      count: 50,
    });

    const { result } = renderHook(() => useAdminStats(null, false));
    
    expect(result.current.hasLoaded).toBe(false);
    
    // Manually trigger fetch
    await result.current.fetchStats('manual-token');
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.loggedInUsersCount).toBe(50);
    });
  });

  it('should provide resetState function', async () => {
    mockGetLoggedInUsersCount.mockResolvedValueOnce({
      success: true,
      count: 42,
    });

    const { result } = renderHook(() => useAdminStats('test-token', true));
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(true);
    });

    // Reset the state
    result.current.resetState();
    
    await waitFor(() => {
      expect(result.current.hasLoaded).toBe(false);
      expect(result.current.loggedInUsersCount).toBeNull();
      expect(result.current.hasError).toBe(false);
    });
  });
});
