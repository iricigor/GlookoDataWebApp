# Pro Users AI Query Endpoint

This document describes the AI Query endpoint for Pro users and how to configure it.

## Overview

The `/api/ai/query` endpoint allows Pro users to access AI analysis functionality without exposing their API keys to the frontend. All AI provider credentials are securely stored in Azure Key Vault and accessed via the backend using managed identities.

## Architecture

```
Pro User (Frontend) 
    ↓ ID Token
Backend API (/api/ai/query)
    ↓ Validates Pro user status
    ↓ Validates prompt is diabetes-related
    ↓ Checks rate limit
    ↓ Retrieves API key from Key Vault
AI Provider API (Perplexity/Gemini/Grok/DeepSeek)
    ↓ Response
Backend API
    ↓ Response
Pro User (Frontend)
```

## Configuration

### Environment Variables

The following environment variables should be configured in your Azure Function App:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `STORAGE_ACCOUNT_NAME` | Azure Storage account name for tables | Yes | `glookodatastorage` |
| `AZURE_CLIENT_ID` | Managed identity client ID | Yes | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AZURE_AD_CLIENT_ID` | Azure App Registration client ID | Optional | `656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c` |
| `AI_PROVIDER` | Default AI provider to use | Optional (default: `perplexity`) | `perplexity`, `gemini`, `grok`, `deepseek` |
| `KEY_VAULT_NAME` | Name of the Key Vault | Optional (default: `glookodatawebapp-kv`) | `glookodatawebapp-kv` |
| `AI_API_KEY_SECRET` | Name of the secret in Key Vault containing the AI API key | Optional (default: `AI-API-Key`) | `AI-API-Key` |

### Azure Key Vault Setup

1. **Create or use existing Key Vault**: `glookodatawebapp-kv` (or your custom name)

2. **Add AI API Key Secret**:
   ```bash
   # For Perplexity
   az keyvault secret set --vault-name glookodatawebapp-kv --name AI-API-Key --value "pplx-your-api-key-here"
   
   # For Google Gemini
   az keyvault secret set --vault-name glookodatawebapp-kv --name AI-API-Key --value "AIzaSyYour-API-Key-Here"
   
   # For Grok
   az keyvault secret set --vault-name glookodatawebapp-kv --name AI-API-Key --value "xai-your-api-key-here"
   
   # For DeepSeek
   az keyvault secret set --vault-name glookodatawebapp-kv --name AI-API-Key --value "sk-your-api-key-here"
   ```

3. **Grant Function App access to Key Vault**:
   ```bash
   # Get the Function App's managed identity principal ID
   FUNCTION_PRINCIPAL_ID=$(az functionapp identity show --name glookodatawebapp-func --resource-group glookodata-rg --query principalId -o tsv)
   
   # Grant Key Vault Secrets User role
   az role assignment create \
     --role "Key Vault Secrets User" \
     --assignee $FUNCTION_PRINCIPAL_ID \
     --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/glookodata-rg/providers/Microsoft.KeyVault/vaults/glookodatawebapp-kv
   ```

### Azure Storage Tables

The endpoint requires the following tables:

1. **ProUsers Table**: Stores list of Pro users
   - PartitionKey: `"ProUser"`
   - RowKey: URL-encoded email (lowercase)
   - Email: User's email
   - CreatedAt: ISO 8601 timestamp

2. **AIQueryLogs Table**: Stores rate limit tracking
   - PartitionKey: `"AIRateLimit"`
   - RowKey: `{userId}_{windowKey}`
   - requestCount: Number of requests in current window
   - lastRequestTime: Timestamp of last request
   - windowKey: Time window identifier (YYYY-MM-DD-HH)

**Important**: The `AIQueryLogs` table must be created during deployment. Both deployment scripts (Bash and PowerShell) include this table in their default configuration.

### Managed Identity Permissions

The Function App's managed identity needs the following permissions:

1. **Storage Account**: `Storage Table Data Contributor` role
   ```bash
   az role assignment create \
     --role "Storage Table Data Contributor" \
     --assignee $FUNCTION_PRINCIPAL_ID \
     --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/glookodata-rg/providers/Microsoft.Storage/storageAccounts/glookodatastorage
   ```

2. **Key Vault**: `Key Vault Secrets User` role (see above)

## API Specification

### Endpoint

`POST /api/ai/query`

### Headers

- `Authorization: Bearer <id_token>` (required) - ID token from MSAL authentication
- `Content-Type: application/json`

### Request Body

```json
{
  "prompt": "Analyze this glucose data...",
  "provider": "perplexity"  // optional: "perplexity", "gemini", "grok", "deepseek"
}
```

**Important Notes:**
- The backend automatically adds a unified system prompt to all AI queries
- The system prompt defines the AI assistant's role as an expert endocrinologist
- Frontend prompts should include appropriate medical context for validation

**System Prompt (automatically added by backend):**
```
You are an expert endocrinologist specialized in type-1 diabetes and CGM/insulin pump data analysis. I am providing aggregated and anonymized data only — never guess or invent missing raw data points.
```

**Example Request:**
```json
{
  "prompt": "You are an expert endocrinologist specialized in type-1 diabetes and CGM/insulin pump data analysis. I am providing aggregated and anonymized data only — never guess or invent missing raw data points.\n\nThis analysis examines your continuous glucose monitoring (CGM) data to evaluate how well your blood glucose stays within the target range, helping identify areas for improvement in diabetes management.\n\nMy percent time-in-range (TIR) from continuous glucose monitoring is 65.4%, based on a target range of 3.9-10.0 mmol/L. My Time Above Range (>10.0 mmol/L) is 28.2%. Provide a brief assessment and 2-3 specific, actionable and behavioral recommendations to improve glucose management."
}
```

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "content": "AI analysis response...",
  "provider": "perplexity"
}
```

