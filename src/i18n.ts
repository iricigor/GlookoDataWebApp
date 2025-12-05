import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Initialize i18next with react-i18next and http backend
i18n
  .use(HttpBackend) // Load translations from public/locales
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language when translation is missing
    interpolation: {
      escapeValue: false, // React already escapes values (XSS protection)
    },
    backend: {
      // Path to load translation files from public folder
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Default namespace
    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;
