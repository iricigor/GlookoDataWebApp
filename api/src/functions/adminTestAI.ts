/**
 * Admin AI Test Azure Function
 * 
 * This function allows Pro users with admin access to test the Pro AI key configuration
 * by sending a simple test query to the configured AI provider.
 * 
 * POST /api/glookoAdmin/test-ai
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 *   - Content-Type: application/json
 * 
 * Body:
 *   {
 *     "provider": "perplexity" | "gemini" | "grok" | "deepseek" (optional)
 *   }
 * 
 * Response:
 *   - 200 OK: { success: true, provider: string, message: string }
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
 * Get AI provider configuration from Key Vault
 */
async function getAIProviderConfig(provider: string): Promise<{ apiKey: string }> {
  // Map provider names to Key Vault secret names
  const secretNames: Record<string, string> = {
    'perplexity': 'PERPLEXITY-API-KEY',
    'gemini': 'GEMINI-API-KEY',
    'grok': 'GROK-API-KEY',
    'deepseek': 'DEEPSEEK-API-KEY',
  };

  const secretName = secretNames[provider];
  if (!secretName) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const apiKey = await getSecretFromKeyVault(secretName);
  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  return { apiKey };
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

    requestLogger.logInfo('Testing AI provider', { provider });

    // Get AI provider configuration
    const config = await getAIProviderConfig(provider);
    requestLogger.logInfo('Retrieved AI configuration', { provider });

    // Test the AI provider
    const testResult = await testAIProvider(provider, config.apiKey);
    
    // Get Key Vault configuration from environment
    const keyVaultName = process.env.KEY_VAULT_NAME || 'Not configured';
    const aiApiKeySecret = process.env.AI_API_KEY_SECRET || DEFAULT_AI_API_KEY_SECRET;
    
    requestLogger.logInfo('AI test successful', { 
      provider, 
      resultLength: testResult.length,
      keyVaultName,
      aiApiKeySecret
    });

    return requestLogger.logSuccess({
      status: 200,
      jsonBody: {
        success: true,
        provider,
        keyVaultName,
        aiApiKeySecret,
        message: `AI provider test successful. Response: ${testResult.substring(0, 200)}${testResult.length > 200 ? '...' : ''}`,
      },
    });

  } catch (error: unknown) {
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Get Key Vault configuration from environment (to return even on error)
    const keyVaultName = process.env.KEY_VAULT_NAME || 'Not configured';
    const aiApiKeySecret = process.env.AI_API_KEY_SECRET || DEFAULT_AI_API_KEY_SECRET;
    const provider = process.env.AI_PROVIDER || 'perplexity';

    // Check for Key Vault errors
    if (errorMessage.includes('Key Vault') || errorMessage.includes('API key not configured')) {
      requestLogger.logWarn('Key Vault error', { error: errorMessage });
      return {
        status: 500,
        jsonBody: {
          error: 'Failed to retrieve API key configuration',
          errorType: 'infrastructure',
          code: 'KEY_VAULT_ERROR',
          provider,
          keyVaultName,
          aiApiKeySecret,
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
          provider,
          keyVaultName,
          aiApiKeySecret,
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
        provider,
        keyVaultName,
        aiApiKeySecret,
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
  route: 'glookoAdmin/test-ai',
  authLevel: 'anonymous',
  handler: testAI,
});
