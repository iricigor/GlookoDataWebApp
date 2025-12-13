/**
 * AI Query Azure Function for Pro Users
 * 
 * This function allows Pro users to query AI providers through the backend,
 * keeping API keys secure in Azure Key Vault. The function:
 * - Validates the user's authentication token
 * - Verifies the user is a Pro user
 * - Validates the prompt is diabetes-related
 * - Retrieves AI provider configuration from environment/Key Vault
 * - Makes the AI API call on behalf of the user
 * - Implements rate limiting and abuse detection
 * 
 * POST /api/ai/query
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 *   - Content-Type: application/json
 * 
 * Body:
 *   {
 *     "prompt": "AI prompt text",
 *     "provider": "perplexity" | "gemini" | "grok" | "deepseek" (optional)
 *   }
 * 
 * Response:
 *   - 200 OK: { success: true, content: string, provider: string }
 *   - 400 Bad Request: Invalid request (missing prompt, non-diabetes prompt)
 *   - 401 Unauthorized: Invalid or missing token
 *   - 403 Forbidden: Not a Pro user or rate limit exceeded
 *   - 500 Internal Server Error: Infrastructure error
 *   - 503 Service Unavailable: AI provider unavailable
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserInfoFromToken, getTableClient, isNotFoundError, getSecretFromKeyVault } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * Request body interface
 */
interface AIQueryRequest {
  prompt: string;
  provider?: string;
}

/**
 * AI provider configuration
 */
interface AIProviderConfig {
  provider: string;
  apiKey: string;
}

/**
 * Rate limit entry in Table Storage
 */
interface RateLimitEntry {
  partitionKey: string;
  rowKey: string;
  timestamp: Date;
  requestCount: number;
  lastRequestTime: Date;
}

/**
 * Rate limit configuration
 */
const MAX_REQUESTS_PER_WINDOW = 50; // Maximum 50 requests per hour per user

/**
 * Maximum prompt length
 */
const MAX_PROMPT_LENGTH = 50000; // Maximum 50,000 characters

/**
 * Keywords that must be present in diabetes-related prompts
 * This is a defense-in-depth measure to ensure the API is used only for its intended purpose
 */
const DIABETES_KEYWORDS = [
  'glucose',
  'blood sugar',
  'bg',
  'insulin',
  'diabetes',
  'diabetic',
  'cgm',
  'pump',
  'basal',
  'bolus',
  'hypo',
  'hyper',
  'glycemia',
  'a1c',
  'hba1c',
  'carb',
  'carbohydrate',
];

/**
 * Minimum number of diabetes keywords required in a prompt
 * This provides stricter validation to ensure prompts are genuinely diabetes-related
 */
const MIN_DIABETES_KEYWORDS_REQUIRED = 2;

/**
 * Determines whether a prompt contains enough diabetes-related keywords.
 *
 * @param prompt - The text to analyze for diabetes-related keywords
 * @returns `true` if the prompt contains at least MIN_DIABETES_KEYWORDS_REQUIRED diabetes-related keywords, `false` otherwise
 */
function validateDiabetesPrompt(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  const matchCount = DIABETES_KEYWORDS.filter(keyword => lowerPrompt.includes(keyword)).length;
  return matchCount >= MIN_DIABETES_KEYWORDS_REQUIRED;
}

/**
 * Encode a string so it is safe to use as an Azure Table Storage RowKey.
 *
 * @param str - The raw string to encode
 * @returns The URL-encoded representation of `str`
 */
function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

/**
 * Determine whether a Pro user with the given email exists in the ProUsers table.
 *
 * The email comparison is case-insensitive.
 *
 * @param email - The user's email address (treated case-insensitively)
 * @returns `true` if a matching ProUsers entry exists, `false` otherwise.
 * @throws Re-throws unexpected errors from the table client operations.
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
 * Generate the current UTC time window key used for rate limiting.
 *
 * @returns The time window key in `YYYY-MM-DD-HH` (UTC) format.
 */
function getCurrentWindowKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
}

/**
 * Determine whether a user's request is allowed under the current hourly rate limit and update the stored counters.
 *
 * Uses optimistic concurrency control with ETags to prevent race conditions where concurrent requests
 * could both read the same counter and exceed the limit. Implements retry logic with exponential backoff
 * for ETag conflicts. On unexpected errors reading or writing storage, the function logs the error and
 * allows the request (fails open).
 *
 * @returns `true` if the request is allowed, `false` if the rate limit has been exceeded for the current window
 */
