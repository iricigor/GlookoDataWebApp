# Azure Table Storage Deployment Guide

> **⚠️ DEPRECATED:** This guide is kept for reference only. Please use the new [DEPLOYMENT.md](DEPLOYMENT.md) guide for comprehensive deployment instructions with the reorganized scripts.

This guide explains how to deploy and configure Azure Table Storage for storing user settings in GlookoDataWebApp.

## ⚠️ Updated Documentation

**This document is deprecated.** For the latest deployment instructions, see:
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Comprehensive deployment guide with updated scripts
- **[deployment/README.md](../scripts/deployment/README.md)** - Deployment scripts documentation

The deployment scripts have been reorganized and split into:
- `deploy-azure-storage-account.sh` - Creates storage account
- `deploy-azure-user-settings-table.sh` - Creates UserSettings table
- `deploy-azure-pro-users-table.sh` - Creates ProUsers table (optional)

## Overview

GlookoDataWebApp uses Azure Table Storage to persist user settings for authenticated users. This enables users to access their preferences across devices and browsers.

## What Gets Stored

The following settings are stored for authenticated users:

- **Theme preference** (light/dark/system)
- **Export format** (CSV/TSV)
- **Glucose thresholds** (veryHigh, high, low, veryLow values)

**Note**: API keys and uploaded files are NOT stored for security and privacy reasons.

## Prerequisites

Before deploying, ensure you have:

1. **Azure Account** with an active subscription
2. **Azure CLI** installed (or use Azure Cloud Shell)
3. **Appropriate permissions** to create resources in Azure
4. **Azure Static Web App** already deployed (for the main application)

## Deployment Steps

> **Note:** The instructions below reference old script names. Use the new scripts in `scripts/deployment/` directory instead. See [DEPLOYMENT.md](DEPLOYMENT.md) for current instructions.

### Step 1: Deploy Azure Table Storage

Run the deployment scripts in Azure Cloud Shell or locally with Azure CLI:

```bash
cd scripts/deployment

# Run these in order:
./deploy-azure-storage-account.sh
./deploy-azure-user-settings-table.sh
```

