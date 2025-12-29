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
 * Google OAuth JWKS endpoint for key rotation.
 * This endpoint provides the public keys used to verify Google ID token signatures.
 * See: https://developers.google.com/identity/protocols/oauth2/openid-connect#discovery
 */
const GOOGLE_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';

/**
 * Check if a value is an unresolved Azure Key Vault reference.
 * Key Vault references have the format: @Microsoft.KeyVault(SecretUri=https://...)
 * 
 * If Azure Functions runtime properly resolves the reference, this function returns false.
 * If it returns true, it means the managed identity or RBAC permissions are not configured correctly.
 * 
 * @param value - The environment variable value to check
 * @returns True if the value is an unresolved Key Vault reference
 */
export function isUnresolvedKeyVaultReference(value: string | undefined): boolean {
  return !!value && value.startsWith('@Microsoft.KeyVault(');
}

/**
 * Google OAuth Client ID (from environment variable or empty string)
 * Used for validating Google ID tokens.
 * 
 * If not configured, Google authentication will fail at runtime with a warning.
 */
const GOOGLE_CLIENT_ID_RAW = process.env.GOOGLE_CLIENT_ID || '';

// Check if the environment variable contains an unresolved Key Vault reference
if (isUnresolvedKeyVaultReference(GOOGLE_CLIENT_ID_RAW)) {
  console.error(
    '❌ GOOGLE_CLIENT_ID contains an unresolved Key Vault reference: ' + GOOGLE_CLIENT_ID_RAW + '\n' +
    '\n' +
    'This means Azure Functions is not resolving the Key Vault reference automatically.\n' +
    'Common causes:\n' +
    '  1. Function App managed identity is not enabled\n' +
    '  2. Managed identity lacks "Key Vault Secrets User" role on the Key Vault\n' +
    '  3. Key Vault firewall is blocking access\n' +
    '\n' +
    'To fix this:\n' +
    '  1. Enable system-assigned or user-assigned managed identity on the Function App\n' +
    '  2. Grant the managed identity "Key Vault Secrets User" role on the Key Vault:\n' +
    '     Run: Set-GlookoKeyVault -AssignIdentity\n' +
    '  3. RESTART the Function App to apply changes (environment variables are loaded only at startup)\n' +
    '     Azure Portal → Function App → Overview → Restart\n' +
    '\n' +
    'Note: Environment variables are cached at Function App startup. After fixing permissions,\n' +
    'the Function App must be restarted for Azure to re-resolve the Key Vault reference.\n' +
    '\n' +
    'See: https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references'
  );
}

// Use the raw value only if it's not a Key Vault reference
const GOOGLE_CLIENT_ID = isUnresolvedKeyVaultReference(GOOGLE_CLIENT_ID_RAW) ? '' : GOOGLE_CLIENT_ID_RAW;

// Warn if Google Client ID is not configured (but don't fail - allow app to run)
if (!GOOGLE_CLIENT_ID) {
  if (!isUnresolvedKeyVaultReference(GOOGLE_CLIENT_ID_RAW)) {
    // Only warn about missing config if it's not a Key Vault reference issue
    console.warn(
      'GOOGLE_CLIENT_ID environment variable is not configured. ' +
      'Google authentication will not work. ' +
      'Configure this environment variable in Azure Function App Settings to enable Google login.'
    );
  }
}

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
 * JWKS client for fetching Google OAuth public keys.
 * Uses caching to minimize requests to the JWKS endpoint.
 */
