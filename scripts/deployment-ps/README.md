# PowerShell Deployment Scripts

This directory contains PowerShell 7+ deployment scripts for the GlookoDataWebApp project.

## 📦 GlookoDeployment PowerShell Module

The **GlookoDeployment** PowerShell module provides complete deployment functionality with **managed identity** support and **centralized configuration management**.

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

**Deployment Functions:**
- **`Invoke-GlookoDeployment`** (Invoke-GD) - Master orchestration for all deployments
- **`Set-GlookoManagedIdentity`** (Set-GMI) - Deploy managed identity
- **`Set-GlookoStorageAccount`** (Set-GSA) - Deploy storage account
- **`Set-GlookoTableStorage`** (Set-GTS) - Deploy storage tables (UserSettings, ProUsers)
- **`Set-GlookoAppRegistration`** (Set-GAR) - Deploy app registration for authentication
- **`Set-GlookoStaticWebApp`** (Set-GSWA) - Deploy static web app

**Configuration Functions:**
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

# 5. Deploy all resources
Invoke-GlookoDeployment -All

# Or deploy specific components
Invoke-GlookoDeployment -Identity -Storage -Tables -Auth -WebApp

# Or use individual functions
Set-GlookoManagedIdentity
Set-GlookoStorageAccount -UseManagedIdentity
Set-GlookoTableStorage
Set-GlookoAppRegistration
Set-GlookoStaticWebApp -Sku Standard -AssignManagedIdentity
```

### Prerequisites

- **PowerShell 7.0 or higher**
- **Azure CLI** installed and configured
- **Appropriate Azure permissions:**
  - Contributor or Owner role on subscription
  - Application Administrator for App Registrations
  - User Access Administrator (for managed identity role assignments)

### Usage Example

## Key Features

- ✅ **PowerShell 7+ compatibility** - Uses modern PowerShell features
- ✅ **Module-based architecture** - Complete GlookoDeployment module
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Validation** - Checks prerequisites before running
- ✅ **Color-coded output** - Easy to read progress and errors
- ✅ **Error handling** - Clear error messages
- ✅ **Configuration management** - Centralized config via module
- ✅ **Help documentation** - Use `-Help` or `Get-Help <command>`
- ✅ **Managed Identity support** - Secure, secret-free authentication
- ✅ **All-in-one deployment** - Single module for all Azure resources

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

All standalone deployment scripts have been consolidated into the GlookoDeployment module:

**Old standalone scripts (deprecated):**
```powershell
./deploy-azure-master.ps1 -All
./deploy-azure-managed-identity.ps1
./deploy-azure-storage-account.ps1
./deploy-azure-user-settings-table.ps1
./deploy-azure-pro-users-table.ps1
./deploy-azure-app-registration.ps1
./deploy-azure-static-web-app.ps1
```

**New module-based approach:**
```powershell
# Install module (one-time)
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

# Deploy all resources
Import-Module GlookoDeployment
Invoke-GlookoDeployment -All

# Or use individual functions
Set-GlookoManagedIdentity
Set-GlookoStorageAccount -UseManagedIdentity
Set-GlookoTableStorage
Set-GlookoAppRegistration
Set-GlookoStaticWebApp -Sku Standard -AssignManagedIdentity
```

Your existing configuration file (`~/.glookodata/config.json`) will continue to work with the module.

## Contributing to the Module

When making changes to the GlookoDeployment module:

1. **Always bump the module version** in `GlookoDeployment.psd1`
   - Use semantic versioning: MAJOR.MINOR.PATCH
   - Patch version for bug fixes (1.0.0 → 1.0.1)
   - Minor version for new features (1.0.0 → 1.1.0)
   - Major version for breaking changes (1.0.0 → 2.0.0)

2. **Update the ReleaseNotes** in `GlookoDeployment.psd1`
   - Add new version section at the top
   - Document all changes clearly

3. **Test the module** before committing
   ```powershell
   # Test manifest is valid
   Test-ModuleManifest -Path ./GlookoDeployment.psd1
   
   # Test module loads correctly
   Import-Module ./GlookoDeployment.psd1 -Force
   
   # Verify all functions are available
   Get-Command -Module GlookoDeployment
   ```

4. **Why version bumping is required:**
   - The one-liner installer downloads the latest version from GitHub
   - Users rely on `iex (irm ...)` to get updates
   - Without version changes, PowerShell may cache old versions
   - Azure Cloud Shell requires new versions to refresh the module

## Support

For issues or questions:

1. Check documentation in `docs/` directory
2. Review existing issues: https://github.com/iricigor/GlookoDataWebApp/issues
3. Open a new issue with `deployment` label

---

**Last Updated:** November 2024

**Note:** Requires PowerShell 7.0 or higher and Azure CLI.
