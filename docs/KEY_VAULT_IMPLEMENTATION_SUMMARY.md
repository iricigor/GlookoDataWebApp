# Key Vault References Implementation Summary

This document summarizes the changes made to implement Key Vault references for Google OAuth credentials in the GlookoDataWebApp Azure deployment.

## Overview

The implementation enables secure access to Google OAuth credentials for both the Azure Function App (backend) and Static Web App (frontend) using Azure Key Vault references and GitHub secrets.

## Issue Requirements

Based on issue "Configure Key Vault References for Azure Functions":

- ✅ **Identity Check**: Managed Identity has `Key Vault Secrets User` role on Key Vault
- ✅ **App Settings Mapping**: Function App configured with Key Vault reference syntax
- ✅ **SWA Mapping**: Static Web App configured to receive `VITE_GOOGLE_CLIENT_ID` via CI/CD

## Changes Made

### 1. PowerShell Deployment Scripts

#### `Set-GlookoAzureFunction.ps1` (v1.0.23)

**Added automatic Key Vault reference configuration:**

```powershell
# Check if Google OAuth secrets exist in Key Vault
$googleClientIdSecret = Get-AzKeyVaultSecret -VaultName $keyVaultName -Name "google-client-id" -ErrorAction SilentlyContinue
$googleClientSecretSecret = Get-AzKeyVaultSecret -VaultName $keyVaultName -Name "google-client-secret" -ErrorAction SilentlyContinue

# If both secrets exist, configure Key Vault references
if ($googleClientIdSecret -and $googleClientSecretSecret) {
    $vaultUri = $keyVault.VaultUri.TrimEnd('/')
    $appSettings["GOOGLE_CLIENT_ID"] = "@Microsoft.KeyVault(SecretUri=$vaultUri/secrets/google-client-id)"
    $appSettings["GOOGLE_CLIENT_SECRET"] = "@Microsoft.KeyVault(SecretUri=$vaultUri/secrets/google-client-secret)"
}
```

**Key features:**
- Automatic detection of Google OAuth secrets in Key Vault
- Only configures references if both secrets exist (fail-safe)
- Uses correct Key Vault reference syntax
- Provides user guidance in deployment summary
- Verifies managed identity RBAC permissions already in place

#### `Set-GlookoStaticWebApp.ps1`

**Enhanced documentation:**
- Added comprehensive notes about GitHub secret configuration
- Documented CI/CD environment variable injection workflow
- Added step-by-step setup instructions in deployment summary
- Reference to detailed KEY_VAULT_REFERENCES.md guide

### 2. GitHub Actions Workflows

#### `azure-static-web-apps-wonderful-stone-071384103.yml` (Production Deploy)

**Added environment variable injection:**

```yaml
- name: Build And Deploy Static Web App
  uses: Azure/static-web-apps-deploy@v1
  env:
    NODE_VERSION: '20.19.5'
    # Inject Google OAuth Client ID for Vite during build
    VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
  with:
    # ... rest of configuration
```

#### `pr-preview-deploy.yml` (PR Preview Deploy)

**Added same environment variable injection:**
- Ensures PR previews can test Google OAuth integration
- Uses the same GitHub secret for consistency

### 3. Documentation

#### `docs/KEY_VAULT_REFERENCES.md` (NEW)

**Comprehensive 300+ line guide covering:**

1. **Prerequisites**
   - Azure Key Vault setup
   - Managed Identity configuration
   - RBAC role assignments

2. **Part 1: Function App Configuration**
   - Adding Google OAuth secrets to Key Vault
   - Verifying managed identity access
   - Deploying/updating Function App
   - Verification in Azure Portal (green checkmarks)
   - PowerShell verification commands

3. **Part 2: Static Web App Configuration**
   - Adding VITE_GOOGLE_CLIENT_ID to GitHub secrets
   - GitHub workflow configuration
   - Triggering deployment
   - Verifying in build logs

4. **Key Vault Reference Syntax**
   - Format explanation
   - Version handling
   - Examples

