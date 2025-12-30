/**
 * Unified Admin Statistics Azure Function
 * 
 * This function provides all administrative statistics in a single endpoint for Pro users.
 * 
 * GET /api/glookoAdmin/stats
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 * 
 * Query Parameters:
 *   - timePeriod: "1hour" | "1day" (default: "1hour") - for API/Web statistics
 * 
 * Response:
 *   - 200 OK: { 
 *       loggedInUsersCount: number,
 *       proUsersCount: number,
 *       webCalls: number, 
 *       webErrors: number, 
 *       apiCalls: number, 
 *       apiErrors: number,
 *       timePeriod: string,
 *       capped?: boolean,
 *       proUsersCapped?: boolean
 *     }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user
 *   - 500 Internal Server Error: Infrastructure error
 *   - 503 Service Unavailable: Storage or Application Insights not configured
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { LogsQueryClient } from "@azure/monitor-query-logs";
import { DefaultAzureCredential } from "@azure/identity";
import { extractUserInfoFromToken, getTableClient, isNotFoundError } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * Time period for API/Web statistics
 */
type TimePeriod = '1hour' | '1day';

/**
 * Timespan constants for Azure Monitor queries
 */
const TIMESPAN_1_HOUR = 'PT1H';
const TIMESPAN_1_DAY = 'P1D';



/**
 * Maximum count limit for entity counting operations
 */
const MAX_COUNT_LIMIT = 100000;

/**
 * URL-encode a string for use as RowKey
 */
function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

/**
 * Check if user exists in ProUsers table by email
 */
async function checkProUserExists(tableClient: ReturnType<typeof getTableClient>, email: string): Promise<boolean> {
  try {
    const rowKey = urlEncode(email.toLowerCase());
    await tableClient.getEntity('ProUser', rowKey);
    return true;
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      const code = (error && typeof error === 'object' && 'code' in error) ? String((error as { code: unknown }).code) : undefined;
      if (code === 'TableNotFound') {
        throw error;
      }
      return false;
    }
    throw error;
  }
}

/**
 * Generic function to count entities in a table by partition key
 */
async function countEntitiesByPartitionKey(
  tableClient: ReturnType<typeof getTableClient>,
  partitionKey: string,
  entityType: string,
  context: InvocationContext
): Promise<{ count: number; capped: boolean }> {
  let count = 0;
  let capped = false;
  
  const entities = tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${partitionKey}'`,
      select: ['partitionKey', 'rowKey']
    }
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _entity of entities) {
    count++;
    
    if (count >= MAX_COUNT_LIMIT) {
      capped = true;
      context.warn(`${entityType} count exceeded ${MAX_COUNT_LIMIT} limit - count capped at ${count}.`);
      break;
    }
  }
  
  return { count, capped };
}

/**
 * Count all users in the UserSettings table
 */
async function countLoggedInUsers(
  tableClient: ReturnType<typeof getTableClient>,
  context: InvocationContext
): Promise<{ count: number; capped: boolean }> {
  return countEntitiesByPartitionKey(tableClient, 'users', 'User', context);
}

/**
 * Count all Pro users in the ProUsers table
 */
async function countProUsers(
  tableClient: ReturnType<typeof getTableClient>,
  context: InvocationContext
): Promise<{ count: number; capped: boolean }> {
  return countEntitiesByPartitionKey(tableClient, 'ProUser', 'Pro user', context);
}

/**
 * Get Application Insights workspace ID from environment
 */
function getWorkspaceId(): string | null {
  return process.env.APPLICATIONINSIGHTS_WORKSPACE_ID || null;
}

/**
 * Query Application Insights for API statistics
 */
