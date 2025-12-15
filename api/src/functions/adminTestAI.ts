/**
 * Admin AI Test Azure Function
 * 
 * This function allows Pro users with admin access to test the Pro AI key configuration.
 * It supports two test modes:
 * 1. Infrastructure test - verifies Key Vault access and environment configuration
 * 2. Full test - includes infrastructure test plus sending a test query to the AI provider
 * 
 * POST /api/glookoAdmin/test-ai-key
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 *   - Content-Type: application/json
 * 
 * Query Parameters:
 *   - testType: "infra" | "full" (default: "full")
 * 
 * Response:
 *   - 200 OK: { success: true, testType: string, provider: string, keyVaultName: string, 
 *               secretName: string, secretExists: boolean, message?: string }
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user
 *   - 500 Internal Server Error: Infrastructure error or AI test failed
 *   - 503 Service Unavailable: AI provider unavailable
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserInfoFromToken, getTableClient, isNotFoundError, getSecretFromKeyVault } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * Default AI API Key secret name in Key Vault
 */
const DEFAULT_AI_API_KEY_SECRET = 'AI-API-Key';

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
 * Get AI provider secret name from environment-configured provider
 * 
 * Maps the provider name to its corresponding Key Vault secret name.
 * Since there's only one backend AI provider configured via AI_PROVIDER env var,
 * this function returns the secret name for that specific provider.
 * 
 * @param provider - The AI provider name (e.g., 'perplexity', 'gemini', 'grok', 'deepseek')
 * @returns The Key Vault secret name for the provider
 * @throws Error if provider is unsupported
 */
