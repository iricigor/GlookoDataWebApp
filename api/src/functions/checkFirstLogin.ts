/**
 * Check First Login Azure Function
 * 
 * This function checks if a user is logging in for the first time by querying
 * the UserSettings table in Azure Table Storage.
 * 
 * GET /api/user/check-first-login
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 * 
 * Response:
 *   - 200 OK: { isFirstLogin: boolean, userId: string }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 500 Internal Server Error: Infrastructure error
 * 
 * Token Validation:
 * The function expects an ID token (not an access token) from MSAL authentication.
 * ID tokens have the application's client ID as the audience, making them suitable
 * for authenticating with our own API. Access tokens, on the other hand, have
 * Microsoft Graph API as the audience and are meant for Graph API calls.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Expected audiences for ID token validation.
 * The ID token's 'aud' claim should match our application's client ID.
 */
const EXPECTED_AUDIENCES = [
  '656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c', // GlookoDataWebApp client ID
];

interface UserSettingsEntity {
  partitionKey: string;
  rowKey: string;
  firstLoginDate?: string;
  lastLoginDate?: string;
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
 * Validate and extract user ID from the ID token
 * 
 * SECURITY NOTE: This implementation validates that the token:
 * 1. Is a valid JWT structure
 * 2. Has an audience (aud) claim matching our application's client ID
 * 3. Contains a user identifier (oid or sub claim)
 * 
 * For production environments, consider using Azure AD Easy Auth at the
 * infrastructure level for additional security.
 * 
 * The token is expected to be a Microsoft identity platform (Azure AD) ID token.
 * See: https://learn.microsoft.com/en-us/azure/active-directory/develop/id-tokens
 * 
 * @param authHeader - The Authorization header value
 * @param context - The invocation context for logging
 * @returns The user's object ID (oid) or subject (sub) claim, or null if invalid
 */
function extractUserIdFromToken(authHeader: string | null, context: InvocationContext): string | null {
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

    if (!EXPECTED_AUDIENCES.includes(claims.aud)) {
      context.warn(`Token audience mismatch. Expected one of: ${EXPECTED_AUDIENCES.join(', ')}, got: ${claims.aud}`);
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
 */
function getTableClient(): TableClient {
  const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
  
  if (!storageAccountName) {
    throw new Error('STORAGE_ACCOUNT_NAME environment variable is not set');
  }

  const tableUrl = `https://${storageAccountName}.table.core.windows.net`;
  const credential = new DefaultAzureCredential();
  
  return new TableClient(tableUrl, 'UserSettings', credential);
}

/**
 * Check if user exists in UserSettings table
 */
async function checkUserExists(tableClient: TableClient, userId: string): Promise<boolean> {
  try {
    // Query for the user in the table
    // PartitionKey is 'users', RowKey is the userId
    await tableClient.getEntity('users', userId);
    return true;
  } catch (error: unknown) {
    // 404 means user doesn't exist - this is expected for first login
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Create user record in UserSettings table
 */
async function createUserRecord(tableClient: TableClient, userId: string): Promise<void> {
  const entity: UserSettingsEntity = {
    partitionKey: 'users',
    rowKey: userId,
    firstLoginDate: new Date().toISOString(),
    lastLoginDate: new Date().toISOString(),
  };

  await tableClient.createEntity(entity);
}

/**
 * Update last login date for existing user
 */
async function updateLastLogin(tableClient: TableClient, userId: string): Promise<void> {
  await tableClient.updateEntity(
    {
      partitionKey: 'users',
      rowKey: userId,
      lastLoginDate: new Date().toISOString(),
    },
    'Merge'
  );
}

/**
 * Main HTTP handler for check-first-login endpoint
 */
async function checkFirstLogin(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing check-first-login request');

  // Validate authorization header and extract user ID from ID token
  const authHeader = request.headers.get('authorization');
  const userId = extractUserIdFromToken(authHeader, context);

  if (!userId) {
    context.warn('Unauthorized request - invalid or missing token');
    return {
      status: 401,
      jsonBody: {
        error: 'Unauthorized access. Please log in again.',
        errorType: 'unauthorized',
      },
    };
  }

  try {
    const tableClient = getTableClient();
    const userExists = await checkUserExists(tableClient, userId);

    if (userExists) {
      // User exists - update last login and return
      await updateLastLogin(tableClient, userId);
      context.log(`User ${userId} returning user`);
      
      return {
        status: 200,
        jsonBody: {
          isFirstLogin: false,
          userId: userId,
        },
      };
    } else {
      // New user - create record and return first login
      await createUserRecord(tableClient, userId);
      context.log(`User ${userId} first login`);
      
      return {
        status: 200,
        jsonBody: {
          isFirstLogin: true,
          userId: userId,
        },
      };
    }
  } catch (error: unknown) {
    context.error('Error checking first login:', error);
    
    // Check for specific Azure SDK error types
    const isAzureError = error && typeof error === 'object' && 'statusCode' in error;
    const statusCode = isAzureError ? (error as { statusCode: number }).statusCode : undefined;
    
    // Check for configuration errors (missing environment variables)
    if (error instanceof Error && error.message.includes('STORAGE_ACCOUNT_NAME')) {
      return {
        status: 503,
        jsonBody: {
          error: 'Service unavailable - storage not configured',
          errorType: 'infrastructure',
          code: 'STORAGE_NOT_CONFIGURED',
        },
      };
    }
    
    // Check for authentication/authorization errors from Azure Storage
    if (statusCode === 401 || statusCode === 403) {
      return {
        status: 503,
        jsonBody: {
          error: 'Service unavailable - storage access denied',
          errorType: 'infrastructure',
          code: 'STORAGE_ACCESS_DENIED',
        },
      };
    }

    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        errorType: 'infrastructure',
      },
    };
  }
}

// Register the function with Azure Functions v4
app.http('checkFirstLogin', {
  methods: ['GET'],
  route: 'user/check-first-login',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: checkFirstLogin,
});
