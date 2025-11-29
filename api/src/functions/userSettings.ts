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
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Expected audiences for ID token validation.
 */
const EXPECTED_AUDIENCES = [
  '656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c', // GlookoDataWebApp client ID
];

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

interface TokenClaims {
  aud?: string;
  oid?: string;
  sub?: string;
  exp?: number;
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
 * Validate and extract user ID from the ID token
 */
function extractUserIdFromToken(authHeader: string | null, context: InvocationContext): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    context.warn('Missing or invalid Authorization header format');
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      context.warn('Invalid JWT structure - expected 3 parts');
      return null;
    }

    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const claims: TokenClaims = JSON.parse(payload);

    if (!claims.aud) {
      context.warn('Token missing audience (aud) claim');
      return null;
    }

    if (!EXPECTED_AUDIENCES.includes(claims.aud)) {
      context.warn(`Token audience mismatch. Expected one of: ${EXPECTED_AUDIENCES.join(', ')}, got: ${claims.aud}`);
      return null;
    }

    if (claims.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (claims.exp < now) {
        context.warn('Token has expired');
        return null;
      }
    }

    const userId = claims.oid || claims.sub;
    if (!userId) {
      context.warn('Token missing user identifier (oid or sub claim)');
      return null;
    }

    return userId;
  } catch (error) {
    context.warn('Failed to parse token:', error);
    return null;
  }
}

/**
 * Get Table Storage client using managed identity
 */
function getTableClient(): TableClient {
  const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
  
  if (!storageAccountName) {
    throw new Error('STORAGE_ACCOUNT_NAME environment variable is not set');
  }

  const tableUrl = `https://${storageAccountName}.table.core.windows.net`;
  const credential = new DefaultAzureCredential();
  
  return new TableClient(tableUrl, 'UserSettings', credential);
}

/**
 * GET handler - Load user settings
 */
async function getUserSettings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing GET user/settings request');

  const authHeader = request.headers.get('authorization');
  const userId = extractUserIdFromToken(authHeader, context);

  if (!userId) {
    return {
      status: 401,
      jsonBody: {
        error: 'Unauthorized access. Please log in again.',
        errorType: 'unauthorized',
      },
    };
  }

  try {
    const tableClient = getTableClient();
    
    try {
      const entity = await tableClient.getEntity<UserSettingsEntity>('users', userId);
      
      if (!entity.settingsJson) {
        // User exists but has no settings saved yet
        return {
          status: 404,
          jsonBody: {
            error: 'No settings found',
            errorType: 'not_found',
          },
        };
      }

      const settings: CloudUserSettings = JSON.parse(entity.settingsJson);
      
      return {
        status: 200,
        jsonBody: { settings },
      };
    } catch (error: unknown) {
      // 404 means user doesn't exist
      if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
        return {
          status: 404,
          jsonBody: {
            error: 'No settings found',
            errorType: 'not_found',
          },
        };
      }
      throw error;
    }
  } catch (error: unknown) {
    context.error('Error loading user settings:', error);
    
    if (error instanceof Error && error.message.includes('STORAGE_ACCOUNT_NAME')) {
      return {
        status: 503,
        jsonBody: {
          error: 'Service unavailable - storage not configured',
          errorType: 'infrastructure',
        },
      };
    }

    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        errorType: 'infrastructure',
      },
    };
  }
}

/**
 * PUT handler - Save user settings
 */
async function putUserSettings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing PUT user/settings request');

  const authHeader = request.headers.get('authorization');
  const userId = extractUserIdFromToken(authHeader, context);

  if (!userId) {
    return {
      status: 401,
      jsonBody: {
        error: 'Unauthorized access. Please log in again.',
        errorType: 'unauthorized',
      },
    };
  }

  try {
    const body = await request.json() as SaveSettingsRequest;
    
    if (!body.settings) {
      return {
        status: 400,
        jsonBody: {
          error: 'Missing settings in request body',
          errorType: 'validation',
        },
      };
    }

    const tableClient = getTableClient();
    const now = new Date().toISOString();

    // Try to get existing entity to preserve firstLoginDate
    let firstLoginDate = now;
    try {
      const existing = await tableClient.getEntity<UserSettingsEntity>('users', userId);
      firstLoginDate = existing.firstLoginDate || now;
    } catch {
      // Entity doesn't exist, use current time as firstLoginDate
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
    
    context.log(`Settings saved for user ${userId}`);
    
    return {
      status: 200,
      jsonBody: { success: true },
    };

  } catch (error: unknown) {
    context.error('Error saving user settings:', error);
    
    if (error instanceof Error && error.message.includes('STORAGE_ACCOUNT_NAME')) {
      return {
        status: 503,
        jsonBody: {
          error: 'Service unavailable - storage not configured',
          errorType: 'infrastructure',
        },
      };
    }

    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        errorType: 'infrastructure',
      },
    };
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
    return {
      status: 405,
      jsonBody: { error: 'Method not allowed' },
    };
  }
}

// Register the function with Azure Functions v4
app.http('userSettings', {
  methods: ['GET', 'PUT'],
  route: 'user/settings',
  authLevel: 'anonymous', // We handle auth manually via Bearer token
  handler: userSettingsHandler,
});