**Errors**:

| Status | Error Type | Description |
|--------|------------|-------------|
| 400 | validation | Invalid request (missing prompt, prompt too long, or non-diabetes prompt) |
| 401 | unauthorized | Invalid or missing authentication token |
| 403 | forbidden | User is not a Pro user |
| 429 | rate_limit | Rate limit exceeded (50 requests/hour) |
| 503 | infrastructure | Azure infrastructure error (storage, Key Vault unavailable) |
| 503 | provider | AI provider error |

Example error response:
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "errorType": "rate_limit"
}
```

## Rate Limiting

- **Window**: 1 hour (fixed window based on YYYY-MM-DD-HH format)
- **Limit**: 50 requests per user per window
- **Storage**: Azure Table Storage (AIQueryLogs table)
- **Enforcement**: Per user (based on userId from token)

## Prompt Validation

All prompts must contain at least **2 diabetes-related keywords** to prevent abuse:

**Valid keywords:**
- glucose, blood sugar, bg
- insulin, diabetes, diabetic
- cgm, pump
- basal, bolus
- hypo, hyper, glycemia
- a1c, hba1c
- carb, carbohydrate

**Example valid prompts:**
- "Analyze glucose trends with insulin doses" ✅ (2 keywords: glucose, insulin)
- "CGM data shows high BG levels" ✅ (2 keywords: cgm, bg)
- "Review basal and bolus insulin settings" ✅ (3 keywords: basal, bolus, insulin)

**Example invalid prompts:**
- "Analyze this data" ❌ (0 keywords)
- "Check glucose levels" ❌ (1 keyword, needs at least 2)
- "What's the weather like?" ❌ (0 keywords)

## Security Features

1. **Authentication**: Full JWT signature verification using Microsoft's JWKS endpoint
2. **Authorization**: Pro user status verified against ProUsers table
3. **Rate Limiting**: Per-user request limits prevent abuse
4. **Prompt Validation**: Ensures API is used only for diabetes-related queries
5. **Secret Management**: API keys stored in Azure Key Vault, never exposed to frontend
6. **Audit Logging**: All requests logged with correlation IDs
7. **Error Handling**: Comprehensive error handling prevents information disclosure

## Monitoring

### Key Metrics to Monitor

1. **Request Rate**: Monitor requests per user per hour
2. **Error Rate**: Track 4xx and 5xx errors
3. **Provider Performance**: Monitor response times from AI providers
4. **Rate Limit Hits**: Track how often users hit rate limits
5. **Failed Authentication**: Monitor unauthorized access attempts

### Logging

All requests are logged with:
- Correlation ID (x-correlation-id header)
- User ID (from token)
- Timestamp
- Request/response status
- Error details (if any)

### Example Queries

```kusto
// Find rate limit violations
AzureDiagnostics
| where FunctionName == "aiQuery"
| where Message contains "Rate limit exceeded"
| summarize count() by UserId, bin(TimeGenerated, 1h)

