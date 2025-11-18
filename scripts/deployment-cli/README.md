# Bash Deployment Scripts (CLI)

This directory contains **Bash** Azure deployment scripts for the GlookoDataWebApp project with support for **managed identity** (secure, secret-free authentication) and **centralized configuration management**.

> **Note:** PowerShell versions of these scripts are available in the [deployment-ps](../deployment-ps/) directory. Both implementations provide identical functionality.

## 🌟 What's New

### Managed Identity Support
- ✅ **No more connection strings or access keys** - Eliminate secrets from your configuration
- ✅ **Automatic credential rotation** - Azure manages credentials automatically
- ✅ **Enhanced security** - Reduced attack surface and better compliance
- ✅ **Simplified operations** - No manual key rotation needed

### Configuration Management
- ✅ **Centralized config** - Single configuration file for all scripts (`~/.glookodata/config.json`)
- ✅ **Flexible overrides** - Command-line args → env vars → config file → defaults
- ✅ **Interactive setup** - Create configuration interactively
- ✅ **Consistent behavior** - All scripts use the same configuration system

### Master Orchestration Script
- ✅ **One command deployment** - Deploy all resources with a single script
- ✅ **Downloads from GitHub** - No need to clone the repository
- ✅ **Dry-run mode** - Validate configuration before deploying
- ✅ **Dependency management** - Scripts run in the correct order automatically

## 📁 Available Scripts

### Core Scripts

#### 🎯 deploy-azure-master.sh (NEW - Recommended)

**Purpose:** Master orchestration script that coordinates all deployments with centralized configuration.

**Key Features:**
- Downloads all deployment scripts from GitHub
- Manages configuration across all scripts
- Supports deploying all resources or specific components
- Includes dry-run mode for validation
- Interactive configuration creation

**Usage:**
```bash
# Download the master script
curl -o deploy-azure-master.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-master.sh
chmod +x deploy-azure-master.sh

# Create configuration interactively
./deploy-azure-master.sh --create-config

# Deploy all resources
./deploy-azure-master.sh --all

# Deploy specific components
./deploy-azure-master.sh --identity --storage --webapp

# Validate configuration without deploying
./deploy-azure-master.sh --dry-run --show-config
```

**Run time:** Varies (downloads scripts + runs selected deployments)

---

#### 🔐 deploy-azure-managed-identity.sh (NEW)

**Purpose:** Creates user-assigned managed identity for secure authentication without secrets.

**Key Features:**
- Creates managed identity in Azure AD
- Assigns RBAC roles to storage account
- Supports configuration file and CLI overrides
- Can be reused across multiple resources

**What it creates:**
- User-Assigned Managed Identity
- RBAC role assignments (Storage Blob/Table Data Contributor)

**Usage:**
```bash
./deploy-azure-managed-identity.sh [OPTIONS]

Options:
  -h, --help              Show help message
  -n, --name NAME         Managed identity name
  -g, --resource-group RG Resource group name
  -l, --location LOCATION Azure region
  -s, --save              Save configuration
  -v, --verbose           Enable verbose output

Examples:
  ./deploy-azure-managed-identity.sh
  ./deploy-azure-managed-identity.sh --name my-identity --save
  LOCATION=westus2 ./deploy-azure-managed-identity.sh
```

**Output:** Client ID, Principal ID, Resource ID

**Run time:** ~1 minute

**Documentation:** See [docs/MANAGED_IDENTITY.md](../../docs/MANAGED_IDENTITY.md)

---

#### 🌐 deploy-azure-static-web-app.sh (NEW)

**Purpose:** Creates Azure Static Web App with optional managed identity support.

**Key Features:**
- Supports Free and Standard SKUs
- Managed identity support (Standard SKU only)
- Retrieves deployment token for GitHub Actions
- Integrated configuration management

**What it creates:**
- Azure Static Web App
- Managed identity assignment (if requested)

**Usage:**
```bash
./deploy-azure-static-web-app.sh [OPTIONS]

Options:
  -h, --help              Show help message
  -n, --name NAME         Static Web App name
  -s, --sku SKU           SKU: Free or Standard
  -m, --managed-identity  Enable managed identity (requires Standard SKU)
  --save                  Save configuration
  -v, --verbose           Enable verbose output

Examples:
  ./deploy-azure-static-web-app.sh --sku Standard --managed-identity
  ./deploy-azure-static-web-app.sh --sku Free
  STATIC_WEB_APP_SKU=Standard USE_MANAGED_IDENTITY=true ./deploy-azure-static-web-app.sh
```