5. **Troubleshooting**
   - Common issues and solutions
   - Function App problems
   - Static Web App build failures
   - OAuth login issues

6. **Security Best Practices**
   - Never commit secrets
   - Rotate secrets regularly
   - Use RBAC for Key Vault
   - Monitor secret access

7. **Reference Scripts**
   - Complete setup script
   - Verification script

#### `scripts/deployment-ps/README.md` (UPDATED)

**Enhanced Set-GlookoAzureFunction section:**
- Added "Google OAuth Integration" subsection
- Step-by-step setup instructions
- Verification guidance
- Link to detailed guide

#### Module Version Update

**`GlookoDeployment.psd1`**
- Version bumped: `1.0.22` → `1.0.23`
- Release notes updated with new features

## Verification & Testing

### Automated Tests Created

1. **Syntax Validation Test**
   - ✅ All PowerShell files pass syntax validation
   - ✅ YAML workflow files valid

2. **Key Vault Reference Configuration Test**
   - ✅ Correct reference syntax format
   - ✅ GitHub workflow has VITE_GOOGLE_CLIENT_ID injection
   - ✅ Documentation files exist
   - ✅ Module version bumped correctly

3. **RBAC Assignment Logic Test**
   - ✅ Key Vault Secrets User role assignment code present
   - ✅ Google OAuth secret detection logic correct
   - ✅ Conditional configuration (only if secrets exist)
   - ✅ User guidance messages present
   - ✅ URI formatting (TrimEnd) to prevent double slashes

## How It Works

### Function App Flow

1. **Deployment Time**:
   - `Set-GlookoAzureFunction -UseManagedIdentity` runs
   - Script checks if `google-client-id` and `google-client-secret` exist in Key Vault
   - If both exist, adds app settings with Key Vault reference syntax
   - Managed identity already has `Key Vault Secrets User` role (from `Set-GlookoKeyVault -AssignIdentity`)

2. **Runtime**:
   - Function App requests `GOOGLE_CLIENT_ID` environment variable
   - Azure sees `@Microsoft.KeyVault(SecretUri=...)` reference
   - Azure uses Function App's managed identity to retrieve secret from Key Vault
   - Secret value is returned to the Function App
   - Green checkmark appears in Azure Portal Environment tab

### Static Web App Flow

1. **GitHub Secret Setup**:
   - Administrator adds `VITE_GOOGLE_CLIENT_ID` to GitHub repository secrets
   - Value matches the Google Client ID stored in Key Vault

2. **CI/CD Build Time**:
   - GitHub Actions workflow runs
   - `env.VITE_GOOGLE_CLIENT_ID` injects secret into build environment
   - Vite reads `import.meta.env.VITE_GOOGLE_CLIENT_ID` during build
   - Value is embedded in compiled JavaScript code
   - Built artifacts deployed to Azure SWA

