import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Get stored UI language preference from LocalStorage
function getStoredUILanguage(): string {
  try {
    const stored = localStorage.getItem('glookoUILanguagePreference');
    if (stored === 'en' || stored === 'de' || stored === 'cs') {
      return stored;
    }
  } catch (error) {
    console.error('Failed to read UI language from localStorage:', error);
  }
  return 'en'; // Default to English
}

// Initialize i18next with react-i18next and http backend
i18n
  .use(HttpBackend) // Load translations from public/locales
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    lng: getStoredUILanguage(), // Initialize with stored language or default to English
    fallbackLng: 'en', // Fallback language when translation is missing
    interpolation: {
      escapeValue: false, // React already escapes values (XSS protection)
    },
    backend: {
      // Path to load translation files from public folder
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Default namespace - commonly used translations
    defaultNS: 'common',
    // All available namespaces
    ns: [
      'common',        // Shared UI elements, buttons, actions
      'navigation',    // Navigation menu
      'home',          // Home page
      'dataUpload',    // Data upload page and features
      'reports',       // Reports page
      'aiAnalysis',    // AI Analysis page
      'settings',      // Settings page
      'dialogs',       // All dialog components
      'notifications', // Toast and notification messages
    ],
  });

export default i18n;
