# GlookoDeployment PowerShell Module

This directory contains the GlookoDeployment PowerShell module for deploying Azure infrastructure for GlookoDataWebApp.

## Prerequisites

- PowerShell 7.0 or later
- Azure CLI installed and logged in (`az login`)
- Appropriate permissions to create Azure resources

## Quick Start

### Installation

#### One-Liner Install (Recommended)

```powershell
# Option 1: Download and review before executing (recommended)
$script = irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1
$script | Out-File -FilePath .\Install-GlookoDeploymentModule.ps1
# Review the script, then run:
.\Install-GlookoDeploymentModule.ps1

# Option 2: Direct installation (for trusted environments only)
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)
```

#### Local Install

```powershell
# From the repository
./Install-GlookoDeploymentModule.ps1 -LocalPath ./GlookoDeployment
```

### Usage

```powershell
# Import the module
Import-Module GlookoDeployment

# Initialize configuration with defaults
Initialize-GlookoConfig

# View current configuration
Get-GlookoConfig

# Deploy Azure Function App
Set-GlookoAzureFunction

# Or deploy all resources
Invoke-GlookoDeployment -All
```

## Available Functions

### Configuration Management

| Function | Alias | Description |
|----------|-------|-------------|
| `Get-GlookoConfig` | `Get-GC` | Get current configuration |
| `Set-GlookoConfig` | `Set-GC` | Update configuration values |
| `Test-GlookoConfig` | `Test-GC` | Validate configuration |
| `Initialize-GlookoConfig` | `Initialize-GC` | Create default configuration |

### Deployment Functions

| Function | Alias | Description |
|----------|-------|-------------|
| `Set-GlookoAzureFunction` | `Set-GAF` | Deploy Azure Function App |
| `Invoke-GlookoDeployment` | `Invoke-GD` | Orchestrate full deployment |

## Configuration

### Configuration File

Configuration is stored at `~/.glookodata/config.json`

### Default Configuration

```json
{
  "resourceGroup": "glookodatawebapp-rg",
  "location": "eastus",
  "functionAppName": "glookodatawebapp-func",
  "storageAccountName": "glookodatawebappstorage",
  "managedIdentityName": "glookodatawebapp-identity",
  "keyVaultName": "glookodatawebapp-kv",
  "webAppUrl": "https://glooko.iric.online",
  "useManagedIdentity": true
}
```

### Setting Configuration

```powershell
# Set individual values
Set-GlookoConfig -Location "westus2"
Set-GlookoConfig -FunctionAppName "my-api-func" -ResourceGroup "my-rg"

# Initialize with defaults
Initialize-GlookoConfig

# Merge defaults with existing config
Initialize-GlookoConfig -Merge
```

## Function Details

### Set-GlookoAzureFunction

Creates and configures an Azure Function App.

**Parameters:**
- `-Name` - Function app name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)
- `-Location` - Azure region (optional, uses config)
- `-Runtime` - Function runtime: node, dotnet, python, java (default: node)
- `-RuntimeVersion` - Runtime version (default: 20)
- `-UseManagedIdentity` - Configure with managed identity
- `-SkipRbacAssignment` - Skip RBAC role assignments

**Examples:**
```powershell
# Deploy with defaults
Set-GlookoAzureFunction

# Deploy with custom settings
Set-GlookoAzureFunction -Name "my-func" -Location "westus2"

# Deploy .NET 8 function
Set-GlookoAzureFunction -Runtime "dotnet" -RuntimeVersion "8"

# Deploy with managed identity
Set-GlookoAzureFunction -UseManagedIdentity
```

### Invoke-GlookoDeployment

Orchestrates complete infrastructure deployment.

**Parameters:**
- `-FunctionApp` - Deploy only Function App
- `-All` - Deploy all resources
- `-DryRun` - Show plan without deploying
- `-SkipPrerequisites` - Skip prerequisite checks

**Examples:**
```powershell
# Deploy everything
Invoke-GlookoDeployment -All

# Preview what would be deployed
Invoke-GlookoDeployment -All -DryRun

# Deploy only Function App
Invoke-GlookoDeployment -FunctionApp
```

## Module Structure

```
GlookoDeployment/
├── GlookoDeployment.psd1        # Module manifest
├── GlookoDeployment.psm1        # Module loader
├── Public/                       # Exported functions
│   ├── Config-Functions.ps1     # Configuration management
│   ├── Set-GlookoAzureFunction.ps1
│   └── Invoke-GlookoDeployment.ps1
└── Private/                      # Internal functions
    ├── Output-Functions.ps1     # Output formatting
    └── Azure-Helpers.ps1        # Azure CLI helpers
```

## Security Notes

> **Security Note:** When downloading and executing scripts from the internet, always review the script content first. For production environments, consider cloning the repository and reviewing the scripts before execution.

- Never store secrets in configuration files
- Use managed identity for authentication when possible
- All secrets should be stored in Azure Key Vault
- RBAC is used for access control (not access policies)

## Troubleshooting

### Common Issues

1. **"Azure CLI not installed"**
   - Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   - Or use Azure Cloud Shell which has Azure CLI pre-installed

2. **"Not logged in to Azure"**
   - Run `az login` to authenticate

3. **"Module not found"**
   - Ensure PowerShell 7.0+ is installed
   - Run the installer again with `-Force`

4. **"Storage account not found"**
   - Create the storage account first
   - Verify the storage account name in configuration

5. **"Permission denied"**
   - Ensure you have Contributor role on the subscription
   - Check Azure RBAC permissions

## Related Documentation

- [Main Scripts README](../README.md) - Scripts directory overview
- [Deployment Guide](../../docs/DEPLOYMENT.md) - Azure deployment documentation
- [Bash Scripts](../deployment-cli/README.md) - Bash equivalent scripts
