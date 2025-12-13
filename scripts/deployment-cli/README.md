# Azure Deployment Scripts (Bash/CLI)

This directory contains Bash scripts for deploying Azure infrastructure for GlookoDataWebApp. These scripts are designed to run in Azure Cloud Shell or any environment with Azure CLI installed.

## Prerequisites

- Azure CLI installed and logged in (`az login`)
- Appropriate permissions to create Azure resources
- `jq` installed for JSON parsing (pre-installed in Azure Cloud Shell)

## Quick Start

### Run from Azure Cloud Shell

```bash
# Download and run the function deployment script
curl -o deploy-azure-function.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-cli/deploy-azure-function.sh
chmod +x deploy-azure-function.sh

# Review the script before running
cat deploy-azure-function.sh | less

# Run the deployment
./deploy-azure-function.sh
```

### Run from Local Repository

```bash
cd scripts/deployment-cli
./deploy-azure-function.sh
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `config-lib.sh` | Shared configuration library (sourced by other scripts) |
| `config.template.json` | Configuration template with default values |
| `deploy-azure-resource-group.sh` | Deploys Azure Resource Group |
| `deploy-azure-storage-account.sh` | Deploys Azure Storage Account |
| `deploy-azure-storage-tables.sh` | Deploys Azure Storage Tables with optional managed identity RBAC |
| `deploy-azure-managed-identity.sh` | Deploys User-Assigned Managed Identity |
| `deploy-azure-key-vault.sh` | Deploys Azure Key Vault with RBAC authorization |
| `deploy-azure-function.sh` | Deploys Azure Function App with managed identity |
| `deploy-azure-swa-backend.sh` | Links Azure Function App to Static Web App as backend |
| `manage-pro-users.sh` | Manages Pro users (list, add, remove, check) in ProUsers table |
| `test-azure-resources.sh` | Verifies deployment state of all Azure resources |

## Configuration

### Configuration File Location

All scripts use a centralized configuration file at: `~/.glookodata/config.json`

This location persists across Azure Cloud Shell sessions.

### Configuration Precedence

Configuration values are resolved in this order (highest to lowest priority):

1. **Command-line arguments**
   ```bash
   ./deploy-azure-function.sh --name myfunction --location westus2
   ```

2. **Environment variables**
   ```bash
   LOCATION=westus2 FUNCTION_APP_NAME=myfunction ./deploy-azure-function.sh
   ```

3. **Configuration file** (`~/.glookodata/config.json`)

4. **Script defaults**

### Creating a Configuration File

You can copy the template and customize:

```bash
mkdir -p ~/.glookodata
cp config.template.json ~/.glookodata/config.json
# Edit the file with your values
nano ~/.glookodata/config.json
```

Or use the `--save` flag to save current settings:

```bash
./deploy-azure-function.sh --name myfunction --location westus2 --save
```

## Script Details

### deploy-azure-resource-group.sh

Creates and configures an Azure Resource Group for the GlookoDataWebApp application.

**Features:**
- Creates an Azure Resource Group with configurable location
- Applies standard tags for resource management
- Idempotent - safe to run multiple times

**Options:**
```
  -h, --help              Show help message
  -n, --name NAME         Resource group name
  -l, --location LOCATION Azure region
  -c, --config FILE       Custom configuration file path
  -s, --save              Save configuration after deployment
  -v, --verbose           Enable verbose output
```

**Examples:**
```bash
# Deploy with defaults
./deploy-azure-resource-group.sh

# Deploy with custom name and location
./deploy-azure-resource-group.sh --name my-rg --location westus2

# Deploy and save configuration
./deploy-azure-resource-group.sh --save
```

### deploy-azure-storage-account.sh

Creates and configures an Azure Storage Account for the GlookoDataWebApp application.

**Features:**
- Creates a StorageV2 account with secure defaults
- Configures TLS 1.2 minimum
- Disables public blob access
- Enables blob soft delete for data protection

**Options:**
```
  -h, --help              Show help message
  -n, --name NAME         Storage account name
  -g, --resource-group RG Resource group name
  -l, --location LOCATION Azure region
  -c, --config FILE       Custom configuration file path
  -s, --save              Save configuration after deployment
  -v, --verbose           Enable verbose output
  --sku SKU               Storage SKU (Standard_LRS, Standard_GRS, etc.)
  --kind KIND             Storage kind (StorageV2, BlobStorage, etc.)
  --access-tier TIER      Access tier (Hot, Cool)
