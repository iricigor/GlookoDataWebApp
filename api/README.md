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
    └── functions/
        └── checkFirstLogin.ts  # First login check function
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STORAGE_ACCOUNT_NAME` | Azure Storage account name | Yes |
| `AZURE_CLIENT_ID` | Managed identity client ID | Yes (for managed identity) |

### Azure Resources

The API requires:
- **Azure Storage Account** with a `UserSettings` table
- **Managed Identity** with `Storage Table Data Contributor` role

Deploy these using the scripts in `scripts/deployment-cli/` or `scripts/deployment-ps/`.

## Security

- Uses Azure Managed Identity for secure access to Table Storage
- Bearer token authentication for API requests
- No secrets stored in code or configuration files

## Related Documentation

- [First Login API](../docs/FIRST_LOGIN_API.md) - Detailed API documentation
- [Deployment Guide](../docs/DEPLOYMENT.md) - Full deployment instructions
- [Deployment Scripts](../scripts/README.md) - Azure infrastructure scripts
