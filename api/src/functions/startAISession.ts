/**
 * Start AI Session Azure Function
 * 
 * This function initiates an AI session with a test prompt and returns a temporary token
 * for the frontend to continue the conversation. It's designed for testing the full AI flow.
 * 
 * POST /api/ai/start-session
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 *   - Content-Type: application/json
 * 
 * Body:
 *   {
 *     "testData": "optional test data to include in prompt"
 *   }
 * 
 * Response:
 *   - 200 OK: { success: true, token: string, sessionId: string, initialPrompt: string }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user
 *   - 500 Internal Server Error: Infrastructure error
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserInfoFromToken, getTableClient, isNotFoundError } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";
import { AI_SYSTEM_PROMPT } from "../utils/aiPrompts";

/**
 * Request body interface
 */
interface StartAISessionRequest {
  testData?: string;
}

/**
 * Response interface
 */
interface StartAISessionResponse {
  success: boolean;
  token: string;
  sessionId: string;
  initialPrompt: string;
}

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
      return false;
    }
    throw error;
  }
}

/**
 * Generate a simple temporary token for testing
 * 
 * NOTE: This is a TESTING implementation only. The token is a simple base64-encoded
 * string without cryptographic signing. For production use, this should be replaced
 * with a proper JWT or secure session token with expiration and validation.
 * 
 * In production, consider:
 * - Using jsonwebtoken library for proper JWT creation
 * - Adding expiration time (e.g., 1 hour)
 * - Including user permissions/scopes
 * - Cryptographic signing with a secret key
 * - Token refresh mechanism
 */
function generateTemporaryToken(userId: string, sessionId: string): string {
  const timestamp = Date.now();
  const tokenData = `${userId}:${sessionId}:${timestamp}`;
  return Buffer.from(tokenData).toString('base64');
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Handle POST /api/ai/start-session
 */
async function startAISession(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const proUsersTable = getTableClient('ProUsers');
    const isProUser = await checkProUserExists(proUsersTable, email);
    
    if (!isProUser) {
      requestLogger.logInfo('Non-Pro user attempted to use AI session endpoint', { userId });
      return requestLogger.logError('This feature is only available for Pro users.', 403, 'forbidden');
    }
    
    requestLogger.logInfo('Pro user verified', { userId });
    
    // Parse request body
    let requestBody: StartAISessionRequest = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText) as StartAISessionRequest;
      }
    } catch {
      return requestLogger.logError('Invalid JSON in request body', 400, 'validation');
    }
    
    // Generate session ID and token
    const sessionId = generateSessionId();
    const token = generateTemporaryToken(userId, sessionId);
    
    // Create test prompt with system prompt
    const testDataInfo = requestBody.testData ? `\nTest data: ${requestBody.testData}` : '';
    const initialPrompt = `${AI_SYSTEM_PROMPT}

This is a test session to verify AI integration.${testDataInfo}

Please confirm you received this message and are ready to analyze diabetes-related data.`;
    
    requestLogger.logInfo('AI session started successfully', {
      userId,
      sessionId,
      hasTestData: !!requestBody.testData,
    });
    
    const response: StartAISessionResponse = {
      success: true,
      token,
      sessionId,
      initialPrompt,
    };
    
    return requestLogger.logSuccess({
      status: 200,
      jsonBody: response,
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
    
    requestLogger.logStorage('tableOperation', false, { error: error instanceof Error ? error.message : 'Unknown error' });
    return requestLogger.logError(error, 500, 'infrastructure');
  }
}

// Register the function with Azure Functions v4
app.http('startAISession', {
  methods: ['POST'],
  route: 'ai/start-session',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: startAISession,
});