async function checkRateLimit(
  tableClient: ReturnType<typeof getTableClient>,
  userId: string,
  context: InvocationContext
): Promise<boolean> {
  const windowKey = getCurrentWindowKey();
  const rowKey = `${urlEncode(userId)}_${windowKey}`;
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try to get existing rate limit entry with ETag
      const entity = await tableClient.getEntity<RateLimitEntry>('AIRateLimit', rowKey);
      
      const requestCount = (entity.requestCount as number) || 0;
      
      if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
        context.warn(`Rate limit exceeded for user ${userId}: ${requestCount} requests in current window`);
        return false;
      }
      
      // Update the counter with optimistic concurrency control using ETag
      try {
        await tableClient.updateEntity({
          partitionKey: 'AIRateLimit',
          rowKey,
          requestCount: requestCount + 1,
          lastRequestTime: new Date(),
        }, 'Replace', { etag: entity.etag });
        
        return true;
      } catch (updateError: unknown) {
        // Check for ETag mismatch (precondition failed)
        if (updateError && typeof updateError === 'object' && 'statusCode' in updateError && 
            (updateError as { statusCode: number }).statusCode === 412) {
          // ETag conflict - retry with exponential backoff
          if (attempt < maxRetries - 1) {
            const delayMs = Math.pow(2, attempt) * 50; // 50ms, 100ms, 200ms
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue; // Retry
          }
          context.warn(`Rate limit check failed after ${maxRetries} retries due to ETag conflicts for user ${userId}`);
          return true; // Fail open
        }
        throw updateError; // Re-throw other errors
      }
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        // First request in this window - create new entry
        try {
          await tableClient.createEntity({
            partitionKey: 'AIRateLimit',
            rowKey,
            requestCount: 1,
            lastRequestTime: new Date(),
            windowKey,
          });
          return true;
        } catch (createError: unknown) {
          // Entity might have been created by concurrent request
          if (createError && typeof createError === 'object' && 'statusCode' in createError && 
              (createError as { statusCode: number }).statusCode === 409) {
            // Already exists - retry the read-update flow
            if (attempt < maxRetries - 1) {
              continue; // Retry
            }
          }
          // On other create errors, fail open
          context.error('Rate limit create failed:', createError);
          return true;
        }
      }
      // On other errors, fail open but log the error
      context.error('Rate limit check failed:', error);
      return true;
    }
  }
  
  // If we exhausted retries, fail open
  context.warn(`Rate limit check exhausted retries for user ${userId}, allowing request`);
  return true;
}

/**
 * Determines which AI provider to use and retrieves its API key from Key Vault.
 *
 * If `requestedProvider` is provided it will be used; otherwise the `AI_PROVIDER`
 * environment variable or the default `perplexity` is used. The function validates
 * the provider against the supported set and reads the API key from a Key Vault
 * secret named by `AI_API_KEY_SECRET` (default `AI-API-Key`).
 *
 * @param requestedProvider - Optional provider override; one of `perplexity`, `gemini`, `grok`, or `deepseek`
 * @returns An `AIProviderConfig` containing `provider` and `apiKey`, or `null` if the provider is invalid or the API key could not be retrieved
 */
async function getAIProviderConfig(
  requestedProvider: string | undefined,
  context: InvocationContext
): Promise<AIProviderConfig | null> {
  // Get the provider to use
  const providerEnvKey = process.env.AI_PROVIDER || 'perplexity';
  const provider = requestedProvider || providerEnvKey;
  
  // Validate provider
  const validProviders = ['perplexity', 'gemini', 'grok', 'deepseek'];
  if (!validProviders.includes(provider)) {
    context.warn(`Invalid AI provider requested: ${provider}`);
    return null;
  }
  
  // Get API key from Key Vault
  // The secret name is determined by: AI_API_KEY_SECRET environment variable or default to 'AI-API-Key'
  const secretName = process.env.AI_API_KEY_SECRET || 'AI-API-Key';
  
  try {
    const apiKey = await getSecretFromKeyVault(undefined, secretName);
    
    if (!apiKey) {
      context.warn(`No API key found in Key Vault for secret: ${secretName}`);
      return null;
    }
    
    return { provider, apiKey };
  } catch (error) {
    context.error('Failed to retrieve AI API key from Key Vault:', error);
    return null;
  }
}

