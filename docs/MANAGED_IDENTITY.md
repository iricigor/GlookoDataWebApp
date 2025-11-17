# Azure Managed Identity Guide

This guide explains how to use Azure Managed Identity with GlookoDataWebApp for secure, secret-free authentication to Azure resources.

## 📋 Table of Contents

- [Overview](#overview)
- [What is Managed Identity?](#what-is-managed-identity)
- [Benefits](#benefits)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Scripts](#deployment-scripts)
- [Configuration Management](#configuration-management)
- [Migration from Connection Strings](#migration-from-connection-strings)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [FAQ](#faq)

## Overview

Azure Managed Identity provides an identity for applications to use when connecting to Azure resources. It eliminates the need for developers to manage credentials (connection strings, access keys, passwords) in code or configuration.

GlookoDataWebApp supports managed identity for:
- **Azure Storage Account** - Table storage for user settings
- **Azure Static Web Apps** - Application hosting with identity-based authentication
- **Azure App Registration** - Microsoft authentication (uses OAuth, not MI)

## What is Managed Identity?

A managed identity is an Azure Active Directory (Azure AD) identity that is automatically managed by Azure. There are two types:

### System-Assigned Managed Identity
- Created as part of an Azure resource (e.g., Static Web App)
- Lifecycle tied to the resource (deleted when resource is deleted)
- Cannot be shared across resources

### User-Assigned Managed Identity
- Created as a standalone Azure resource
- Can be assigned to multiple Azure resources
- Independent lifecycle (persists when resources are deleted)
- **Recommended for GlookoDataWebApp** (used by our scripts)

## Benefits

### Security Benefits
- ✅ **No secrets in code or configuration** - No connection strings or access keys to manage
- ✅ **Automatic credential rotation** - Azure manages credentials and rotates them automatically
- ✅ **Reduced attack surface** - No credentials to be stolen or exposed
- ✅ **Compliance** - Easier to meet regulatory requirements

### Operational Benefits
- ✅ **Simplified management** - No need to rotate keys manually
- ✅ **Better access control** - Use Azure RBAC for fine-grained permissions
- ✅ **Audit trail** - Track all access via Azure Monitor
- ✅ **Scalable** - Same identity can be used across multiple resources

### Cost Benefits
- ✅ **No additional cost** - Managed identities are free
- ✅ **Reduced operational overhead** - Less time managing secrets

## Architecture

### Without Managed Identity (Traditional)
```
┌──────────────────┐
│  Static Web App  │
│                  │
│  Contains:       │
│  - Connection    │
│    String        │
│  - Storage Key   │
└────────┬─────────┘
         │
         │ Authenticates with
         │ connection string
         │
         v
┌──────────────────┐
│ Storage Account  │
│  (Table Storage) │
└──────────────────┘
```

### With Managed Identity (Secure)
```
┌──────────────────┐
│  Static Web App  │
│                  │
│  Assigned:       │
│  - Managed       │
│    Identity      │
└────────┬─────────┘
         │
         │ Authenticates with
         │ managed identity token
         │
         v
┌──────────────────┐     ┌──────────────────┐
│ Azure AD         │────>│ Storage Account  │
│ (Issues tokens)  │     │  (Table Storage) │
└──────────────────┘     └──────────────────┘
         ^
         │
         │ Identity has RBAC roles:
         │ - Storage Table Data Contributor
         └─ Storage Blob Data Contributor
```

### Components

1. **User-Assigned Managed Identity** (`glookodatawebapp-identity`)
   - Created once, reused across resources
   - Has RBAC roles assigned for storage access

2. **Static Web App** (`glookodatawebapp-swa`)
   - Assigned the managed identity
   - Uses identity to authenticate to storage

3. **Storage Account** (`glookodatawebappstorage`)
   - Grants permissions to managed identity
   - No connection strings needed in application

## Prerequisites

Before deploying with managed identity:

1. **Azure Account** with active subscription
2. **Appropriate Permissions:**
   - Contributor or Owner role on subscription
   - User Access Administrator (for role assignments)
   - Application Administrator (for app registrations)
3. **Azure Cloud Shell** (recommended) or local Azure CLI
4. **Static Web App Standard SKU** (Free tier doesn't support managed identity)

## Quick Start

### Method 1: Deploy Everything (Recommended)

Use the master script to deploy all resources with managed identity:

```bash
# Download the master script
curl -o deploy-azure-master.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-master.sh
chmod +x deploy-azure-master.sh

# Create configuration (optional but recommended)
./deploy-azure-master.sh --create-config

# Edit configuration to enable managed identity
# Set "useManagedIdentity": true in ~/.glookodata/config.json

# Deploy all resources
./deploy-azure-master.sh --all
```

### Method 2: Deploy Individual Components

If you prefer to deploy components separately:

```bash
# 1. Deploy managed identity
./deploy-azure-managed-identity.sh

# 2. Deploy storage account
./deploy-azure-storage-account.sh

# 3. Deploy tables
./deploy-azure-user-settings-table.sh

# 4. Deploy Static Web App with managed identity
./deploy-azure-static-web-app.sh --sku Standard --managed-identity

# 5. Deploy app registration (for Microsoft auth)
./deploy-azure-app-registration.sh
```

## Deployment Scripts

### deploy-azure-managed-identity.sh

Creates and configures a user-assigned managed identity.

**What it does:**
- Creates managed identity in Azure AD
- Assigns RBAC roles to storage account (if it exists)
- Retrieves identity details for other scripts

**Usage:**
```bash
./deploy-azure-managed-identity.sh [OPTIONS]

Options:
  -h, --help              Show help message
  -n, --name NAME         Managed identity name
  -g, --resource-group RG Resource group name
  -l, --location LOCATION Azure region
  -c, --config FILE       Custom configuration file
  -s, --save              Save configuration
```

**Example:**
```bash
# Deploy with defaults
./deploy-azure-managed-identity.sh

# Deploy with custom name
./deploy-azure-managed-identity.sh --name my-app-identity --save

# Use custom config
MANAGED_IDENTITY_NAME=my-identity ./deploy-azure-managed-identity.sh
```

### deploy-azure-static-web-app.sh

Creates a Static Web App with optional managed identity support.

**What it does:**
- Creates Static Web App (Free or Standard SKU)
- Assigns managed identity (if Standard SKU and --managed-identity flag)
- Retrieves deployment token

**Usage:**
```bash
./deploy-azure-static-web-app.sh [OPTIONS]

Options:
  -h, --help              Show help message
  -n, --name NAME         Static Web App name
  -s, --sku SKU           SKU: Free or Standard
  -m, --managed-identity  Enable managed identity
  -c, --config FILE       Custom configuration file
  --save                  Save configuration
```

**Example:**
```bash
# Deploy with Free SKU (no managed identity)
./deploy-azure-static-web-app.sh

# Deploy with Standard SKU and managed identity
./deploy-azure-static-web-app.sh --sku Standard --managed-identity

# Use environment variables
STATIC_WEB_APP_SKU=Standard USE_MANAGED_IDENTITY=true ./deploy-azure-static-web-app.sh
```

### deploy-azure-master.sh

Master orchestration script that coordinates all deployments.

**What it does:**
- Downloads all deployment scripts from GitHub
- Manages configuration across all scripts
- Validates configuration before deployment
- Executes scripts in correct order
- Handles dependencies between scripts

**Usage:**
```bash
./deploy-azure-master.sh [OPTIONS]

Options:
  -a, --all               Deploy all resources
  --identity              Deploy only managed identity
  --storage               Deploy only storage
  --tables                Deploy only tables
  --webapp                Deploy only Static Web App
  --auth                  Deploy only app registration
  -d, --dry-run           Validate without deploying
  --create-config         Create configuration file
  --show-config           Display current configuration
  --download-only         Download scripts only
  --clean                 Remove downloaded scripts
```

**Example:**
```bash
# Deploy everything
./deploy-azure-master.sh --all

# Deploy specific components
./deploy-azure-master.sh --identity --storage --webapp

# Validate configuration
./deploy-azure-master.sh --dry-run --show-config

# Download scripts for offline use
./deploy-azure-master.sh --download-only
```

## Configuration Management

### Configuration File

All scripts support a centralized configuration file at `~/.glookodata/config.json` (in Cloud Shell).

**Creating Configuration:**
```bash
# Interactive creation
./deploy-azure-master.sh --create-config

# Manual creation
mkdir -p ~/.glookodata
cat > ~/.glookodata/config.json << 'EOF'
{
  "resourceGroup": "glookodatawebapp-rg",
  "location": "eastus",
  "appName": "glookodatawebapp",
  "storageAccountName": "glookodatawebappstorage",
  "managedIdentityName": "glookodatawebapp-identity",
  "staticWebAppName": "glookodatawebapp-swa",
  "staticWebAppSku": "Standard",
  "useManagedIdentity": true,
  "tags": {
    "Application": "GlookoDataWebApp",
    "Environment": "Production"
  }
}
EOF
```

### Configuration Priority

Configuration values are resolved in this order (highest to lowest priority):

1. **Command-line arguments** (highest)
   ```bash
   ./deploy-azure-managed-identity.sh --name my-identity --location westus2
   ```

2. **Environment variables**
   ```bash
   LOCATION=westus2 MANAGED_IDENTITY_NAME=my-identity ./deploy-azure-managed-identity.sh
   ```

3. **Configuration file** (`~/.glookodata/config.json`)
   ```json
   {
     "location": "eastus",
     "managedIdentityName": "glookodatawebapp-identity"
   }
   ```

4. **Script defaults** (lowest)
   ```bash
   readonly LOCATION="eastus"
   readonly MANAGED_IDENTITY_NAME="glookodatawebapp-identity"
   ```

### Viewing Configuration

```bash
# Show current configuration
./deploy-azure-master.sh --show-config

# Edit configuration
./deploy-azure-master.sh --edit-config
```

## Migration from Connection Strings

If you're currently using connection strings, follow these steps to migrate to managed identity:

### Step 1: Deploy Managed Identity

```bash
./deploy-azure-managed-identity.sh
```

This creates the managed identity and assigns necessary roles to your storage account.

### Step 2: Update Static Web App

```bash
# If you have Free SKU, upgrade to Standard
./deploy-azure-static-web-app.sh --sku Standard --managed-identity
```

This assigns the managed identity to your Static Web App.

### Step 3: Update Application Code

Update your application to use DefaultAzureCredential instead of connection strings:

**Before (using connection string):**
```javascript
const { TableClient } = require("@azure/data-tables");

const tableClient = TableClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING,
  "UserSettings"
);
```

**After (using managed identity):**
```javascript
const { TableClient } = require("@azure/data-tables");
const { DefaultAzureCredential } = require("@azure/identity");

const credential = new DefaultAzureCredential();
const tableClient = new TableClient(
  `https://${storageAccountName}.table.core.windows.net`,
  "UserSettings",
  credential
);
```

### Step 4: Remove Connection Strings

```bash
# Remove connection string from Static Web App configuration
az staticwebapp appsettings delete \
  --name glookodatawebapp-swa \
  --resource-group glookodatawebapp-rg \
  --setting-names AZURE_STORAGE_CONNECTION_STRING
```

### Step 5: Verify

Test your application to ensure it can still access storage using the managed identity.

## Troubleshooting

### Common Issues

#### 1. "Managed Identity not found"

**Problem:** Script can't find the managed identity.

**Solution:**
```bash
# Verify managed identity exists
az identity show \
  --name glookodatawebapp-identity \
  --resource-group glookodatawebapp-rg

# If not found, create it
./deploy-azure-managed-identity.sh
```

#### 2. "Permission denied" when accessing storage

**Problem:** Managed identity doesn't have required roles.

**Solution:**
```bash
# Re-run the managed identity script to assign roles
./deploy-azure-managed-identity.sh

# Or manually assign roles
PRINCIPAL_ID=$(az identity show \
  --name glookodatawebapp-identity \
  --resource-group glookodatawebapp-rg \
  --query principalId -o tsv)

az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Storage Table Data Contributor" \
  --scope /subscriptions/{subscription-id}/resourceGroups/glookodatawebapp-rg/providers/Microsoft.Storage/storageAccounts/glookodatawebappstorage
```

#### 3. "Static Web App doesn't support managed identity"

**Problem:** Free SKU doesn't support managed identity.

**Solution:**
```bash
# Upgrade to Standard SKU
./deploy-azure-static-web-app.sh --sku Standard --managed-identity
```

#### 4. "Authentication failed" in application

**Problem:** Application code not using correct authentication method.

**Solution:**
- Ensure application uses `DefaultAzureCredential`
- Verify managed identity is assigned to Static Web App
- Check RBAC role assignments
- Enable diagnostic logging in Azure

### Debugging

Enable verbose output in scripts:

```bash
./deploy-azure-managed-identity.sh --verbose
```

Check Azure activity logs:

```bash
az monitor activity-log list \
  --resource-group glookodatawebapp-rg \
  --max-events 50 \
  --output table
```

View role assignments:

```bash
az role assignment list \
  --assignee $(az identity show --name glookodatawebapp-identity --resource-group glookodatawebapp-rg --query principalId -o tsv) \
  --output table
```

## Best Practices

### Security

1. **Use User-Assigned Managed Identity** for resources that need to share access
2. **Apply Least Privilege** - assign only required roles
3. **Monitor access** - enable Azure Monitor and set up alerts
4. **Review regularly** - audit role assignments quarterly
5. **Use separate identities** for different environments (dev, staging, production)

### Operations

1. **Document identity usage** - maintain a list of which resources use which identities
2. **Tag resources** - use consistent tags for managed identities
3. **Automate deployments** - use the master script for consistency
4. **Test thoroughly** - verify managed identity access in all scenarios
5. **Have rollback plan** - keep connection strings available during migration

### Configuration

1. **Use configuration file** - centralize settings in `~/.glookodata/config.json`
2. **Version control** - commit config.template.json, not config.json
3. **Environment-specific configs** - use different configs for dev/prod
4. **Validate before deployment** - use `--dry-run` flag

## FAQ

### Q: Does managed identity cost money?

**A:** No, managed identities are free. However, the Standard SKU for Static Web Apps (required for managed identity) costs ~$9/month.

### Q: Can I use managed identity with the Free SKU?

**A:** No, managed identity for Static Web Apps requires the Standard SKU.

### Q: What happens to my connection strings?

**A:** You can safely delete them from your configuration. The managed identity handles authentication.

### Q: Can I use the same managed identity for multiple apps?

**A:** Yes! User-assigned managed identities can be assigned to multiple resources. This is actually recommended for shared access scenarios.

### Q: How do I rotate credentials?

**A:** You don't! Azure automatically rotates the credentials used by managed identities.

### Q: What if managed identity is compromised?

**A:** Disable the identity or remove role assignments immediately:
```bash
az role assignment delete --assignee {principal-id} --role "Role Name"
```

### Q: Can I test managed identity locally?

**A:** Yes, using Azure CLI authentication:
```bash
az login
# Your local app will use Azure CLI credentials via DefaultAzureCredential
```

### Q: What roles does the identity need?

**A:** For table storage:
- `Storage Table Data Contributor` (read/write tables)
- `Storage Blob Data Contributor` (if using blobs)

### Q: How do I update role assignments?

**A:** Re-run the managed identity script:
```bash
./deploy-azure-managed-identity.sh
```

## Additional Resources

- [Azure Managed Identity Documentation](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/)
- [Static Web Apps Managed Identity](https://docs.microsoft.com/azure/static-web-apps/assign-managed-identity)
- [Azure RBAC Roles](https://docs.microsoft.com/azure/role-based-access-control/built-in-roles)
- [DefaultAzureCredential](https://docs.microsoft.com/dotnet/api/azure.identity.defaultazurecredential)
- [GlookoDataWebApp Deployment Guide](DEPLOYMENT.md)

## Support

For issues or questions:

1. Check this guide and [DEPLOYMENT.md](DEPLOYMENT.md)
2. Review [troubleshooting section](#troubleshooting)
3. Check [existing issues](https://github.com/iricigor/GlookoDataWebApp/issues)
4. Open a new issue with the `managed-identity` label

---

**Last Updated:** November 2024
