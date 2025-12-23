# Key Vault References Configuration Guide

This guide explains how to configure Key Vault references for the Azure Function App and Static Web App to securely access Google OAuth credentials.

## Overview

The GlookoDataWebApp uses Azure Key Vault to store sensitive credentials like Google OAuth Client ID and Client Secret. The Azure Function App and Static Web App access these secrets using:

- **Function App**: Key Vault references (resolved at runtime using managed identity)
- **Static Web App**: Environment variables injected during CI/CD build

## Prerequisites

1. **Azure Key Vault** must be created (run `Set-GlookoKeyVault`)
2. **User-Assigned Managed Identity** must exist (run `Set-GlookoManagedIdentity`)
3. **Function App** must be deployed (run `Set-GlookoAzureFunction -UseManagedIdentity`)
4. **Managed Identity** must have `Key Vault Secrets User` role on the Key Vault

## Part 1: Function App Configuration

### Step 1: Add Google OAuth Secrets to Key Vault

```powershell
# Connect to Azure
Connect-AzAccount

# Set variables
$keyVaultName = "glookodatawebapp-kv"  # Your Key Vault name
$googleClientId = "<your-google-oauth-client-id>"
$googleClientSecret = "<your-google-oauth-client-secret>"

# Add secrets to Key Vault
$clientIdSecure = ConvertTo-SecureString $googleClientId -AsPlainText -Force
Set-AzKeyVaultSecret -VaultName $keyVaultName -Name "google-client-id" -SecretValue $clientIdSecure

$clientSecretSecure = ConvertTo-SecureString $googleClientSecret -AsPlainText -Force
Set-AzKeyVaultSecret -VaultName $keyVaultName -Name "google-client-secret" -SecretValue $clientSecretSecure
```

### Step 2: Verify Managed Identity Has Access

Check that the managed identity has the `Key Vault Secrets User` role:

```powershell
# Get Key Vault and Managed Identity
$keyVault = Get-AzKeyVault -VaultName $keyVaultName
$identity = Get-AzUserAssignedIdentity -Name "glookodatawebapp-identity" -ResourceGroupName "glookodatawebapp-rg"

# Check role assignment
Get-AzRoleAssignment -ObjectId $identity.PrincipalId -Scope $keyVault.ResourceId -RoleDefinitionName "Key Vault Secrets User"
```

If the role is not assigned, run:

```powershell
New-AzRoleAssignment `
    -ObjectId $identity.PrincipalId `
    -RoleDefinitionName "Key Vault Secrets User" `
    -Scope $keyVault.ResourceId
```

Or use the deployment script:

```powershell
Set-GlookoKeyVault -AssignIdentity
```

### Step 3: Deploy/Update Function App with Key Vault References

Run the deployment script to configure Key Vault references:

```powershell
Set-GlookoAzureFunction -UseManagedIdentity
```

This will automatically:
1. Detect Google OAuth secrets in Key Vault
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` app settings with Key Vault reference syntax
3. Configure the managed identity

### Step 4: Verify Key Vault References in Azure Portal

1. Go to **Azure Portal** → **Function App** → **Environment** tab
2. Under **Application settings**, verify:
   - `GOOGLE_CLIENT_ID`: Should show `@Microsoft.KeyVault(SecretUri=https://...)`
   - `GOOGLE_CLIENT_SECRET`: Should show `@Microsoft.KeyVault(SecretUri=https://...)`
3. Look for **green checkmarks** ✅ next to these settings
   - Green checkmark = Secret resolved successfully
   - Red X = Secret resolution failed (check RBAC permissions)

### Step 5: Verify Using PowerShell

```powershell
# Get Function App settings
$functionName = "glookodatawebapp-func"
$rg = "glookodatawebapp-rg"

# Get app settings
$settings = (Get-AzFunctionApp -ResourceGroupName $rg -Name $functionName).ApplicationSettings

# Check for Key Vault references
$settings["GOOGLE_CLIENT_ID"]      # Should show @Microsoft.KeyVault(SecretUri=...)
$settings["GOOGLE_CLIENT_SECRET"]  # Should show @Microsoft.KeyVault(SecretUri=...)
```

Expected output:
```
@Microsoft.KeyVault(SecretUri=https://glookodatawebapp-kv.vault.azure.net/secrets/google-client-id)
@Microsoft.KeyVault(SecretUri=https://glookodatawebapp-kv.vault.azure.net/secrets/google-client-secret)
```

## Part 2: Static Web App Configuration

### Step 1: Add VITE_GOOGLE_CLIENT_ID to GitHub Secrets

The Static Web App needs the Google Client ID at build time to embed it in the frontend code.

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secret:
   - **Name**: `VITE_GOOGLE_CLIENT_ID`
   - **Value**: `<your-google-oauth-client-id>` (same as stored in Key Vault)
5. Click **Add secret**

### Step 2: Verify GitHub Workflow Configuration

The GitHub Actions workflow should have been updated to inject the environment variable:

```yaml
- name: Build And Deploy Static Web App
  uses: Azure/static-web-apps-deploy@v1
  env:
    NODE_VERSION: '20.19.5'
    VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}  # ✅ This line
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_WONDERFUL_STONE_071384103 }}
    # ... rest of configuration
```

### Step 3: Trigger Deployment

After adding the GitHub secret:

1. Go to **Actions** tab in GitHub
2. Select **🚀 Deploy to Azure** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

The build process will now have access to `VITE_GOOGLE_CLIENT_ID`, which Vite will inject into the frontend code.

