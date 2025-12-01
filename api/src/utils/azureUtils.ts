/**
 * Shared Azure utilities for Azure Functions
 * 
 * This module contains common utilities used across multiple functions
 * for authentication, storage access, and error handling.
 */

import { InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

/**
 * GlookoDataWebApp client ID - hardcoded fallback for when environment variable is not set.
 * This is the Application (client) ID from Azure App Registration.
 * 
 * Note: Client IDs are not secrets and are safe to include in source code.
 * This is standard practice for SPAs using MSAL authentication.
 * See: https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration
 */
const GLOOKO_CLIENT_ID = '656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c';

/**
 * Expected audiences for ID token validation.
 * Uses environment variable if set, otherwise falls back to hardcoded client ID.
 * This ensures the application works even if the environment variable is not configured.
 */
const EXPECTED_AUDIENCES: string[] = [process.env.AZURE_AD_CLIENT_ID || GLOOKO_CLIENT_ID];

/**
 * Get expected audiences for ID token validation.
 * Returns the configured audiences (from env variable or hardcoded fallback).
 */
export function getExpectedAudiences(): string[] {
  return EXPECTED_AUDIENCES;
}

/**
 * Microsoft identity platform JWKS endpoint for key rotation.
 * This endpoint provides the public keys used to verify JWT signatures.
 * The "common" endpoint works for both single-tenant and multi-tenant apps.
 * See: https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc
 */
const MS_JWKS_URI = 'https://login.microsoftonline.com/common/discovery/v2.0/keys';

/**
 * JWKS client for fetching Microsoft identity platform public keys.
 * Uses caching to minimize requests to the JWKS endpoint.
 */
const jwksClientInstance = jwksClient({
  jwksUri: MS_JWKS_URI,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

/**
 * Get the signing key from the JWKS endpoint based on the key ID in the JWT header.
 * 
 * @param header - The JWT header containing the kid (key ID)
 * @returns Promise resolving to the public key string
 */
async function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  if (!header.kid) {
    throw new Error('JWT header missing kid (key ID)');
  }
  
  const key = await jwksClientInstance.getSigningKey(header.kid);
  return key.getPublicKey();
}

/**
 * Valid issuers for Microsoft identity platform tokens.
 * Supports both v1.0 and v2.0 token formats.
 * The {tenantid} placeholder is replaced at validation time.
 * For consumer accounts (MSA), the tenant ID is typically '9188040d-6c67-4c5b-b112-36a304b66dad'.
 */
const VALID_ISSUER_PATTERNS = [
  'https://login.microsoftonline.com/{tenantid}/v2.0',
  'https://sts.windows.net/{tenantid}/',
];

/**
 * Consumer (personal Microsoft account) tenant ID.
 * Used when users sign in with personal Microsoft accounts.
 */
const CONSUMER_TENANT_ID = '9188040d-6c67-4c5b-b112-36a304b66dad';

interface TokenClaims {
  aud?: string;      // Audience - should be our app's client ID
  iss?: string;      // Issuer - Microsoft identity platform
  oid?: string;      // Object ID (unique user identifier)
  sub?: string;      // Subject (unique user identifier)
  exp?: number;      // Expiration time
  iat?: number;      // Issued at time
  tid?: string;      // Tenant ID
  email?: string;    // User's email address (when email scope is requested)
  preferred_username?: string; // User's preferred username (usually email)
}

/**
 * Validate the issuer claim against expected Microsoft identity platform issuers.
 * 
 * The issuer (iss) claim in Microsoft tokens contains the tenant ID.
 * We validate that the issuer matches one of Microsoft's known patterns.
 * 
 * @param issuer - The issuer claim from the token
 * @param tenantId - The tenant ID from the token (required for proper validation)
 * @returns True if the issuer is valid
 */
function validateIssuer(issuer: string, tenantId?: string): boolean {
  // If no tenant ID is provided in the token, we can't validate the issuer properly
  // Accept consumer tenant as fallback for personal Microsoft accounts
  const tid = tenantId || CONSUMER_TENANT_ID;
  
  for (const pattern of VALID_ISSUER_PATTERNS) {
    const expectedIssuer = pattern.replace('{tenantid}', tid);
    if (issuer === expectedIssuer) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate and extract user ID from the ID token with full signature verification.
 * 
 * This implementation provides production-ready JWT validation:
 * - Cryptographic signature verification using Microsoft's JWKS endpoint
 * - Audience validation to ensure the token is intended for this application
 * - Issuer validation to ensure the token comes from Microsoft identity platform
 * - Expiration validation to reject expired tokens
 * 
 * The token is expected to be a Microsoft identity platform (Azure AD/Entra ID) ID token.
 * See: https://learn.microsoft.com/en-us/azure/active-directory/develop/id-tokens
 * 
 * @param authHeader - The Authorization header value (Bearer token)
 * @param context - The invocation context for logging
 * @returns Promise resolving to the user's object ID (oid) or subject (sub) claim, or null if invalid
 */
export async function extractUserIdFromToken(authHeader: string | null, context: InvocationContext): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    context.warn('Missing or invalid Authorization header format');
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Decode the header to get the key ID
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || typeof decodedToken === 'string') {
      context.warn('Failed to decode JWT token');
      return null;
    }

    // Get the public key from Microsoft's JWKS endpoint
    const publicKey = await getSigningKey(decodedToken.header);
    
    // Verify the token signature and decode the payload
    const expectedAudiences = getExpectedAudiences();
    // Ensure audience is never empty - jsonwebtoken requires string or non-empty array
    if (expectedAudiences.length === 0) {
      context.warn('No expected audiences configured');
      return null;
    }
    // Use single string for one audience, or cast to tuple for multiple
    const audience: string | [string, ...string[]] = expectedAudiences.length === 1 
      ? expectedAudiences[0] 
      : [expectedAudiences[0], ...expectedAudiences.slice(1)];
    const verifiedPayload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'], // Microsoft uses RS256 for ID tokens
      audience: audience,
      clockTolerance: 60, // Allow 60 seconds of clock skew
    }) as TokenClaims;

    // Validate issuer
    if (!verifiedPayload.iss) {
      context.warn('Token missing issuer (iss) claim');
      return null;
    }

    if (!validateIssuer(verifiedPayload.iss, verifiedPayload.tid)) {
      context.warn(`Invalid token issuer: ${verifiedPayload.iss}`);
      return null;
    }

    // Return the object ID (oid) or subject (sub) claim
    const userId = verifiedPayload.oid || verifiedPayload.sub;
    if (!userId) {
      context.warn('Token missing user identifier (oid or sub claim)');
      return null;
    }

    return userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      context.warn('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      context.warn(`JWT validation failed: ${error.message}`);
    } else if (error instanceof jwt.NotBeforeError) {
      context.warn('Token not yet valid (nbf claim)');
    } else {
      context.warn('Failed to validate token:', error);
    }
    return null;
  }
}