```

**Examples:**
```bash
# Deploy with defaults
./deploy-azure-storage-account.sh

# Deploy with custom name and location
./deploy-azure-storage-account.sh --name mystorageacct --location westus2

# Deploy with geo-redundant storage
./deploy-azure-storage-account.sh --sku Standard_GRS

# Deploy and save configuration
./deploy-azure-storage-account.sh --save
```

### deploy-azure-storage-tables.sh

Creates Azure Storage Tables inside an existing Storage Account. Optionally assigns RBAC roles to a managed identity if one uniquely exists in the resource group.

**Features:**
- Creates UserSettings, ProUsers, and AIQueryLogs tables by default
- Supports custom table names via `--table` option
- Assigns Storage Table Data Contributor role to managed identity
- Automatically detects unique managed identity in resource group
- Idempotent - safe to run multiple times

**Options:**
```
  -h, --help                  Show help message
  -a, --storage-account NAME  Storage account name
  -g, --resource-group RG     Resource group name
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output
  --table NAME                Create specific table (can be repeated)
  --assign-identity           Assign RBAC to managed identity if uniquely exists
```

**Examples:**
```bash
# Deploy with defaults (creates UserSettings, ProUsers, and AIQueryLogs tables)
./deploy-azure-storage-tables.sh

# Deploy with custom storage account
./deploy-azure-storage-tables.sh --storage-account mystorageacct

# Create specific tables
./deploy-azure-storage-tables.sh --table CustomTable1 --table CustomTable2

# Deploy and assign RBAC to managed identity
./deploy-azure-storage-tables.sh --assign-identity

# Deploy with custom settings and RBAC assignment
./deploy-azure-storage-tables.sh --storage-account mystorageacct --assign-identity --save
```

**Prerequisites:**
- Storage Account must exist (run deploy-azure-storage-account.sh first)
- For RBAC assignment: Managed Identity should exist (run deploy-azure-managed-identity.sh)

### deploy-azure-managed-identity.sh

Creates and configures a user-assigned managed identity for passwordless authentication across Azure resources.

**Features:**
- Creates a user-assigned managed identity
- Displays identity properties (Client ID, Principal ID, Resource ID)
- Idempotent - safe to run multiple times

**Options:**
```
  -h, --help                  Show help message
  -n, --name NAME             Managed identity name
  -g, --resource-group RG     Resource group name
  -l, --location LOCATION     Azure region
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output
```

**Examples:**
```bash
# Deploy with defaults
./deploy-azure-managed-identity.sh

# Deploy with custom name and location
./deploy-azure-managed-identity.sh --name my-identity --location westus2

# Deploy and save configuration
./deploy-azure-managed-identity.sh --save
```

**Next Steps after creation:**
- Deploy Storage Account (for function app storage)
- Deploy Key Vault (for secrets management)
- Deploy Function App (which will use this identity)

### deploy-azure-key-vault.sh

Creates and configures an Azure Key Vault for secure secrets management.

**Features:**
- Creates Key Vault with RBAC authorization (not access policies)
- Enables soft delete and purge protection (90 days retention)
- Assigns Key Vault Secrets User role to managed identity (optional)
- Idempotent - safe to run multiple times

**Options:**
```
  -h, --help              Show help message
  -n, --name NAME         Key Vault name
  -g, --resource-group RG Resource group name
  -l, --location LOCATION Azure region
  -c, --config FILE       Custom configuration file path
  -s, --save              Save configuration after deployment
  -v, --verbose           Enable verbose output
  --assign-identity       Assign RBAC to managed identity if it exists
```

**Examples:**
```bash
# Deploy with defaults
./deploy-azure-key-vault.sh

# Deploy with custom name and location
./deploy-azure-key-vault.sh --name my-keyvault --location westus2

# Deploy and assign RBAC to managed identity
./deploy-azure-key-vault.sh --assign-identity