**Output:** Deployment token, default hostname, resource ID

**Run time:** ~2-3 minutes

---

### Supporting Scripts

#### 1. deploy-azure-app-registration.sh (UPDATED)

**Purpose:** Creates and configures Azure App Registration for Microsoft authentication.

**What it creates:**
- Azure App Registration in Microsoft Entra ID
- Redirect URIs for production and local development
- API permissions (openid, profile, email, User.Read)

**Usage:**
```bash
./deploy-azure-app-registration.sh [OPTIONS]

# Now supports configuration file
```

**Output:** Application (client) ID and Tenant ID

**Run time:** ~30 seconds

---

#### 2. deploy-azure-storage-account.sh (UPDATED - Managed Identity Support)

**Purpose:** Creates Azure Storage Account with optional managed identity authentication.

**Key Features:**
- Traditional connection string mode (default for backward compatibility)
- **NEW:** Managed identity mode (secure, no secrets)
- Automatic role assignment for managed identity
- Configuration file support

**What it creates:**
- Azure Resource Group
- Azure Storage Account with secure defaults (HTTPS-only, TLS 1.2)
- RBAC role assignments (if using managed identity)

**Usage:**
```bash
./deploy-azure-storage-account.sh [OPTIONS]

Options:
  -h, --help              Show help message
  --use-managed-identity  Configure for managed identity access
  --show-connection       Display connection string (even with MI)
  -n, --name NAME         Storage account name
  -g, --resource-group RG Resource group name
  -l, --location LOCATION Azure region
  -s, --save              Save configuration
  -v, --verbose           Enable verbose output

Examples:
  # Deploy with managed identity (recommended)
  ./deploy-azure-storage-account.sh --use-managed-identity

  # Deploy with connection strings (traditional)
  ./deploy-azure-storage-account.sh

  # Use custom configuration
  STORAGE_ACCOUNT_NAME=mystorageacct ./deploy-azure-storage-account.sh
```

**Output:** 
- With MI: Configuration confirmation
- Without MI: Connection string and storage account key

**Run time:** ~2-3 minutes

---

#### 3. deploy-azure-user-settings-table.sh

**Purpose:** Creates UserSettings table for storing user preferences.

**Prerequisites:** Run `deploy-azure-storage-account.sh` first

**What it creates:**
- UserSettings table in Azure Table Storage
- CORS configuration for browser access

**Run time:** ~30 seconds

---

#### 4. deploy-azure-pro-users-table.sh

**Purpose:** Creates ProUsers table for professional user management (optional).

**Prerequisites:** Run `deploy-azure-storage-account.sh` first

**What it creates:**
- ProUsers table in Azure Table Storage
- Placeholder for future user management features

**Note:** This is a template for future implementation.

**Run time:** ~30 seconds

---

### Configuration Files

#### config-lib.sh (NEW)

**Purpose:** Shared configuration library sourced by all deployment scripts.

**Features:**
- Configuration loading from JSON files
- Command-line argument parsing
- Helper functions for Azure operations
- Managed identity utilities
- RBAC role management

**Note:** This file is automatically sourced by other scripts. You don't run it directly.

---

#### config.template.json (NEW)

**Purpose:** JSON schema and template for configuration file.

**Usage:**
```bash
# Copy template to create your config
mkdir -p ~/.glookodata
cp config.template.json ~/.glookodata/config.json

# Edit with your values
nano ~/.glookodata/config.json
```

**Configuration options:**
- `resourceGroup` - Azure resource group name
- `location` - Azure region (e.g., eastus, westus2)
- `appName` - Application base name
- `storageAccountName` - Storage account name
- `managedIdentityName` - Managed identity name
- `staticWebAppName` - Static Web App name
- `staticWebAppSku` - SKU tier (Free or Standard)
- `useManagedIdentity` - Enable managed identity (true/false)
- `webAppUrl` - Production web URL
- `tags` - Common tags for all resources

---

## 🚀 Quick Start

### Recommended: Use Master Script (Easiest)

This is the recommended approach for new deployments:

```bash
# 1. Download master script
curl -o deploy-azure-master.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-master.sh
chmod +x deploy-azure-master.sh

# 2. Create configuration (optional but recommended)
./deploy-azure-master.sh --create-config

# 3. Edit configuration
./deploy-azure-master.sh --edit-config

# 4. Deploy all resources
./deploy-azure-master.sh --all

# Or deploy specific components
./deploy-azure-master.sh --identity --storage --tables --webapp
```

