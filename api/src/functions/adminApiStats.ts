/**
 * Admin API Statistics Azure Function
 * 
 * This function provides API call and error statistics from Application Insights
 * for Pro users with admin access.
 * 
 * GET /api/glookoAdmin/stats/api
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 * 
 * Query Parameters:
 *   - timePeriod: "1hour" | "1day" (default: "1hour")
 * 
 * Response:
 *   - 200 OK: { 
 *       webCalls: number, 
 *       webErrors: number, 
 *       apiCalls: number, 
 *       apiErrors: number,
 *       timePeriod: string 
 *     }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user
 *   - 500 Internal Server Error: Infrastructure error
 *   - 503 Service Unavailable: Application Insights not configured
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { LogsQueryClient } from "@azure/monitor-query-logs";
import { DefaultAzureCredential } from "@azure/identity";
import { extractUserInfoFromToken, getTableClient, isNotFoundError } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * Time period for statistics
 */
type TimePeriod = '1hour' | '1day';

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
 * Get Application Insights workspace ID from environment
 */
function getWorkspaceId(): string | null {
  return process.env.APPLICATIONINSIGHTS_WORKSPACE_ID || null;
}

/**
 * Query Application Insights for API statistics
 * 
 * @param workspaceId - Application Insights workspace ID
 * @param timePeriod - Time period for the query (1hour or 1day)
 * @returns Object with web and API call/error counts
 */
async function queryApplicationInsights(
  workspaceId: string,
  timePeriod: TimePeriod
): Promise<{ webCalls: number; webErrors: number; apiCalls: number; apiErrors: number }> {
  // Initialize the Azure Monitor Logs client with managed identity
  const credential = new DefaultAzureCredential();
  const logsQueryClient = new LogsQueryClient(credential);

  // Determine timespan based on period
  const timespan = timePeriod === '1hour' ? 'PT1H' : 'P1D';

  // Query for API calls and errors
  // We'll distinguish between web (client-side) and API (server-side) calls
  // Web calls are typically static content and page loads
  // API calls are requests to /api/* endpoints
  const query = `
    requests
    | where timestamp > ago(${timePeriod === '1hour' ? '1h' : '1d'})
    | extend isApiCall = url contains "/api/"
    | summarize 
        TotalCalls = count(),
        Errors = countif(success == false)
        by isApiCall
    | project isApiCall, TotalCalls, Errors
  `;

  try {
    const result = await logsQueryClient.queryWorkspace(
      workspaceId,
      query,
      { duration: timespan }
    );

    // Initialize counters
    let webCalls = 0;
    let webErrors = 0;
    let apiCalls = 0;
    let apiErrors = 0;

    // Process results - check if result is successful and has tables
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
 * GET handler - Get API call and error statistics
 */
async function getApiStats(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
      requestLogger.logWarn('Non-Pro user attempted to access admin API stats endpoint', { userId });
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

    // Check if Application Insights is configured
    const workspaceId = getWorkspaceId();
    
    if (!workspaceId) {
      requestLogger.logWarn('Application Insights workspace ID not configured');
      return requestLogger.logError(
        'Service unavailable - Application Insights not configured',
        503,
        'infrastructure',
        { code: 'APPINSIGHTS_NOT_CONFIGURED' }
      );
    }

    requestLogger.logInfo('Querying Application Insights', { workspaceId, timePeriod });

    // Query Application Insights
    const stats = await queryApplicationInsights(workspaceId, timePeriod);

    requestLogger.logInfo('Application Insights query successful', { 
      webCalls: stats.webCalls,
      webErrors: stats.webErrors,
      apiCalls: stats.apiCalls,
      apiErrors: stats.apiErrors,
      timePeriod
    });

    return requestLogger.logSuccess({
      status: 200,
      jsonBody: {
        webCalls: stats.webCalls,
        webErrors: stats.webErrors,
        apiCalls: stats.apiCalls,
        apiErrors: stats.apiErrors,
        timePeriod,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check for specific error types
    if (errorMessage.includes('Application Insights')) {
      requestLogger.logWarn('Application Insights error', { error: errorMessage });
      return {
        status: 503,
        jsonBody: {
          error: `Failed to query Application Insights: ${errorMessage}`,
          errorType: 'infrastructure',
          code: 'APPINSIGHTS_QUERY_ERROR',
        },
        headers: {
          'x-correlation-id': requestLogger.correlationId,
        },
      };
    }

    // Generic error
    requestLogger.logStorage('apiStats', false, { 
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
app.http('adminApiStats', {
  methods: ['GET'],
  route: 'glookoAdmin/stats/api',
  authLevel: 'anonymous',
  handler: getApiStats,
});
