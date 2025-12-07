import { describe, it, expect, beforeEach } from 'vitest';
import i18n from './i18n';

describe('i18n configuration', () => {
  beforeEach(async () => {
    // Ensure i18n is initialized before each test
    if (!i18n.isInitialized) {
      await i18n.init();
    }
  });

  it('should be initialized with English as the default language', () => {
    expect(i18n.language).toBe('en');
  });

  it('should have English as the fallback language', () => {
    expect(i18n.options.fallbackLng).toContain('en');
  });

  it('should have escapeValue set to false for interpolation', () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });

  it('should use common as the default namespace', () => {
    expect(i18n.options.defaultNS).toBe('common');
  });

  it('should load all required namespaces', () => {
    const expectedNamespaces = [
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
    expect(i18n.options.ns).toEqual(expectedNamespaces);
  });

  it('should have the http backend configured with correct load path', () => {
    const backendOptions = i18n.options.backend as { loadPath?: string };
    expect(backendOptions?.loadPath).toBe('/locales/{{lng}}/{{ns}}.json');
  });
});
