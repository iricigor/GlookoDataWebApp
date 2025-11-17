# PowerShell Deployment Scripts

This directory contains PowerShell 7+ deployment scripts for the GlookoDataWebApp project with support for **managed identity** (secure, secret-free authentication) and **centralized configuration management**.

## Prerequisites

- **PowerShell 7.0 or higher**
- **Azure CLI** installed and configured
- **Appropriate Azure permissions:**
  - Contributor or Owner role on subscription
  - Application Administrator for App Registrations
  - User Access Administrator (for managed identity role assignments)

## Available Scripts

### Core Scripts

#### 🎯 deploy-azure-master.ps1 (Recommended)

Master orchestration script that coordinates all deployments with centralized configuration.

**Usage:**
```powershell
# Deploy all resources
./deploy-azure-master.ps1 -All

# Deploy specific components
./deploy-azure-master.ps1 -Identity -Storage -WebApp

# Validate configuration without deploying
./deploy-azure-master.ps1 -DryRun -ShowConfig

# Create configuration interactively
./deploy-azure-master.ps1 -CreateConfig
```

#### 🔐 deploy-azure-managed-identity.ps1

Creates user-assigned managed identity for secure authentication without secrets.

**Usage:**
```powershell
./deploy-azure-managed-identity.ps1
./deploy-azure-managed-identity.ps1 -Name my-identity -Save
```

#### 📦 deploy-azure-storage-account.ps1

Creates Azure Storage Account with optional managed identity support.

**Usage:**
```powershell
# With managed identity (recommended)
./deploy-azure-storage-account.ps1 -UseManagedIdentity

# With connection strings (traditional)
./deploy-azure-storage-account.ps1
```

#### 🌐 deploy-azure-static-web-app.ps1

Creates Azure Static Web App with optional managed identity support.

**Usage:**
```powershell
./deploy-azure-static-web-app.ps1 -Sku Standard -ManagedIdentity
./deploy-azure-static-web-app.ps1 -Sku Free
```

### Supporting Scripts

- **deploy-azure-app-registration.ps1** - Creates Azure App Registration for authentication
- **deploy-azure-user-settings-table.ps1** - Creates UserSettings table
- **deploy-azure-pro-users-table.ps1** - Creates ProUsers table

### Configuration Files

- **config-lib.ps1** - Shared configuration library (sourced by all scripts)
- **config.template.json** - JSON configuration template

## Quick Start

### Recommended: Use Master Script

```powershell
# 1. Create configuration (optional but recommended)
./deploy-azure-master.ps1 -CreateConfig

# 2. Edit configuration
notepad ~/.glookodata/config.json

# 3. Deploy all resources
./deploy-azure-master.ps1 -All

# Or deploy specific components
./deploy-azure-master.ps1 -Identity -Storage -Tables -WebApp
```

### Alternative: Manual Deployment

```powershell
# With Managed Identity (recommended)
./deploy-azure-managed-identity.ps1 -Save
./deploy-azure-storage-account.ps1 -UseManagedIdentity
./deploy-azure-user-settings-table.ps1
./deploy-azure-static-web-app.ps1 -Sku Standard -ManagedIdentity
./deploy-azure-app-registration.ps1

# Without Managed Identity (traditional)
./deploy-azure-storage-account.ps1
./deploy-azure-user-settings-table.ps1
./deploy-azure-app-registration.ps1
```

## Configuration Management

### Configuration File Location

All scripts look for configuration at: `~/.glookodata/config.json`

### Configuration Priority

Values are resolved in this order (highest to lowest):

1. **Command-line parameters** (highest)
2. **Environment variables**
3. **Configuration file** (`~/.glookodata/config.json`)
4. **Script defaults** (lowest)

### Environment Variables

```powershell
$env:RESOURCE_GROUP = "my-rg"
$env:LOCATION = "westus2"
./deploy-azure-storage-account.ps1
```

## Key Features

All deployment scripts include:

- ✅ **PowerShell 7+ compatibility** - Uses modern PowerShell features
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Validation** - Checks prerequisites before running
- ✅ **Color-coded output** - Easy to read progress and errors
- ✅ **Error handling** - Clear error messages
- ✅ **Configuration management** - Consistent config across scripts
- ✅ **Help documentation** - Use `-Help` on any script

## Comparison: Bash vs PowerShell

| Feature | Bash (deployment-cli) | PowerShell (deployment-ps) |
|---------|----------------------|----------------------------|
| Platform | Linux, macOS, WSL | Windows, Linux, macOS |
| Shell | Bash 4.0+ | PowerShell 7.0+ |
| Syntax | Shell scripting | PowerShell cmdlets |
| Parameters | `--name value` | `-Name value` |
| Best for | Azure Cloud Shell | Windows developers |

Both implementations provide **identical functionality** - use whichever is more comfortable for your environment.

## Documentation

For comprehensive information, see:

- **[Main Deployment README](../deployment/README.md)** - Complete deployment guide
- **[MANAGED_IDENTITY.md](../../docs/MANAGED_IDENTITY.md)** - Managed identity guide
- **[DEPLOYMENT.md](../../docs/DEPLOYMENT.md)** - Deployment documentation

## Troubleshooting

### "config-lib.ps1 not found"

**Solution:**
```powershell
# Ensure config-lib.ps1 is in the same directory as other scripts
Get-ChildItem *.ps1
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
- Or run scripts without managed identity (uses connection strings)

## Support

For issues or questions:

1. Check documentation in `docs/` directory
2. Review existing issues: https://github.com/iricigor/GlookoDataWebApp/issues
3. Open a new issue with `deployment` label

---

**Last Updated:** November 2024

**Note:** These scripts require PowerShell 7.0 or higher and Azure CLI.
