# Developer Guide: User Settings System

This guide explains how the user settings system works and how to extend it.

## Architecture Overview

The user settings system provides automatic synchronization of user preferences between browser storage and Azure Table Storage for authenticated users.

### Components

```
┌─────────────────────────────────────────────────────────┐
│                        App.tsx                          │
│  - Initializes all hooks                                │
│  - Passes settings to components                        │
└────────────┬────────────────────────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
┌────▼─────┐    ┌────▼──────────┐
│ useAuth  │    │ Settings Hooks │
│          │    │ - useTheme     │
│ Provides │    │ - useExportFmt │
│ login    │    │ - useGlucose   │
│ state    │    │   Thresholds   │
└────┬─────┘    └────┬───────────┘
     │               │
     │  ┌────────────▼────────────┐
     │  │ Individual hooks manage │
     │  │ cookie storage          │
     │  └─────────────────────────┘
     │
┌────▼──────────────────────────┐
│   useSettingsSync              │
│                                │
│ - Monitors auth state          │
│ - Loads from Azure on login    │
│ - Saves to Azure on change     │
│ - Saves to Azure on logout     │
└────┬───────────────────────────┘
     │
┌────▼──────────────────────────┐
│  userSettingsService           │
│                                │
│ - loadUserSettings()           │
│ - saveUserSettings()           │
│ - isServiceAvailable()         │
└────┬───────────────────────────┘
     │
┌────▼──────────────────────────┐
│  Azure Static Web Apps         │
│  Data API Builder              │
│                                │
│  /api/data/UserSettings        │
└────┬───────────────────────────┘
     │
┌────▼──────────────────────────┐
│  Azure Table Storage           │
│                                │
│  Table: UserSettings           │
│  PartitionKey: user@email.com  │
│  RowKey: "settings"            │
└────────────────────────────────┘
```

## Key Concepts

### 1. Dual Storage Strategy

**For Anonymous Users:**
- Settings stored in browser cookies
- Managed by individual hooks (useTheme, useExportFormat, useGlucoseThresholds)
- No Azure interaction

**For Authenticated Users:**
- Settings loaded from Azure Table Storage on login
- Changes automatically saved to Azure (debounced)
- Settings also remain in cookies for offline access
- Azure becomes the source of truth

### 2. Zero Breaking Changes

The system is designed to work transparently:
- Existing hooks (`useTheme`, `useExportFormat`, `useGlucoseThresholds`) unchanged
- New `useSettingsSync` hook added alongside existing hooks
- No changes required to components that use settings
- Works without Azure deployment (falls back to cookies)

### 3. Automatic Synchronization

The `useSettingsSync` hook handles all sync operations:
- **On Login**: Load settings from Azure
- **On Change**: Save to Azure after 2-second debounce
- **On Logout**: Immediate save to Azure
- **Service Check**: Automatically detects if Azure is available

## Adding a New Setting

To add a new setting that should be synchronized:

### Step 1: Create the Hook

Create a new hook for your setting (e.g., `useNewSetting.ts`):

```typescript
import { useState, useCallback } from 'react';

export type NewSettingType = 'option1' | 'option2';

const COOKIE_NAME = 'glooko-new-setting';
const COOKIE_EXPIRY_DAYS = 365;

function getFromCookie(): NewSettingType | null {
  // Implementation similar to other hooks
}

function saveToCookie(value: NewSettingType): void {
  // Implementation similar to other hooks
}

export function useNewSetting() {
  const [value, setValue] = useState<NewSettingType>(() => {
    return getFromCookie() ?? 'option1';
  });

  const setSetting = useCallback((newValue: NewSettingType) => {
    setValue(newValue);
    saveToCookie(newValue);
  }, []);

  return { value, setSetting };
}
```

### Step 2: Update the Service Interface

Add the new setting to `UserSettings` interface in `userSettingsService.ts`:

```typescript
export interface UserSettings {
  themeMode: 'light' | 'dark' | 'system';
  exportFormat: 'csv' | 'tsv';
  glucoseThresholds: {
    veryHigh: number;
    high: number;
    low: number;
    veryLow: number;
  };
  newSetting: NewSettingType;  // Add this
}
```

Update the `UserSettingsResponse` interface:

```typescript
export interface UserSettingsResponse {
  PartitionKey: string;
  RowKey: string;
  ThemeMode: string;
  ExportFormat: string;
  GlucoseThresholds: string;
  NewSetting: string;  // Add this
  Timestamp?: string;
}
```

Update `loadUserSettings()`:

```typescript
const settings: UserSettings = {
  themeMode: (settingsData.ThemeMode as UserSettings['themeMode']) || 'system',
  exportFormat: (settingsData.ExportFormat as UserSettings['exportFormat']) || 'csv',
  glucoseThresholds: settingsData.GlucoseThresholds 
    ? JSON.parse(settingsData.GlucoseThresholds)
    : { veryHigh: 13.9, high: 10.0, low: 3.9, veryLow: 3.0 },
  newSetting: (settingsData.NewSetting as NewSettingType) || 'option1',  // Add this
};
```

Update `saveUserSettings()`:

```typescript
const payload: UserSettingsResponse = {
  PartitionKey: userEmail,
  RowKey: 'settings',
  ThemeMode: settings.themeMode,
  ExportFormat: settings.exportFormat,
  GlucoseThresholds: JSON.stringify(settings.glucoseThresholds),
  NewSetting: settings.newSetting,  // Add this
};
```

### Step 3: Update useSettingsSync

Add parameters to `UseSettingsSyncParams` interface:

```typescript
interface UseSettingsSyncParams {
  isLoggedIn: boolean;
  userEmail: string | null;
  themeMode: ThemeMode;
  exportFormat: ExportFormat;
  glucoseThresholds: GlucoseThresholds;
  newSetting: NewSettingType;  // Add this
  setThemeMode: (mode: ThemeMode) => void;
  setExportFormat: (format: ExportFormat) => void;
  setGlucoseThresholds: (thresholds: GlucoseThresholds) => void;
  setNewSetting: (value: NewSettingType) => void;  // Add this
}
```

Update the load effect:

```typescript
loadUserSettings(userEmail)
  .then((settings) => {
    if (settings) {
      setThemeMode(settings.themeMode);
      setExportFormat(settings.exportFormat);
      setGlucoseThresholds(settings.glucoseThresholds);
      setNewSetting(settings.newSetting);  // Add this
      // ...
    }
  })
```

Update the save effect dependencies:

```typescript
useEffect(() => {
  // ... save logic
  const settings: UserSettings = {
    themeMode,
    exportFormat,
    glucoseThresholds,
    newSetting,  // Add this
  };
  // ... rest of save logic
}, [isLoggedIn, userEmail, themeMode, exportFormat, glucoseThresholds, newSetting]);  // Add to deps
```

### Step 4: Integrate in App.tsx

```typescript
function App() {
  // ... existing code
  
  // Add your new hook
  const { value: newSetting, setSetting: setNewSetting } = useNewSetting();
  
  // Add to settings sync
  useSettingsSync({
    isLoggedIn,
    userEmail,
    themeMode,
    exportFormat,
    glucoseThresholds,
    newSetting,  // Add this
    setThemeMode,
    setExportFormat,
    setGlucoseThresholds,
    setNewSetting,  // Add this
  });
  
  // ... rest of app
}
```

### Step 5: Write Tests

Add tests for your new setting in `userSettingsService.test.ts`:

```typescript
it('should load new setting successfully', async () => {
  const mockResponse = {
    value: [
      {
        // ... other fields
        NewSetting: 'option2',
      },
    ],
  };

  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  const settings = await loadUserSettings('user@example.com');

  expect(settings?.newSetting).toBe('option2');
});
```

## Testing

### Unit Tests

Run the service tests:
```bash
npm test -- --run src/services/userSettingsService.test.ts
```

### Integration Testing

Test the complete flow:

1. **Without Azure (Local Development)**:
   ```bash
   npm run dev
   ```
   - Settings should work with cookies only
   - No Azure errors in console

2. **With Azure (Production)**:
   - Deploy to Azure Static Web Apps
   - Log in with Microsoft account
   - Change settings
   - Log out and log back in
   - Verify settings persisted

### Manual Testing Checklist

