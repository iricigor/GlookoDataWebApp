/**
 * Custom hook for managing the first-time login welcome dialog
 * 
 * This hook:
 * - Detects when a user logs in for the first time (no settings in Azure)
 * - Manages the welcome dialog state
 * - Creates initial user settings in Azure storage
 * 
 * Usage: Call this hook in App.tsx alongside useAuth and useSettingsSync
 */

import { useState, useCallback, useRef } from 'react';
import { saveUserSettings, type UserSettings } from '../services/userSettingsService';
import type { ThemeMode } from './useTheme';
import type { ExportFormat } from './useExportFormat';
import type { ResponseLanguage } from './useResponseLanguage';
import type { GlucoseThresholds } from '../types';

interface UseWelcomeDialogParams {
  userEmail: string | null;
  themeMode: ThemeMode;
  exportFormat: ExportFormat;
  responseLanguage: ResponseLanguage;
  glucoseThresholds: GlucoseThresholds;
  insulinDuration: number;
}

interface UseWelcomeDialogReturn {
  /** Whether the welcome dialog should be shown */
  showWelcomeDialog: boolean;
  /** Function to show the welcome dialog */
  triggerWelcomeDialog: () => void;
  /** Function to close the welcome dialog */
  closeWelcomeDialog: () => void;
  /** Function to create user settings in Azure */
  createUserSettings: () => Promise<boolean>;
}

/**
 * Hook to manage first-time login welcome dialog
 * 
 * @param params - User email and current settings
 * @returns Dialog state and control functions
 */
export function useWelcomeDialog(params: UseWelcomeDialogParams): UseWelcomeDialogReturn {
  const {
    userEmail,
    themeMode,
    exportFormat,
    responseLanguage,
    glucoseThresholds,
    insulinDuration,
  } = params;

  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  
  // Track if we've already shown the welcome dialog for this user
  const hasShownForUserRef = useRef<string | null>(null);

  const triggerWelcomeDialog = useCallback(() => {
    // Only show if we haven't shown it for this user yet
    if (userEmail && hasShownForUserRef.current !== userEmail) {
      setShowWelcomeDialog(true);
      hasShownForUserRef.current = userEmail;
    }
  }, [userEmail]);

  const closeWelcomeDialog = useCallback(() => {
    setShowWelcomeDialog(false);
  }, []);

  const createUserSettings = useCallback(async (): Promise<boolean> => {
    if (!userEmail) {
      return false;
    }

    try {
      const settings: UserSettings = {
        themeMode,
        exportFormat,
        responseLanguage,
        glucoseThresholds,
        insulinDuration,
      };

      const success = await saveUserSettings(userEmail, settings);
      return success;
    } catch (error) {
      console.error('Failed to create user settings:', error);
      return false;
    }
  }, [userEmail, themeMode, exportFormat, responseLanguage, glucoseThresholds, insulinDuration]);

  return {
    showWelcomeDialog,
    triggerWelcomeDialog,
    closeWelcomeDialog,
    createUserSettings,
  };
}