### Alternative: Manual Deployment

If you prefer to run scripts individually:

#### With Managed Identity (Recommended for Production)

```bash
# 1. Download scripts
curl -o config-lib.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/config-lib.sh
curl -o deploy-azure-managed-identity.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-managed-identity.sh
curl -o deploy-azure-storage-account.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-storage-account.sh
curl -o deploy-azure-user-settings-table.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-user-settings-table.sh
curl -o deploy-azure-static-web-app.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-static-web-app.sh
curl -o deploy-azure-app-registration.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/deploy-azure-app-registration.sh
chmod +x *.sh

# 2. Run in order
./deploy-azure-managed-identity.sh --save
./deploy-azure-storage-account.sh --use-managed-identity
./deploy-azure-user-settings-table.sh
./deploy-azure-static-web-app.sh --sku Standard --managed-identity
./deploy-azure-app-registration.sh
```

#### Without Managed Identity (Traditional)

```bash
# Run in order (using connection strings)
./deploy-azure-storage-account.sh
./deploy-azure-user-settings-table.sh
./deploy-azure-pro-users-table.sh  # Optional
./deploy-azure-app-registration.sh
```

### Option: Run from Local Clone

If you have the repository cloned:

```bash
cd scripts/deployment

# With managed identity
./deploy-azure-managed-identity.sh
./deploy-azure-storage-account.sh --use-managed-identity
./deploy-azure-user-settings-table.sh
./deploy-azure-static-web-app.sh --sku Standard --managed-identity
./deploy-azure-app-registration.sh

# Or use master script
./deploy-azure-master.sh --all
```

---

## 📖 Configuration Management

### Configuration File Location

All scripts look for configuration at: `~/.glookodata/config.json`

This location is in your Cloud Shell home directory, which persists across sessions.

### Creating Configuration

**Method 1: Interactive (Recommended)**
```bash
./deploy-azure-master.sh --create-config
```

**Method 2: Manual**
```bash
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
  "webAppUrl": "https://glooko.iric.online",
  "tags": {
    "Application": "GlookoDataWebApp",
    "Environment": "Production"
  }
}
EOF
```

### Configuration Priority

Values are resolved in this order (highest to lowest priority):

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
   { "location": "eastus", "managedIdentityName": "glookodatawebapp-identity" }
   ```

4. **Script defaults** (lowest)

### Viewing Configuration

```bash
# Show current configuration
./deploy-azure-master.sh --show-config

# Edit configuration
./deploy-azure-master.sh --edit-config

# Test with dry-run
./deploy-azure-master.sh --dry-run --show-config
```

---

## 🎯 Common Use Cases

### Initial Setup (New Deployment)

Deploy everything with managed identity:

```bash
./deploy-azure-master.sh --create-config
# Edit config to set useManagedIdentity: true
./deploy-azure-master.sh --all
```

### Add Managed Identity to Existing Deployment

Migrate from connection strings to managed identity:

```bash
# 1. Deploy managed identity
./deploy-azure-managed-identity.sh

# 2. Update storage account
./deploy-azure-storage-account.sh --use-managed-identity

# 3. Upgrade and configure Static Web App
./deploy-azure-static-web-app.sh --sku Standard --managed-identity

# 4. Update application code to use DefaultAzureCredential
# 5. Remove connection strings from configuration
```

### Deploy Only Storage Components

```bash
./deploy-azure-master.sh --storage --tables
```

### Deploy with Custom Configuration

```bash
# Create custom config
cat > ~/my-config.json << 'EOF'
{
  "location": "westus2",
  "storageAccountName": "myappstorageacct"
}
EOF