- [ ] Anonymous user can change settings
- [ ] Settings persist in cookies for anonymous user
- [ ] User can log in with Microsoft account
- [ ] Settings load from Azure on login
- [ ] Settings save to Azure when changed
- [ ] Settings save to Azure on logout
- [ ] Settings sync across devices
- [ ] No errors in browser console
- [ ] Works offline (falls back to cookies)

## Debugging

### Enable Verbose Logging

The sync system includes console logging. Look for:
- `"Loading user settings from Azure..."`
- `"User settings loaded from Azure successfully"`
- `"User settings auto-saved to Azure"`
- `"User logged out, saving settings..."`

### Common Issues

**Settings not loading:**
1. Check if user is authenticated (`isLoggedIn === true`)
2. Verify `userEmail` is available
3. Check browser console for errors
4. Verify Azure Table Storage is deployed
5. Check `staticwebapp.config.json` is deployed

**Settings not saving:**
1. Check if debounce period has passed (2 seconds)
2. Verify network requests in browser DevTools
3. Check Azure Table Storage logs
4. Verify CORS settings in Azure

**Service not available:**
1. Check if running locally without SWA CLI
2. Verify `/api/data/UserSettings` endpoint exists
3. Check Azure Static Web App deployment
4. Review `staticwebapp.config.json` configuration

## Best Practices

### 1. Keep Settings Lightweight

Only sync essential preferences. Don't sync:
- ❌ Large data sets
- ❌ Uploaded files
- ❌ API keys or secrets
- ❌ Temporary UI state
- ✅ User preferences (theme, format, thresholds)
- ✅ Small configuration values
- ✅ User-specific settings

### 2. Use Proper Types

Always define TypeScript interfaces for new settings:
```typescript
// Good
type MySettingType = 'option1' | 'option2' | 'option3';

// Bad
type MySettingType = string;
```

### 3. Provide Defaults

Always provide sensible defaults:
```typescript
const defaultValue: MySettingType = 'option1';
return getFromCookie() ?? defaultValue;
```

### 4. Handle Errors Gracefully

Sync failures should not break the app:
```typescript
try {
  await saveUserSettings(userEmail, settings);
} catch (error) {
  console.error('Failed to save settings:', error);
  // App continues to work with local settings
}
```

### 5. Test Both Modes

Always test:
- Anonymous user experience (cookies only)
- Authenticated user experience (Azure sync)
- Transition from anonymous to authenticated
- Network failures and recovery

## Security Considerations

### What NOT to Sync

**Never sync sensitive data:**
- API keys
- Passwords
- Access tokens
- Personally identifiable information beyond email
- Health data or uploaded files

**Why:**
- Security risk if Azure credentials compromised
- Privacy concerns
- Compliance issues (GDPR, HIPAA)

### What IS Safe to Sync

**Safe to sync:**
- Theme preferences
- Display settings
- Non-sensitive configuration
- User-specific view preferences

## Performance Considerations

### Debouncing

Settings are debounced before saving:
- **2 seconds** for auto-save
- **Immediate** on logout

This prevents excessive API calls when users rapidly change settings.

### Batch Updates

Consider batching multiple setting updates:
```typescript
// Instead of multiple separate updates
setThemeMode('dark');
setExportFormat('tsv');

// Consider a batch update API if you have many settings
```

## Troubleshooting Guide

### Issue: Settings not persisting across sessions

**Check:**
1. Is user authenticated?
2. Is Azure service available?
3. Are settings being saved on logout?
4. Check Azure Table Storage data

### Issue: Settings sync delay

**Expected behavior:**
- 2-second debounce on auto-save
- Immediate save on logout
- Immediate load on login

### Issue: Different settings on different devices

**Possible causes:**
1. Settings changed while offline
2. Sync failed on one device
3. Multiple rapid logins/logouts

**Solution:**
- Last write wins
- Manual refresh may be needed

## Additional Resources

- [Azure Table Storage Documentation](https://docs.microsoft.com/azure/storage/tables/)
- [Azure Static Web Apps Configuration](https://docs.microsoft.com/azure/static-web-apps/configuration)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [React Hooks Documentation](https://react.dev/reference/react)

## Support

For questions or issues:
1. Check this developer guide
2. Review [Azure Deployment Guide](AZURE_DEPLOYMENT.md)
3. Check [Contributing Guide](../CONTRIBUTING.md)
4. Open an issue on GitHub

---

**Last Updated**: November 2024
