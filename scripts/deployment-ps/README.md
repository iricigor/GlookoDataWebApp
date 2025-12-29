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

# Option 3: Force reinstall (overwrite existing installation)
$env:GLOOKO_INSTALL_FORCE=1; iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)
```

#### Local Install

```powershell
# From the repository
./Install-GlookoDeploymentModule.ps1 -LocalPath ./GlookoDeployment

# Force reinstall from local path
./Install-GlookoDeploymentModule.ps1 -LocalPath ./GlookoDeployment -Force
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
| `Set-GlookoResourceGroup` | `Set-GRG` | Deploy Azure Resource Group |
| `Set-GlookoStorageAccount` | `Set-GSA` | Deploy Azure Storage Account |
| `Set-GlookoTableStorage` | `Set-GTS` | Deploy Azure Storage Tables with optional managed identity RBAC |
| `Set-GlookoManagedIdentity` | `Set-GMI` | Deploy User-Assigned Managed Identity |
| `Set-GlookoKeyVault` | `Set-GKV` | Deploy Azure Key Vault with RBAC authorization |
| `Set-GlookoAzureFunction` | `Set-GAF` | Deploy Azure Function App |
| `Set-GlookoStaticWebApp` | `Set-GSWA` | Deploy Azure Static Web App with Google authentication |
| `Set-GlookoSwaBackend` | `Set-GSB` | Link Azure Function App to Static Web App as backend |
| `Invoke-GlookoDeployment` | `Invoke-GD` | Orchestrate full deployment |
| `Invoke-GlookoProUsers` | `Invoke-GPU` | Manage Pro users (list, add, remove, check) |
| `Invoke-GlookoProviderMigration` | `Invoke-GPM` | Migrate ProUsers and UserSettings tables to add Provider column |
| `Test-GlookoDeployment` | `Test-GD` | Verify deployment state of all resources |

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

### Set-GlookoResourceGroup

Creates and configures an Azure Resource Group.

**Parameters:**
- `-Name` - Resource group name (optional, uses config)
- `-Location` - Azure region (optional, uses config)

**Examples:**
```powershell
# Deploy with defaults
Set-GlookoResourceGroup

# Deploy with custom name and location
Set-GlookoResourceGroup -Name "my-rg" -Location "westus2"

# Use alias
Set-GRG -Name "my-rg"
```

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

### Set-GlookoKeyVault

Creates and configures an Azure Key Vault for secure secrets management.

**Parameters:**
- `-Name` - Key Vault name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)
- `-Location` - Azure region (optional, uses config)
- `-AssignIdentity` - Assign Key Vault Secrets User role to managed identity

**Examples:**
```powershell
# Deploy with defaults
Set-GlookoKeyVault

# Deploy with custom name and location
Set-GlookoKeyVault -Name "my-keyvault" -Location "westus2"

# Deploy and assign RBAC to managed identity
Set-GlookoKeyVault -AssignIdentity

# Use alias
Set-GKV -AssignIdentity
```

**Prerequisites:**
- Resource Group must exist (created automatically if not present)
- For RBAC assignment: Managed Identity should exist (run Set-GlookoManagedIdentity)

