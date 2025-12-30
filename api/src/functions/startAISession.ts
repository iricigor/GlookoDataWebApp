/**
 * Start AI Session Azure Function
 * 
 * This function initiates an AI session with Gemini by sending a test prompt and returns 
 * an ephemeral token for the frontend to send additional data directly to Gemini AI.
 * 
 * Flow:
 * 1. Validates Pro user
 * 2. Gets Gemini API key from Key Vault
 * 3. Generates ephemeral Gemini token
 * 4. Sends initial prompt to Gemini AI
 * 5. Returns ephemeral token + initial response to frontend
 * 6. Frontend uses token to send additional data directly to Gemini
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
 *   - 200 OK: { success: true, token: string, expiresAt: string, initialResponse: string }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user
 *   - 500 Internal Server Error: Infrastructure error
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserInfoFromToken, getTableClient, isNotFoundError, getSecretFromKeyVault } from "../utils/azureUtils";
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
  expiresAt: string;
  initialResponse: string;
}

/**
 * Gemini ephemeral token API response
 */
interface GeminiTokenApiResponse {
  name: string;
  expireTime: string;
  newSessionExpireTime: string;
}

/**
 * Gemini API response structure
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Default Gemini API Key secret name in Key Vault
 */
const DEFAULT_GEMINI_API_KEY_SECRET = 'AI-API-Key';

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
 * Generate ephemeral access token for Gemini API
 * 
 * @param apiKey - The Gemini API key from Key Vault
 * @returns Ephemeral token response with token name and expiration
 */
async function generateEphemeralToken(apiKey: string): Promise<{ token: string; expiresAt: string }> {
  const now = new Date();
  const expireTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
  const newSessionExpireTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes to start session

  const response = await fetch('https://generativelanguage.googleapis.com/v1/authTokens:create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      uses: 1, // Single-use token for security
      expireTime: expireTime.toISOString(),
      newSessionExpireTime: newSessionExpireTime.toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as GeminiTokenApiResponse;
  
  return {
    token: data.name,
    expiresAt: data.expireTime,
  };
}

/**
 * Send initial prompt to Gemini AI
 * 
 * @param apiKey - The Gemini API key
 * @param prompt - The initial prompt to send
 * @returns The AI's response text
 */
async function sendInitialPromptToGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${AI_SYSTEM_PROMPT}\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
        topP: 0.8,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as GeminiResponse;
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error('Invalid response from Gemini API - no content');
  }
  
  return content;
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
    
    // Get Gemini API key from Key Vault
    const secretName = process.env.AI_API_KEY_SECRET || DEFAULT_GEMINI_API_KEY_SECRET;
    const apiKey = await getSecretFromKeyVault(undefined, secretName);
    
    if (!apiKey) {
      throw new Error(`Gemini API key not configured in Key Vault secret: ${secretName}`);
    }
    
    requestLogger.logInfo('Retrieved Gemini API key from Key Vault', { secretName });
    
    // Generate ephemeral token for frontend to use
    const tokenData = await generateEphemeralToken(apiKey);
    
    requestLogger.logInfo('Gemini ephemeral token generated', { expiresAt: tokenData.expiresAt });
    
    // Create and send initial prompt to Gemini
    const testDataInfo = requestBody.testData ? `\nTest data: ${requestBody.testData}` : '';
    const initialPrompt = `This is a test session to verify AI integration.${testDataInfo}

Please confirm you received this message and are ready to analyze diabetes-related data.`;
    
    const initialResponse = await sendInitialPromptToGemini(apiKey, initialPrompt);
    
    requestLogger.logInfo('AI session started successfully', {
      userId,
      hasTestData: !!requestBody.testData,
      responseLength: initialResponse.length,
    });
    
    const response: StartAISessionResponse = {
      success: true,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      initialResponse,
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
