/**
 * Check Pro Status Azure Function
 * 
 * This function checks if a user is a pro user by querying
 * the ProUsers table in Azure Table Storage.
 * 
 * GET /api/user/check-pro-status
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 * 
 * Response:
 *   - 200 OK: { isProUser: boolean, userId: string }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 500 Internal Server Error: Infrastructure error
 * 
 * Token Validation:
 * The function expects an ID token (not an access token) from MSAL authentication.
 * ID tokens have the application's client ID as the audience, making them suitable
 * for authenticating with our own API.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserIdFromToken, getTableClient, isNotFoundError } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * Check if user exists in ProUsers table
 */
async function checkProUserExists(tableClient: ReturnType<typeof getTableClient>, userId: string): Promise<boolean> {
  try {
    // Query for the user in the ProUsers table
    // PartitionKey is 'prousers', RowKey is the userId
    await tableClient.getEntity('prousers', userId);
    return true;
  } catch (error: unknown) {
    // 404 means user is not a pro user - this is expected
    if (isNotFoundError(error)) {
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Main HTTP handler for check-pro-status endpoint
 */
async function checkProStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const tableClient = getTableClient('ProUsers');
    const isProUser = await checkProUserExists(tableClient, userId);

    requestLogger.logStorage('checkProUser', true, { userId, isProUser });
    requestLogger.logInfo('Pro status check completed', { userId, isProUser });
    
    return requestLogger.logSuccess({
      status: 200,
      jsonBody: {
        isProUser: isProUser,
        userId: userId,
      },
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
app.http('checkProStatus', {
  methods: ['GET'],
  route: 'user/check-pro-status',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: checkProStatus,
});
