# Azure Static Web Apps Deployment Guide

This guide explains how to deploy GlookoDataWebApp to Azure Static Web Apps (SWA).

## Overview

The GlookoDataWebApp is deployed as an Azure Static Web App, which provides:
- **Global CDN** - Fast content delivery worldwide
- **Free SSL certificates** - HTTPS by default
- **Custom domains** - Easy domain configuration
- **CI/CD integration** - Automatic deployments from GitHub
- **Linked Backend** - Azure Function App integration for API endpoints

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Static Web App                          │
│                   (wonderful-stone-071384103)                    │
│                                                                   │
│   ┌─────────────────┐          ┌─────────────────────┐          │
│   │   React SPA     │   /api/* │   Linked Backend    │          │
│   │   (Frontend)    │─────────▶│  (Function App)     │          │
│   │                 │          │                     │          │
│   └─────────────────┘          └─────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────┐
                              │   Azure Function    │
                              │  (glookodatawebapp- │
                              │       func)         │
                              └─────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────┐
                              │  Table Storage      │
                              │  (UserSettings)     │
                              └─────────────────────┘
```

## Prerequisites

Before deploying, ensure you have:

1. **Azure Account** with an active subscription
2. **GitHub Account** with this repository forked or accessible
3. **Appropriate Permissions**:
   - Contributor or Owner role on the Azure subscription
   - Admin access to the GitHub repository

## GitHub Actions Secrets Required

The deployment workflow requires the following secrets to be configured in GitHub:

| Secret Name | Description |
|-------------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WONDERFUL_STONE_071384103` | SWA deployment token |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Function App publish profile |
| `AZURE_CREDENTIALS` | Azure service principal credentials (JSON format) |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID for resource linking |

### Creating Azure Credentials

```bash
# Create a service principal with Contributor role
az ad sp create-for-rbac --name "GlookoDataWebApp-Deploy" \
  --role Contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/glookodatawebapp-rg \
  --sdk-auth
```

Copy the JSON output to the `AZURE_CREDENTIALS` secret.

## Deployment via GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to Azure Static Web Apps:

- **Workflow file**: `.github/workflows/azure-static-web-apps-wonderful-stone-071384103.yml`
- **Trigger**: Manual (workflow_dispatch)
- **Build**: Runs `npm run build` automatically
- **Deploy**: Deploys frontend to Static Web Apps, API to Function App, and links them

### What the Workflow Does

1. **Builds and deploys the React frontend** to Azure Static Web Apps
2. **Builds and deploys the API** to Azure Function App (`glookodatawebapp-func`)
3. **Links the Function App to the Static Web App** so that `/api/*` routes are proxied to the Function App
4. **Creates a GitHub release** with the version from package.json

## Manual Deployment via Azure Portal

1. Sign in to https://portal.azure.com
2. Create a new Static Web App
3. Connect to your GitHub repository
4. Configure build settings:
   - **Build Presets**: Vite
   - **App location**: `/` (root)
   - **Output location**: `dist`
5. Azure will automatically create a GitHub Actions workflow
6. **Link the backend** (see below)

### Linking the Function App Backend

If the backend is not linked, `/api/*` requests will return 404. To link manually:

```bash
# Login to Azure
az login

# Link the Function App to the Static Web App
az staticwebapp backends link \
  --name wonderful-stone-071384103 \
  --resource-group glookodatawebapp-rg \
  --backend-resource-id "/subscriptions/{subscription-id}/resourceGroups/glookodatawebapp-rg/providers/Microsoft.Web/sites/glookodatawebapp-func" \
  --backend-region eastus

# Verify the link
az staticwebapp backends list \
  --name wonderful-stone-071384103 \
  --resource-group glookodatawebapp-rg
```

## Configuration

The `staticwebapp.config.json` file configures:
- SPA routing with fallback to index.html
- Security headers
- MIME types for .zip and .json files
- Cache control for static assets
- API route headers (no caching for `/api/*`)

## Troubleshooting

### API Returns 404

If API calls to `/api/*` return 404:

1. **Check if backend is linked**:
   ```bash
   az staticwebapp backends list \
     --name wonderful-stone-071384103 \
     --resource-group glookodatawebapp-rg
   ```

2. **Verify the Function App is running**:
   ```bash
   az functionapp show \
     --name glookodatawebapp-func \
     --resource-group glookodatawebapp-rg \
     --query state
   ```

3. **Re-link the backend** using the commands above

### CORS Errors

The Function App is configured with CORS for the production domain. If you're getting CORS errors:

1. Check the Function App CORS settings in Azure Portal
2. Ensure your domain is in the allowed origins list

## Support

For issues, check:
- [GitHub Issues](https://github.com/iricigor/GlookoDataWebApp/issues)
- [Azure Static Web Apps documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Bring your own functions to Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/functions-bring-your-own)