The scripts will:
- Create a resource group (if it doesn't exist)
- Create a storage account with Table Storage
- Create the UserSettings table
- Configure CORS for browser access
- Display connection strings and keys

**Important**: Save the connection string and storage key displayed at the end. You'll need them for the next step.

### Step 2: Configure Azure Static Web App

Add the storage connection string to your Static Web App configuration:

#### Option A: Using Azure Portal

1. Navigate to your Static Web App in Azure Portal
2. Go to **Settings** → **Configuration**
3. Add a new application setting:
   - **Name**: `AZURE_STORAGE_CONNECTION_STRING`
   - **Value**: (paste the connection string from Step 1)
4. Click **Save**

#### Option B: Using Azure CLI

```bash
az staticwebapp appsettings set \
  --name <your-static-web-app-name> \
  --setting-names AZURE_STORAGE_CONNECTION_STRING="<connection-string-from-step-1>"
```

### Step 3: Deploy staticwebapp.config.json

The `staticwebapp.config.json` file in the repository root is automatically deployed with your Static Web App. It configures:

- Data API Builder integration with Table Storage
- Authentication requirements for settings API
- CORS policies
- Security headers

Ensure this file is included in your deployment.

### Step 4: Verify Deployment

1. Deploy your application to Azure Static Web Apps
2. Log in with a Microsoft account
3. Change some settings (theme, export format, glucose thresholds)
4. Log out and log back in
5. Verify your settings are persisted

## Architecture

### Data Flow

```
User Browser
    ↓
    Login (MSAL/Microsoft Auth)
    ↓
    Authenticated Request to /api/data/UserSettings
    ↓
    Azure Static Web Apps (validates auth token)
    ↓
    Data API Builder (processes request)
    ↓
    Azure Table Storage (stores/retrieves settings)
```

### Security Model

1. **Authentication**: Users must be authenticated via Microsoft account (MSAL)
2. **Authorization**: Only authenticated users can access their settings
3. **Data Isolation**: Users can only access their own settings (enforced by Data API Builder)
4. **Transport Security**: All communications use HTTPS/TLS
5. **No Secrets in Code**: Connection strings stored as environment variables

## Table Schema

The UserSettings table uses the following schema:

| Column | Type | Description |
|--------|------|-------------|
| PartitionKey | String | User email (from authenticated account) |
| RowKey | String | Fixed value: "settings" |
| ThemeMode | String | "light", "dark", or "system" |
| ExportFormat | String | "csv" or "tsv" |
| GlucoseThresholds | JSON String | Serialized glucose threshold values |
| Timestamp | DateTime | Auto-managed by Azure Table Storage |

## API Endpoints

After deployment, the following endpoints are available:

### Get User Settings
```
GET /api/data/UserSettings
Authorization: Bearer <auth-token>
```

### Create/Update User Settings
```
POST /api/data/UserSettings
Authorization: Bearer <auth-token>
Content-Type: application/json

{
  "PartitionKey": "user@example.com",
  "RowKey": "settings",
  "ThemeMode": "dark",
  "ExportFormat": "csv",
  "GlucoseThresholds": "{\"veryHigh\":13.9,\"high\":10.0,\"low\":3.9,\"veryLow\":3.0}"
}
```

## Local Development

For local development, the application falls back to browser cookies when Azure Table Storage is not available. This allows developers to work without Azure credentials.

To test with Azure Table Storage locally:

1. Set the `AZURE_STORAGE_CONNECTION_STRING` environment variable
2. Run the Static Web App CLI (SWA CLI) for local development
3. Or use the Azure Functions Core Tools

## Troubleshooting

### Connection String Issues

If you see connection errors:

1. Verify the connection string is correct in Static Web App configuration
2. Check the storage account is accessible
3. Ensure CORS is configured correctly

### Authentication Issues

If authentication fails:

1. Verify Microsoft authentication is working (see App Registration setup)
2. Check that the user is logged in before accessing settings
3. Review browser console for authentication errors

### Data Not Persisting

If settings don't persist:

1. Check browser console for API errors
2. Verify the user is authenticated
3. Check Azure Portal → Storage Account → Tables to see if data is being written
4. Review Application Insights logs in Azure

## Cost Considerations

Azure Table Storage pricing (as of 2024):

- **Storage**: ~$0.045 per GB per month
- **Transactions**: ~$0.00036 per 10,000 transactions

For a typical user:
- Storage per user: <1 KB
- Transactions: ~10-50 per session

**Estimated cost for 1,000 users**: <$1/month

## Security Best Practices

1. **Never commit connection strings** to source control
2. **Use Managed Identity** in production when possible
3. **Rotate storage keys** periodically
4. **Monitor access logs** for suspicious activity
5. **Enable Azure Storage analytics** for auditing
6. **Use HTTPS only** (enforced in staticwebapp.config.json)
7. **Implement rate limiting** if needed for production scale

## Cleanup

To remove the Azure resources:

```bash
# Delete the entire resource group
az group delete --name glookodatawebapp-rg --yes

# Or delete just the storage account
az storage account delete \
  --name glookodatawebappstorage \
  --resource-group glookodatawebapp-rg \
  --yes
```

## Additional Resources

- [Azure Table Storage Documentation](https://docs.microsoft.com/azure/storage/tables/)
- [Azure Static Web Apps Configuration](https://docs.microsoft.com/azure/static-web-apps/configuration)
- [Data API Builder Documentation](https://learn.microsoft.com/azure/data-api-builder/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)

## Support

For issues or questions:

1. Check the [project issues](https://github.com/iricigor/GlookoDataWebApp/issues)
2. Review the [Azure Static Web Apps documentation](https://docs.microsoft.com/azure/static-web-apps/)
3. Create a new issue with the `azure` label

---

**Last Updated**: November 2024
