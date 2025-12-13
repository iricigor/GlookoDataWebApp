/**
 * Environment detection utilities
 * 
 * Detects the application running environment based on the browser's URL.
 */

export type Environment = 'dev' | 'staging' | 'prod';

/**
 * Detects the current environment based on the browser URL
 * 
 * @returns The detected environment: 'dev', 'staging', or 'prod'
 * 
 * Detection rules:
 * - localhost or 127.0.0.1 → dev
 * - Azure Static Web Apps staging URLs (*.azurestaticapps.net) → staging
 * - glooko.iric.online → prod
 */
export function detectEnvironment(): Environment {
  // In test environments, default to prod (no indicator)
  if (typeof window === 'undefined' || !window.location) {
    return 'prod';
  }

  const hostname = window.location.hostname.toLowerCase();

  // Development: localhost or 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'dev';
  }

  // Staging: Azure Static Web Apps staging URLs
  // Pattern: something-something-###-###.region.#.azurestaticapps.net
  if (hostname.includes('.azurestaticapps.net')) {
    return 'staging';
  }

  // Production: glooko.iric.online or any other domain
  return 'prod';
}
