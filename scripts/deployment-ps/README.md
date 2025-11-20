# PowerShell Deployment Scripts

This directory contains PowerShell 7+ deployment scripts for the GlookoDataWebApp project.

## 📦 GlookoDeployment PowerShell Module (Recommended)

The **GlookoDeployment** PowerShell module provides the primary deployment functionality with **managed identity** support and **centralized configuration management**.

### Installation

Install the module using the one-liner installer:

```powershell
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)
```

Or run the installer script locally:

```powershell
./Install-GlookoDeploymentModule.ps1
```

### Module Commands

After installation, the module provides these commands:

- **`Invoke-GlookoDeployment`** (Invoke-GD) - Master orchestration for all deployments
- **`Set-GlookoManagedIdentity`** (Set-GMI) - Deploy managed identity
- **`Set-GlookoStorageAccount`** (Set-GSA) - Deploy storage account
- **`Get-GlookoConfig`** (Get-GC) - Get current configuration
- **`Set-GlookoConfig`** (Set-GC) - Update configuration values
- **`Initialize-GlookoConfig`** (Init-GC) - Create new configuration
- **`Test-GlookoConfig`** (Test-GC) - Validate configuration

### Quick Start with Module

```powershell
# 1. Install the module
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

# 2. Import the module
Import-Module GlookoDeployment

# 3. Initialize configuration
Initialize-GlookoConfig

# 4. Edit configuration (optional)
notepad ~/.glookodata/config.json

# 5. Deploy resources
Invoke-GlookoDeployment -All

# Or deploy specific components
Invoke-GlookoDeployment -Identity -Storage
Set-GlookoManagedIdentity
Set-GlookoStorageAccount -UseManagedIdentity
```

## 📄 Standalone Scripts (Legacy)

The following standalone scripts are provided for specific functionality not yet available in the module:

### Available Standalone Scripts

- **`deploy-azure-app-registration.ps1`** - Creates Azure App Registration for authentication
- **`deploy-azure-user-settings-table.ps1`** - Creates UserSettings table with CORS
- **`deploy-azure-pro-users-table.ps1`** - Creates ProUsers table
- **`deploy-azure-static-web-app.ps1`** - Creates Azure Static Web App

**Note:** These scripts will be migrated to the module in future releases. For now, they must be run standalone after deploying core resources via the module.

### Prerequisites

- **PowerShell 7.0 or higher**
- **Azure CLI** installed and configured
- **Appropriate Azure permissions:**
  - Contributor or Owner role on subscription
  - Application Administrator for App Registrations
  - User Access Administrator (for managed identity role assignments)

### Usage Example

```powershell
# First, use the module for core resources
Import-Module GlookoDeployment
Invoke-GlookoDeployment -Identity -Storage

# Then run standalone scripts for tables and web app
./deploy-azure-user-settings-table.ps1
./deploy-azure-pro-users-table.ps1
./deploy-azure-static-web-app.ps1 -Sku Standard
./deploy-azure-app-registration.ps1
```

## Key Features

- ✅ **PowerShell 7+ compatibility** - Uses modern PowerShell features
- ✅ **Module-based architecture** - Installable GlookoDeployment module
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Validation** - Checks prerequisites before running
- ✅ **Color-coded output** - Easy to read progress and errors
- ✅ **Error handling** - Clear error messages
- ✅ **Configuration management** - Centralized config via module
- ✅ **Help documentation** - Use `-Help` or `Get-Help <command>`
- ✅ **Managed Identity support** - Secure, secret-free authentication

## Documentation

For comprehensive information, see:

- **[Module README](GlookoDeployment/README.md)** - GlookoDeployment module documentation
- **[Main Deployment README](../deployment/README.md)** - Complete deployment guide
- **[MANAGED_IDENTITY.md](../../docs/MANAGED_IDENTITY.md)** - Managed identity guide
- **[DEPLOYMENT.md](../../docs/DEPLOYMENT.md)** - Deployment documentation

## Troubleshooting

### "Module not found"

**Solution:**
```powershell
# Install or reinstall the module
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

# Or force reinstall
./Install-GlookoDeploymentModule.ps1 -Force
```

### "PowerShell version too old"

**Solution:**
Install PowerShell 7+: https://github.com/PowerShell/PowerShell#get-powershell

### "Azure CLI not found"

**Solution:**
Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli

### "Permission denied" for role assignments

**Solution:**
- Contact your Azure administrator to request User Access Administrator role
- Or deploy without managed identity (uses connection strings)

## Migration from Standalone Scripts

If you were using the old standalone scripts (`deploy-azure-master.ps1`, `deploy-azure-managed-identity.ps1`, etc.), they have been replaced by the GlookoDeployment module:

**Old approach:**
```powershell
./deploy-azure-master.ps1 -All
```

**New approach:**
```powershell
Import-Module GlookoDeployment
Invoke-GlookoDeployment -All
```

Your existing configuration file (`~/.glookodata/config.json`) will continue to work with the module.

## Support

For issues or questions:

1. Check documentation in `docs/` directory
2. Review existing issues: https://github.com/iricigor/GlookoDataWebApp/issues
3. Open a new issue with `deployment` label

---

**Last Updated:** November 2024

**Note:** Requires PowerShell 7.0 or higher and Azure CLI.
