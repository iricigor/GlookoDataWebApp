/**
 * Custom hook for managing user settings cloud sync
 * 
 * This hook manages the synchronization of user settings between
 * local storage (cookies) and cloud storage (Azure Table Storage).
 * 
 * It provides:
 * - Loading settings from cloud on login
 * - Saving settings to cloud when changed
 * - Saving settings to cloud before logout
 * - Sync status indicator for UI feedback
 */

import { useState, useCallback, useRef } from 'react';
import { 
  saveUserSettings, 
  loadUserSettings,
  type SaveSettingsResult,
  type LoadSettingsResult,
} from '../utils/api/userSettingsApi';
import type { CloudUserSettings } from '../types';

/** Time in ms to show success status before returning to idle */
const SUCCESS_STATUS_DURATION_MS = 2000;

/**
 * Sync status for UI feedback
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Return type for the useUserSettings hook
 */
export interface UseUserSettingsReturn {
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Whether sync is currently in progress */
  isSyncing: boolean;
  /** Error message if sync failed */
  syncError: string | null;
  /** Save settings to cloud (async) */
  saveSettings: (settings: CloudUserSettings) => Promise<SaveSettingsResult>;
  /** Load settings from cloud */
  loadSettings: () => Promise<LoadSettingsResult>;
  /** Save settings and wait for completion (for logout) */
  saveSettingsSync: (settings: CloudUserSettings) => Promise<SaveSettingsResult>;
  /** Clear sync error */
  clearSyncError: () => void;
}

/**
 * Hook for managing user settings cloud sync
 * 
 * @param idToken - The ID token from MSAL authentication
 * @param userEmail - The user's email address
 * @returns Sync state and functions for managing settings
 */
export function useUserSettings(
  idToken: string | null,
  userEmail: string | null
): UseUserSettingsReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Use a ref to track pending save operations
  const pendingSaveRef = useRef<Promise<SaveSettingsResult> | null>(null);

  /**
   * Save settings to cloud asynchronously (fire and forget)
   * Multiple rapid calls are debounced - only the last settings are saved
   */
  const saveSettings = useCallback(async (settings: CloudUserSettings): Promise<SaveSettingsResult> => {
    if (!idToken || !userEmail) {
      return {
        success: false,
        error: 'Not authenticated',
        errorType: 'unauthorized',
      };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    const savePromise = saveUserSettings(idToken, settings, userEmail);
    pendingSaveRef.current = savePromise;

    try {
      const result = await savePromise;
      
      // Only update status if this is still the latest save operation
      if (pendingSaveRef.current === savePromise) {
        if (result.success) {
          setSyncStatus('success');
          // Reset to idle after a short delay
          setTimeout(() => {
            setSyncStatus(prev => prev === 'success' ? 'idle' : prev);
          }, SUCCESS_STATUS_DURATION_MS);
        } else {
          setSyncStatus('error');
          setSyncError(result.error || 'Failed to save settings');
        }
      }
      
      return result;
    } catch (error) {
      if (pendingSaveRef.current === savePromise) {
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'Unknown error');
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'unknown',
      };
    }
  }, [idToken, userEmail]);

  /**
   * Save settings and wait for completion (used before logout)
   */
  const saveSettingsSync = useCallback(async (settings: CloudUserSettings): Promise<SaveSettingsResult> => {
    if (!idToken || !userEmail) {
      return {
        success: false,
        error: 'Not authenticated',
        errorType: 'unauthorized',
      };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const result = await saveUserSettings(idToken, settings, userEmail);
      
      if (result.success) {
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
        setSyncError(result.error || 'Failed to save settings');
      }
      
      return result;
    } catch (error) {
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'unknown',
      };
    }
  }, [idToken, userEmail]);

  /**
   * Load settings from cloud
   */
  const loadSettings = useCallback(async (): Promise<LoadSettingsResult> => {
    if (!idToken) {
      return {
        success: false,
        error: 'Not authenticated',
        errorType: 'unauthorized',
      };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const result = await loadUserSettings(idToken);
      
      if (result.success) {
        setSyncStatus('idle');
      } else {
        setSyncStatus('error');
        setSyncError(result.error || 'Failed to load settings');
      }
      
      return result;
    } catch (error) {
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'unknown',
      };
    }
  }, [idToken]);

  /**
   * Clear sync error
   */
  const clearSyncError = useCallback(() => {
    setSyncError(null);
    setSyncStatus('idle');
  }, []);

  return {
    syncStatus,
    isSyncing: syncStatus === 'syncing',
    syncError,
    saveSettings,
    loadSettings,
    saveSettingsSync,
    clearSyncError,
  };
}
