/**
 * I18n Test Provider Wrapper
 * Provides i18next context for component testing
 */

import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations for tests
const enTranslations = {
  "navigation": {
    "home": "Home",
    "dataUpload": "Data Upload",
    "reports": "Reports",
    "aiAnalysis": "AI Analysis",
    "settings": "Settings",
    "navigationMenu": "Navigation menu",
    "login": "Login",
    "logout": "Logout",
    "switchToDarkMode": "Switch to dark mode",
    "switchToLightMode": "Switch to light mode",
    "switchToLanguage": "Switch to {{language}}",
    "currentLanguage": "Current language: {{language}}. Click to switch.",
    "settingsLabel": "Settings",
    "syncingSettings": "Syncing settings...",
    "settingsShortcut": "Settings"
  },
  "home": {
    "title": "Glooko Insights",
    "subtitle": "A web app for importing, visualizing, and analyzing diabetes data exported from the Glooko platform",
    "dataUploadTitle": "Data Upload",
    "dataUploadDescription": "Upload and manage your Glooko export files with drag-and-drop support",
    "reportsTitle": "Comprehensive Reports",
    "reportsDescription": "View detailed analytics including time-in-range, patterns, and trends",
    "aiAnalysisTitle": "AI Analysis",
    "aiAnalysisDescription": "Get intelligent insights and recommendations using advanced AI algorithms",
    "settingsTitle": "Settings",
    "settingsDescription": "Your data is stored locally with configurable persistence options"
  },
  "toast": {
    "aiProviderSwitchedTitle": "AI provider switched",
    "aiProviderSwitchedBody": "{{fromProvider}} key verification failed. Switched to {{toProvider}}.",
    "fileLoadedSuccessTitle": "File loaded successfully",
    "fileLoadedSuccessBody": "{{fileName}} has been selected for analysis"
  },
  "footer": {
    "version": "Version {{version}}"
  },
  "loginDialog": {
    "login": "Login",
    "title": "Login with Microsoft",
    "description": "Sign in with your personal Microsoft account to access all features.",
    "signInButton": "Sign in with Microsoft",
    "signingIn": "Signing in...",
    "cancel": "Cancel",
    "errorMessage": "Failed to login. Please try again."
  },
  "logoutDialog": {
    "logout": "Logout",
    "title": "Logout",
    "confirmMessage": "Are you sure you want to logout?",
    "loggingOut": "Logging out...",
    "cancel": "Cancel",
    "proUser": "Pro user",
    "keyVaultSecret": "Key Vault Secret:",
    "loadingSecret": "Loading secret...",
    "secretNotAvailable": "Not available"
  },
  "welcomeDialog": {
    "title": "Welcome!",
    "greeting": "Welcome, {{userName}}!",
    "greetingDefault": "Welcome to our app!",
    "thankYou": "Thank you for joining us! We're excited to help you manage and analyze your diabetes data.",
    "cloudSettingsSync": "Cloud Settings Sync:",
    "cloudSettingsSyncDescription": "Your app preferences (theme, glucose unit, thresholds, etc.) will be saved to the cloud so they sync across all your devices.",
    "privacyFirst": "Privacy First:",
    "privacyFirstDescription": "We only store your email address for account identification and your app preferences. No personal health data, glucose readings, or medical information is ever stored in our cloud.",
    "privacyNote": "If you prefer not to save settings to the cloud, click \"Cancel\" to log out. You can still use the app without logging in.",
    "saveSettings": "Save Settings",
    "cancel": "Cancel"
  },
  "infrastructureErrorDialog": {
    "defaultTitle": "Something went wrong",
    "defaultDescription": "An error occurred while connecting to our services.",
    "serviceUnavailableTitle": "Service Unavailable",
    "serviceUnavailableDescription": "Our services are currently unavailable. This could mean the infrastructure is being set up or there are temporary access issues.",
    "networkErrorTitle": "Network Error",
    "networkErrorDescription": "Unable to connect to our services. Please check your internet connection and try again.",
    "accessDeniedTitle": "Access Denied",
    "accessDeniedDescription": "Your session may have expired. Please try logging in again.",
    "errorWithCode": "Error {{statusCode}}: {{message}}",
    "ok": "OK"
  },
  "cookieConsent": {
    "message": "This app uses <strong>functional cookies only</strong> to save your preferences (theme, settings, date selections). We do <strong>not collect personal data via cookies</strong>, use tracking cookies, or send cookie data to external servers. All data processing happens locally in your browser.",
    "learnMore": "Learn more about privacy",
    "gotIt": "Got it"
  },
  "common": {
    "english": "English",
    "german": "German"
  },
  "dataUpload": {
    "title": "Data Upload",
    "description": "Upload and manage your Glooko export files with drag-and-drop support",
    "uploadZone": {
      "dropFilesPrompt": "Drop ZIP files here or click to browse",
      "uploadDescription": "Upload one or multiple ZIP files from Glooko export",
      "selectFilesButton": "Select Files"
    },
    "fileList": {
      "title": "Uploaded Files",
      "titleWithCount": "Uploaded Files ({{count}})",
      "loadingDemoData": "Loading demo data...",
      "noFiles": "No files uploaded yet. Upload ZIP files to get started.",
      "loadDemoDataButton": "Load Demo Data",
      "loadingButton": "Loading...",
      "clearAllButton": "Clear All",
      "table": {
        "selectColumn": "Select",
        "fileNameColumn": "File Name",
        "uploadTimeColumn": "Upload Time",
        "fileSizeColumn": "File Size",
        "actionsColumn": "Actions",
        "selectFileAriaLabel": "Select {{fileName}}",
        "collapseDetailsAriaLabel": "Collapse details",
        "expandDetailsAriaLabel": "Expand details",
        "validBadge": "Valid",
        "invalidBadge": "Invalid",
        "exportToXlsxAriaLabel": "Export {{fileName}} to XLSX",
        "exportToXlsxTitle": "Export to XLSX",
        "removeFileAriaLabel": "Remove {{fileName}}"
      },
      "details": {
        "metadataHeader": "Metadata",
        "dataSetsHeader": "Data Sets ({{count}})",
        "mergedFromFiles": "merged from {{count}} files",
        "row": "row",
        "rows": "rows",
        "errorPrefix": "Error: {{error}}",
        "invalidZipFile": "Invalid ZIP file"
      },
      "export": {
        "copyAriaLabel": "Copy uploaded files table as {{format}}",
        "downloadAriaLabel": "Download uploaded files table as {{format}}"
      }
    }
  }
};

// Initialize i18n for tests
i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: enTranslations
      }
    },
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * Render a React element wrapped with the configured i18n provider and Fluent UI theme for testing.
 *
 * Wraps the given element with the module's i18n instance and FluentProvider using `webLightTheme`, then calls
 * `render` from @testing-library/react with any provided render options.
 *
 * @param ui - The React element to render
 * @param options - Additional render options forwarded to @testing-library/react (the `wrapper` option is ignored)
 * @returns The render result from @testing-library/react
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  /**
   * Wraps children with the i18next provider and Fluent UI theme provider for tests.
   *
   * @param children - React nodes to be rendered inside the configured i18n and Fluent UI theme context.
   * @returns A JSX element containing `children` nested within `I18nextProvider` (configured `i18n`) and `FluentProvider` (`webLightTheme`).
   */
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <FluentProvider theme={webLightTheme}>
          {children}
        </FluentProvider>
      </I18nextProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}