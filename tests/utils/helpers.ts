/**
 * E2E Test Utilities
 * Helper functions for E2E tests
 */

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random string for test data
 */
export function randomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get current timestamp as string
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!process.env.CI;
}