function getSecretNameForProvider(provider: string): string {
  // Map provider to its Key Vault secret name
  switch (provider.toLowerCase()) {
    case 'perplexity':
      return 'PERPLEXITY-API-KEY';
    case 'gemini':
      return 'GEMINI-API-KEY';
    case 'grok':
      return 'GROK-API-KEY';
    case 'deepseek':
      return 'DEEPSEEK-API-KEY';
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Get AI provider configuration from Key Vault
 * 
 * Retrieves the API key for the configured AI provider from Azure Key Vault.
 * 
 * @param provider - The AI provider name
 * @returns Object containing the API key and secret name
 * @throws Error if secret cannot be retrieved or provider is unsupported
 */
async function getAIProviderConfig(provider: string): Promise<{ apiKey: string; secretName: string }> {
  const secretName = getSecretNameForProvider(provider);

  const apiKey = await getSecretFromKeyVault(secretName);
  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  return { apiKey, secretName };
}

/**
 * Test AI provider with a simple query
 */
async function testAIProvider(provider: string, apiKey: string): Promise<string> {
  const testPrompt = "Hello, this is a test query to verify the API connection is working. Please respond with a brief confirmation.";

  // Call the appropriate AI provider API
  switch (provider) {
    case 'perplexity':
      return await testPerplexity(apiKey, testPrompt);
    case 'gemini':
      return await testGemini(apiKey, testPrompt);
    case 'grok':
      return await testGrok(apiKey, testPrompt);
    case 'deepseek':
      return await testDeepSeek(apiKey, testPrompt);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Test Perplexity API
 */
async function testPerplexity(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || 'Test successful - received response from Perplexity';
}

/**
 * Test Google Gemini API
 */
async function testGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 100 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Test successful - received response from Gemini';
}

/**
 * Test Grok API
 */
async function testGrok(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || 'Test successful - received response from Grok';
}

/**
 * Test DeepSeek API
 */
async function testDeepSeek(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || 'Test successful - received response from DeepSeek';
}

/**
 * POST handler - Test AI provider configuration
 */
async function testAI(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
      requestLogger.logWarn('Non-Pro user attempted to access admin test AI endpoint', { userId });
      return requestLogger.logError('Access denied. This endpoint requires Pro user access.', 403, 'authorization');
    }

    requestLogger.logInfo('Pro user verified', { userId });

    // Get testType from query parameter (default to "full")
    const testType = request.query.get('testType') || 'full';
    
    if (!['infra', 'full'].includes(testType)) {
      return requestLogger.logError(
        `Invalid testType parameter: ${testType}. Supported values: infra, full`,
        400,
        'validation'
      );
    }

    // Parse request body (provider is optional and will be ignored - we use environment configuration)
    const body = await request.text();
    
    if (body) {
      try {
        // Parse but don't use the provider from request
        JSON.parse(body);
      } catch {
        return requestLogger.logError('Invalid JSON in request body', 400, 'validation');
      }
    }

    // Get provider from environment variable (AI_PROVIDER) or default to perplexity
    // This ensures consistency with the aiQuery endpoint configuration
    const provider = process.env.AI_PROVIDER || 'perplexity';
    const validProviders = ['perplexity', 'gemini', 'grok', 'deepseek'];
    
    if (!validProviders.includes(provider)) {
      return requestLogger.logError(
        `Invalid provider configured: ${provider}. Supported providers: ${validProviders.join(', ')}`,
        500,
        'infrastructure',
        { code: 'INVALID_PROVIDER_CONFIG' }
      );
    }

    // Get Key Vault configuration from environment
    const keyVaultName = process.env.KEY_VAULT_NAME || 'Not configured';
    
    // Safely get secret name - compute once to avoid exception in error handler
    let secretName: string;
    try {
      secretName = getSecretNameForProvider(provider);
    } catch (error) {
      // If provider is unsupported, this was already caught above
      // This is a safety fallback
      secretName = 'unknown-secret';
    }

    requestLogger.logInfo('Testing AI provider', { provider, testType });

    // Infrastructure test - verify Key Vault access
    let secretExists = false;
    let aiProviderConfig: { apiKey: string; secretName: string } | null = null;

    try {
      // Get AI provider configuration (this tests Key Vault access)
      aiProviderConfig = await getAIProviderConfig(provider);
      secretExists = true;
      secretName = aiProviderConfig.secretName; // Update with actual secret name
      requestLogger.logInfo('Retrieved AI configuration', { provider, secretName: aiProviderConfig.secretName });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      requestLogger.logWarn('Failed to retrieve AI configuration', { error: errorMessage });
      
      // For infra test, return the configuration info even if Key Vault access failed
      // Using HTTP 206 (Partial Content) to indicate partial success
      if (testType === 'infra') {
        return requestLogger.logSuccess({
          status: 206,
          jsonBody: {
            success: false,
            testType,
            provider,
            keyVaultName,
            secretName,
            secretExists: false,
            error: `Failed to retrieve secret: ${errorMessage}`,
          },
        });
      }
      
      // For full test, return error
      throw error;
    }

    // If testType is 'infra', return infrastructure info only
    if (testType === 'infra') {
      return requestLogger.logSuccess({
        status: 200,
        jsonBody: {
          success: true,
          testType,
          provider,
          keyVaultName,
          secretName,
          secretExists,
          message: 'Infrastructure test successful. Key Vault access confirmed.',
        },
      });
    }

    // Full test - test the AI provider
    if (!aiProviderConfig) {
      // This should not happen as we would have returned earlier, but add explicit check for safety
      return requestLogger.logError(
        'Failed to retrieve AI provider configuration',
        500,
        'infrastructure'
      );
    }
    
    const testResult = await testAIProvider(provider, aiProviderConfig.apiKey);
    
    requestLogger.logInfo('AI test successful', { 
      provider, 
      resultLength: testResult.length,
      keyVaultName,
      secretName
    });

    return requestLogger.logSuccess({
      status: 200,
      jsonBody: {
        success: true,
        testType,
        provider,
        keyVaultName,
        secretName,
        secretExists,
        message: `AI provider test successful. Response: ${testResult.substring(0, 200)}${testResult.length > 200 ? '...' : ''}`,
      },
    });

  } catch (error: unknown) {
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Get Key Vault configuration from environment (to return even on error)
    const keyVaultName = process.env.KEY_VAULT_NAME || 'Not configured';
    const provider = process.env.AI_PROVIDER || 'perplexity';
    const testType = request.query.get('testType') || 'full';
    
    // Safely get secret name without risking exception in error handler
    let secretName: string;
    try {
      secretName = getSecretNameForProvider(provider);
    } catch {
      secretName = 'unknown-secret';
    }

    // Check for Key Vault errors
    if (errorMessage.includes('Key Vault') || errorMessage.includes('API key not configured')) {
      requestLogger.logWarn('Key Vault error', { error: errorMessage });
      return {
        status: 500,
        jsonBody: {
          error: 'Failed to retrieve API key configuration',
          errorType: 'infrastructure',
          code: 'KEY_VAULT_ERROR',
          testType,
          provider,
          keyVaultName,
          secretName,
          secretExists: false,
        },
        headers: {
          'x-correlation-id': requestLogger.correlationId,
        },
      };
    }

    // Check for AI provider errors
    if (errorMessage.includes('API error')) {
      requestLogger.logWarn('AI provider error', { error: errorMessage });
      return {
        status: 503,
        jsonBody: {
          error: `AI provider test failed: ${errorMessage}`,
          errorType: 'provider',
          code: 'PROVIDER_ERROR',
          testType,
          provider,
          keyVaultName,
          secretName,
          secretExists: true,
        },
        headers: {
          'x-correlation-id': requestLogger.correlationId,
        },
      };
    }

    // Generic error
    requestLogger.logStorage('aiTest', false, { 
      error: errorMessage,
      errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });

    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        errorType: 'infrastructure',
        testType,
        provider,
        keyVaultName,
        secretName,
        correlationId: requestLogger.correlationId,
      },
      headers: {
        'x-correlation-id': requestLogger.correlationId,
      },
    };
  }
}

// Register the function with Azure Functions v4
app.http('adminTestAI', {
  methods: ['POST'],
  route: 'glookoAdmin/test-ai-key',
  authLevel: 'anonymous',
  handler: testAI,
});