**Expected Secrets:**
After deploying the Key Vault, add secrets manually:
```powershell
# Add Perplexity API key
$secret = ConvertTo-SecureString 'your-api-key' -AsPlainText -Force
Set-AzKeyVaultSecret -VaultName '<name>' -Name 'PerplexityApiKey' -SecretValue $secret

# Add Google Gemini API key
$secret = ConvertTo-SecureString 'your-api-key' -AsPlainText -Force
Set-AzKeyVaultSecret -VaultName '<name>' -Name 'GeminiApiKey' -SecretValue $secret
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

**Google OAuth Integration:**
When deploying with managed identity and Key Vault, the function automatically configures Key Vault references for Google OAuth:

1. Checks if `google-client-id` and `google-client-secret` exist in Key Vault
2. If they exist, adds app settings with Key Vault reference syntax:
   - `GOOGLE_CLIENT_ID`: `@Microsoft.KeyVault(SecretUri=https://...)`
   - `GOOGLE_CLIENT_SECRET`: `@Microsoft.KeyVault(SecretUri=https://...)`
3. The managed identity resolves these references at runtime

To set up Google OAuth:
```powershell
# Add secrets to Key Vault
$clientId = ConvertTo-SecureString "<your-google-client-id>" -AsPlainText -Force
Set-AzKeyVaultSecret -VaultName "glookodatawebapp-kv" -Name "google-client-id" -SecretValue $clientId

$clientSecret = ConvertTo-SecureString "<your-google-client-secret>" -AsPlainText -Force
Set-AzKeyVaultSecret -VaultName "glookodatawebapp-kv" -Name "google-client-secret" -SecretValue $clientSecret

# Deploy/update function app
Set-GlookoAzureFunction -UseManagedIdentity
```

Verify in Azure Portal (Function App → Environment tab):
- Green checkmarks ✅ should appear next to `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

For detailed setup instructions, see [Key Vault References Guide](../../docs/KEY_VAULT_REFERENCES.md).

### Set-GlookoStaticWebApp

Creates and configures an Azure Static Web App for GlookoDataWebApp. Automatically configures Google authentication if the required secrets exist in the Key Vault.

**Parameters:**
- `-Name` - Static Web App name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)
- `-Location` - Azure region (optional, uses config)
- `-Sku` - SKU tier (Free or Standard, default: Standard)
- `-AssignManagedIdentity` - Assign user-assigned managed identity

**Examples:**
```powershell
# Deploy with defaults from configuration
Set-GlookoStaticWebApp

# Deploy with custom name and location
Set-GlookoStaticWebApp -Name "my-swa" -Location "westus2"

# Deploy Free tier with managed identity
Set-GlookoStaticWebApp -Sku Free -AssignManagedIdentity

# Use alias
Set-GSWA
```

**Prerequisites:**
- Resource Group must exist (or will be created)
- User-Assigned Managed Identity should exist (for identity assignment)
- Key Vault with Google auth secrets (optional, for Google authentication):
  - `google-client-id`: Google OAuth 2.0 Client ID
  - `google-client-secret`: Google OAuth 2.0 Client Secret
- Azure CLI must be available in PATH (for setting SWA app settings)

**Google Authentication Setup:**

To enable Google authentication for your Static Web App:

1. **Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select a project
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Set application type to "Web application"
   - Add authorized redirect URI: `https://<your-swa-url>/.auth/login/google/callback`
   - Copy the Client ID and Client Secret

2. **Add Secrets to Key Vault:**
   ```powershell
   $clientId = ConvertTo-SecureString "<your-client-id>" -AsPlainText -Force
   $clientSecret = ConvertTo-SecureString "<your-client-secret>" -AsPlainText -Force
   
   Set-AzKeyVaultSecret -VaultName "<keyvault-name>" -Name "google-client-id" -SecretValue $clientId
   Set-AzKeyVaultSecret -VaultName "<keyvault-name>" -Name "google-client-secret" -SecretValue $clientSecret
   ```

3. **Deploy or Update Static Web App:**
   ```powershell
   Set-GlookoStaticWebApp
   ```

4. **Test Google Authentication:**
   - Visit: `https://<your-swa-url>/.auth/login/google`
   - You should be redirected to Google sign-in page

### Set-GlookoSwaBackend

Links an Azure Function App as the backend for an Azure Static Web App. This enables `/api/*` routes on the Static Web App to be proxied to the Function App.

**Parameters:**
- `-StaticWebAppName` - Static Web App name (optional, uses config)
- `-FunctionAppName` - Function App name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)
- `-Location` - Backend region (optional, uses config)

**Examples:**
```powershell
# Link with defaults from configuration
Set-GlookoSwaBackend

# Link with explicit names
Set-GlookoSwaBackend -StaticWebAppName "my-swa" -FunctionAppName "my-func"

# Link with specific region
Set-GlookoSwaBackend -Location "westus2"

# Use alias
Set-GSB
```

**Prerequisites:**
- Static Web App must exist
- Function App must exist (run Set-GlookoAzureFunction first)

**Why is this needed?**
When a Function App is deployed separately from a Static Web App, the `/api/*` routes
won't work until the backend is linked. This function handles that linking.

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

### Invoke-GlookoProUsers

Manages Pro users in the ProUsers Azure Storage Table. Users are identified by their email address and authentication provider.

**Parameters:**
- `-Action` - The action to perform: List, Add, Remove, Check (required)
- `-User` - The user identifier in "email;provider" format (required for Add, Remove, Check). If provider is not specified, defaults to "Microsoft"
- `-StorageAccountName` - Storage account name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)

**Examples:**
```powershell
# List all Pro users (displays as "email;provider")
Invoke-GlookoProUsers -Action List

# Add a new Pro user with Microsoft provider
Invoke-GlookoProUsers -Action Add -User "user@example.com;Microsoft"

# Add a new Pro user with Google provider
Invoke-GlookoProUsers -Action Add -User "user@example.com;Google"

# Add a new Pro user with default provider (Microsoft)
Invoke-GlookoProUsers -Action Add -User "user@example.com"

# Remove a Pro user
Invoke-GlookoProUsers -Action Remove -User "user@example.com;Microsoft"

# Check if a user is a Pro user
Invoke-GlookoProUsers -Action Check -User "user@example.com;Google"

# Use alias with positional parameters
Invoke-GPU Add "user@example.com;Google"

# List from a specific storage account
Invoke-GlookoProUsers -Action List -StorageAccountName "mystorageacct"
```