/**
 * Add Pro user confirmation marker (✨) to AI response content.
 *
 * This function programmatically adds the ✨ emoji to confirm the response is from
 * the Pro user backend. It attempts to insert it just before the "--- CONCLUSIO DATAE ---"
 * marker if present, otherwise prepends it to the beginning of the response.
 *
 * @param content - The AI response content to modify
 * @returns The modified content with the ✨ emoji added
 */
function addProUserMarker(content: string): string {
  const marker = '--- CONCLUSIO DATAE ---';
  const proEmoji = '✨';
  
  // Try to find the CONCLUSIO DATAE marker and add emoji before it
  const markerIndex = content.indexOf(marker);
  if (markerIndex !== -1) {
    // Insert emoji on a new line before the marker
    return content.substring(0, markerIndex) + `\n${proEmoji}\n` + content.substring(markerIndex);
  }
  
  // Fallback: prepend emoji at the beginning
  return `${proEmoji}\n${content}`;
}

/**
 * Send the prompt to a configured AI provider and return the provider's generated text.
 *
 * @param config - AI provider selection and API key used for the request (`provider` is one of 'perplexity' | 'gemini' | 'grok' | 'deepseek'; `apiKey` is the secret used for authentication)
 * @param prompt - The user prompt to send to the AI provider
 * @returns An object with `success: true` and `content` containing the provider's response on success; on failure `success: false` with `error` describing the failure and `errorType` categorizing the failure as one of: `configuration`, `provider`, `request`, or `network`
 */
