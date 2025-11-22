/**
 * Custom hook for syncing user settings with Azure Table Storage
 * 
 * This hook manages automatic synchronization of settings for authenticated users:
 * - Loads settings from Azure when user logs in
 * - Saves settings to Azure when they change (debounced)
 * - Saves settings when user logs out
 * - Does nothing for anonymous users (settings stay in cookies)
 * 
 * This hook should be used in App.tsx alongside existing settings hooks.
 */

import { useEffect, useRef } from 'react';
import { loadUserSettings, saveUserSettings, isUserSettingsServiceAvailable } from '../services/userSettingsService';
import type { UserSettings } from '../services/userSettingsService';
import type { ThemeMode } from './useTheme';
import type { ExportFormat } from './useExportFormat';
import type { ResponseLanguage } from './useResponseLanguage';
import type { GlucoseThresholds } from '../types';

interface UseSettingsSyncParams {
  // Auth state
  isLoggedIn: boolean;
  userEmail: string | null;
  
  // Current settings values
  themeMode: ThemeMode;
  exportFormat: ExportFormat;
  responseLanguage: ResponseLanguage;
  glucoseThresholds: GlucoseThresholds;
  
  // Setters to update settings when loaded from Azure
  setThemeMode: (mode: ThemeMode) => void;
  setExportFormat: (format: ExportFormat) => void;
  setResponseLanguage: (language: ResponseLanguage) => void;
  setGlucoseThresholds: (thresholds: GlucoseThresholds) => void;
  
  // Optional callback when no settings are found (first-time login)
  onFirstTimeLogin?: () => void;
}

/**
 * Hook to automatically sync user settings with Azure Table Storage
 * 
 * @param params - Auth state, current settings, and setters
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isLoggedIn, userEmail } = useAuth();
 *   const { themeMode, setThemeMode } = useTheme();
 *   const { exportFormat, setExportFormat } = useExportFormat();
 *   const { responseLanguage, setResponseLanguage } = useResponseLanguage();
 *   const { thresholds, setThresholds } = useGlucoseThresholds();
 *   
 *   useSettingsSync({
 *     isLoggedIn,
 *     userEmail,
 *     themeMode,
 *     exportFormat,
 *     responseLanguage,
 *     glucoseThresholds: thresholds,
 *     setThemeMode,
 *     setExportFormat,
 *     setResponseLanguage,
 *     setGlucoseThresholds: setThresholds,
 *   });
 *   
 *   // ... rest of app
 * }
 * ```
 */
export function useSettingsSync(params: UseSettingsSyncParams): void {
  const {
    isLoggedIn,
    userEmail,
    themeMode,
    exportFormat,
    responseLanguage,
    glucoseThresholds,
    setThemeMode,
    setExportFormat,
    setResponseLanguage,
    setGlucoseThresholds,
    onFirstTimeLogin,
  } = params;
  
  // Track if Azure service is available
  const serviceAvailableRef = useRef<boolean | null>(null);
  
  // Track which user we've loaded settings for
  const loadedForUserRef = useRef<string | null>(null);
  
  // Track if we're currently loading to prevent duplicate loads
  const isLoadingRef = useRef(false);
  
  // Track previous login state to detect logout
  const prevLoggedInRef = useRef(isLoggedIn);
  
  // Track previous user email for logout save
  const prevUserEmailRef = useRef(userEmail);
  
  // Check if Azure service is available (once on mount)
  useEffect(() => {
    if (serviceAvailableRef.current === null) {
      isUserSettingsServiceAvailable().then((available) => {
        serviceAvailableRef.current = available;
        if (!available) {
          console.log('Azure settings sync not available (using local storage only)');
        }
      });
    }
  }, []);
  
  // Load settings when user logs in
  useEffect(() => {
    const serviceAvailable = serviceAvailableRef.current;
    
    // Only load if:
    // 1. User is logged in
    // 2. We have a user email
    // 3. Azure service check has completed and is available
    // 4. We haven't already loaded for this user
    // 5. We're not currently loading
    if (
      isLoggedIn && 
      userEmail && 
      serviceAvailable === true && 
      loadedForUserRef.current !== userEmail &&
      !isLoadingRef.current
    ) {
      isLoadingRef.current = true;
      
      console.log('Loading user settings from Azure...');
      loadUserSettings(userEmail)
        .then((settings) => {
          if (settings) {
            // Apply loaded settings
            setThemeMode(settings.themeMode);
            setExportFormat(settings.exportFormat);
            setResponseLanguage(settings.responseLanguage);
            setGlucoseThresholds(settings.glucoseThresholds);
            
            console.log('User settings loaded from Azure successfully');
          } else {
            console.log('No saved settings found in Azure, using current values');
            
            // This is a first-time login - trigger the callback if provided
            if (onFirstTimeLogin) {
              onFirstTimeLogin();
            }
          }
          
          // Mark this user as loaded
          loadedForUserRef.current = userEmail;
        })
        .catch((error) => {
          console.error('Failed to load user settings from Azure:', error);
        })
        .finally(() => {
          isLoadingRef.current = false;
        });
    }
  }, [isLoggedIn, userEmail, setThemeMode, setExportFormat, setResponseLanguage, setGlucoseThresholds, onFirstTimeLogin]);
  
  // Save settings to Azure when they change (debounced, for authenticated users only)
  useEffect(() => {
    const serviceAvailable = serviceAvailableRef.current;
    
    // Only save if:
    // 1. User is logged in
    // 2. We have a user email
    // 3. Azure service is available
    // 4. We've loaded settings for this user (don't save before initial load)
    // 5. We're not currently loading
    if (
      isLoggedIn && 
      userEmail && 
      serviceAvailable === true && 
      loadedForUserRef.current === userEmail &&
      !isLoadingRef.current
    ) {
      // Debounce saves to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        const settings: UserSettings = {
          themeMode,
          exportFormat,
          responseLanguage,
          glucoseThresholds,
        };
        
        saveUserSettings(userEmail, settings)
          .then((success) => {
            if (success) {
              console.log('User settings auto-saved to Azure');
            }
          })
          .catch((error) => {
            console.error('Failed to auto-save user settings:', error);
          });
      }, 2000);  // 2 second debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoggedIn, userEmail, themeMode, exportFormat, responseLanguage, glucoseThresholds]);
  
  // Save settings when user logs out
  useEffect(() => {
    const serviceAvailable = serviceAvailableRef.current;
    
    // Detect logout: was logged in, now not logged in
    if (prevLoggedInRef.current && !isLoggedIn && prevUserEmailRef.current && serviceAvailable === true) {
      const userEmailForSave = prevUserEmailRef.current;
      const settings: UserSettings = {
        themeMode,
        exportFormat,
        responseLanguage,
        glucoseThresholds,
      };
      
      console.log('User logged out, saving settings...');
      
      // Fire and forget - don't block logout
      saveUserSettings(userEmailForSave, settings)
        .then(() => console.log('Settings saved on logout'))
        .catch((error) => console.error('Failed to save settings on logout:', error));
      
      // Reset loaded state
      loadedForUserRef.current = null;
    }
    
    // Update refs for next comparison
    prevLoggedInRef.current = isLoggedIn;
    prevUserEmailRef.current = userEmail;
  }, [isLoggedIn, userEmail, themeMode, exportFormat, responseLanguage, glucoseThresholds]);
}
