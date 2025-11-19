# GlookoDeployment PowerShell Module

PowerShell module for deploying and managing GlookoDataWebApp Azure resources with centralized configuration management.

## Features

- **Centralized Configuration** - Single configuration file for all deployments
- **Managed Identity Support** - Secure, secret-free authentication
- **Modular Design** - Deploy individual components or everything at once
- **Configuration Management** - Functions to get, set, test, and initialize configuration
- **Public/Private Functions** - Clean API with internal helper functions

## Requirements

- PowerShell 7.0 or higher
- Azure CLI installed and configured
- Appropriate Azure permissions (Contributor or Owner)

## Installation

### Option 1: One-Line Install (Recommended)

```powershell
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)
```

### Option 2: Download and Install

```powershell
# Download the installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1" -OutFile Install-GlookoDeploymentModule.ps1

# Run the installer
./Install-GlookoDeploymentModule.ps1
```

### Option 3: Azure Cloud Shell

```powershell
# Works directly in Azure Cloud Shell
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)
```

### Option 4: Install from Local Directory

```powershell
./Install-GlookoDeploymentModule.ps1 -LocalPath ./GlookoDeployment
```

## Quick Start

```powershell
# 1. Import the module
Import-Module GlookoDeployment

# 2. Initialize configuration
Initialize-GlookoConfig

# 3. Customize configuration (optional)
Set-GlookoConfig -Location "westus2" -ResourceGroup "my-glooko-rg"

# 4. Deploy all resources
Invoke-GlookoDeployment -All

# Or deploy individual components
New-GlookoManagedIdentity
New-GlookoStorageAccount -UseManagedIdentity
```

## Available Commands

### Configuration Management

| Command | Description |
|---------|-------------|
| `Get-GlookoConfig` | Retrieves current configuration |
| `Set-GlookoConfig` | Sets configuration values |
| `Test-GlookoConfig` | Validates configuration |
| `Initialize-GlookoConfig` | Creates new configuration file |

### Deployment Functions

| Command | Description |
|---------|-------------|
| `New-GlookoManagedIdentity` | Creates user-assigned managed identity |
| `New-GlookoStorageAccount` | Creates Azure Storage Account |
| `Invoke-GlookoDeployment` | Master orchestration for all deployments |

## Configuration

Configuration is stored at `~/.glookodata/config.json` with the following precedence:

1. **Command-line parameters** (highest priority)
2. **Environment variables**
3. **Configuration file**
4. **Module defaults** (lowest priority)

### Configuration File Structure

```json
{
  "resourceGroup": "glookodatawebapp-rg",
  "location": "eastus",
  "appName": "glookodatawebapp",
  "storageAccountName": "glookodatawebappstorage",
  "managedIdentityName": "glookodatawebapp-identity",
  "staticWebAppName": "glookodatawebapp-swa",
  "staticWebAppSku": "Free",
  "useManagedIdentity": true,
  "webAppUrl": "https://glooko.iric.online",
  "appRegistrationName": "GlookoDataWebApp",
  "signInAudience": "PersonalMicrosoftAccount"
}
```

## Examples

### Initialize and Configure

```powershell
# Create configuration file with defaults
Initialize-GlookoConfig

# Update specific values
Set-GlookoConfig -Location "westus2" -StorageAccountName "myuniquestorage"

# View current configuration
Get-GlookoConfig

# Validate configuration
Test-GlookoConfig
```

### Deploy Managed Identity

```powershell
# Deploy with default configuration
New-GlookoManagedIdentity

# Deploy with custom parameters
New-GlookoManagedIdentity -Name "my-identity" -Location "westus2"

# Deploy and assign storage roles
New-GlookoManagedIdentity -AssignStorageRoles
```

### Deploy Storage Account

```powershell
# Deploy with managed identity (recommended)
New-GlookoStorageAccount -UseManagedIdentity

# Deploy with custom name
New-GlookoStorageAccount -Name "mystorageacct" -Location "westus2"

# Deploy and show connection string
New-GlookoStorageAccount -ShowConnectionString
```