### Step 4: Verify in Build Logs

After deployment, check the GitHub Actions logs:

1. Go to the workflow run
2. Check the **Build And Deploy Static Web App** step
3. Look for environment variable logs (if enabled)
4. Verify no errors related to missing `VITE_GOOGLE_CLIENT_ID`

## Key Vault Reference Syntax

The Key Vault reference syntax used by Azure Function App:

```
@Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/<secret-name>)
```

Example:
```
@Microsoft.KeyVault(SecretUri=https://glookodatawebapp-kv.vault.azure.net/secrets/google-client-id)
```

### With Version (Optional)

You can reference a specific version:

```
@Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/<secret-name>/<version>)
```

If no version is specified, the latest version is used.

## Troubleshooting

### Function App: Red X Next to Key Vault Reference

**Problem**: Key Vault reference shows a red X in Azure Portal.

**Solutions**:
1. Verify managed identity has `Key Vault Secrets User` role
2. Check that the secret exists in Key Vault
3. Verify Key Vault reference syntax is correct
4. Check for typos in secret name

### Function App: Missing Environment Variables

**Problem**: `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` not showing in app settings.

**Solutions**:
1. Re-run deployment: `Set-GlookoAzureFunction -UseManagedIdentity`
2. Verify secrets exist in Key Vault
3. Check deployment logs for errors

### Static Web App: Build Fails

**Problem**: GitHub Actions build fails with error about missing `VITE_GOOGLE_CLIENT_ID`.

**Solutions**:
1. Verify GitHub secret `VITE_GOOGLE_CLIENT_ID` is set
2. Check workflow YAML has `env:` section with the variable
3. Re-run the workflow after adding the secret

### Static Web App: Google Login Not Working

**Problem**: Google OAuth login fails on the Static Web App.

**Solutions**:
1. Verify `VITE_GOOGLE_CLIENT_ID` is correctly set in GitHub secrets
2. Check that the Google OAuth redirect URI matches your SWA URL
3. Verify the client ID in Key Vault matches the one in GitHub secrets
4. Check browser console for OAuth-related errors

## Security Best Practices

1. **Never commit secrets to Git**: Always use Key Vault or GitHub Secrets
2. **Rotate secrets regularly**: Update secrets in Key Vault and GitHub Secrets periodically
3. **Use RBAC for Key Vault**: Managed identity provides secure, passwordless access
4. **Limit secret access**: Only grant `Key Vault Secrets User` role to necessary identities
5. **Monitor secret access**: Use Azure Monitor to track Key Vault access

## Reference Scripts

### Complete Setup Script

```powershell
# 1. Connect to Azure
Connect-AzAccount

# 2. Import GlookoDeployment module
Import-Module GlookoDeployment

# 3. Create Managed Identity
Set-GlookoManagedIdentity

# 4. Create Key Vault with RBAC
Set-GlookoKeyVault -AssignIdentity

# 5. Add Google OAuth secrets
$clientId = ConvertTo-SecureString "<your-google-client-id>" -AsPlainText -Force
Set-AzKeyVaultSecret -VaultName "glookodatawebapp-kv" -Name "google-client-id" -SecretValue $clientId

$clientSecret = ConvertTo-SecureString "<your-google-client-secret>" -AsPlainText -Force
Set-AzKeyVaultSecret -VaultName "glookodatawebapp-kv" -Name "google-client-secret" -SecretValue $clientSecret

# 6. Deploy Function App with Key Vault references
Set-GlookoAzureFunction -UseManagedIdentity

# 7. Verify configuration
Test-GlookoDeployment
```

### Verification Script

```powershell
# Get configuration
$config = Get-GlookoConfig
$functionName = $config.functionAppName
$keyVaultName = $config.keyVaultName
$identityName = $config.managedIdentityName
$rg = $config.resourceGroup

# Check Function App settings
Write-Host "=== Function App Settings ===" -ForegroundColor Cyan
$settings = (Get-AzFunctionApp -ResourceGroupName $rg -Name $functionName).ApplicationSettings
Write-Host "GOOGLE_CLIENT_ID:     $($settings['GOOGLE_CLIENT_ID'])"
Write-Host "GOOGLE_CLIENT_SECRET: $($settings['GOOGLE_CLIENT_SECRET'])"

# Check Key Vault secrets
Write-Host "`n=== Key Vault Secrets ===" -ForegroundColor Cyan
$secrets = Get-AzKeyVaultSecret -VaultName $keyVaultName
$secrets | Where-Object { $_.Name -like "google-*" } | ForEach-Object {
    Write-Host "$($_.Name): Exists (Updated: $($_.Updated))"
}

# Check RBAC assignment
Write-Host "`n=== RBAC Assignments ===" -ForegroundColor Cyan
$identity = Get-AzUserAssignedIdentity -ResourceGroupName $rg -Name $identityName
$keyVault = Get-AzKeyVault -VaultName $keyVaultName
$roleAssignment = Get-AzRoleAssignment -ObjectId $identity.PrincipalId -Scope $keyVault.ResourceId -RoleDefinitionName "Key Vault Secrets User"

if ($roleAssignment) {
    Write-Host "✅ Managed identity has 'Key Vault Secrets User' role" -ForegroundColor Green
}
else {
    Write-Host "❌ Managed identity missing 'Key Vault Secrets User' role" -ForegroundColor Red
}
```

## Related Documentation

- [Azure Key Vault References](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references)
- [Azure Managed Identities](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