async function callAIProvider(
  config: AIProviderConfig,
  prompt: string,
  context: InvocationContext
): Promise<{ success: boolean; content?: string; error?: string; errorType?: string }> {
  const { provider, apiKey } = config;
  
  try {
    // Build request based on provider
    let url: string;
    let requestBody: unknown;
    let headers: Record<string, string>;
    
    switch (provider) {
      case 'perplexity':
        url = 'https://api.perplexity.ai/chat/completions';
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        };
        requestBody = {
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specialized in diabetes management and glucose data analysis. Provide accurate, evidence-based information.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.2,
        };
        break;
        
      case 'gemini':
        // Gemini API supports authentication via x-goog-api-key header
        // This is more secure than URL parameters as it prevents key exposure in logs
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`;
        headers = {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        };
        requestBody = {
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful AI assistant specialized in diabetes management and glucose data analysis. Provide accurate, evidence-based information.\n\n${prompt}`,
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
        };
        break;
        
      case 'grok':
        url = 'https://api.x.ai/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        };
        requestBody = {
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specialized in diabetes management and glucose data analysis. Provide accurate, evidence-based information.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.2,
        };
        break;
        
      case 'deepseek':
        url = 'https://api.deepseek.com/chat/completions';
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        };
        requestBody = {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specialized in diabetes management and glucose data analysis. Provide accurate, evidence-based information.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.2,
        };
        break;
        
      default:
        return {
          success: false,
          error: `Unsupported provider: ${provider}`,
          errorType: 'configuration',
        };
    }
    
    // Make the API call
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      context.warn(`AI provider ${provider} returned error: ${response.status} ${errorText}`);
      
      return {
        success: false,
        error: `AI provider error: ${response.status}`,
        errorType: response.status >= 500 ? 'provider' : 'request',
      };
    }
    
    const data = await response.json();
    
    // Extract content based on provider response format
    let content: string | undefined;
    
    if (provider === 'gemini') {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      // OpenAI-compatible format (Perplexity, Grok, DeepSeek)
      content = data.choices?.[0]?.message?.content;
    }
    
    if (!content) {
      context.warn(`Could not extract content from ${provider} response`);
      return {
        success: false,
        error: 'Invalid response format from AI provider',
        errorType: 'provider',
      };
    }
    
    return {
      success: true,
      content,
    };
    
  } catch (error) {
    context.error(`Error calling AI provider ${provider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'network',
    };
  }
}

/**
 * Handle POST /api/ai/query by authenticating a Pro user, validating a diabetes-related prompt,
 * enforcing per-user rate limits, invoking the configured AI provider, and returning the generated content.
 *
 * @param request - Incoming HTTP request; body must be JSON with a `prompt` string and optional `provider`
 * @param context - Azure Functions invocation context used for logging and telemetry
 * @returns An HTTP response object containing `{ success: true, content, provider }` on success, or an error status and message on failure
 */
async function aiQuery(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
      requestLogger.logInfo('Non-Pro user attempted to use AI query endpoint', { userId });
      return requestLogger.logError('This feature is only available for Pro users.', 403, 'forbidden');
    }
    
    requestLogger.logInfo('Pro user verified', { userId });
    
    // Check rate limit
    const rateLimitTable = getTableClient('AIQueryLogs');
    const rateLimitOk = await checkRateLimit(rateLimitTable, userId, context);
    
    if (!rateLimitOk) {
      requestLogger.logInfo('Rate limit exceeded', { userId });
      return requestLogger.logError(
        'Rate limit exceeded. Please try again later.',
        429,
        'rate_limit'
      );
    }
    
    // Parse request body
    let requestBody: AIQueryRequest;
    try {
      const bodyText = await request.text();
      requestBody = JSON.parse(bodyText) as AIQueryRequest;
    } catch {
      return requestLogger.logError('Invalid JSON in request body', 400, 'validation');
    }
    
    const { prompt, provider } = requestBody;
    
    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return requestLogger.logError('Prompt is required', 400, 'validation');
    }
    
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return requestLogger.logError(`Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`, 400, 'validation');
    }
    
    // Validate prompt is diabetes-related (requires at least 2 keywords)
    if (!validateDiabetesPrompt(prompt)) {
      requestLogger.logInfo('Non-diabetes prompt rejected', { userId });
      return requestLogger.logError(
        `This endpoint is only for diabetes-related queries. Please ensure your prompt contains at least ${MIN_DIABETES_KEYWORDS_REQUIRED} relevant medical terms.`,
        400,
        'validation'
      );
    }
    
    // Validate prompt contains expected system role context (diabetes expert)
    // This ensures prompts follow the expected structure from the frontend
    const lowerPrompt = prompt.toLowerCase();
    const hasSystemContext = lowerPrompt.includes('diabetes') || 
                             lowerPrompt.includes('glucose') ||
                             lowerPrompt.includes('medical assistant') ||
                             lowerPrompt.includes('diabetes care') ||
                             lowerPrompt.includes('continuous glucose monitoring');
    
    if (!hasSystemContext) {
      requestLogger.logInfo('Prompt missing expected system context', { userId });
      return requestLogger.logError(
        'Invalid prompt structure. Prompts must include appropriate medical context.',
        400,
        'validation'
      );
    }
    
    // Get AI provider configuration
    const aiConfig = await getAIProviderConfig(provider, context);
    
    if (!aiConfig) {
      requestLogger.logError('AI provider configuration not available', 503, 'infrastructure');
      return requestLogger.logError(
        'AI service is temporarily unavailable. Please try again later.',
        503,
        'infrastructure'
      );
    }
    
    requestLogger.logInfo('Calling AI provider', { provider: aiConfig.provider, userId });
    
    // Call AI provider
    const aiResult = await callAIProvider(aiConfig, prompt, context);
    
    if (!aiResult.success) {
      requestLogger.logError(
        `AI provider call failed: ${aiResult.error}`,
        503,
        aiResult.errorType || 'provider'
      );
      return requestLogger.logError(
        'AI service error. Please try again later.',
        503,
        'provider'
      );
    }
    
    // Add Pro user confirmation marker (✨) to the response
    const markedContent = aiResult.content ? addProUserMarker(aiResult.content) : aiResult.content;
    
    requestLogger.logInfo('AI query completed successfully', {
      userId,
      provider: aiConfig.provider,
      promptLength: prompt.length,
      responseLength: markedContent?.length || 0,
    });
    
    return requestLogger.logSuccess({
      status: 200,
      jsonBody: {
        success: true,
        content: markedContent,
        provider: aiConfig.provider,
      },
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
app.http('aiQuery', {
  methods: ['POST'],
  route: 'ai/query',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: aiQuery,
});