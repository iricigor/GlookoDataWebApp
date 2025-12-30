# GlookoDataWebApp API

This directory contains the Azure Functions backend API for the GlookoDataWebApp.

## Overview

The API provides backend services for the GlookoDataWebApp, including:
- User authentication and first-login detection
- User settings management (via Azure Table Storage)

## Prerequisites

- Node.js 20+
- Azure Functions Core Tools v4
- Azure subscription (for deployment)

## Local Development

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the local settings template:
   ```bash
   cp local.settings.json.template local.settings.json
   ```

3. Update `local.settings.json` with your Azure Storage connection info

4. Build the project:
   ```bash
   npm run build
   ```

### Running Locally

```bash
npm start
```

The API will be available at `http://localhost:7071/api/`

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/check-first-login` | GET | Check if user is logging in for the first time |
| `/api/user/settings` | GET, PUT | Load and save user settings |
| `/api/user/check-pro-status` | GET | Check if user is a Pro user |
| `/api/glookoAdmin/stats/logged-in-users` | GET | Get count of logged-in users (Pro users only) |
| `/api/glookoAdmin/stats/traffic` | GET | Get API/web traffic statistics (Pro users only, **requires Application Insights**) |

**Note:** The `/api/glookoAdmin/stats/traffic` endpoint requires Application Insights to be configured. See [Application Insights Setup Guide](../docs/APPLICATION_INSIGHTS_SETUP.md) for instructions.

## Deployment

The API is automatically deployed to Azure Functions via GitHub Actions when changes are pushed to the main branch.

### Manual Deployment

1. Ensure Azure CLI is installed and you're logged in:
   ```bash
   az login
   ```

2. Deploy using Azure Functions Core Tools:
   ```bash
   func azure functionapp publish glookodatawebapp-func
   ```

## Project Structure

```
api/
├── host.json                 # Azure Functions host configuration
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── local.settings.json.template  # Local settings template
├── .funcignore               # Files to ignore during deployment
└── src/
    ├── functions/
    │   ├── checkFirstLogin.ts  # First login check function
    │   └── userSettings.ts     # User settings CRUD operations
    └── utils/
        └── azureUtils.ts       # Shared utilities for JWT validation, Table Storage access
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STORAGE_ACCOUNT_NAME` | Azure Storage account name | Yes |
| `AZURE_CLIENT_ID` | Managed identity client ID | Yes (for managed identity) |
| `AZURE_AD_CLIENT_ID` | Azure App Registration client ID | Optional (for JWT audience validation, falls back to hardcoded ID) |
| `APPLICATIONINSIGHTS_WORKSPACE_ID` | Azure Application Insights Log Analytics Workspace ID | Optional (required for traffic statistics endpoint) |

**Note:** The `APPLICATIONINSIGHTS_WORKSPACE_ID` is only required for the `/api/glookoAdmin/stats/traffic` endpoint. If not configured, this endpoint will return a 503 error. See [Application Insights Setup Guide](../docs/APPLICATION_INSIGHTS_SETUP.md) for detailed configuration instructions.

### Azure Resources

The API requires:
- **Azure Storage Account** with a `UserSettings` table
- **Managed Identity** with `Storage Table Data Contributor` role
- **App Registration** for user authentication (client ID used for JWT validation)

Deploy these using the scripts in `scripts/deployment-cli/` or `scripts/deployment-ps/`.

## Security

- Uses Azure Managed Identity for secure access to Table Storage
- **Full JWT signature verification** using Microsoft's JWKS endpoint for production security
- Validates token audience, issuer, and expiration claims
- Automatic key rotation support via JWKS caching
- Bearer token authentication for API requests
- No secrets stored in code or configuration files

## Related Documentation

- [First Login API](../docs/FIRST_LOGIN_API.md) - Detailed API documentation
- [Deployment Guide](../docs/DEPLOYMENT.md) - Full deployment instructions
- [Deployment Scripts](../scripts/README.md) - Azure infrastructure scripts