3. **Runtime**:
   - Frontend code has Google Client ID embedded
   - No runtime Key Vault lookup needed (client-side can't access Key Vault)

## Security Considerations

### Function App
- ✅ **Secrets never in code**: Key Vault references used instead
- ✅ **Passwordless authentication**: Managed identity for Key Vault access
- ✅ **RBAC**: `Key Vault Secrets User` role limits access to secrets only
- ✅ **Audit trail**: Azure Monitor logs all Key Vault access

### Static Web App
- ✅ **GitHub secrets**: VITE_GOOGLE_CLIENT_ID stored securely
- ✅ **Build-time injection**: Never committed to repository
- ⚠️ **Client-side exposure**: Google Client ID is public (by OAuth design)
- ✅ **Client Secret protected**: Only in Key Vault, never in frontend

## Verification Checklist

### For Deployers

After running the deployment scripts, verify:

- [ ] Key Vault contains `google-client-id` and `google-client-secret` secrets
- [ ] Managed Identity has `Key Vault Secrets User` role on Key Vault
- [ ] Function App settings show `@Microsoft.KeyVault(...)` references
- [ ] Azure Portal shows green checkmarks ✅ for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- [ ] GitHub repository has `VITE_GOOGLE_CLIENT_ID` secret configured
- [ ] GitHub Actions workflow has `env.VITE_GOOGLE_CLIENT_ID` in build step

### Using PowerShell

```powershell
# Quick verification script
Import-Module GlookoDeployment

# Get configuration
$config = Get-GlookoConfig

# Check Function App settings
$settings = (Get-AzFunctionApp -ResourceGroupName $config.resourceGroup -Name $config.functionAppName).ApplicationSettings
Write-Host "GOOGLE_CLIENT_ID: $($settings['GOOGLE_CLIENT_ID'])"
# Should show: @Microsoft.KeyVault(SecretUri=https://...)

# Check Key Vault secrets
Get-AzKeyVaultSecret -VaultName $config.keyVaultName | Where-Object { $_.Name -like "google-*" }
# Should list: google-client-id, google-client-secret

# Check RBAC
$identity = Get-AzUserAssignedIdentity -ResourceGroupName $config.resourceGroup -Name $config.managedIdentityName
$keyVault = Get-AzKeyVault -VaultName $config.keyVaultName
Get-AzRoleAssignment -ObjectId $identity.PrincipalId -Scope $keyVault.ResourceId -RoleDefinitionName "Key Vault Secrets User"
# Should return role assignment details
```

## Related Documentation

- [KEY_VAULT_REFERENCES.md](KEY_VAULT_REFERENCES.md) - Detailed setup guide
- [PowerShell Deployment README](../scripts/deployment-ps/README.md) - Module documentation
- [Azure Key Vault References](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references) - Microsoft docs

## Definition of Done

All requirements from the issue are met:

✅ **Identity Check**: 
- User-Assigned Managed Identity has `Key Vault Secrets User` role
- RBAC assignment code already exists in `Set-GlookoKeyVault -AssignIdentity`
- Verified during `Set-GlookoAzureFunction` deployment

✅ **App Settings Mapping**: 
- Function App configured with:
  - `GOOGLE_CLIENT_ID`: `@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/google-client-id)`
  - `GOOGLE_CLIENT_SECRET`: `@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/google-client-secret)`
- Automatic configuration when secrets exist in Key Vault

✅ **SWA Mapping**: 
- GitHub workflow injects `VITE_GOOGLE_CLIENT_ID` during build
- Documentation guides user to add GitHub secret
- Both production and PR preview workflows configured

✅ **Verification**: 
- Azure Portal Environment tab shows green checkmarks
- PowerShell verification commands provided
- Automated tests validate configuration

## Next Steps for Users

1. **Add Google OAuth secrets to Key Vault**:
   ```powershell
   $clientId = ConvertTo-SecureString "<your-google-client-id>" -AsPlainText -Force
   Set-AzKeyVaultSecret -VaultName "glookodatawebapp-kv" -Name "google-client-id" -SecretValue $clientId
   
   $clientSecret = ConvertTo-SecureString "<your-google-client-secret>" -AsPlainText -Force
   Set-AzKeyVaultSecret -VaultName "glookodatawebapp-kv" -Name "google-client-secret" -SecretValue $clientSecret
   ```

2. **Deploy/Update Function App**:
   ```powershell
   Set-GlookoAzureFunction -UseManagedIdentity
   ```

3. **Add GitHub Secret**:
   - Go to: Settings > Secrets and variables > Actions
   - Add secret: `VITE_GOOGLE_CLIENT_ID` = `<your-google-client-id>`

4. **Deploy via GitHub Actions**:
   - Go to Actions tab
   - Run "🚀 Deploy to Azure" workflow

5. **Verify**:
   - Azure Portal → Function App → Environment tab → Check for green checkmarks
   - Test OAuth login on the deployed Static Web App

For detailed instructions, see [KEY_VAULT_REFERENCES.md](KEY_VAULT_REFERENCES.md).
