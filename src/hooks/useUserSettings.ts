/**
 * Custom hook for managing user settings with Azure Table Storage sync
 * 
 * This hook provides a unified interface for managing user settings that:
 * - For authenticated users: Syncs with Azure Table Storage
 * - For anonymous users: Uses browser cookies (existing behavior)
 * - Automatically loads settings on login
 * - Automatically saves settings on logout and when they change
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useTheme, type ThemeMode } from './useTheme';
import { useExportFormat, type ExportFormat } from './useExportFormat';
import { useGlucoseThresholds } from './useGlucoseThresholds';
import { loadUserSettings, saveUserSettings, isUserSettingsServiceAvailable } from '../services/userSettingsService';
import type { UserSettings } from '../services/userSettingsService';
import type { GlucoseThresholds } from '../types';

export interface UseUserSettingsReturn {
  // Theme
  themeMode: ThemeMode;
  theme: ReturnType<typeof useTheme>['theme'];
  setThemeMode: (mode: ThemeMode) => void;
  
  // Export format
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  
  // Glucose thresholds
  glucoseThresholds: GlucoseThresholds;
  updateGlucoseThreshold: (key: keyof GlucoseThresholds, value: number) => void;
  isThresholdsValid: boolean;
  
  // Sync status
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

/**
 * Hook to manage user settings with Azure sync for authenticated users
 */
export function useUserSettings(): UseUserSettingsReturn {
  // Get auth state
  const { isLoggedIn, userEmail } = useAuth();
  
  // Get individual setting hooks (these handle cookie storage)
  const { themeMode, theme, setThemeMode: setThemeModeLocal } = useTheme();
  const { exportFormat, setExportFormat: setExportFormatLocal } = useExportFormat();
  const { 
    thresholds: glucoseThresholds, 
    updateThreshold: updateGlucoseThresholdLocal,
    isValid: isThresholdsValid,
  } = useGlucoseThresholds();
  
  // Track sync status
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  
  // Track if we've loaded settings for the current user
  const loadedForUserRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  
  // Check if Azure service is available on mount
  useEffect(() => {
    isUserSettingsServiceAvailable().then(setServiceAvailable);
  }, []);
  
  // Load settings when user logs in
  useEffect(() => {
    // Only load if:
    // 1. User is logged in
    // 2. We have a user email
    // 3. Azure service is available
    // 4. We haven't already loaded for this user
    // 5. We're not currently loading
    if (
      isLoggedIn && 
      userEmail && 
      serviceAvailable && 
      loadedForUserRef.current !== userEmail &&
      !isLoadingRef.current
    ) {
      isLoadingRef.current = true;
      setIsSyncing(true);
      
      loadUserSettings(userEmail)
        .then((settings) => {
          if (settings) {
            // Apply loaded settings
            setThemeModeLocal(settings.themeMode);
            setExportFormatLocal(settings.exportFormat);
            
            // Apply glucose thresholds
            Object.entries(settings.glucoseThresholds).forEach(([key, value]) => {
              updateGlucoseThresholdLocal(key as keyof GlucoseThresholds, value);
            });
            
            console.log('User settings loaded from Azure');
          } else {
            console.log('No saved settings found for user, using defaults');
          }
          
          loadedForUserRef.current = userEmail;
          setLastSyncTime(new Date());
        })
        .catch((error) => {
          console.error('Failed to load user settings:', error);
        })
        .finally(() => {
          setIsSyncing(false);
          isLoadingRef.current = false;
        });
    }
  }, [
    isLoggedIn, 
    userEmail, 
    serviceAvailable,
    setThemeModeLocal,
    setExportFormatLocal,
    updateGlucoseThresholdLocal,
  ]);
  
  // Save settings to Azure when they change (for authenticated users)
  useEffect(() => {
    // Only save if:
    // 1. User is logged in
    // 2. We have a user email
    // 3. Azure service is available
    // 4. We've already loaded settings for this user (don't save before loading)
    if (
      isLoggedIn && 
      userEmail && 
      serviceAvailable && 
      loadedForUserRef.current === userEmail &&
      !isLoadingRef.current
    ) {
      // Debounce saves to avoid too many requests
      const timeoutId = setTimeout(() => {
        const settings: UserSettings = {
          themeMode,
          exportFormat,
          glucoseThresholds,
        };
        
        setIsSyncing(true);
        saveUserSettings(userEmail, settings)
          .then((success) => {
            if (success) {
              setLastSyncTime(new Date());
              console.log('User settings saved to Azure');
            }
          })
          .catch((error) => {
            console.error('Failed to save user settings:', error);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      }, 1000);  // 1 second debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    isLoggedIn,
    userEmail,
    serviceAvailable,
    themeMode,
    exportFormat,
    glucoseThresholds,
  ]);
  
  // Save settings when user logs out
  useEffect(() => {
    // This effect handles the logout case
    // When isLoggedIn changes from true to false, save settings
    const prevLoggedInRef = { current: isLoggedIn };
    
    return () => {
      // On unmount or before next effect, check if we just logged out
      if (prevLoggedInRef.current && !isLoggedIn && userEmail && serviceAvailable) {
        // User just logged out, save settings
        const settings: UserSettings = {
          themeMode,
          exportFormat,
          glucoseThresholds,
        };
        
        // Fire and forget - don't wait for response
        saveUserSettings(userEmail, settings)
          .then(() => console.log('Settings saved on logout'))
          .catch((error) => console.error('Failed to save settings on logout:', error));
        
        // Reset loaded state
        loadedForUserRef.current = null;
      }
      
      prevLoggedInRef.current = isLoggedIn;
    };
  }, [isLoggedIn, userEmail, serviceAvailable, themeMode, exportFormat, glucoseThresholds]);
  
  // Wrapped setters that work with both local and remote storage
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeLocal(mode);
    // Auto-save handled by useEffect above
  }, [setThemeModeLocal]);
  
  const setExportFormat = useCallback((format: ExportFormat) => {
    setExportFormatLocal(format);
    // Auto-save handled by useEffect above
  }, [setExportFormatLocal]);
  
  const updateGlucoseThreshold = useCallback((key: keyof GlucoseThresholds, value: number) => {
    updateGlucoseThresholdLocal(key, value);
    // Auto-save handled by useEffect above
  }, [updateGlucoseThresholdLocal]);
  
  return {
    themeMode,
    theme,
    setThemeMode,
    exportFormat,
    setExportFormat,
    glucoseThresholds,
    updateGlucoseThreshold,
    isThresholdsValid,
    isSyncing,
    lastSyncTime,
  };
}
