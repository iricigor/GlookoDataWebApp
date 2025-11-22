import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWelcomeDialog } from './useWelcomeDialog';
import * as userSettingsService from '../services/userSettingsService';

// Mock the userSettingsService
vi.mock('../services/userSettingsService', () => ({
  saveUserSettings: vi.fn(),
}));

describe('useWelcomeDialog', () => {
  const mockParams = {
    userEmail: 'test@example.com',
    themeMode: 'light' as const,
    exportFormat: 'csv' as const,
    responseLanguage: 'english' as const,
    glucoseThresholds: {
      veryHigh: 13.9,
      high: 10.0,
      low: 3.9,
      veryLow: 3.0,
    },
    insulinDuration: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with dialog hidden', () => {
    const { result } = renderHook(() => useWelcomeDialog(mockParams));
    
    expect(result.current.showWelcomeDialog).toBe(false);
  });

  it('should show dialog when triggerWelcomeDialog is called', async () => {
    const { result } = renderHook(() => useWelcomeDialog(mockParams));
    
    result.current.triggerWelcomeDialog();
    
    await waitFor(() => {
      expect(result.current.showWelcomeDialog).toBe(true);
    });
  });

  it('should hide dialog when closeWelcomeDialog is called', async () => {
    const { result } = renderHook(() => useWelcomeDialog(mockParams));
    
    result.current.triggerWelcomeDialog();
    await waitFor(() => {
      expect(result.current.showWelcomeDialog).toBe(true);
    });
    
    result.current.closeWelcomeDialog();
    await waitFor(() => {
      expect(result.current.showWelcomeDialog).toBe(false);
    });
  });

  it('should only show dialog once per user', async () => {
    const { result } = renderHook(() => useWelcomeDialog(mockParams));
    
    result.current.triggerWelcomeDialog();
    await waitFor(() => {
      expect(result.current.showWelcomeDialog).toBe(true);
    });
    
    result.current.closeWelcomeDialog();
    await waitFor(() => {
      expect(result.current.showWelcomeDialog).toBe(false);
    });
    
    // Try to trigger again
    result.current.triggerWelcomeDialog();
    await waitFor(() => {
      expect(result.current.showWelcomeDialog).toBe(false);
    });
  });

  it('should reset when user changes', async () => {
    const { result, rerender } = renderHook(
      (props) => useWelcomeDialog(props),
      { initialProps: mockParams }
    );
    
    result.current.triggerWelcomeDialog();
    await waitFor(() => {
      expect(result.current.showWelcomeDialog).toBe(true);
    });
    
    result.current.closeWelcomeDialog();
    
    // Change user
    rerender({ ...mockParams, userEmail: 'different@example.com' });
    
    // Should be able to trigger for new user
    result.current.triggerWelcomeDialog();
    await waitFor(() => {
      expect(result.current.showWelcomeDialog).toBe(true);
    });
  });

  it('should not trigger when userEmail is null', () => {
    const { result } = renderHook(() => 
      useWelcomeDialog({ ...mockParams, userEmail: null })
    );
    
    result.current.triggerWelcomeDialog();
    expect(result.current.showWelcomeDialog).toBe(false);
  });

  it('should create user settings successfully', async () => {
    vi.mocked(userSettingsService.saveUserSettings).mockResolvedValue(true);
    
    const { result } = renderHook(() => useWelcomeDialog(mockParams));
    
    const success = await result.current.createUserSettings();
    
    expect(success).toBe(true);
    expect(userSettingsService.saveUserSettings).toHaveBeenCalledWith(
      mockParams.userEmail,
      {
        themeMode: mockParams.themeMode,
        exportFormat: mockParams.exportFormat,
        responseLanguage: mockParams.responseLanguage,
        glucoseThresholds: mockParams.glucoseThresholds,
        insulinDuration: mockParams.insulinDuration,
      }
    );
  });

  it('should handle creation failure', async () => {
    vi.mocked(userSettingsService.saveUserSettings).mockResolvedValue(false);
    
    const { result } = renderHook(() => useWelcomeDialog(mockParams));
    
    const success = await result.current.createUserSettings();
    
    expect(success).toBe(false);
  });

  it('should handle creation error', async () => {
    vi.mocked(userSettingsService.saveUserSettings).mockRejectedValue(
      new Error('Network error')
    );
    
    const { result } = renderHook(() => useWelcomeDialog(mockParams));
    
    const success = await result.current.createUserSettings();
    
    expect(success).toBe(false);
  });

  it('should return false when userEmail is null', async () => {
    const { result } = renderHook(() => 
      useWelcomeDialog({ ...mockParams, userEmail: null })
    );
    
    const success = await result.current.createUserSettings();
    
    expect(success).toBe(false);
    expect(userSettingsService.saveUserSettings).not.toHaveBeenCalled();
  });
});
