/**
 * Google Token Exchange Azure Function
 * 
 * This function implements the OAuth 2.0 Authorization Code Flow by exchanging
 * an authorization code for access and ID tokens using the Google OAuth 2.0 API.
 * 
 * POST /api/auth/google/token
 * 
 * Request Body:
 *   {
 *     "code": "authorization_code_from_google",
 *     "redirect_uri": "https://yourdomain.com/callback"
 *   }
 * 
 * Response:
 *   - 200 OK: { access_token: string, id_token: string, expires_in: number }
 *   - 400 Bad Request: Missing or invalid parameters
 *   - 401 Unauthorized: Invalid authorization code
 *   - 500 Internal Server Error: Configuration or infrastructure error
 * 
 * Security:
 * - Client secret is stored securely in Azure Function App Settings
 * - Secret never leaves the backend and is never exposed to the browser
 * - Authorization code is single-use and expires quickly
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createRequestLogger } from "../utils/logger";
import { isUnresolvedKeyVaultReference } from "../utils/azureUtils";

interface TokenExchangeRequest {
  code: string;
  redirect_uri: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
  refresh_token?: string;
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<GoogleTokenResponse> {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
  }

  return await response.json() as GoogleTokenResponse;
}

/**
 * HTTP trigger function for Google token exchange
 */
export async function googleTokenExchange(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const log = createRequestLogger(request, context);
  
  try {
    log.logInfo('Processing Google token exchange request');

    // Validate request method
    if (request.method !== 'POST') {
      log.logWarn(`Invalid method: ${request.method}`);
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed. Use POST.' }
      };
    }

    // Get client ID and secret from environment
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Check for unresolved Key Vault references
    if (isUnresolvedKeyVaultReference(clientId)) {
      log.logError(
        new Error(
          'GOOGLE_CLIENT_ID contains an unresolved Key Vault reference. ' +
          'The Function App managed identity may not have access to Key Vault. ' +
          'Ensure the managed identity has "Key Vault Secrets User" role. ' +
          'Run: Set-GlookoKeyVault -AssignIdentity'
        ),
        500,
        'configuration_error'
      );
      return {
        status: 500,
        jsonBody: { 
          error: 'Server configuration error',
          details: 'Google authentication is not properly configured. Please contact the administrator.'
        }
      };
    }

    if (isUnresolvedKeyVaultReference(clientSecret)) {
      log.logError(
        new Error(
          'GOOGLE_CLIENT_SECRET contains an unresolved Key Vault reference. ' +
          'The Function App managed identity may not have access to Key Vault. ' +
          'Ensure the managed identity has "Key Vault Secrets User" role. ' +
          'Run: Set-GlookoKeyVault -AssignIdentity'
        ),
        500,
        'configuration_error'
      );
      return {
        status: 500,
        jsonBody: { 
          error: 'Server configuration error',
          details: 'Google authentication is not properly configured. Please contact the administrator.'
        }
      };
    }

    if (!clientId || !clientSecret) {
      return log.logError(
        new Error('Google OAuth credentials not configured'),
        500,
        'configuration_error'
      );
    }

    // Parse request body
    let body: TokenExchangeRequest;
    try {
      const bodyText = await request.text();
      body = JSON.parse(bodyText) as TokenExchangeRequest;
    } catch {
      log.logWarn('Invalid request body');
      return {
        status: 400,
        jsonBody: { error: 'Invalid request body. Expected JSON.' }
      };
    }

    // Validate required fields
    if (!body.code || !body.redirect_uri) {
      log.logWarn('Missing required fields in request');
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields: code and redirect_uri' }
      };
    }

    // Exchange authorization code for tokens
    log.logInfo('Exchanging authorization code for tokens');
    const tokenResponse = await exchangeCodeForTokens(
      body.code,
      body.redirect_uri,
      clientId,
      clientSecret
    );

    log.logInfo('Token exchange successful');

    // Return tokens to client
    // Only return what the client needs - don't expose everything
    return {
      status: 200,
      jsonBody: {
        access_token: tokenResponse.access_token,
        id_token: tokenResponse.id_token,
        expires_in: tokenResponse.expires_in,
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's an authorization error
    if (errorMessage.includes('401') || errorMessage.includes('invalid_grant')) {
      return log.logError(error, 401, 'unauthorized');
    }

    return log.logError(error, 500, 'token_exchange_failed');
  }
}

// Register the function
app.http('googleTokenExchange', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/google/token',
  handler: googleTokenExchange
});
