/**
 * User Settings Azure Functions
 * 
 * These functions handle saving and loading user settings from Azure Table Storage.
 * 
 * PUT /api/user/settings - Save user settings
 * GET /api/user/settings - Load user settings
 * 
 * Headers:
 *   - Authorization: Bearer <id_token> (required)
 * 
 * PUT Body:
 *   {
 *     settings: CloudUserSettings,
 *     email: string
 *   }
 * 
 * Response:
 *   - 200 OK: Success (for PUT) or { settings: CloudUserSettings } (for GET)
 *   - 401 Unauthorized: Invalid or missing token
 *   - 404 Not Found: No settings found (for GET)
 *   - 500 Internal Server Error: Infrastructure error
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { extractUserIdFromToken, getTableClient, isNotFoundError } from "../utils/azureUtils";
import { createRequestLogger } from "../utils/logger";

/**
 * Cloud user settings type (should match frontend type)
 */
interface CloudUserSettings {
  themeMode: 'light' | 'dark' | 'system';
  exportFormat: 'csv' | 'tsv';
  responseLanguage: 'english' | 'czech' | 'german' | 'serbian';
  glucoseUnit: 'mmol/L' | 'mg/dL';
  insulinDuration: number;
  glucoseThresholds: {
    veryHigh: number;
    high: number;
    low: number;
    veryLow: number;
  };
}

/**
 * Request body for saving settings
 */
interface SaveSettingsRequest {
  settings: CloudUserSettings;
  email: string;
}

/**
 * User settings entity stored in Table Storage
 */
interface UserSettingsEntity {
  partitionKey: string;
  rowKey: string;
  email?: string;
  firstLoginDate?: string;
  lastLoginDate?: string;
  settingsJson?: string; // Compact JSON string of CloudUserSettings
}

/**
 * GET handler - Load user settings
 */
async function getUserSettings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const requestLogger = createRequestLogger(request, context);
  requestLogger.logStart();

  const authHeader = request.headers.get('authorization');
  const userId = await extractUserIdFromToken(authHeader, context);

  if (!userId) {
    requestLogger.logAuth(false, undefined, 'Invalid or missing token');
    return requestLogger.logError('Unauthorized access. Please log in again.', 401, 'unauthorized');
  }

  requestLogger.logAuth(true, userId);

  try {
    const tableClient = getTableClient();
    
    try {
      const entity = await tableClient.getEntity<UserSettingsEntity>('users', userId);
      requestLogger.logStorage('getEntity', true, { userId });
      
      if (!entity.settingsJson) {
        // User exists but has no settings saved yet
        requestLogger.logInfo('User found but no settings saved', { userId });
        return requestLogger.logSuccess({
          status: 404,
          jsonBody: {
            error: 'No settings found',
            errorType: 'not_found',
          },
        });
      }

      const settings: CloudUserSettings = JSON.parse(entity.settingsJson);
      requestLogger.logInfo('Settings loaded successfully', { userId, settingsFound: true });
      
      return requestLogger.logSuccess({
        status: 200,
        jsonBody: { settings },
      });
    } catch (error: unknown) {
      // 404 means user doesn't exist
      if (isNotFoundError(error)) {
        requestLogger.logInfo('User not found in storage', { userId });
        return requestLogger.logSuccess({
          status: 404,
          jsonBody: {
            error: 'No settings found',
            errorType: 'not_found',
          },
        });
      }
      throw error;
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('STORAGE_ACCOUNT_NAME')) {
      requestLogger.logStorage('getTableClient', false, { error: 'STORAGE_ACCOUNT_NAME not configured' });
      return requestLogger.logError('Service unavailable - storage not configured', 503, 'infrastructure');
    }

    requestLogger.logStorage('getEntity', false, { error: error instanceof Error ? error.message : 'Unknown error' });
    return requestLogger.logError(error, 500, 'infrastructure');
  }
}

/**
 * PUT handler - Save user settings
 */
async function putUserSettings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const requestLogger = createRequestLogger(request, context);
  requestLogger.logStart();

  const authHeader = request.headers.get('authorization');
  const userId = await extractUserIdFromToken(authHeader, context);

  if (!userId) {
    requestLogger.logAuth(false, undefined, 'Invalid or missing token');
    return requestLogger.logError('Unauthorized access. Please log in again.', 401, 'unauthorized');
  }

  requestLogger.logAuth(true, userId);

  try {
    const body = await request.json() as SaveSettingsRequest;
    
    if (!body.settings) {
      requestLogger.logWarn('Missing settings in request body');
      return requestLogger.logError('Missing settings in request body', 400, 'validation');
    }

    const tableClient = getTableClient();
    const now = new Date().toISOString();

    // Try to get existing entity to preserve firstLoginDate
    let firstLoginDate = now;
    let isNewUser = true;
    try {
      const existing = await tableClient.getEntity<UserSettingsEntity>('users', userId);
      firstLoginDate = existing.firstLoginDate || now;
      isNewUser = false;
      requestLogger.logStorage('getEntity', true, { userId, existingUser: true });
    } catch {
      // Entity doesn't exist, use current time as firstLoginDate
      requestLogger.logInfo('New user - will create entity', { userId });
    }

    // Upsert the entity (create or update)
    const entity: UserSettingsEntity = {
      partitionKey: 'users',
      rowKey: userId,
      email: body.email || '',
      firstLoginDate,
      lastLoginDate: now,
      settingsJson: JSON.stringify(body.settings),
    };

    await tableClient.upsertEntity(entity, 'Replace');
    requestLogger.logStorage('upsertEntity', true, { userId, isNewUser });
    requestLogger.logInfo('Settings saved successfully', { userId });
    
    return requestLogger.logSuccess({
      status: 200,
      jsonBody: { success: true },
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('STORAGE_ACCOUNT_NAME')) {
      requestLogger.logStorage('getTableClient', false, { error: 'STORAGE_ACCOUNT_NAME not configured' });
      return requestLogger.logError('Service unavailable - storage not configured', 503, 'infrastructure');
    }

    requestLogger.logStorage('upsertEntity', false, { error: error instanceof Error ? error.message : 'Unknown error' });
    return requestLogger.logError(error, 500, 'infrastructure');
  }
}

/**
 * Main handler that routes to GET or PUT
 */
async function userSettingsHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'GET') {
    return getUserSettings(request, context);
  } else if (request.method === 'PUT') {
    return putUserSettings(request, context);
  } else {
    const requestLogger = createRequestLogger(request, context);
    return requestLogger.logError('Method not allowed', 405, 'validation');
  }
}

// Register the function with Azure Functions v4
app.http('userSettings', {
  methods: ['GET', 'PUT'],
  route: 'user/settings',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: userSettingsHandler,
});
