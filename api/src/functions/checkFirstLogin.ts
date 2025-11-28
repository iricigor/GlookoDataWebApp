/**
 * Check First Login Azure Function
 * 
 * This function checks if a user is logging in for the first time by querying
 * the UserSettings table in Azure Table Storage.
 * 
 * GET /api/user/check-first-login
 * 
 * Headers:
 *   - Authorization: Bearer <access_token> (required)
 * 
 * Response:
 *   - 200 OK: { isFirstLogin: boolean, userId: string }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 500 Internal Server Error: Infrastructure error
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";

interface UserSettingsEntity {
  partitionKey: string;
  rowKey: string;
  firstLoginDate?: string;
  lastLoginDate?: string;
}

/**
 * Extract and validate the user ID from the access token
 * In production, this would validate the JWT properly
 * For now, we extract the 'oid' (object ID) claim from the token
 */
function extractUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // JWT tokens are base64url encoded with 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const claims = JSON.parse(payload);

    // Return the object ID (oid) or subject (sub) claim
    return claims.oid || claims.sub || null;
  } catch {
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

  // Validate authorization header
  const authHeader = request.headers.get('authorization');
  const userId = extractUserIdFromToken(authHeader);

  if (!userId) {
    context.warn('Unauthorized request - invalid or missing token');
    return {
      status: 401,
      jsonBody: {
        error: 'Unauthorized - valid Bearer token required',
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a connection/infrastructure error
    if (errorMessage.includes('STORAGE_ACCOUNT_NAME') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('Table')) {
      return {
        status: 503,
        jsonBody: {
          error: 'Service unavailable - infrastructure not configured',
          errorType: 'infrastructure',
          code: 'STORAGE_CONNECTION_FAILED',
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