# Use custom config
./deploy-azure-master.sh --config ~/my-config.json --all
```

### Update Existing Resources

Scripts are idempotent - safe to re-run:

```bash
# Re-run to update configuration
./deploy-azure-managed-identity.sh
./deploy-azure-storage-account.sh --use-managed-identity
```

---

## 🔧 Script Features

All deployment scripts include:

- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Validation** - Checks prerequisites before running
- ✅ **Color-coded output** - Easy to read progress and errors
- ✅ **Error handling** - Exits on errors with clear messages
- ✅ **Detailed logging** - Shows exactly what's being created
- ✅ **Secure defaults** - Follows Azure security best practices
- ✅ **Configuration management** - Consistent config across scripts
- ✅ **Help documentation** - Use `--help` on any script

---

## 📋 Prerequisites

Before running any scripts:

1. **Azure Account** with active subscription
2. **Appropriate Permissions:**
   - Contributor or Owner role on subscription
   - Application Administrator for App Registrations
   - User Access Administrator (for managed identity role assignments)
3. **Azure Cloud Shell** (recommended) or local Azure CLI
4. **For Managed Identity:**
   - Static Web App Standard SKU (Free tier doesn't support managed identity)

---

## 🔐 Security Best Practices

### Using Managed Identity (Recommended)

- ✅ **No secrets in configuration** - Managed identity eliminates connection strings
- ✅ **Automatic credential rotation** - Azure handles it automatically
- ✅ **Least privilege access** - Assign only required RBAC roles
- ✅ **Audit trail** - Track all access via Azure Monitor

### Using Connection Strings (Traditional)

If not using managed identity:

- ❌ **Never commit** connection strings or keys to source control
- ✅ **Store in Azure Key Vault** or Static Web App settings
- ✅ **Rotate keys periodically** (every 90 days recommended)
- ✅ **Use HTTPS only** for all connections
- ✅ **Monitor access** - Enable Azure Storage analytics

### General Security

- ✅ **Keep scripts updated** - Pull latest from GitHub regularly
- ✅ **Review permissions** - Audit role assignments quarterly
- ✅ **Enable monitoring** - Set up Azure Monitor and alerts
- ✅ **Use separate environments** - Different configs for dev/staging/prod
- ✅ **Document changes** - Keep track of configuration changes

---

**Using nano (recommended for beginners):**
```bash
# Download script
curl -o script.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]

# Edit with nano
nano script.sh

# Make your changes (e.g., change LOCATION="eastus" to your preferred region)
# Save: Ctrl+O, then Enter
# Exit: Ctrl+X

# Make executable and run
chmod +x script.sh
./script.sh
```

**Using vi/vim (for advanced users):**
```bash
# Download and edit
curl -o script.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]
vi script.sh

# Press 'i' to enter insert mode
# Make your changes
# Press 'Esc' to exit insert mode
# Type ':wq' and press Enter to save and quit

# Make executable and run
chmod +x script.sh
./script.sh
```

**Using code editor (Azure Cloud Shell built-in):**
```bash
# Download script
curl -o script.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]

# Open in Cloud Shell editor
code script.sh

# Edit in the browser-based editor
# Save: Ctrl+S (Windows/Linux) or Cmd+S (Mac)
# Close the editor tab when done

# Make executable and run
chmod +x script.sh
./script.sh
```

**Common edits you might want to make:**
- `LOCATION="eastus"` → Change to your preferred Azure region
- `APP_NAME="glookodatawebapp"` → Change to a unique name if needed
- Redirect URIs → Add additional development URLs

See [DEPLOYMENT.md](../../docs/DEPLOYMENT.md) for detailed instructions.

---

## 📋 Prerequisites

Before running any scripts:

1. **Azure Account** with active subscription
2. **Appropriate Permissions:**
   - Contributor or Owner role on subscription
   - Application Administrator for App Registrations
3. **Azure Cloud Shell** or local Azure CLI

---

## 🔧 Script Features

All scripts include:

- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Validation** - Checks prerequisites before running
- ✅ **Color-coded output** - Easy to read progress and errors
- ✅ **Error handling** - Exits on errors with clear messages
- ✅ **Detailed logging** - Shows exactly what's being created
- ✅ **Secure defaults** - Follows Azure security best practices

## 🐛 Troubleshooting

### Common Issues

#### "config-lib.sh not found"

**Problem:** Script can't find the configuration library.

**Solution:**
```bash
# Download config-lib.sh
curl -o config-lib.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/config-lib.sh
chmod +x config-lib.sh

# Or use master script which downloads everything
./deploy-azure-master.sh --download-only
```

#### "Storage account name already taken"

**Problem:** Storage account names must be globally unique.

**Solution:**
```bash
# Use a different name
./deploy-azure-storage-account.sh --name mystorageacct123

# Or set in config file
echo '{"storageAccountName": "mystorageacct123"}' > ~/.glookodata/config.json
```

#### "Managed identity not found"

**Problem:** Trying to use managed identity but it doesn't exist.

**Solution:**
```bash
# Create the managed identity first
./deploy-azure-managed-identity.sh

