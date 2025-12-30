/**
 * Admin API & Web Traffic Statistics Azure Function
 * 
 * This function provides API call and error statistics from Application Insights
 * for Pro users with admin access.
 * 
 * GET /api/glookoAdmin/stats/traffic
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
 *     Note: Returns zeros for all statistics if Application Insights is not configured
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user
 *   - 500 Internal Server Error: Infrastructure error
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
 * Timespan constants for Azure Monitor queries
 */
const TIMESPAN_1_HOUR = 'PT1H';
const TIMESPAN_1_DAY = 'P1D';



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
  // Initialize the Azure Monitor Logs client with User-Assigned Managed Identity
  // DefaultAzureCredential uses AZURE_CLIENT_ID environment variable to identify the User-Assigned MI
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  });
  const logsQueryClient = new LogsQueryClient(credential);

  // Determine timespan based on period
  const timespan = timePeriod === '1hour' ? TIMESPAN_1_HOUR : TIMESPAN_1_DAY;

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

    // Get Application Insights statistics
    const workspaceId = getWorkspaceId();
    let webCalls = 0;
    let webErrors = 0;
    let apiCalls = 0;
    let apiErrors = 0;
    
    if (workspaceId) {
      try {
        requestLogger.logInfo('Querying Application Insights', { workspaceId, timePeriod });
        const stats = await queryApplicationInsights(workspaceId, timePeriod);
        webCalls = stats.webCalls;
        webErrors = stats.webErrors;
        apiCalls = stats.apiCalls;
        apiErrors = stats.apiErrors;
        
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

    return requestLogger.logSuccess({
      status: 200,
      jsonBody: {
        webCalls,
        webErrors,
        apiCalls,
        apiErrors,
        timePeriod,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

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
app.http('adminTrafficStats', {
  methods: ['GET'],
  route: 'glookoAdmin/stats/traffic',
  authLevel: 'anonymous',
  handler: getApiStats,
});