/**
 * User info extracted from the ID token
 */
export interface UserInfo {
  /** User's object ID (oid) or subject (sub) - unique identifier */
  userId: string;
  /** User's email address (normalized to lowercase) */
  email: string | null;
}

/**
 * Validate and extract user info from the ID token with full signature verification.
 * 
 * This function provides production-ready JWT validation and extracts:
 * - userId: Object ID (oid) or Subject (sub) claim
 * - email: Email or preferred_username claim (normalized to lowercase)
 * 
 * @param authHeader - The Authorization header value (Bearer token)
 * @param context - The invocation context for logging
 * @returns Promise resolving to UserInfo or null if invalid
 */
export async function extractUserInfoFromToken(authHeader: string | null, context: InvocationContext): Promise<UserInfo | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    context.warn('Missing or invalid Authorization header format');
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Decode the header to get the key ID
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || typeof decodedToken === 'string') {
      context.warn('Failed to decode JWT token');
      return null;
    }

    // Get the public key from Microsoft's JWKS endpoint
    const publicKey = await getSigningKey(decodedToken.header);
    
    // Verify the token signature and decode the payload
    const expectedAudiences = getExpectedAudiences();
    // Ensure audience is never empty - jsonwebtoken requires string or non-empty array
    if (expectedAudiences.length === 0) {
      context.warn('No expected audiences configured');
      return null;
    }
    // Use single string for one audience, or cast to tuple for multiple
    const audience: string | [string, ...string[]] = expectedAudiences.length === 1 
      ? expectedAudiences[0] 
      : [expectedAudiences[0], ...expectedAudiences.slice(1)];
    const verifiedPayload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'], // Microsoft uses RS256 for ID tokens
      audience: audience,
      clockTolerance: 60, // Allow 60 seconds of clock skew
    }) as TokenClaims;

    // Validate issuer
    if (!verifiedPayload.iss) {
      context.warn('Token missing issuer (iss) claim');
      return null;
    }

    if (!validateIssuer(verifiedPayload.iss, verifiedPayload.tid)) {
      context.warn(`Invalid token issuer: ${verifiedPayload.iss}`);
      return null;
    }

    // Get the user ID (oid or sub claim)
    const userId = verifiedPayload.oid || verifiedPayload.sub;
    if (!userId) {
      context.warn('Token missing user identifier (oid or sub claim)');
      return null;
    }

    // Get the email (email or preferred_username claim, normalized to lowercase)
    const rawEmail = verifiedPayload.email || verifiedPayload.preferred_username;
    const email = rawEmail ? rawEmail.toLowerCase() : null;

    return { userId, email };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      context.warn('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      context.warn(`JWT validation failed: ${error.message}`);
    } else if (error instanceof jwt.NotBeforeError) {
      context.warn('Token not yet valid (nbf claim)');
    } else {
      context.warn('Failed to validate token:', error);
    }
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
