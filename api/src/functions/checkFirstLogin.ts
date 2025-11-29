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
import { extractUserIdFromToken, getTableClient, isNotFoundError } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

interface UserSettingsEntity {
  partitionKey: string;
  rowKey: string;
  firstLoginDate?: string;
  lastLoginDate?: string;
}

/**
 * Check if user exists in UserSettings table
 */
async function checkUserExists(tableClient: ReturnType<typeof getTableClient>, userId: string): Promise<boolean> {
  try {
    // Query for the user in the table
    // PartitionKey is 'users', RowKey is the userId
    await tableClient.getEntity('users', userId);
    return true;
  } catch (error: unknown) {
    // 404 means user doesn't exist - this is expected for first login
    if (isNotFoundError(error)) {
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Create user record in UserSettings table
 */
async function createUserRecord(tableClient: ReturnType<typeof getTableClient>, userId: string): Promise<void> {
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
async function updateLastLogin(tableClient: ReturnType<typeof getTableClient>, userId: string): Promise<void> {
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
  const requestLogger = createRequestLogger(request, context);
  requestLogger.logStart();

  // Validate authorization header and extract user ID from ID token
  const authHeader = request.headers.get('authorization');
  const userId = await extractUserIdFromToken(authHeader, context);

  if (!userId) {
    requestLogger.logAuth(false, undefined, 'Invalid or missing token');
    return requestLogger.logError('Unauthorized access. Please log in again.', 401, 'unauthorized');
  }

  requestLogger.logAuth(true, userId);

  try {
    const tableClient = getTableClient();
    const userExists = await checkUserExists(tableClient, userId);

    if (userExists) {
      // User exists - update last login and return
      await updateLastLogin(tableClient, userId);
      requestLogger.logStorage('updateLastLogin', true, { userId });
      requestLogger.logInfo('Returning user detected', { userId, isFirstLogin: false });
      
      return requestLogger.logSuccess({
        status: 200,
        jsonBody: {
          isFirstLogin: false,
          userId: userId,
        },
      });
    } else {
      // New user - create record and return first login
      await createUserRecord(tableClient, userId);
      requestLogger.logStorage('createUserRecord', true, { userId });
      requestLogger.logInfo('First login detected', { userId, isFirstLogin: true });
      
      return requestLogger.logSuccess({
        status: 200,
        jsonBody: {
          isFirstLogin: true,
          userId: userId,
        },
      });
    }
  } catch (error: unknown) {
    // Check for specific Azure SDK error types
    const isAzureError = error && typeof error === 'object' && 'statusCode' in error;
    const statusCode = isAzureError ? (error as { statusCode: number }).statusCode : undefined;
    
    // Check for configuration errors (missing environment variables)
    if (error instanceof Error && error.message.includes('STORAGE_ACCOUNT_NAME')) {
      requestLogger.logStorage('getTableClient', false, { error: 'STORAGE_ACCOUNT_NAME not configured' });
      return requestLogger.logError('Service unavailable - storage not configured', 503, 'infrastructure', { code: 'STORAGE_NOT_CONFIGURED' });
    }
    
    // Check for authentication/authorization errors from Azure Storage
    if (statusCode === 401 || statusCode === 403) {
      requestLogger.logStorage('tableOperation', false, { error: 'Storage access denied', azureStatusCode: statusCode });
      return requestLogger.logError('Service unavailable - storage access denied', 503, 'infrastructure', { code: 'STORAGE_ACCESS_DENIED' });
    }

    requestLogger.logStorage('tableOperation', false, { error: error instanceof Error ? error.message : 'Unknown error' });
    return requestLogger.logError(error, 500, 'infrastructure');
  }
}

// Register the function with Azure Functions v4
app.http('checkFirstLogin', {
  methods: ['GET'],
  route: 'user/check-first-login',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: checkFirstLogin,
});
