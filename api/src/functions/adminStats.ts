/**
 * Admin Statistics Azure Functions
 * 
 * These functions provide administrative statistics for Pro users.
 * 
 * GET /api/admin/stats/logged-in-users - Get count of logged-in users
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 * 
 * Response:
 *   - 200 OK: { count: number }
 *   - 401 Unauthorized: Invalid or missing token, or missing email
 *   - 403 Forbidden: User is not a Pro user
 *   - 500 Internal Server Error: Infrastructure error
 *   - 503 Service Unavailable: Storage not configured or access denied
 * 
 * Security:
 * - Requires valid authentication token
 * - Requires user to be a Pro user (verified via ProUsers table)
 * - Only returns aggregated statistics, no individual user data
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserInfoFromToken, getTableClient, isNotFoundError } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * URL-encode a string for use as RowKey
 * This mirrors the encoding used in checkProStatus.ts
 */
function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

/**
 * Check if user exists in ProUsers table by email
 * 
 * The ProUsers table structure:
 * - PartitionKey: "ProUser" (constant)
 * - RowKey: URL-encoded email address (normalized to lowercase)
 */
async function checkProUserExists(tableClient: ReturnType<typeof getTableClient>, email: string): Promise<boolean> {
  try {
    const rowKey = urlEncode(email.toLowerCase());
    await tableClient.getEntity('ProUser', rowKey);
    return true;
  } catch (error: unknown) {
    // 404 means user is not a pro user
    if (isNotFoundError(error)) {
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Count all users in the UserSettings table
 * 
 * Counts entities with partitionKey='users' in the UserSettings table.
 * This represents all users who have logged in at least once.
 */
async function countLoggedInUsers(tableClient: ReturnType<typeof getTableClient>): Promise<number> {
  let count = 0;
  
  // Query all entities with partitionKey='users'
  const entities = tableClient.listEntities({
    queryOptions: {
      filter: "PartitionKey eq 'users'"
    }
  });
  
  // Count all entities
  for await (const _entity of entities) {
    count++;
  }
  
  return count;
}

/**
 * GET handler - Get count of logged-in users
 * 
 * This endpoint is only accessible to Pro users.
 * Returns the total count of users in the UserSettings table.
 */
async function getLoggedInUsersCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const requestLogger = createRequestLogger(request, context);
  requestLogger.logStart();

  // Validate authorization header and extract user info from ID token
  const authHeader = request.headers.get('authorization');
  const userInfo = await extractUserInfoFromToken(authHeader, context);

  if (!userInfo) {
    requestLogger.logAuth(false, undefined, 'Invalid or missing token');
    return requestLogger.logError('Unauthorized access. Please log in again.', 401, 'unauthorized');
  }

  const { userId, email } = userInfo;

  if (!email) {
    requestLogger.logAuth(true, userId, 'Token missing email claim');
    return requestLogger.logError('Token missing email claim. Please ensure the app has email scope.', 401, 'unauthorized');
  }

  requestLogger.logAuth(true, userId);

  try {
    // Check if user is a Pro user
    const proUsersTableClient = getTableClient('ProUsers');
    const isProUser = await checkProUserExists(proUsersTableClient, email);

    if (!isProUser) {
      requestLogger.logWarn('Non-Pro user attempted to access admin endpoint', { userId });
      return requestLogger.logError('Access denied. This endpoint requires Pro user access.', 403, 'authorization');
    }

    requestLogger.logInfo('Pro user verified', { userId });

    // Count logged-in users
    const userSettingsTableClient = getTableClient('UserSettings');
    const count = await countLoggedInUsers(userSettingsTableClient);
    
    requestLogger.logStorage('countLoggedInUsers', true, { count });
    requestLogger.logInfo('Logged-in users count retrieved', { count });
    
    return requestLogger.logSuccess({
      status: 200,
      jsonBody: { count },
    });

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
app.http('adminStatsLoggedInUsers', {
  methods: ['GET'],
  route: 'admin/stats/logged-in-users',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: getLoggedInUsersCount,
});
