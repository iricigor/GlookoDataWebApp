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
| `deploy-azure-function.sh` | Deploys Azure Function App with managed identity |

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