# Then run storage account script
./deploy-azure-storage-account.sh --use-managed-identity
```

#### "Permission denied" for role assignments

**Problem:** You don't have User Access Administrator role.

**Solution:**
- Contact your Azure administrator to request the role
- Or run scripts without managed identity (uses connection strings)

#### Script hangs or times out

**Problem:** Network issues or Azure service delays.

**Solution:**
```bash
# Enable verbose mode to see what's happening
./deploy-azure-managed-identity.sh --verbose

# Or re-run the script (they're idempotent)
```

### Getting Help

For more troubleshooting:

1. **Enable verbose mode:** Add `--verbose` or `-v` flag to any script
2. **Check Azure Portal:** Verify resources in Azure Portal
3. **Review activity logs:**
   ```bash
   az monitor activity-log list --resource-group glookodatawebapp-rg --max-events 50 --output table
   ```
4. **Check script logs:** Scripts display detailed progress information
5. **Consult documentation:**
   - [MANAGED_IDENTITY.md](../../docs/MANAGED_IDENTITY.md) - Managed identity guide
   - [DEPLOYMENT.md](../../docs/DEPLOYMENT.md) - Complete deployment guide

---

## 📖 Documentation

For comprehensive information, see:

- **[MANAGED_IDENTITY.md](../../docs/MANAGED_IDENTITY.md)** - Managed identity guide (NEW)
  - Architecture and benefits
  - Migration from connection strings
  - Troubleshooting
  - Best practices
- **[DEPLOYMENT.md](../../docs/DEPLOYMENT.md)** - Complete deployment guide
- **[AZURE_APP_REGISTRATION.md](../../docs/AZURE_APP_REGISTRATION.md)** - App Registration details
- **[AZURE_DEPLOYMENT.md](../../docs/AZURE_DEPLOYMENT.md)** - Table Storage details (legacy)

---

## 💡 Tips & Tricks

### Editing Configuration Before Running

Azure Cloud Shell provides several editors:

**Using nano (recommended for beginners):**
```bash
nano ~/.glookodata/config.json

# Navigate with arrow keys
# Make your changes
# Save: Ctrl+O, then Enter
# Exit: Ctrl+X
```

**Using vi/vim (for advanced users):**
```bash
vi ~/.glookodata/config.json

# Press 'i' to enter insert mode
# Make your changes
# Press 'Esc' to exit insert mode
# Type ':wq' and press Enter to save and quit
```

**Using code editor (Azure Cloud Shell built-in):**
```bash
code ~/.glookodata/config.json

# Edit in the browser-based editor
# Save: Ctrl+S (Windows/Linux) or Cmd+S (Mac)
# Close the editor tab when done
```

### Common Configuration Customizations

- `location` - Change to your preferred Azure region (e.g., "westus2", "northeurope")
- `storageAccountName` - Must be globally unique (3-24 lowercase letters/numbers)
- `staticWebAppSku` - "Free" for testing, "Standard" for production with managed identity
- `useManagedIdentity` - Set to `true` for secure, secret-free authentication

### Testing Configuration

```bash
# Validate configuration without deploying
./deploy-azure-master.sh --dry-run --show-config

# Test individual script
./deploy-azure-managed-identity.sh --help
```

### Saving Time with Configuration

```bash
# Save configuration after first successful deployment
./deploy-azure-managed-identity.sh --name my-identity --save

