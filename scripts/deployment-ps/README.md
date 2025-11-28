# GlookoDeployment PowerShell Module

This directory contains the GlookoDeployment PowerShell module for deploying Azure infrastructure for GlookoDataWebApp.

## Prerequisites

- PowerShell 7.4 or later (required for security - earlier versions have known vulnerabilities)
- Az PowerShell modules (installed automatically in Azure Cloud Shell PowerShell)
- Connected to Azure (`Connect-AzAccount`)
- Appropriate permissions to create Azure resources

### Required Az Modules

The module requires the following Az PowerShell modules:
- Az.Accounts
- Az.Resources
- Az.Storage
- Az.Functions
- Az.KeyVault
- Az.ManagedServiceIdentity
- Az.Websites

These are pre-installed in Azure Cloud Shell (PowerShell flavor). For local use:
```powershell
Install-Module -Name Az -Scope CurrentUser -Repository PSGallery -Force
```

## Quick Start

### Installation

The installer script downloads module files to your PowerShell modules directory, making the module available for import.

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

### After Installation

Once installed, import the module to use its functions:

```powershell
# Connect to Azure (if not in Cloud Shell)
Connect-AzAccount

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
| `Set-GlookoStorageAccount` | `Set-GSA` | Deploy Azure Storage Account |
| `Set-GlookoTableStorage` | `Set-GTS` | Deploy Azure Storage Tables with optional managed identity RBAC |
| `Set-GlookoManagedIdentity` | `Set-GMI` | Deploy User-Assigned Managed Identity |
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

### Set-GlookoStorageAccount

Creates and configures an Azure Storage Account.

**Parameters:**
- `-Name` - Storage account name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)
- `-Location` - Azure region (optional, uses config)
- `-Sku` - Storage SKU: Standard_LRS, Standard_GRS, etc. (default: Standard_LRS)
- `-Kind` - Storage kind: StorageV2, BlobStorage, etc. (default: StorageV2)
- `-AccessTier` - Access tier: Hot, Cool (default: Hot)

**Examples:**
```powershell
# Deploy with defaults
Set-GlookoStorageAccount

# Deploy with custom settings
Set-GlookoStorageAccount -Name "mystorageacct" -Location "westus2"

# Deploy with geo-redundant storage
Set-GlookoStorageAccount -Sku "Standard_GRS"

# Deploy with cool access tier
Set-GlookoStorageAccount -AccessTier "Cool"
```

### Set-GlookoTableStorage

Creates Azure Storage Tables inside an existing Storage Account. Optionally assigns RBAC roles to a managed identity if one uniquely exists in the resource group.

**Parameters:**
- `-StorageAccountName` - Storage account name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)
- `-TableNames` - Array of table names to create (default: @('UserSettings', 'ProUsers'))
- `-AssignIdentity` - Assign Storage Table Data Contributor role to managed identity

**Examples:**
```powershell
# Deploy with defaults (creates UserSettings and ProUsers tables)
Set-GlookoTableStorage

# Deploy with custom storage account
Set-GlookoTableStorage -StorageAccountName "mystorageacct"

# Create custom tables
Set-GlookoTableStorage -TableNames @('CustomTable1', 'CustomTable2')

# Deploy and assign RBAC to managed identity
Set-GlookoTableStorage -AssignIdentity

# Use alias
Set-GTS -AssignIdentity
```

**Prerequisites:**
- Storage Account must exist (run Set-GlookoStorageAccount first)
- For RBAC assignment: Managed Identity should exist (run Set-GlookoManagedIdentity)

### Set-GlookoManagedIdentity

Creates and configures a user-assigned managed identity for passwordless authentication.

**Parameters:**
- `-Name` - Managed identity name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)
- `-Location` - Azure region (optional, uses config)

**Examples:**
```powershell
# Deploy with defaults
Set-GlookoManagedIdentity

# Deploy with custom name and location
Set-GlookoManagedIdentity -Name "my-identity" -Location "westus2"

# Deploy in custom resource group
Set-GlookoManagedIdentity -ResourceGroup "my-rg"
```

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
- `-ManagedIdentity` - Deploy only Managed Identity
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

# Deploy only Managed Identity
Invoke-GlookoDeployment -ManagedIdentity

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
│   ├── Set-GlookoStorageAccount.ps1
│   ├── Set-GlookoTableStorage.ps1
│   ├── Set-GlookoManagedIdentity.ps1
│   ├── Set-GlookoAzureFunction.ps1
│   └── Invoke-GlookoDeployment.ps1
└── Private/                      # Internal functions
    ├── Output-Functions.ps1     # Output formatting
    └── Azure-Helpers.ps1        # Azure PowerShell helpers
```

## Security Notes

> **Security Note:** When downloading and executing scripts from the internet, always review the script content first. For production environments, consider cloning the repository and reviewing the scripts before execution.

- Never store secrets in configuration files
- Use managed identity for authentication when possible
- All secrets should be stored in Azure Key Vault
- RBAC is used for access control (not access policies)

## Troubleshooting

### Common Issues

1. **"Az module not found"**
   - Install Az module: `Install-Module -Name Az -Scope CurrentUser`
   - Or use Azure Cloud Shell (PowerShell flavor) which has Az modules pre-installed

2. **"Not connected to Azure"**
   - Run `Connect-AzAccount` to authenticate

3. **"Module not found"**
   - Ensure PowerShell 7.4+ is installed
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
