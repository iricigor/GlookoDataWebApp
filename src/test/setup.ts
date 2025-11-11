/**
 * Test setup file for Vitest
 * Configures the testing environment and global test utilities
 */

import '@testing-library/jest-dom';

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
