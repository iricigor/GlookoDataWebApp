/**
 * Tests for useUserSettings hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserSettings } from './useUserSettings';
import * as userSettingsApi from '../utils/api/userSettingsApi';
import type { CloudUserSettings } from '../types';

// Mock the API module
vi.mock('../utils/api/userSettingsApi');

const mockSettings: CloudUserSettings = {
  themeMode: 'dark',
  exportFormat: 'csv',
  responseLanguage: 'english',
  glucoseUnit: 'mmol/L',
  insulinDuration: 5,
  glucoseThresholds: {
    veryHigh: 13.9,
    high: 10.0,
    low: 3.9,
    veryLow: 3.0,
  },
};

describe('useUserSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with idle sync status', () => {
    const { result } = renderHook(() => useUserSettings(null, null, null));
    
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.syncError).toBeNull();
  });

  it('should return unauthorized error when saving without token', async () => {
    const { result } = renderHook(() => useUserSettings(null, null, null));
    
    let saveResult: userSettingsApi.SaveSettingsResult | undefined;
    await act(async () => {
      saveResult = await result.current.saveSettings(mockSettings);
    });
    
    expect(saveResult).toEqual({
      success: false,
      error: 'Not authenticated',
      errorType: 'unauthorized',
    });
  });

  it('should return unauthorized error when saving without email', async () => {
    const { result } = renderHook(() => useUserSettings('valid-token', null, null));
    
    let saveResult: userSettingsApi.SaveSettingsResult | undefined;
    await act(async () => {
      saveResult = await result.current.saveSettings(mockSettings);
    });
    
    expect(saveResult).toEqual({
      success: false,
      error: 'Not authenticated',
      errorType: 'unauthorized',
    });
  });

  it('should save settings successfully', async () => {
    vi.mocked(userSettingsApi.saveUserSettings).mockResolvedValueOnce({
      success: true,
    });

    const { result } = renderHook(() => useUserSettings('valid-token', 'test@example.com', 'Microsoft'));
    
    let saveResult: userSettingsApi.SaveSettingsResult | undefined;
    await act(async () => {
      saveResult = await result.current.saveSettings(mockSettings);
    });
    
    expect(saveResult).toEqual({ success: true });
    expect(userSettingsApi.saveUserSettings).toHaveBeenCalledWith(
      'valid-token',
      mockSettings,
      'test@example.com'
    );
    
    // Status should transition to success
    await waitFor(() => {
      expect(result.current.syncStatus).toBe('success');
    });
  });

  it('should set error status on save failure', async () => {
    vi.mocked(userSettingsApi.saveUserSettings).mockResolvedValueOnce({
      success: false,
      error: 'Save failed',
      errorType: 'infrastructure',
    });

    const { result } = renderHook(() => useUserSettings('valid-token', 'test@example.com', 'Microsoft'));
    
    await act(async () => {
      await result.current.saveSettings(mockSettings);
    });
    
    expect(result.current.syncStatus).toBe('error');
    expect(result.current.syncError).toBe('Save failed');
  });

  it('should return unauthorized error when loading without token', async () => {
    const { result } = renderHook(() => useUserSettings(null, null, null));
    
    let loadResult: userSettingsApi.LoadSettingsResult | undefined;
    await act(async () => {
      loadResult = await result.current.loadSettings();
    });
    
    expect(loadResult).toEqual({
      success: false,
      error: 'Not authenticated',
      errorType: 'unauthorized',
    });
  });

  it('should load settings successfully', async () => {
    vi.mocked(userSettingsApi.loadUserSettings).mockResolvedValueOnce({
      success: true,
      settings: mockSettings,
    });

    const { result } = renderHook(() => useUserSettings('valid-token', 'test@example.com', 'Microsoft'));
    
    let loadResult: userSettingsApi.LoadSettingsResult | undefined;
    await act(async () => {
      loadResult = await result.current.loadSettings();
    });
    
    expect(loadResult).toEqual({
      success: true,
      settings: mockSettings,
    });
    expect(userSettingsApi.loadUserSettings).toHaveBeenCalledWith('valid-token');
    expect(result.current.syncStatus).toBe('idle');
  });

  it('should set error status on load failure', async () => {
    vi.mocked(userSettingsApi.loadUserSettings).mockResolvedValueOnce({
      success: false,
      error: 'Load failed',
      errorType: 'infrastructure',
    });

    const { result } = renderHook(() => useUserSettings('valid-token', 'test@example.com', 'Microsoft'));
    
    await act(async () => {
      await result.current.loadSettings();
    });
    
    expect(result.current.syncStatus).toBe('error');
    expect(result.current.syncError).toBe('Load failed');
  });

  it('should save settings synchronously before logout', async () => {
    vi.mocked(userSettingsApi.saveUserSettings).mockResolvedValueOnce({
      success: true,
    });

    const { result } = renderHook(() => useUserSettings('valid-token', 'test@example.com', 'Microsoft'));
    
    let saveResult: userSettingsApi.SaveSettingsResult | undefined;
    await act(async () => {
      saveResult = await result.current.saveSettingsSync(mockSettings);
    });
    
    expect(saveResult).toEqual({ success: true });
    expect(result.current.syncStatus).toBe('success');
  });

  it('should clear sync error', () => {
    const { result } = renderHook(() => useUserSettings('valid-token', 'test@example.com', 'Microsoft'));
    
    // First trigger an error by mocking a failed save
    act(() => {
      result.current.clearSyncError();
    });
    
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.syncError).toBeNull();
  });

  it('should set isSyncing to true when syncing', async () => {
    // Create a delayed promise to test syncing state
    let resolvePromise: (value: userSettingsApi.LoadSettingsResult) => void;
    const delayedPromise = new Promise<userSettingsApi.LoadSettingsResult>((resolve) => {
      resolvePromise = resolve;
    });
    
    vi.mocked(userSettingsApi.loadUserSettings).mockReturnValueOnce(delayedPromise);

    const { result } = renderHook(() => useUserSettings('valid-token', 'test@example.com', 'Microsoft'));
    
    // Start loading
    act(() => {
      result.current.loadSettings();
    });
    
    // Should be syncing
    expect(result.current.isSyncing).toBe(true);
    expect(result.current.syncStatus).toBe('syncing');
    
    // Resolve the promise
    await act(async () => {
      resolvePromise!({ success: true, settings: mockSettings });
    });
    
    // Should no longer be syncing
    expect(result.current.isSyncing).toBe(false);
  });
});