# Future runs use saved configuration
./deploy-azure-managed-identity.sh  # Uses saved name
```

---

## 📊 What Gets Created

### Resource Group
- **Name:** `glookodatawebapp-rg` (or custom from config)
- **Location:** `eastus` (or custom from config)

### Managed Identity (NEW)
- **Name:** `glookodatawebapp-identity`
- **Type:** User-Assigned
- **Roles:** Storage Blob Data Contributor, Storage Table Data Contributor

### Storage Account
- **Name:** `glookodatawebappstorage` (must be globally unique)
- **Type:** StorageV2
- **Replication:** LRS (Locally Redundant Storage)
- **Security:** HTTPS-only, TLS 1.2+, no public blob access
- **Authentication:** Connection strings (default) or Managed Identity (recommended)

### Tables
- **UserSettings** - User preferences and settings
  - PartitionKey: User email
  - RowKey: "settings"
  - Columns: ThemeMode, ExportFormat, GlucoseThresholds
- **ProUsers** - Professional user accounts (optional)
  - Template for future features

### Static Web App (NEW)
- **Name:** `glookodatawebapp-swa`
- **SKU:** Free (default) or Standard (for managed identity)
- **Identity:** System-assigned or User-assigned managed identity
- **Deployment:** GitHub Actions integration

### App Registration
- **Name:** `GlookoDataWebApp`
- **Type:** Single Page Application (SPA)
- **Accounts:** Personal Microsoft accounts only (consumers tenant)
- **Permissions:** openid, profile, email, User.Read

---

## 💰 Cost Considerations

### Azure Table Storage
- **Storage:** ~$0.045 per GB per month
- **Transactions:** ~$0.00036 per 10,000 transactions
- **Typical cost:** <$1/month for 1,000 users

### Static Web App
- **Free tier:** $0/month (limited features, no managed identity)
- **Standard tier:** ~$9/month (includes managed identity, custom domains)

### Managed Identity
- **Cost:** Free (no additional charge)

### Total Estimated Monthly Cost
- **With Free SKU:** ~$1/month (storage only)
- **With Standard SKU:** ~$10/month (storage + Static Web App)

**Note:** Actual costs may vary based on usage. Monitor costs in Azure Cost Management.

---

## 🔗 Script URLs Reference

All scripts available at:
```
https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]
```

**Available scripts:**
- `deploy-azure-master.sh` (NEW - Recommended starting point)
- `deploy-azure-managed-identity.sh` (NEW)
- `deploy-azure-static-web-app.sh` (NEW)
- `deploy-azure-storage-account.sh` (UPDATED)
- `deploy-azure-user-settings-table.sh`
- `deploy-azure-pro-users-table.sh`
- `deploy-azure-app-registration.sh`
- `config-lib.sh` (NEW - Required by all scripts)
- `config.template.json` (NEW - Configuration template)

---

## 📞 Support

For issues or questions:

1. **Check documentation:**
   - [MANAGED_IDENTITY.md](../../docs/MANAGED_IDENTITY.md) - Managed identity guide
   - [DEPLOYMENT.md](../../docs/DEPLOYMENT.md) - Deployment guide
   - [Troubleshooting section](#troubleshooting) - Common issues

2. **Review existing issues:**
   - [Project issues](https://github.com/iricigor/GlookoDataWebApp/issues)

3. **Open a new issue:**
   - Use `deployment` or `managed-identity` label
   - Include script output and error messages
   - Describe what you were trying to do

4. **Azure support:**
   - [Azure documentation](https://docs.microsoft.com/azure/)
   - [Azure support plans](https://azure.microsoft.com/support/plans/)

---

## 🔗 Related Files

- `/docs/MANAGED_IDENTITY.md` - Managed identity guide (NEW)
- `/docs/DEPLOYMENT.md` - Comprehensive deployment guide
- `/docs/AZURE_APP_REGISTRATION.md` - App Registration guide
- `/scripts/README.md` - Main scripts directory README
- `/staticwebapp.config.json` - Static Web App configuration

---

## 🎯 Version History

### Version 2.0 (Current)
- ✅ Added managed identity support
- ✅ Added master orchestration script
- ✅ Added configuration management system
- ✅ Added Static Web App deployment script
- ✅ Updated storage account script with MI support
- ✅ Comprehensive documentation

### Version 1.0 (Legacy)
- Basic deployment scripts
- Connection string based authentication
- Manual script execution

---

**Last Updated:** November 2024

**Note:** These scripts are designed for Azure Cloud Shell but work with local Azure CLI as well.

---

## 🎯 Common Use Cases

### Initial Setup

Deploy all resources for a new installation:
```bash
./deploy-azure-app-registration.sh
./deploy-azure-storage-account.sh
./deploy-azure-user-settings-table.sh
```

### Add Storage to Existing App

If you already have App Registration:
```bash
./deploy-azure-storage-account.sh
./deploy-azure-user-settings-table.sh
```

### Add Professional Features

Add ProUsers table to existing deployment:
```bash
./deploy-azure-pro-users-table.sh
```

### Update Existing Resources

Re-run any script to update configuration:
```bash
# Scripts check for existing resources and update them
./deploy-azure-app-registration.sh  # Will prompt to update
```

---

**Last Updated:** November 2024

**Note:** These scripts are designed for Azure Cloud Shell but work with local Azure CLI as well.
