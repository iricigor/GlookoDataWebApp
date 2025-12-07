/**
 * Test setup file for Vitest
 * Configures the testing environment and global test utilities
 */

import '@testing-library/jest-dom';
import { beforeAll } from 'vitest';
import i18n from '../i18n';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Resource } from 'i18next';

// Initialize i18n before tests with synchronously loaded translations
beforeAll(async () => {
  // Load all translation files synchronously for testing
  const languages = ['en', 'de', 'cs'];
  const namespaces = [
    'common',
    'navigation',
    'home',
    'dataUpload',
    'reports',
    'aiAnalysis',
    'settings',
    'dialogs',
    'notifications',
  ];

  // Create a resources object with all translations
  const resources: Resource = {};
  
  for (const lang of languages) {
    resources[lang] = {};
    for (const ns of namespaces) {
      try {
        const filePath = join(process.cwd(), `public/locales/${lang}/${ns}.json`);
        const content = readFileSync(filePath, 'utf8');
        resources[lang][ns] = JSON.parse(content);
      } catch (error) {
        console.warn(`Could not load ${lang}/${ns}.json:`, error);
      }
    }
  }

  // Initialize i18n with preloaded resources
  if (!i18n.isInitialized) {
    await i18n.use({
      type: 'backend',
      init: () => {},
      read: (language: string, namespace: string, callback: (err: Error | null, data: unknown) => void) => {
        const data = resources[language]?.[namespace];
        if (data) {
          callback(null, data);
        } else {
          callback(new Error(`Translation not found: ${language}/${namespace}`), null);
        }
      },
    }).init({
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: namespaces,
      resources,
      interpolation: {
        escapeValue: false,
      },
    });
  }
}, 30000); // Increase timeout to 30 seconds

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
