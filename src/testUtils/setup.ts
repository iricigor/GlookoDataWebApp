/**
 * Test setup file for Vitest
 * Configures the testing environment and global test utilities
 */

import '@testing-library/jest-dom';
import { beforeAll } from 'vitest';
import i18n from '../i18n';

// Initialize i18n before tests and load all namespaces
beforeAll(async () => {
  if (!i18n.isInitialized) {
    await i18n.init();
  }
  
  // Ensure all namespaces are loaded
  const namespaces = Array.isArray(i18n.options.ns) ? i18n.options.ns : [i18n.options.ns as string];
  await Promise.all(
    namespaces.map(ns => i18n.loadNamespaces(ns))
  );
});

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