# Deploy and save configuration
./deploy-azure-key-vault.sh --save
```

**Prerequisites:**
- Resource Group must exist (created automatically if not present)
- For RBAC assignment: Managed Identity should exist (run deploy-azure-managed-identity.sh)

**Expected Secrets:**
After deploying the Key Vault, add secrets manually:
```bash
# Add Perplexity API key
az keyvault secret set --vault-name <name> --name "PerplexityApiKey" --value "<your-api-key>"

# Add Google Gemini API key
az keyvault secret set --vault-name <name> --name "GeminiApiKey" --value "<your-api-key>"
```

### deploy-azure-function.sh

Creates and configures an Azure Function App that serves as the API backend for the Static Web App.

**Features:**
- Creates a consumption plan function app
- Assigns user-assigned managed identity
- Configures RBAC roles for Storage Account access
- Configures RBAC roles for Key Vault access (if Key Vault exists)
- Sets up CORS for the web application
- Configures application settings for managed identity

**Options:**
```
  -h, --help                  Show help message
  -n, --name NAME             Function app name
  -g, --resource-group RG     Resource group name
  -l, --location LOCATION     Azure region
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output
  --use-managed-identity      Configure with managed identity (default)
  --runtime RUNTIME           Function runtime (node, dotnet, python, java)
  --runtime-version VERSION   Runtime version
```

**Examples:**
```bash
# Deploy with defaults
./deploy-azure-function.sh

# Deploy with custom name and location
./deploy-azure-function.sh --name my-api-func --location westus2

# Deploy with .NET runtime
./deploy-azure-function.sh --runtime dotnet --runtime-version 8

