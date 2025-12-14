/**
 * Admin Statistics Azure Functions
 * 
 * These functions provide administrative statistics for Pro users.
 * 
 * GET /api/glookoAdmin/stats/logged-in-users - Get count of logged-in users and Pro users
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 * 
 * Response:
 *   - 200 OK: { count: number, proUsersCount: number, capped?: boolean, proUsersCapped?: boolean }
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
      // Distinguish entity-level (EntityNotFound) from table-level (TableNotFound) 404s
      const code = (error && typeof error === 'object' && 'code' in error) ? String((error as { code: unknown }).code) : undefined;
      if (code === 'TableNotFound') {
        throw error; // let handler map to 503
      }
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Maximum count limit for entity counting operations
 * This prevents timeouts for extremely large datasets
 */
const MAX_COUNT_LIMIT = 100000;

/**
 * Generic function to count entities in a table by partition key
 * 
 * Counts entities matching the specified partitionKey filter.
 * Note: Azure Table Storage doesn't support $count directly, so we iterate
 * through entities. For very large datasets (>10k entities), consider implementing
 * pagination or caching strategies.
 * 
 * @param tableClient - The Azure Table Storage client
 * @param partitionKey - The partition key to filter by
 * @param entityType - Human-readable entity type for logging (e.g., "User", "Pro user")
 * @param context - Azure Functions invocation context for logging
 * @returns Object with count and capped flag
 */
async function countEntitiesByPartitionKey(
  tableClient: ReturnType<typeof getTableClient>,
  partitionKey: string,
  entityType: string,
  context: InvocationContext
): Promise<{ count: number; capped: boolean }> {
  let count = 0;
  let capped = false;
  
  // Query all entities with the specified partitionKey
  // We only select the partitionKey and rowKey to minimize data transfer
  const entities = tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${partitionKey}'`,
      select: ['partitionKey', 'rowKey']
    }
  });
  
  // Count all entities
  // For large datasets, consider implementing a maximum count limit
  // or using a separate counter table for better performance
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _entity of entities) {
    count++;
    
    // Safety check: if count exceeds a reasonable limit, stop and return
    // This prevents timeouts for extremely large datasets
    if (count >= MAX_COUNT_LIMIT) {
      capped = true;
      context.warn(`${entityType} count exceeded ${MAX_COUNT_LIMIT} limit - count capped at ${count}. This may indicate the need for a separate counter table.`);
      break;
    }
  }
  
  return { count, capped };
}

/**
 * Count all users in the UserSettings table
 * 
 * Counts entities with partitionKey='users' in the UserSettings table.
 * This represents all users who have logged in at least once.
 * 
 * @returns Object with count and capped flag
 */
async function countLoggedInUsers(
  tableClient: ReturnType<typeof getTableClient>,
  context: InvocationContext
): Promise<{ count: number; capped: boolean }> {
  return countEntitiesByPartitionKey(tableClient, 'users', 'User', context);
}

/**
 * Count all Pro users in the ProUsers table
 * 
 * Counts entities with partitionKey='ProUser' in the ProUsers table.
 * This represents all users with Pro access.
 * 
 * @returns Object with count and capped flag
 */
async function countProUsers(
  tableClient: ReturnType<typeof getTableClient>,
  context: InvocationContext
): Promise<{ count: number; capped: boolean }> {
  return countEntitiesByPartitionKey(tableClient, 'ProUser', 'Pro user', context);
}

/**
 * GET handler - Get count of logged-in users and Pro users
 * 
 * This endpoint is only accessible to Pro users.
 * Returns the total count of users in the UserSettings table and the count of Pro users.
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
    const { count, capped } = await countLoggedInUsers(userSettingsTableClient, context);
    
    if (capped) {
      requestLogger.logWarn('User count was capped at limit', { count, capped });
    }
    
    requestLogger.logStorage('countLoggedInUsers', true, { count, capped });
    requestLogger.logInfo('Logged-in users count retrieved', { count, capped });
    
    // Count Pro users
    const { count: proUsersCount, capped: proUsersCapped } = await countProUsers(proUsersTableClient, context);
    
    if (proUsersCapped) {
      requestLogger.logWarn('Pro user count was capped at limit', { proUsersCount, proUsersCapped });
    }
    
    requestLogger.logStorage('countProUsers', true, { proUsersCount, proUsersCapped });
    requestLogger.logInfo('Pro users count retrieved', { proUsersCount, proUsersCapped });
    
    // Build response object with both counts
    const responseBody: { count: number; proUsersCount: number; capped?: boolean; proUsersCapped?: boolean } = {
      count,
      proUsersCount,
    };
    
    // Only include capped flags if they're true
    if (capped) {
      responseBody.capped = capped;
    }
    if (proUsersCapped) {
      responseBody.proUsersCapped = proUsersCapped;
    }
    
    return requestLogger.logSuccess({
      status: 200,
      jsonBody: responseBody,
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

    // Log the full error server-side for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    requestLogger.logStorage('tableOperation', false, { 
      error: errorMessage,
      errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
    
    // Return a generic error message to the client with correlation ID
    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        errorType: 'infrastructure',
        correlationId: requestLogger.correlationId,
      },
      headers: {
        'x-correlation-id': requestLogger.correlationId,
      },
    };
  }
}

// Register the function with Azure Functions v4
app.http('adminStatsLoggedInUsers', {
  methods: ['GET'],
  route: 'glookoAdmin/stats/logged-in-users',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: getLoggedInUsersCount,
});