// Monitor AI provider errors
AzureDiagnostics
| where FunctionName == "aiQuery"
| where Message contains "AI provider error"
| summarize count() by ErrorType, bin(TimeGenerated, 1h)
```

## Testing

### Test with curl

```bash
# Get ID token from your frontend application
ID_TOKEN="your-id-token-here"

# Test Pro user AI query with example prompt including system context
curl -X POST https://your-app.azurewebsites.net/api/ai/query \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "You are an expert endocrinologist specialized in type-1 diabetes and CGM/insulin pump data analysis. I am providing aggregated and anonymized data only — never guess or invent missing raw data points.\n\nAnalyze glucose trends showing average of 120 mg/dL with 70% time in range. Provide brief assessment and recommendations."
  }'
```

### Test Pro User Status

Before using the AI query endpoint, verify the user is in the ProUsers table:

```bash
# Using Azure CLI
az storage entity show \
  --table-name ProUsers \
  --partition-key "ProUser" \
  --row-key "$(echo 'user@example.com' | jq -rR @uri)" \
  --account-name glookodatastorage
```

## Troubleshooting

### Common Issues

1. **503 Service Unavailable - Storage Not Configured**
   - Verify `STORAGE_ACCOUNT_NAME` environment variable is set
   - Check managed identity has Storage Table Data Contributor role

2. **503 Service Unavailable - Storage Access Denied**
   - Verify managed identity role assignments
   - Check Azure Storage firewall rules

3. **503 AI Service Temporarily Unavailable**
   - Verify Key Vault secret exists and contains valid API key
   - Check managed identity has Key Vault Secrets User role
   - Verify AI provider is not experiencing outages

4. **403 Forbidden - Not a Pro User**
   - Verify user's email is in ProUsers table
   - Check email normalization (should be lowercase)
   - Verify PartitionKey is "ProUser" and RowKey is URL-encoded email

5. **429 Rate Limit Exceeded**
   - User has exceeded 50 requests in the current hour
   - Wait for the next hour window
   - Check AIQueryLogs table for request history

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic Rate Limiting**: Adjust limits based on user tier or usage patterns
2. **Cost Tracking**: Track AI API costs per user
3. **Multiple API Keys**: Support rotating API keys for high availability
4. **Caching**: Cache similar prompts to reduce AI API calls
5. **Analytics Dashboard**: Real-time monitoring of usage and costs
6. **Scheduled Monitoring**: Automated health checks and alerts
7. **Provider Fallback**: Automatically switch providers on failures

## Related Documentation

- [API README](../README.md) - General API documentation
- [Deployment Scripts](../../scripts/README.md) - Infrastructure deployment
- [Pro Users Tab](../../src/pages/Settings/ProUsersTab.tsx) - Frontend Pro user management
- [Backend AI API Client](../../src/utils/api/backendAIApi.ts) - Frontend integration