# Deploy and save configuration
./deploy-azure-function.sh --save
```

**Prerequisites:**
- Storage Account must exist (for function app storage)
- Managed Identity should exist (for RBAC authentication)
- Key Vault is optional but recommended

### deploy-azure-swa-backend.sh

Links an Azure Function App as the backend for an Azure Static Web App. This enables `/api/*` routes on the Static Web App to be proxied to the Function App.

**Features:**
- Links Function App to Static Web App as backend
- Enables API proxy routing for `/api/*` endpoints
- Handles existing backend (unlinks if different, skips if same)
- Idempotent - safe to run multiple times

**Options:**
```
  -h, --help                  Show help message
  -n, --swa-name NAME         Static Web App name
  -f, --function-name NAME    Function App name
  -g, --resource-group RG     Resource group name
  -l, --location LOCATION     Azure region for backend
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output
```

**Examples:**
```bash
# Link with defaults from configuration
./deploy-azure-swa-backend.sh

# Link with explicit names
./deploy-azure-swa-backend.sh --swa-name my-swa --function-name my-func

# Link with specific region and save config
./deploy-azure-swa-backend.sh --location westus2 --save
```

**Prerequisites:**
- Static Web App must exist
- Function App must exist (run deploy-azure-function.sh first)

**Why is this needed?**
When a Function App is deployed separately from a Static Web App, the `/api/*` routes
won't work until the backend is linked. This script handles that linking.

### test-azure-resources.sh

Verifies the deployment state of all Azure resources for GlookoDataWebApp. For each resource, it reports one of three states:
- **not existing** - Resource does not exist
- **existing, misconfigured** - Resource exists but has incorrect configuration
- **existing, configured properly** - Resource exists with correct configuration

**Features:**
- Verifies all key resources (Resource Group, Storage Account, Managed Identity, Function App, Key Vault, Static Web App)
- Checks RBAC role assignments for managed identity
- Supports JSON output for automation
- Verbose mode for detailed misconfiguration information

**Options:**
```
  -h, --help              Show help message
  -g, --resource-group RG Resource group name
  -c, --config FILE       Custom configuration file path
  -v, --verbose           Enable verbose output
  --json                  Output results in JSON format
```

**Examples:**
```bash
# Verify all resources with default configuration
./test-azure-resources.sh

# Verify with verbose output to see misconfiguration details
./test-azure-resources.sh --verbose

# Output results as JSON for automation
./test-azure-resources.sh --json

# Verify a specific resource group
./test-azure-resources.sh --resource-group my-rg
```

**Exit Codes:**
- `0` - All resources are properly configured
- `1` - Some resources are missing or misconfigured

### manage-pro-users.sh

Manages Pro users in the ProUsers Azure Storage Table. Users are identified by their email address.

**Features:**
- List all Pro users
- Add new Pro users by email
- Remove Pro users by email
- Check if an email is a Pro user
- Idempotent - safe to run multiple times

**Commands:**
```text
  list                    List all Pro users
  add EMAIL               Add a new Pro user by email
  remove EMAIL            Remove a Pro user by email
  check EMAIL             Check if an email is a Pro user
```

**Options:**
```text
  -h, --help              Show help message
  -a, --storage-account   Storage account name
  -g, --resource-group    Resource group name
  -c, --config FILE       Custom configuration file path
  -v, --verbose           Enable verbose output
```

**Examples:**
```bash
# List all Pro users
./manage-pro-users.sh list

# Add a new Pro user
./manage-pro-users.sh add user@example.com

# Remove a Pro user
./manage-pro-users.sh remove user@example.com

# Check if an email is a Pro user
./manage-pro-users.sh check user@example.com

# List Pro users from a specific storage account
./manage-pro-users.sh list --storage-account mystorageacct
```

**Table Structure:**
- PartitionKey: "ProUser" (constant for all entries)
- RowKey: Email address (URL-encoded)
- Email: Email address (original format)
- CreatedAt: ISO 8601 timestamp when the user was added

**Prerequisites:**
- Storage Account must exist (run deploy-azure-storage-account.sh first)
- ProUsers table must exist (run deploy-azure-storage-tables.sh first)

## Configuration Library (config-lib.sh)

The `config-lib.sh` file provides shared functionality for all deployment scripts:

### Output Functions
- `print_info()` - Blue info message with ℹ️ icon
- `print_success()` - Green success message with ✅ icon
- `print_warning()` - Yellow warning message with ⚠️ icon
- `print_error()` - Red error message with ❌ icon
- `print_section()` - Section header with separator lines

### Configuration Functions
- `get_config_value()` - Get value from JSON config
- `load_config()` - Load all config with precedence
- `save_config_value()` - Save value to config file
- `ensure_config_dir()` - Create config directory if needed

### Azure Validation
- `check_azure_cli()` - Verify Azure CLI is available
- `check_azure_login()` - Verify user is logged in
- `check_prerequisites()` - Run all prerequisite checks

### Resource Management
- `ensure_resource_group()` - Create resource group if needed
- `resource_exists()` - Check if resource exists

### Managed Identity
- `get_managed_identity_id()` - Get client ID
- `get_managed_identity_principal_id()` - Get principal ID
- `get_managed_identity_resource_id()` - Get resource ID

## Best Practices

1. **Review before running**: Always review downloaded scripts before execution
2. **Use configuration files**: Store settings in `~/.glookodata/config.json` for consistency
3. **Test in dev environment**: Deploy to a development subscription first
4. **Check idempotency**: Scripts are designed to be run multiple times safely
5. **Use `--save`**: Save your configuration for future deployments

## Security Notes

> **Security Note:** When downloading and executing scripts from the internet, always review the script content first. For production environments, consider cloning the repository and reviewing the scripts before execution.

- Never store secrets in scripts or configuration files
- Use managed identity for authentication when possible
- Scripts use RBAC for access control (not access policies)
- All secrets should be stored in Azure Key Vault

## Troubleshooting

### Common Issues

1. **"Azure CLI not installed"**
   - Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   - Or use Azure Cloud Shell which has Azure CLI pre-installed

2. **"Not logged in to Azure"**
   - Run `az login` to authenticate
   - In Cloud Shell, you're automatically logged in

3. **"jq not installed"**
   - Install jq: `sudo apt-get install jq` (Linux) or `brew install jq` (macOS)
   - Azure Cloud Shell has jq pre-installed

4. **"Resource not found"**
   - Ensure prerequisite resources exist (storage account, managed identity)
   - Check resource group name and location

5. **"Permission denied"**
   - Ensure you have Contributor role on the subscription
   - Check Azure RBAC permissions

## Related Documentation

- [Main Scripts README](../README.md) - Scripts directory overview
- [Deployment Guide](../../docs/DEPLOYMENT.md) - Azure deployment documentation
- [PowerShell Module](../deployment-ps/README.md) - PowerShell equivalent scripts