const googleJwksClientInstance = jwksClient({
  jwksUri: GOOGLE_JWKS_URI,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

/**
 * Get the signing key from the appropriate JWKS endpoint based on the token issuer.
 * 
 * @param header - The JWT header containing the kid (key ID)
 * @param issuer - The token issuer to determine which JWKS endpoint to use
 * @returns Promise resolving to the public key string
 */
async function getSigningKey(header: jwt.JwtHeader, issuer?: string): Promise<string> {
  if (!header.kid) {
    throw new Error('JWT header missing kid (key ID)');
  }
  
  // Use Google JWKS endpoint if issuer is from Google
  const isGoogleToken = VALID_GOOGLE_ISSUERS.includes(issuer || '');
  const client = isGoogleToken ? googleJwksClientInstance : jwksClientInstance;
  
  const key = await client.getSigningKey(header.kid);
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
 * Valid issuers for Google OAuth tokens.
 * According to Google's OpenID Connect specification, Google ID tokens
 * can have either 'https://accounts.google.com' or 'accounts.google.com' as the issuer.
 * Both formats must be accepted for proper validation.
 * See: https://developers.google.com/identity/openid-connect/openid-connect#validatinganidtoken
 */
const VALID_GOOGLE_ISSUERS = [
  'https://accounts.google.com',
  'accounts.google.com',
];

/**
 * Consumer (personal Microsoft account) tenant ID.
 * Used when users sign in with personal Microsoft accounts.
 */
const CONSUMER_TENANT_ID = '9188040d-6c67-4c5b-b112-36a304b66dad';

interface TokenClaims {
  aud?: string;      // Audience - should be our app's client ID (Azure) or Google client ID
  iss?: string;      // Issuer - Microsoft identity platform or Google
  oid?: string;      // Object ID (unique user identifier - Microsoft only)
  sub?: string;      // Subject (unique user identifier - both Microsoft and Google)
  exp?: number;      // Expiration time
  iat?: number;      // Issued at time
  tid?: string;      // Tenant ID (Microsoft only)
  email?: string;    // User's email address (when email scope is requested)
  preferred_username?: string; // User's preferred username (usually email)
  upn?: string;      // User Principal Name (common in enterprise AAD setups)
}

/**
 * Validate the issuer claim against expected Microsoft or Google identity platform issuers.
 * 
 * The issuer (iss) claim in Microsoft tokens contains the tenant ID.
 * We validate that the issuer matches one of Microsoft's or Google's known patterns.
 * 
 * @param issuer - The issuer claim from the token
 * @param tenantId - The tenant ID from the token (required for Microsoft tokens)
 * @returns True if the issuer is valid
 */
function validateIssuer(issuer: string, tenantId?: string): boolean {
  // Check if it's a Google token
  if (VALID_GOOGLE_ISSUERS.includes(issuer)) {
    return true;
  }
  
  // Otherwise, validate as Microsoft token
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
 * Validate and decode a JWT token from the Authorization header.
 * 
 * This is a shared helper function that provides production-ready JWT validation:
 * - Cryptographic signature verification using Microsoft's or Google's JWKS endpoint
 * - Audience validation to ensure the token is intended for this application
 * - Issuer validation to ensure the token comes from Microsoft or Google identity platform
 * - Expiration validation to reject expired tokens
 * 
 * @param authHeader - The Authorization header value (Bearer token)
 * @param context - The invocation context for logging
 * @returns Promise resolving to the verified token claims or null if invalid
 */
async function validateAndDecodeToken(authHeader: string | null, context: InvocationContext): Promise<TokenClaims | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    context.warn('Missing or invalid Authorization header format');
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Decode the token to get header and payload (without verification)
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || typeof decodedToken === 'string') {
      context.warn('Failed to decode JWT token');
      return null;
    }

    // Extract issuer to determine token type
    const payload = decodedToken.payload as TokenClaims;
    const issuer = payload.iss;
    
    if (!issuer) {
      context.warn('Token missing issuer (iss) claim');
      return null;
    }

    // Determine if this is a Google or Microsoft token
    const isGoogleToken = VALID_GOOGLE_ISSUERS.includes(issuer);
    
    // Get the public key from the appropriate JWKS endpoint
    const publicKey = await getSigningKey(decodedToken.header, issuer);
    
    // Determine expected audience based on token type
    let expectedAudience: string | [string, ...string[]];
    if (isGoogleToken) {
      // Google tokens should have the Google Client ID as audience
      if (!GOOGLE_CLIENT_ID) {
        context.warn('Google Client ID not configured');
        return null;
      }
      expectedAudience = GOOGLE_CLIENT_ID;
    } else {
      // Microsoft tokens should have the Azure AD Client ID as audience
      const expectedAudiences = getExpectedAudiences();
      if (expectedAudiences.length === 0) {
        context.warn('No expected audiences configured for Microsoft tokens');
        return null;
      }
      expectedAudience = expectedAudiences.length === 1 
        ? expectedAudiences[0] 
        : [expectedAudiences[0], ...expectedAudiences.slice(1)];
    }
    
    // Verify the token signature and decode the payload
    const verifiedPayload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'], // Both Microsoft and Google use RS256 for ID tokens
      audience: expectedAudience,
      clockTolerance: 60, // Allow 60 seconds of clock skew
    }) as TokenClaims;

    // Validate issuer (we already validated it's not null above, use the stored issuer)
    if (!validateIssuer(issuer, verifiedPayload.tid)) {
      context.warn(`Invalid token issuer: ${issuer}`);
      return null;
    }

    return verifiedPayload;
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
 * Extract user ID from verified token claims.
 * 
 * This helper extracts the user's unique identifier (oid or sub claim) from
 * verified token claims and logs a warning if neither claim is present.
 * 
 * @param claims - The verified token claims
 * @param context - The invocation context for logging
 * @returns The user ID or null if not found
 */
function getUserIdFromClaims(claims: TokenClaims, context: InvocationContext): string | null {
  const userId = claims.oid || claims.sub;
  if (!userId) {
    context.warn('Token missing user identifier (oid or sub claim)');
    return null;
  }
  return userId;
}

/**
 * Extract email from verified token claims.
 * 
 * This helper extracts the user's email from verified token claims,
 * checking email, preferred_username, and upn claims in order.
 * The email is normalized to lowercase for consistent lookup.
 * 
 * @param claims - The verified token claims
 * @returns The normalized email or null if not found
 */
function getEmailFromClaims(claims: TokenClaims): string | null {
  // Check email, preferred_username, and upn claims in order of preference
  const rawEmail = claims.email || claims.preferred_username || claims.upn;
  return rawEmail ? rawEmail.toLowerCase() : null;
}

/**
 * Validate and extract user ID from the ID token with full signature verification.
 * 
 * This implementation uses the shared validateAndDecodeToken helper and extracts
 * the user's unique identifier (oid or sub claim).
 * 
 * The token is expected to be a Microsoft identity platform (Azure AD/Entra ID) ID token.
 * See: https://learn.microsoft.com/en-us/azure/active-directory/develop/id-tokens
 * 
 * @param authHeader - The Authorization header value (Bearer token)
 * @param context - The invocation context for logging
 * @returns Promise resolving to the user's object ID (oid) or subject (sub) claim, or null if invalid
 */
export async function extractUserIdFromToken(authHeader: string | null, context: InvocationContext): Promise<string | null> {
  const verifiedPayload = await validateAndDecodeToken(authHeader, context);
  if (!verifiedPayload) {
    return null;
  }

  return getUserIdFromClaims(verifiedPayload, context);
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
 * This implementation uses the shared validateAndDecodeToken helper and extracts:
 * - userId: Object ID (oid) or Subject (sub) claim
 * - email: Email or preferred_username claim (normalized to lowercase)
 * 
 * @param authHeader - The Authorization header value (Bearer token)
 * @param context - The invocation context for logging
 * @returns Promise resolving to UserInfo or null if invalid
 */
export async function extractUserInfoFromToken(authHeader: string | null, context: InvocationContext): Promise<UserInfo | null> {
  const verifiedPayload = await validateAndDecodeToken(authHeader, context);
  if (!verifiedPayload) {
    return null;
  }

  const userId = getUserIdFromClaims(verifiedPayload, context);
  if (!userId) {
    return null;
  }

  const email = getEmailFromClaims(verifiedPayload);

  return { userId, email };
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
 * Determine whether an error represents a 404 Not Found response from Azure Table Storage.
 *
 * @param error - The error object to inspect
 * @returns `true` if the error's `statusCode` equals 404, `false` otherwise.
 */
export function isNotFoundError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' && 
    'statusCode' in error && 
    (error as { statusCode: number }).statusCode === 404
  );
}

/**
 * Default Key Vault configuration
 */
const DEFAULT_KEY_VAULT_NAME = 'glookodatawebapp-kv';
const DEFAULT_SECRET_NAME = 'GlookoTest';

/**
 * Retrieve a secret value from an Azure Key Vault using the managed identity.
 *
 * The function resolves the vault name from the `KEY_VAULT_NAME` environment variable if set,
 * otherwise uses the `keyVaultName` parameter. The secret name is resolved from
 * `KEY_VAULT_SECRET_NAME` if set, otherwise uses the `secretName` parameter.
 *
 * @param keyVaultName - Fallback Key Vault name used when `KEY_VAULT_NAME` is not set
 * @param secretName - Fallback secret name used when `KEY_VAULT_SECRET_NAME` is not set
 * @returns The secret value retrieved from the Key Vault
 * @throws Error if the retrieved secret has no value
 */
export async function getSecretFromKeyVault(
  keyVaultName: string = DEFAULT_KEY_VAULT_NAME,
  secretName: string = DEFAULT_SECRET_NAME
): Promise<string> {
  // Dynamic import to avoid loading the module if not needed
  const { SecretClient } = await import('@azure/keyvault-secrets');
  
  const vaultName = process.env.KEY_VAULT_NAME || keyVaultName;
  const secret = process.env.KEY_VAULT_SECRET_NAME || secretName;
  
  const keyVaultUrl = `https://${vaultName}.vault.azure.net`;
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);
  
  const secretResponse = await client.getSecret(secret);
  
  if (!secretResponse.value) {
    throw new Error(`Secret ${secret} has no value`);
  }
  
  return secretResponse.value;
}