# Azure Deployment Guide

This comprehensive guide explains how to deploy all Azure resources needed for the GlookoDataWebApp, including authentication, table storage, and application settings.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Scripts](#deployment-scripts)
  - [1. Azure App Registration](#1-azure-app-registration)
  - [2. Azure Storage Account](#2-azure-storage-account)
  - [3. UserSettings Table](#3-usersettings-table)
  - [4. ProUsers Table (Optional)](#4-prousers-table-optional)
- [Running Scripts from Azure Portal](#running-scripts-from-azure-portal)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Cost Estimation](#cost-estimation)

## Overview

The GlookoDataWebApp uses Azure services for:
- **Microsoft Authentication** - User sign-in with personal Microsoft accounts
- **Table Storage** - Storing user preferences across devices
- **Static Web Apps** - Hosting the web application

All scripts are designed to be idempotent and can be run multiple times safely.

## Prerequisites

Before deploying, ensure you have:

1. **Azure Account** with an active subscription
2. **Appropriate Permissions**:
   - Contributor or Owner role on the subscription
   - Application Administrator role for App Registrations
3. **Azure Cloud Shell Access** (recommended) or local Azure CLI installed

## Quick Start

For a complete deployment, run these scripts in order:

```bash
# 1. Set up authentication
./deploy-azure-app-registration.sh

# 2. Create storage account
./deploy-azure-storage-account.sh

# 3. Create UserSettings table
./deploy-azure-user-settings-table.sh

# 4. (Optional) Create ProUsers table
./deploy-azure-pro-users-table.sh
```

## Deployment Scripts

All deployment scripts are located in the `scripts/deployment/` directory.

### 1. Azure App Registration

**Script:** `deploy-azure-app-registration.sh`

**Purpose:** Creates and configures an Azure App Registration for Microsoft authentication.

**What it does:**
- Creates app registration in Microsoft Entra ID
- Configures redirect URIs for production and development
- Sets up API permissions (openid, profile, email, User.Read)
- Configures for personal Microsoft accounts only

**Output:** Application (client) ID and Tenant ID needed for app configuration

**Documentation:** See [AZURE_APP_REGISTRATION.md](AZURE_APP_REGISTRATION.md) for detailed information

### 2. Azure Storage Account

**Script:** `deploy-azure-storage-account.sh`

**Purpose:** Creates Azure Storage Account and resource group.

**What it does:**
- Creates resource group (if it doesn't exist)
- Creates storage account with secure defaults
- Retrieves connection string and storage key
- Displays configuration information

**Output:** Connection string and storage key for next steps

**Run Time:** ~2-3 minutes

### 3. UserSettings Table

**Script:** `deploy-azure-user-settings-table.sh`

**Purpose:** Creates UserSettings table for storing user preferences.

**Prerequisites:** Must run `deploy-azure-storage-account.sh` first

**What it does:**
- Creates UserSettings table in the storage account
- Configures CORS for browser access
- Sets up table for user preferences storage

**Table Schema:**
- `PartitionKey`: User email (from authenticated account)
- `RowKey`: Fixed value "settings"
- `ThemeMode`: "light", "dark", or "system"
- `ExportFormat`: "csv" or "tsv"
- `GlucoseThresholds`: JSON string with threshold values

**Run Time:** ~30 seconds

### 4. ProUsers Table (Optional)

**Script:** `deploy-azure-pro-users-table.sh`

**Purpose:** Creates ProUsers table for future professional user management features.

**Prerequisites:** Must run `deploy-azure-storage-account.sh` first

**What it does:**
- Creates ProUsers table in the storage account
- Placeholder for future user management features

**Note:** This is a template for future implementation. The table structure and usage will be defined when professional user features are implemented.

**Run Time:** ~30 seconds

## Running Scripts from Azure Portal

You can run deployment scripts directly from Azure Cloud Shell without downloading files:

### Method 1: Using curl (Recommended)

```bash
# 1. Open Azure Cloud Shell (https://shell.azure.com)
# 2. Select Bash environment
# 3. Run the following commands for each script:

# Download script from GitHub (main branch)
curl -o deploy-script.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-app-registration.sh

# Make executable
chmod +x deploy-script.sh

# (Optional) Edit if needed
nano deploy-script.sh

# Run the script
./deploy-script.sh
```

### Method 2: Direct Execution (One-liner)

```bash
# Download and execute in one command (use with caution)
curl -s https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-app-registration.sh | bash
```

### Complete Deployment Example

Here's a complete example deploying all components:

```bash
# Open Azure Cloud Shell and select Bash

# 1. Deploy App Registration
curl -o deploy-app-reg.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-app-registration.sh
chmod +x deploy-app-reg.sh
./deploy-app-reg.sh

# 2. Deploy Storage Account
curl -o deploy-storage.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-storage-account.sh
chmod +x deploy-storage.sh
./deploy-storage.sh

# 3. Deploy UserSettings Table
curl -o deploy-user-settings.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-user-settings-table.sh
chmod +x deploy-user-settings.sh
./deploy-user-settings.sh

# 4. (Optional) Deploy ProUsers Table
curl -o deploy-pro-users.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-pro-users-table.sh
chmod +x deploy-pro-users.sh
./deploy-pro-users.sh
```

### Customizing Scripts Before Running

If you need to customize scripts (e.g., change region, app name):

```bash
# Download script
curl -o deploy-storage.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-storage-account.sh

# Make executable
chmod +x deploy-storage.sh

# Edit configuration using your preferred editor
```

**Choose an editor:**

**Option 1: nano (recommended for beginners)**
```bash
nano deploy-storage.sh

# Navigate with arrow keys
# Edit these lines:
#   readonly LOCATION="eastus"          # Change to your preferred region
#   readonly APP_NAME="glookodatawebapp"  # Change app name if needed

# Save: Ctrl+O, then Enter
# Exit: Ctrl+X
```

**Option 2: vi/vim (for advanced users)**
```bash
vi deploy-storage.sh

# Press 'i' to enter insert mode
# Make your changes
# Press 'Esc' to exit insert mode
# Type ':wq' and press Enter to save and quit
```

**Option 3: Cloud Shell code editor**
```bash
code deploy-storage.sh

# Edit in the browser-based editor
# Save: Ctrl+S (Windows/Linux) or Cmd+S (Mac)
# Close the editor tab when done
```

**Then run the script:**
```bash
./deploy-storage.sh
```

### Script URLs Reference

All scripts are available at:
```
https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]
```

Available scripts:
- `deploy-azure-app-registration.sh`
- `deploy-azure-storage-account.sh`
- `deploy-azure-user-settings-table.sh`
- `deploy-azure-pro-users-table.sh`

## Configuration

### App Configuration

After running the deployment scripts, configure your application:

#### 1. Microsoft Authentication

Add the following to your app configuration:

```javascript
const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID_FROM_SCRIPT",
    authority: "https://login.microsoftonline.com/consumers",
    redirectUri: "https://glooko.iric.online"
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};
```

#### 2. Azure Static Web App Settings

Configure environment variables in your Static Web App:

**Using Azure Portal:**
1. Navigate to your Static Web App
2. Go to Settings → Configuration
3. Add: `AZURE_STORAGE_CONNECTION_STRING` = (connection string from script)

**Using Azure CLI:**
```bash
az staticwebapp appsettings set \
  --name <your-static-web-app-name> \
  --setting-names AZURE_STORAGE_CONNECTION_STRING="<connection-string>"
```

#### 3. staticwebapp.config.json

The `staticwebapp.config.json` file is automatically deployed with your app. It configures:
- Data API Builder integration
- Authentication requirements
- CORS policies
- Security headers

## Verification

### Verify App Registration

```bash
# List app registrations
az ad app list --display-name "GlookoDataWebApp"

# Check redirect URIs
az ad app show --id <app-id> --query web.redirectUris
```

### Verify Storage Resources

```bash
# Check resource group
az group show --name glookodatawebapp-rg

# Check storage account
az storage account show --name glookodatawebappstorage --resource-group glookodatawebapp-rg

# List tables
az storage table list --connection-string "<connection-string>"
```

### Test the Application

1. Navigate to [https://glooko.iric.online](https://glooko.iric.online)
2. Sign in with a personal Microsoft account
3. Go to Settings page
4. Change theme or other preferences
5. Sign out and sign back in
6. Verify settings are persisted

## Troubleshooting

### Common Issues

#### Script Fails: "Not logged in to Azure"

**Solution:**
```bash
# Azure Cloud Shell is already authenticated
# For local CLI, run:
az login
```

#### Storage Account Name Already Taken

Storage account names must be globally unique.

**Solution:** Edit the script and change `APP_NAME` constant:
```bash
readonly APP_NAME="glookodatawebapp-yourcompany"
```

#### Permission Denied Creating App Registration

**Solution:** Contact your Azure administrator to request "Application Administrator" role.

#### Table Already Exists Warning

This is normal if re-running scripts. The script will skip creation and continue.

#### CORS Errors in Browser

**Solution:**
1. Verify CORS is configured in storage account
2. Check your web app URL is in the allowed origins list
3. Re-run the table creation script if needed

### Get Help

For detailed troubleshooting:
- Check the [project issues](https://github.com/iricigor/GlookoDataWebApp/issues)
- Review [Azure documentation](https://docs.microsoft.com/azure/)
- Enable debug mode in scripts by adding `set -x` after the shebang

## Security Best Practices

### Connection Strings and Keys

- ❌ Never commit connection strings or keys to source control
- ✅ Store in Azure Key Vault or Static Web App settings
- ✅ Rotate keys periodically (every 90 days)
- ✅ Use Managed Identity when possible in production

### Authentication

- ✅ Always use HTTPS for all communications
- ✅ Keep MSAL library updated
- ✅ Use Authorization Code Flow with PKCE for SPAs
- ✅ Validate all tokens server-side

### Table Storage

- ✅ Enable Azure Storage encryption at rest
- ✅ Use HTTPS-only connections
- ✅ Implement proper access controls
- ✅ Enable Azure Storage analytics for auditing
- ✅ Never store sensitive data (API keys, passwords)

### Monitoring

- ✅ Enable Application Insights
- ✅ Monitor for suspicious access patterns
- ✅ Set up alerts for failed authentication attempts
- ✅ Review access logs regularly

## Cost Estimation

### Azure Table Storage

**Pricing (as of 2024):**
- Storage: ~$0.045 per GB per month
- Transactions: ~$0.00036 per 10,000 transactions

**Typical Usage:**
- Storage per user: <1 KB
- Transactions: ~10-50 per session
- **Estimated cost for 1,000 users**: <$1/month

### Azure Static Web Apps

- Free tier available for small applications
- Standard tier: ~$9/month

### Total Monthly Cost

For a typical deployment:
- Static Web App: Free or $9/month
- Table Storage: <$1/month
- **Total: ~$1-10/month depending on tier**

## Next Steps

After deployment:

1. **Test Authentication**
   - Verify users can sign in with Microsoft accounts
   - Check token handling and refresh logic

2. **Test Settings Sync**
   - Sign in and change settings
   - Verify persistence across devices/browsers

3. **Configure Monitoring**
   - Set up Application Insights
   - Configure alerts for errors

4. **Plan for Production**
   - Review security checklist
   - Set up backup and disaster recovery
   - Document operational procedures

5. **Optional: Set up CI/CD**
   - Configure GitHub Actions for automated deployment
   - Set up staging environment

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Table Storage Documentation](https://docs.microsoft.com/azure/storage/tables/)
- [Microsoft Identity Platform](https://docs.microsoft.com/azure/active-directory/develop/)
- [Data API Builder Documentation](https://learn.microsoft.com/azure/data-api-builder/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)

## Support

For issues or questions:
1. Check [project documentation](../README.md)
2. Review [existing issues](https://github.com/iricigor/GlookoDataWebApp/issues)
3. Open a new issue with the `azure` or `deployment` label

---

**Last Updated:** November 2024
