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
 *   - 503 Service Unavailable: Storage not configured or access denied
 * 
 * Token Validation:
 * The function expects an ID token (not an access token) from MSAL authentication.
 * ID tokens have the application's client ID as the audience, making them suitable
 * for authenticating with our own API.
 * 
 * ProUsers Table Structure:
 * The ProUsers table uses the following structure (aligned with deployment scripts):
 * - PartitionKey: "ProUser" (constant for all entries)
 * - RowKey: URL-encoded email address (normalized to lowercase)
 * - Email: User's email address (original format)
 * - CreatedAt: ISO 8601 timestamp when the user was added
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserInfoFromToken, getTableClient, isNotFoundError, getSecretFromKeyVault } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * URL-encode a string for use as RowKey
 * This mirrors the Python/PowerShell URL encoding used in deployment scripts
 */
function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

/**
 * Mask an email address for logging purposes to reduce PII exposure.
 * Shows first character of local part and domain only.
 * Example: "john.doe@example.com" -> "j***@example.com"
 */
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) {
    return '***';
  }
  const [localPart, domain] = parts;
  const maskedLocal = localPart.length > 0 ? localPart[0] + '***' : '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Check if user exists in ProUsers table by email
 * 
 * The ProUsers table structure:
 * - PartitionKey: "ProUser" (constant)
 * - RowKey: URL-encoded email address (normalized to lowercase)
 * 
 * Note: Email is normalized to lowercase here to ensure consistent lookup
 * regardless of the case used by callers, matching how deployment scripts store entries.
 */
async function checkProUserExists(tableClient: ReturnType<typeof getTableClient>, email: string): Promise<boolean> {
  try {
    // Query for the user in the ProUsers table
    // PartitionKey is 'ProUser', RowKey is the URL-encoded email (normalized to lowercase)
    const rowKey = urlEncode(email.toLowerCase());
    await tableClient.getEntity('ProUser', rowKey);
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
 * HTTP handler for GET /api/user/check-pro-status that validates the caller, determines whether the user is a Pro user, and returns the pro status.
 *
 * Validates the Authorization header and ID token, requires the token to contain an email claim, checks the ProUsers table for the user, and—if the user is a Pro user—attempts to retrieve an optional secret from Key Vault without failing the request if secret retrieval fails. Logs authentication, storage, and operational events while masking PII in logs.
 *
 * @param request - Incoming HTTP request; must include an Authorization header containing a valid ID token.
 * @param context - Azure Functions invocation context used for logging and telemetry.
 * @returns An HTTP response with a JSON body containing `isProUser` (boolean) and `userId` (string); when available, includes `secretValue` (string).
 */
async function checkProStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const tableClient = getTableClient('ProUsers');
    const isProUser = await checkProUserExists(tableClient, email);

    // Use masked email in logs to reduce PII exposure (userId already uniquely identifies the user)
    const maskedEmailForLog = maskEmail(email);
    requestLogger.logStorage('checkProUser', true, { userId, email: maskedEmailForLog, isProUser });
    requestLogger.logInfo('Pro status check completed', { userId, email: maskedEmailForLog, isProUser });
    
    // If user is a pro user, also fetch the secret from Key Vault
    let secretValue: string | undefined;
    if (isProUser) {
      try {
        secretValue = await getSecretFromKeyVault();
        requestLogger.logInfo('Secret retrieved successfully', { userId });
      } catch (secretError: unknown) {
        // Log the error but don't fail the request - the pro status check succeeded
        requestLogger.logWarn('Failed to retrieve secret from Key Vault', { 
          userId, 
          error: secretError instanceof Error ? secretError.message : 'Unknown error' 
        });
        // secretValue remains undefined
      }
    }
    
    return requestLogger.logSuccess({
      status: 200,
      jsonBody: {
        isProUser,
        userId,
        ...(secretValue !== undefined && { secretValue }),
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