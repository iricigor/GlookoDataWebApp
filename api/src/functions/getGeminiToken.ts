/**
 * GetGeminiToken Azure Function
 * 
 * This function allows Pro users to obtain ephemeral access tokens for the Gemini Multimodal Live API.
 * The ephemeral tokens are short-lived (30 minutes by default) and secure - they ensure the master
 * Gemini API key remains on the server and is never exposed to the client.
 * 
 * GET /api/ai/GetGeminiToken
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 * 
 * Response:
 *   - 200 OK: { success: true, token: string, expiresAt: string }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user
 *   - 500 Internal Server Error: Failed to generate token
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserInfoFromToken, getTableClient, isNotFoundError, getSecretFromKeyVault } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * Gemini ephemeral token response
 * This matches the IGeminiTokenResponse interface in src/types/index.ts
 */
interface GeminiTokenResponse {
  /** Ephemeral access token name (use as authentication for WebSocket) */
  token: string;
  /** Token expiration timestamp (ISO 8601 format) */
  expiresAt: string;
  /** Success status */
  success: boolean;
}

/**
 * Default Gemini API Key secret name in Key Vault
 */
const DEFAULT_GEMINI_API_KEY_SECRET = 'AI-API-Key';

/**
 * Get the Gemini API key secret name from environment variable
 * 
 * @returns The secret name configured in AI_API_KEY_SECRET or default
 */
function getGeminiSecretName(): string {
  return process.env.AI_API_KEY_SECRET || DEFAULT_GEMINI_API_KEY_SECRET;
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
 * Google Gemini ephemeral token API response
 */
interface GeminiTokenApiResponse {
  name: string;
  expireTime: string;
  newSessionExpireTime: string;
}

/**
 * Generate ephemeral access token for Gemini Multimodal Live API
 * 
 * @param apiKey - The Gemini API key from Key Vault
 * @returns Ephemeral token response with token name and expiration
 */
async function generateEphemeralToken(apiKey: string): Promise<{ token: string; expiresAt: string }> {
  const now = new Date();
  const expireTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
  const newSessionExpireTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes to start session

  const response = await fetch('https://generativelanguage.googleapis.com/v1alpha/authTokens:generate', {
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
 * GET handler - Generate ephemeral Gemini token
 */
async function getGeminiToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
      requestLogger.logWarn('Non-Pro user attempted to access GetGeminiToken endpoint', { userId });
      return requestLogger.logError('Access denied. This endpoint requires Pro user access.', 403, 'authorization');
    }

    requestLogger.logInfo('Pro user verified, generating Gemini token', { userId });

    // Get Gemini API key from Key Vault
    const secretName = getGeminiSecretName();
    const apiKey = await getSecretFromKeyVault(undefined, secretName);
    
    if (!apiKey) {
      throw new Error(`Gemini API key not configured in Key Vault secret: ${secretName}`);
    }

    requestLogger.logInfo('Retrieved Gemini API key from Key Vault', { secretName });

    // Generate ephemeral token
    const tokenData = await generateEphemeralToken(apiKey);
    
    requestLogger.logInfo('Gemini ephemeral token generated successfully', { 
      userId,
      expiresAt: tokenData.expiresAt,
    });

    const response: GeminiTokenResponse = {
      success: true,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
    };

    return requestLogger.logSuccess({
      status: 200,
      jsonBody: response,
    });

  } catch (error: unknown) {
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check for Key Vault errors
    if (errorMessage.includes('Key Vault') || errorMessage.includes('API key not configured')) {
      requestLogger.logWarn('Key Vault error', { error: errorMessage });
      return {
        status: 500,
        jsonBody: {
          error: 'Failed to retrieve Gemini API key configuration',
          errorType: 'infrastructure',
          code: 'KEY_VAULT_ERROR',
        },
        headers: {
          'x-correlation-id': requestLogger.correlationId,
        },
      };
    }

    // Check for Gemini API errors
    if (errorMessage.includes('Gemini API error')) {
      requestLogger.logWarn('Gemini API error', { error: errorMessage });
      return {
        status: 503,
        jsonBody: {
          error: `Failed to generate ephemeral token: ${errorMessage}`,
          errorType: 'provider',
          code: 'GEMINI_API_ERROR',
        },
        headers: {
          'x-correlation-id': requestLogger.correlationId,
        },
      };
    }

    // Generic error
    requestLogger.logStorage('getGeminiToken', false, { 
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
app.http('getGeminiToken', {
  methods: ['GET'],
  route: 'ai/GetGeminiToken',
  authLevel: 'anonymous',
  handler: getGeminiToken,
});