async function queryApplicationInsights(
  workspaceId: string,
  timePeriod: TimePeriod
): Promise<{ webCalls: number; webErrors: number; apiCalls: number; apiErrors: number }> {
  // Initialize with User-Assigned Managed Identity using AZURE_CLIENT_ID
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  });
  const logsQueryClient = new LogsQueryClient(credential);

  const timespan = timePeriod === '1hour' ? TIMESPAN_1_HOUR : TIMESPAN_1_DAY;

  // Query for API calls and errors
  // In Azure Static Web Apps with Application Insights:
  // - Web traffic (page views, static content) is tracked in the 'pageViews' table (client-side telemetry)
  // - API calls (Azure Functions) are tracked in the 'requests' table (server-side telemetry)
  // 
  // Note: The 'requests' table in a Static Web App deployment typically ONLY contains API calls,
  // so we query both tables separately and union the results.
  // Query for API calls and errors
  // In Azure Static Web Apps with Application Insights:
  // - API calls (Azure Functions) are tracked in the 'requests' table (server-side telemetry)
  // - Web traffic (page views) would be in 'pageViews' table, but requires client-side SDK integration
  // 
  // Note: For privacy-focused apps that process data client-side, the pageViews table may be empty.
  // We query the requests table for API statistics and check pageViews separately.
  // The pageViews query will return no rows if client-side monitoring isn't configured.
  //
  // Error detection: We count errors based on HTTP status codes (4xx and 5xx) rather than the
  // 'success' field, as the success field may not always reflect HTTP-level errors correctly.
  const query = `
    let apiData = requests
    | where timestamp > ago(${timePeriod === '1hour' ? '1h' : '1d'})
    | summarize 
        TotalCalls = count(),
        Errors = countif(toint(resultCode) >= 400)
    | extend isApiCall = true;
    let webData = pageViews
    | where timestamp > ago(${timePeriod === '1hour' ? '1h' : '1d'})
    | summarize 
        TotalCalls = count(),
        Errors = 0
    | extend isApiCall = false;
    union apiData, webData
    | project isApiCall, TotalCalls, Errors
  `;

  try {
    const result = await logsQueryClient.queryWorkspace(
      workspaceId,
      query,
      { duration: timespan }
    );

    let webCalls = 0;
    let webErrors = 0;
    let apiCalls = 0;
    let apiErrors = 0;

    if (result.status === 'Success' && result.tables && result.tables.length > 0) {
      const table = result.tables[0];
      
      for (const row of table.rows) {
        const isApiCall = row[0] as boolean;
        const totalCalls = row[1] as number;
        const errors = row[2] as number;

        if (isApiCall) {
          apiCalls = totalCalls;
          apiErrors = errors;
        } else {
          webCalls = totalCalls;
          webErrors = errors;
        }
      }
    }

    return { webCalls, webErrors, apiCalls, apiErrors };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Application Insights query failed: ${errorMessage}`);
  }
}

/**
 * GET handler - Get all administrative statistics (unified endpoint)
 */
async function getUnifiedAdminStats(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const requestLogger = createRequestLogger(request, context);
  requestLogger.logStart();

  // Validate authorization header and extract user info
  const authHeader = request.headers.get('authorization');
  const userInfo = await extractUserInfoFromToken(authHeader, context);

  if (!userInfo) {
    requestLogger.logAuth(false, undefined, 'Invalid or missing token');
    return requestLogger.logError('Unauthorized access. Please log in again.', 401, 'unauthorized');
  }

  const { userId, email } = userInfo;

  if (!email) {
    requestLogger.logAuth(true, userId, 'Token missing email claim');
    return requestLogger.logError('Token missing email claim.', 401, 'unauthorized');
  }

  requestLogger.logAuth(true, userId);

  try {
    // Check if user is a Pro user
    const proUsersTableClient = getTableClient('ProUsers');
    const isProUser = await checkProUserExists(proUsersTableClient, email);

    if (!isProUser) {
      requestLogger.logWarn('Non-Pro user attempted to access admin stats endpoint', { userId });
      return requestLogger.logError('Access denied. This endpoint requires Pro user access.', 403, 'authorization');
    }

    requestLogger.logInfo('Pro user verified', { userId });

    // Get time period from query parameter
    const timePeriodParam = request.query.get('timePeriod') || '1hour';
    
    if (!['1hour', '1day'].includes(timePeriodParam)) {
      return requestLogger.logError(
        `Invalid timePeriod parameter: ${timePeriodParam}. Supported values: 1hour, 1day`,
        400,
        'validation'
      );
    }

    const timePeriod = timePeriodParam as TimePeriod;

    // Count logged-in users
    const userSettingsTableClient = getTableClient('UserSettings');
    const { count: loggedInUsersCount, capped } = await countLoggedInUsers(userSettingsTableClient, context);
    
    if (capped) {
      requestLogger.logWarn('User count was capped at limit', { loggedInUsersCount, capped });
    }
    
    requestLogger.logStorage('countLoggedInUsers', true, { loggedInUsersCount, capped });
    
    // Count Pro users
    const { count: proUsersCount, capped: proUsersCapped } = await countProUsers(proUsersTableClient, context);
    
    if (proUsersCapped) {
      requestLogger.logWarn('Pro user count was capped at limit', { proUsersCount, proUsersCapped });
    }
    
    requestLogger.logStorage('countProUsers', true, { proUsersCount, proUsersCapped });

    // Get Application Insights statistics
    const workspaceId = getWorkspaceId();
    let webCalls = 0;
    let webErrors = 0;
    let apiCalls = 0;
    let apiErrors = 0;
    
    if (workspaceId) {
      try {
        requestLogger.logInfo('Querying Application Insights', { workspaceId, timePeriod });
        const apiStats = await queryApplicationInsights(workspaceId, timePeriod);
        webCalls = apiStats.webCalls;
        webErrors = apiStats.webErrors;
        apiCalls = apiStats.apiCalls;
        apiErrors = apiStats.apiErrors;
        
        requestLogger.logInfo('Application Insights query successful', { 
          webCalls,
          webErrors,
          apiCalls,
          apiErrors,
          timePeriod
        });
      } catch (error: unknown) {
        // Log warning but don't fail the entire request
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        requestLogger.logWarn('Application Insights query failed - returning zeros for API stats', { error: errorMessage });
      }
    } else {
      requestLogger.logWarn('Application Insights workspace ID not configured - returning zeros for API stats');
    }

    // Build response object
    const responseBody: { 
      loggedInUsersCount: number;
      proUsersCount: number;
      webCalls: number;
      webErrors: number;
      apiCalls: number;
      apiErrors: number;
      timePeriod: string;
      capped?: boolean;
      proUsersCapped?: boolean;
    } = {
      loggedInUsersCount,
      proUsersCount,
      webCalls,
      webErrors,
      apiCalls,
      apiErrors,
      timePeriod,
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
    
    // Check for configuration errors
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
app.http('adminStatsUnified', {
  methods: ['GET'],
  route: 'glookoAdmin/stats',
  authLevel: 'anonymous',
  handler: getUnifiedAdminStats,
});
