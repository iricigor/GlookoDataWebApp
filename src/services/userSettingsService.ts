/**
 * User Settings Service
 * 
 * This service handles saving and loading user settings to/from Azure Table Storage
 * via Azure Static Web Apps Data API.
 * 
 * For authenticated users, settings are stored in Azure Table Storage.
 * For anonymous users, settings remain in browser cookies (handled by individual hooks).
 */

export interface UserSettings {
  themeMode: 'light' | 'dark' | 'system';
  exportFormat: 'csv' | 'tsv';
  responseLanguage: 'english' | 'czech' | 'german' | 'serbian';
  glucoseThresholds: {
    veryHigh: number;
    high: number;
    low: number;
    veryLow: number;
  };
  insulinDuration?: number;  // Optional: Insulin duration in hours (default 5)
}

export interface UserSettingsResponse {
  PartitionKey: string;  // User email
  RowKey: string;  // Always "settings"
  ThemeMode: string;
  ExportFormat: string;
  ResponseLanguage: string;
  GlucoseThresholds: string;  // JSON string
  InsulinDuration?: string;  // Insulin duration in hours
  Timestamp?: string;
}

/**
 * Load user settings from Azure Table Storage
 * 
 * @param userEmail - Email of the authenticated user
 * @returns User settings or null if not found
 */
export async function loadUserSettings(userEmail: string): Promise<UserSettings | null> {
  try {
    // Call Static Web App Data API
    const response = await fetch(`/api/data/UserSettings?$filter=PartitionKey eq '${userEmail}' and RowKey eq 'settings'`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // Include authentication cookies
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No settings found for this user
        return null;
      }
      throw new Error(`Failed to load settings: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Data API Builder returns a value array
    if (!data.value || data.value.length === 0) {
      return null;
    }

    const settingsData: UserSettingsResponse = data.value[0];

    // Parse the settings
    const settings: UserSettings = {
      themeMode: (settingsData.ThemeMode as UserSettings['themeMode']) || 'system',
      exportFormat: (settingsData.ExportFormat as UserSettings['exportFormat']) || 'csv',
      responseLanguage: (settingsData.ResponseLanguage as UserSettings['responseLanguage']) || 'english',
      glucoseThresholds: settingsData.GlucoseThresholds 
        ? JSON.parse(settingsData.GlucoseThresholds)
        : { veryHigh: 13.9, high: 10.0, low: 3.9, veryLow: 3.0 },
      insulinDuration: settingsData.InsulinDuration ? parseFloat(settingsData.InsulinDuration) : 5,
    };

    return settings;
  } catch (error) {
    console.error('Error loading user settings:', error);
    return null;
  }
}

/**
 * Save user settings to Azure Table Storage
 * 
 * @param userEmail - Email of the authenticated user
 * @param settings - Settings to save
 * @returns true if successful, false otherwise
 */
export async function saveUserSettings(userEmail: string, settings: UserSettings): Promise<boolean> {
  try {
    const payload: UserSettingsResponse = {
      PartitionKey: userEmail,
      RowKey: 'settings',
      ThemeMode: settings.themeMode,
      ExportFormat: settings.exportFormat,
      ResponseLanguage: settings.responseLanguage,
      GlucoseThresholds: JSON.stringify(settings.glucoseThresholds),
      InsulinDuration: settings.insulinDuration?.toString(),
    };

    // Use PUT to upsert (create or update)
    const response = await fetch('/api/data/UserSettings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // Include authentication cookies
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving user settings:', error);
    return false;
  }
}

/**
 * Check if user settings service is available
 * This is useful for detecting if we're in a development environment without Azure
 * 
 * @returns true if service is available, false otherwise
 */
export async function isUserSettingsServiceAvailable(): Promise<boolean> {
  try {
    // Try a simple health check - attempt to access the API
    const response = await fetch('/api/data/UserSettings?$top=0', {
      method: 'GET',
      credentials: 'include',
    });
    
    // If we get a response (even if empty), service is available
    return response.ok || response.status === 401;  // 401 means auth works, just not logged in
  } catch {
    // Service not available (probably local development without SWA CLI)
    return false;
  }
}
