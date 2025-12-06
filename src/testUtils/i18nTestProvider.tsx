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
    "login": "Login",
    "switchToDarkMode": "Switch to dark mode",
    "switchToLightMode": "Switch to light mode",
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
    "title": "Sign in to Glooko Data Web App",
    "description": "Sign in with your personal Microsoft account to access all features.",
    "features": {
      "cloudSync": "Cloud settings synchronization",
      "accessAnywhere": "Access your preferences from any device",
      "privacyFirst": "Your Glooko data stays on your device"
    },
    "signInWithMicrosoft": "Sign in with Microsoft",
    "cancel": "Cancel",
    "signingIn": "Signing in..."
  },
  "logoutDialog": {
    "logout": "Logout",
    "title": "Confirm Logout",
    "message": "Are you sure you want to logout?",
    "proUser": "Pro user",
    "cancel": "Cancel"
  },
  "welcomeDialog": {
    "title": "Welcome!",
    "welcomeGeneric": "Welcome to our app!",
    "welcomePersonalized": "Welcome, {{userName}}!",
    "cloudSettingsSyncTitle": "Cloud Settings Sync",
    "cloudSettingsSyncDescription": "Your settings (theme, language, glucose thresholds) will be saved to the cloud and synced across all your devices.",
    "privacyFirstTitle": "Privacy First",
    "privacyFirstDescription": "Your Glooko data files always stay on your device. Only app settings are stored in the cloud.",
    "saveSettings": "Save Settings",
    "cancel": "Cancel"
  },
  "infrastructureErrorDialog": {
    "title": "Something went wrong",
    "serviceUnavailableTitle": "Service Unavailable",
    "serviceUnavailableMessage": "The cloud infrastructure is being set up. Please try again in a few moments.",
    "networkErrorTitle": "Network Error",
    "networkErrorMessage": "Unable to reach the server. Please check your internet connection and try again.",
    "unauthorizedTitle": "Access Denied",
    "unauthorizedMessage": "Your session may have expired. Please try logging in again.",
    "unknownErrorTitle": "Something went wrong",
    "unknownErrorMessage": "An error occurred while connecting to the cloud service.",
    "errorPrefix": "Error {{code}}:",
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
 * Custom render function that wraps components with necessary providers for testing
 * @param ui - The component to render
 * @param options - Optional render options
 * @returns The render result from @testing-library/react
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
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
