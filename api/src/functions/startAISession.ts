/**
 * Start AI Session Azure Function
 * 
 * This function acts as a secure proxy between the frontend and Gemini AI REST API.
 * It validates Pro users and forwards their AI requests to Gemini without logging user data.
 * The Gemini API key remains secure on the backend and is never exposed to the client.
 * 
 * PRIVACY: User prompts and data are forwarded directly to Gemini without being logged or stored.
 * 
 * Flow:
 * 1. Validates Pro user (logs only userId, not content)
 * 2. Gets Gemini API key from Key Vault
 * 3. Forwards the request body directly to Gemini AI (no logging of content)
 * 4. Returns Gemini's response as-is to frontend
 * 
 * POST /api/ai/start-session
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 *   - Content-Type: application/json
 * 
 * Body:
 *   Gemini API request format (forwarded as-is)
 *   {
 *     "contents": [{ "parts": [{ "text": "user prompt" }] }],
 *     "generationConfig": { "temperature": 0.2, "maxOutputTokens": 4000, ... }
 *   }
 * 
 * Response:
 *   Gemini API response (forwarded as-is)
 *   {
 *     "candidates": [{ "content": { "parts": [{ "text": "..." }] } }],
 *     "usageMetadata": { ... }
 *   }
 * 
 * Error Responses:
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user
 *   - 500 Internal Server Error: Infrastructure error
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserInfoFromToken, getTableClient, isNotFoundError, getSecretFromKeyVault } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * Default Gemini API Key secret name in Key Vault
 */
const DEFAULT_GEMINI_API_KEY_SECRET = 'AI-API-Key';

/**
 * Request timeout for Gemini API calls (30 seconds)
 */
const GEMINI_API_TIMEOUT = 30000;

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
 * Forward request to Gemini AI as a proxy (without logging user data)
 * 
 * @param apiKey - The Gemini API key
 * @param requestBody - The request body from the client (forwarded as-is)
 * @returns The Gemini API response
 */
async function proxyToGemini(apiKey: string, requestBody: string): Promise<{ status: number; body: string; headers: Headers }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`;
  
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), GEMINI_API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: requestBody,
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();
    
    return {
      status: response.status,
      body: responseBody,
      headers: response.headers,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Gemini API timeout');
    }
    throw error;
  }
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
    
    // Get request body as raw text (to forward as-is without parsing/logging user data)
    const bodyText = await request.text();
    
    if (!bodyText) {
      return requestLogger.logError('Request body is required', 400, 'validation');
    }
    
    // Get Gemini API key from Key Vault
    const secretName = process.env.AI_API_KEY_SECRET || DEFAULT_GEMINI_API_KEY_SECRET;
    const apiKey = await getSecretFromKeyVault(undefined, secretName);
    
    if (!apiKey) {
      throw new Error(`Gemini API key not configured in Key Vault secret: ${secretName}`);
    }
    
    requestLogger.logInfo('Retrieved Gemini API key from Key Vault', { secretName });
    
    // Proxy request to Gemini AI (without logging user data)
    const geminiResponse = await proxyToGemini(apiKey, bodyText);
    
    // Log success without user data details
    requestLogger.logInfo('AI request proxied successfully', {
      userId,
      geminiStatus: geminiResponse.status,
    });
    
    // Return Gemini's response as-is
    return {
      status: geminiResponse.status,
      headers: {
        'Content-Type': geminiResponse.headers.get('Content-Type') || 'application/json',
      },
      body: geminiResponse.body,
    };
    
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
