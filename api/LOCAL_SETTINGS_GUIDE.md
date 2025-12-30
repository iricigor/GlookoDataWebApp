# Local Settings Configuration Guide

This guide explains the settings in `local.settings.json` for local development.

## Required Settings

### `AzureWebJobsStorage`
Azure Storage connection string for the Functions runtime.
- **Required for**: Function runtime storage
- **Format**: Connection string
- **Example**: `DefaultEndpointsProtocol=https;AccountName=...`

### `FUNCTIONS_WORKER_RUNTIME`
The Functions runtime language.
- **Value**: `node`
- **Fixed**: Do not change

### `STORAGE_ACCOUNT_NAME`
Name of the Azure Storage Account containing your tables.
- **Required for**: Table Storage access (UserSettings, ProUsers, etc.)
- **Format**: Storage account name
- **Example**: `glookodatawebappstorage`

### `AZURE_CLIENT_ID`
Client ID of the User-Assigned Managed Identity.
- **Required for**: Managed Identity authentication
- **Format**: GUID
- **Example**: `12345678-1234-1234-1234-123456789abc`

## Optional Settings

### `AZURE_AD_CLIENT_ID`
Azure AD App Registration client ID for JWT validation.
- **Required for**: Custom JWT audience validation
- **Default**: Falls back to hardcoded Glooko client ID if not set
- **Format**: GUID

### `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
Google OAuth credentials for Google Sign-In integration.
- **Required for**: Google authentication flow
- **Format**: Google OAuth client credentials
- **Setup**: See [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)

### `APPLICATIONINSIGHTS_WORKSPACE_ID`
Azure Application Insights Log Analytics Workspace ID.
- **Required for**: `/api/glookoAdmin/stats/traffic` endpoint only
- **Optional**: Other endpoints work without it
- **Format**: GUID (Log Analytics Workspace ID, not the Instrumentation Key)
- **Setup**: See [`docs/APPLICATION_INSIGHTS_SETUP.md`](../docs/APPLICATION_INSIGHTS_SETUP.md)
- **Note**: The traffic stats endpoint returns 503 if this is not configured

## Setup Instructions

1. Copy the template:
   ```bash
   cp local.settings.json.template local.settings.json
   ```

2. Fill in the required values from your Azure resources

3. Add optional values as needed for the features you're testing

4. Never commit `local.settings.json` to source control (it's in .gitignore)

## References

- [Azure Functions local settings](https://learn.microsoft.com/azure/azure-functions/functions-develop-local#local-settings-file)
- [Application Insights Setup Guide](../docs/APPLICATION_INSIGHTS_SETUP.md)
- [Main API README](./README.md)
