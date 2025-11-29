/**
 * Shared Azure utilities for Azure Functions
 * 
 * This module contains common utilities used across multiple functions
 * for authentication, storage access, and error handling.
 */

import { InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * GlookoDataWebApp client ID - hardcoded fallback for when environment variable is not set.
 * This is the Application (client) ID from Azure App Registration.
 */
const GLOOKO_CLIENT_ID = '656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c';

/**
 * Expected audiences for ID token validation.
 * Uses environment variable if set, otherwise falls back to hardcoded client ID.
 * This ensures the application works even if the environment variable is not configured.
 */
const EXPECTED_AUDIENCES: string[] = process.env.AZURE_AD_CLIENT_ID 
  ? [process.env.AZURE_AD_CLIENT_ID] 
  : [GLOOKO_CLIENT_ID];

/**
 * Get expected audiences for ID token validation.
 * Returns the configured audiences (from env variable or hardcoded fallback).
 */
export function getExpectedAudiences(): string[] {
  return EXPECTED_AUDIENCES;
}

interface TokenClaims {
  aud?: string;      // Audience - should be our app's client ID
  iss?: string;      // Issuer - Microsoft identity platform
  oid?: string;      // Object ID (unique user identifier)
  sub?: string;      // Subject (unique user identifier)
  exp?: number;      // Expiration time
  iat?: number;      // Issued at time
  tid?: string;      // Tenant ID
}

/**
 * Validate and extract user ID from the ID token.
 * 
 * SECURITY NOTE: This validates basic JWT claims (audience, expiration, structure)
 * but does not perform full signature verification. For production environments,
 * consider using Azure Static Web Apps built-in authentication or Azure AD Easy Auth
 * which provides full token validation at the infrastructure level.
 * 
 * The token is expected to be a Microsoft identity platform (Azure AD) ID token.
 * See: https://learn.microsoft.com/en-us/azure/active-directory/develop/id-tokens
 * 
 * @param authHeader - The Authorization header value
 * @param context - The invocation context for logging
 * @returns The user's object ID (oid) or subject (sub) claim, or null if invalid
 */
export function extractUserIdFromToken(authHeader: string | null, context: InvocationContext): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    context.warn('Missing or invalid Authorization header format');
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // JWT tokens are base64url encoded with 3 parts separated by dots
    // Requires Node.js 16.14.0+ for base64url encoding support
    const parts = token.split('.');
    if (parts.length !== 3) {
      context.warn('Invalid JWT structure - expected 3 parts');
      return null;
    }

    // Decode the payload (second part)
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const claims: TokenClaims = JSON.parse(payload);

    // Validate audience - the token must be intended for our application
    if (!claims.aud) {
      context.warn('Token missing audience (aud) claim');
      return null;
    }

    const expectedAudiences = getExpectedAudiences();
    if (!expectedAudiences.includes(claims.aud)) {
      context.warn(`Token audience mismatch. Expected one of: ${expectedAudiences.join(', ')}, got: ${claims.aud}`);
      return null;
    }

    // Validate token is not expired (basic check - full validation requires signature verification)
    if (claims.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (claims.exp < now) {
        context.warn('Token has expired');
        return null;
      }
    }

    // Return the object ID (oid) or subject (sub) claim
    const userId = claims.oid || claims.sub;
    if (!userId) {
      context.warn('Token missing user identifier (oid or sub claim)');
      return null;
    }

    return userId;
  } catch (error) {
    context.warn('Failed to parse token:', error);
    return null;
  }
}

/**
 * Get Table Storage client using managed identity
 * 
 * @param tableName - The name of the table to access (default: 'UserSettings')
 * @returns A configured TableClient instance
 * @throws Error if STORAGE_ACCOUNT_NAME environment variable is not set
 */
export function getTableClient(tableName: string = 'UserSettings'): TableClient {
  const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
  
  if (!storageAccountName) {
    throw new Error('STORAGE_ACCOUNT_NAME environment variable is not set');
  }

  const tableUrl = `https://${storageAccountName}.table.core.windows.net`;
  const credential = new DefaultAzureCredential();
  
  return new TableClient(tableUrl, tableName, credential);
}

/**
 * Check if an error is a "not found" (404) error from Azure Table Storage
 * 
 * @param error - The error to check
 * @returns True if the error indicates a 404 Not Found response
 */
export function isNotFoundError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' && 
    'statusCode' in error && 
    (error as { statusCode: number }).statusCode === 404
  );
}
