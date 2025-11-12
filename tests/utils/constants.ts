/**
 * E2E Test Constants
 * Common constants used across E2E tests
 */

export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  NETWORK: 60000,
};

export const PAGES = {
  HOME: '#home',
  UPLOAD: '#upload',
  REPORTS: '#reports',
  AI_ANALYSIS: '#ai',
  SETTINGS: '#settings',
} as const;

export const DEMO_FILE_NAME = 'demo-data.zip';