### Master Deployment

```powershell
# Deploy everything
Invoke-GlookoDeployment -All

# Deploy specific components
Invoke-GlookoDeployment -Identity -Storage

# Preview what would be deployed
Invoke-GlookoDeployment -All -WhatIf
```

### Using Environment Variables

```powershell
# Set environment variables
$env:RESOURCE_GROUP = "my-rg"
$env:LOCATION = "westus2"
$env:STORAGE_ACCOUNT_NAME = "mystorageacct"

# Deploy (will use environment variables)
New-GlookoStorageAccount
```

### Using Custom Configuration File

```powershell
# Use custom config file
$config = Get-GlookoConfig -ConfigFile ~/my-custom-config.json
New-GlookoStorageAccount -ConfigFile ~/my-custom-config.json
```

## Module Structure

```
GlookoDeployment/
├── GlookoDeployment.psd1          # Module manifest
├── GlookoDeployment.psm1          # Module loader
├── Public/                         # Exported functions
│   ├── Config-Management.ps1       # Configuration functions
│   ├── New-GlookoManagedIdentity.ps1
│   ├── New-GlookoStorageAccount.ps1
│   └── Invoke-GlookoDeployment.ps1
└── Private/                        # Internal functions
    ├── Write-Message.ps1           # Output formatting
    ├── Config-Functions.ps1        # Configuration helpers
    └── Azure-Functions.ps1         # Azure resource helpers
```

## Getting Help

```powershell
# Get help for a specific command
Get-Help New-GlookoStorageAccount -Full

# List all available commands
Get-Command -Module GlookoDeployment

# View module information
Get-Module GlookoDeployment | Format-List
```

## Updating the Module

```powershell
# Reinstall latest version
Install-GlookoDeploymentModule.ps1 -Force
```

## Uninstalling

```powershell
# Remove the module
Remove-Module GlookoDeployment -Force
$modulePath = (Get-Module -ListAvailable GlookoDeployment).ModuleBase
Remove-Item $modulePath -Recurse -Force
```

## Comparison with Scripts

| Feature | Scripts (deployment-ps/*.ps1) | Module (GlookoDeployment) |
|---------|------------------------------|---------------------------|
| Installation | Clone repo | One-line install |
| Updates | Git pull | Reinstall script |
| Usage | `./deploy-script.ps1` | `New-GlookoResource` |
| Functions | File-based | Module-based |
| Configuration | Dot-sourced lib | Built-in |
| Discovery | File browsing | `Get-Command` |
| Help | `-Help` flag | `Get-Help` |

## Troubleshooting

### Module Not Found After Install

```powershell
# Verify installation
Get-Module -ListAvailable GlookoDeployment

# If not found, check module paths
$env:PSModulePath -split ';'

# Manually import
Import-Module ~/Documents/PowerShell/Modules/GlookoDeployment
```

### Azure CLI Not Found

```powershell
# Install Azure CLI
# Windows: https://aka.ms/installazurecliwindows
# macOS: brew install azure-cli
# Linux: https://docs.microsoft.com/cli/azure/install-azure-cli-linux

# Verify installation
az --version
```

### Permission Denied

```powershell
# Ensure you're logged in to Azure
az login

# Check your subscription
az account show

# Verify you have appropriate permissions
az role assignment list --assignee (az account show --query user.name -o tsv)
```

## Contributing

Contributions are welcome! Please see the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](../../../LICENSE) for license information.

## Related Documentation

- [Main Deployment README](../deployment/README.md)
- [PowerShell Scripts README](./README.md)
- [Managed Identity Guide](../../docs/MANAGED_IDENTITY.md)
- [Deployment Documentation](../../docs/DEPLOYMENT.md)

## Support

For issues or questions:

1. Check this documentation
2. Review existing issues: https://github.com/iricigor/GlookoDataWebApp/issues
3. Open a new issue with `deployment` label

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**PowerShell Version:** 7.0+