**Return Values:**
Returns a hashtable with action-specific properties:
- List: `@{ Action; Count; Users }` - Users array contains `@{ Email; Provider; User; CreatedAt }` for each user
- Add: `@{ Action; Email; Provider; User; Success; AlreadyExists }`
- Remove: `@{ Action; Email; Provider; User; Success; NotFound }`
- Check: `@{ Action; Email; Provider; User; IsProUser; CreatedAt }`

**Table Structure:**
- PartitionKey: "ProUser" (constant for all entries)
- RowKey: Email address (URL-encoded)
- Email: Email address (original format)
- Provider: Authentication provider (Microsoft or Google)
- CreatedAt: ISO 8601 timestamp when the user was added

**Prerequisites:**
- Storage Account must exist (run Set-GlookoStorageAccount first)
- ProUsers table must exist (run Set-GlookoTableStorage first)

### Invoke-GlookoProviderMigration

Migrates ProUsers and UserSettings tables to add the Provider column with a default value of "Microsoft" for existing records that don't have this column. This migration is needed to support Google login alongside Microsoft login.

**Parameters:**
- `-StorageAccountName` - Storage account name (optional, uses config)
- `-ResourceGroup` - Resource group (optional, uses config)
- `-DryRun` - Show what would be updated without making changes

**Examples:**
```powershell
# Run migration (adds Provider=Microsoft to all records without Provider column)
Invoke-GlookoProviderMigration

# Preview what would be updated (dry-run mode)
Invoke-GlookoProviderMigration -DryRun

# Run migration on specific storage account
Invoke-GlookoProviderMigration -StorageAccountName "mystorageacct"

# Use alias
Invoke-GPM -DryRun
```

**Return Values:**
Returns a hashtable with migration results:
```powershell
@{
    StorageAccountName      = "glookodatawebappstorage"
    ResourceGroup          = "glookodatawebapp-rg"
    DefaultProvider        = "Microsoft"
    DryRun                = $false
    ProUsersUpdated       = 5
    ProUsersSkipped       = 2
    UserSettingsUpdated   = 10
    UserSettingsSkipped   = 3
}
```

**Migration Logic:**
- If Provider column exists: **No change** (preserve existing value)
- If Provider column missing: **Add Provider=Microsoft**

**Tables Updated:**
- **ProUsers**: Professional user information
- **UserSettings**: User preferences and settings

**Prerequisites:**
- Storage Account must exist (run Set-GlookoStorageAccount first)
- Tables must exist (run Set-GlookoTableStorage first)

**When to Run:**
Run this migration script once before enabling Google login to ensure all existing users have Provider=Microsoft set. New users will automatically get the Provider column set when they first log in.

### Test-GlookoDeployment

Verifies the deployment state of all Azure resources for GlookoDataWebApp. For each resource, it reports one of three states:
- **not existing** - Resource does not exist
- **existing, misconfigured** - Resource exists but has incorrect configuration
- **existing, configured properly** - Resource exists with correct configuration

**Parameters:**
- `-ResourceGroup` - Resource group to verify (optional, uses config)
- `-OutputFormat` - Output format: 'Console' or 'Object' (default: Console)
- `-Verbose` - Enable verbose output with misconfiguration details

**Examples:**
```powershell
# Verify all resources with default configuration
Test-GlookoDeployment

# Verify with verbose output to see misconfiguration details
Test-GlookoDeployment -Verbose

# Get results as a PowerShell object for pipeline processing
$results = Test-GlookoDeployment -OutputFormat Object

# Output results as JSON for automation
Test-GlookoDeployment -OutputFormat Object | ConvertTo-Json -Depth 5

# Verify a specific resource group
Test-GlookoDeployment -ResourceGroup "my-rg"
```

**Return Values:**
- Console mode: Returns `$true` if all resources are properly configured, `$false` otherwise
- Object mode: Returns a PSCustomObject with Summary, Resources, and Configuration properties

## Module Structure

```
GlookoDeployment/
├── GlookoDeployment.psd1        # Module manifest
├── GlookoDeployment.psm1        # Module loader
├── Public/                       # Exported functions
│   ├── Config-Functions.ps1     # Configuration management
│   ├── Set-GlookoResourceGroup.ps1
│   ├── Set-GlookoStorageAccount.ps1
│   ├── Set-GlookoTableStorage.ps1
│   ├── Set-GlookoManagedIdentity.ps1
│   ├── Set-GlookoKeyVault.ps1
│   ├── Set-GlookoAzureFunction.ps1
│   ├── Set-GlookoSwaBackend.ps1
│   ├── Invoke-GlookoDeployment.ps1
│   ├── Invoke-GlookoProUsers.ps1
│   └── Test-GlookoDeployment.ps1
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
   - Run the installer again with `-Force` (or `$env:GLOOKO_INSTALL_FORCE=1` for iex usage)

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
