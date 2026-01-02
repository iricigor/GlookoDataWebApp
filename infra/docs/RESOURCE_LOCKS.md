# Resource Locks for GlookoDataWebApp

This document explains the resource locks implemented for the GlookoDataWebApp infrastructure and provides instructions for managing them.

## Overview

Azure Resource Locks protect critical resources from accidental deletion. The GlookoDataWebApp infrastructure implements **CanNotDelete** locks on resources that **cannot be easily recreated** because they contain:
- User-generated data
- Externally-generated secrets
- Unique identities that would break integrations if recreated

## Protection Strategy

**Resources that ARE protected:**
- Resources containing **irreplaceable data** (Storage Account)
- Resources containing **externally-generated secrets** (Key Vault)
- Resources with **unique identities** that break role assignments if recreated (Managed Identity)

**Resources that are NOT protected:**
- Resources that can be **recreated and redeployed** (Function App, Static Web App)
- Resources with no persistent state

## Protected Resources

The following resources are protected with `CanNotDelete` locks:

### 1. Storage Account
- **Resource:** Storage Account (e.g., `glookodatawebappstorage`)
- **Lock Name:** `{storageAccountName}-lock`
- **Why Protected:** Contains **user-generated data** in tables (UserSettings, ProUsers, AIQueryLogs) that is created by the running application and cannot be recreated from code
- **Impact if Deleted:** All user settings, pro user records, and AI query history would be permanently lost
- **Lock Impact:** Prevents deletion while allowing all other operations (read, write, update)

### 2. Key Vault
- **Resource:** Key Vault (e.g., `glookodatawebapp-kv`)
- **Lock Name:** `{keyVaultName}-lock`
- **Why Protected:** Stores **externally-generated secrets** (API keys from Perplexity, Google Gemini, OAuth credentials) that are obtained outside the deployment process
- **Impact if Deleted:** All API keys and OAuth credentials would be lost; services would stop working until secrets are manually re-added
- **Lock Impact:** Prevents deletion while allowing secret management operations

### 3. User-Assigned Managed Identity
- **Resource:** Managed Identity (e.g., `glookodatawebapp-identity`)
- **Lock Name:** `{managedIdentityName}-lock`
- **Why Protected:** Has a **unique Principal ID** that is referenced in all RBAC role assignments; recreating it generates a new Principal ID, breaking all existing role assignments and service integrations
- **Impact if Deleted:** All role assignments break; Function App and Static Web App lose access to Storage and Key Vault; requires manual reconfiguration of all services
- **Lock Impact:** Prevents deletion while allowing RBAC role assignments

## Resources NOT Protected

The following resources do NOT have locks because they can be easily recreated:

### Function App
- **Why NOT Protected:** Can be recreated via Bicep and code redeployed via CI/CD
- **Recreation Process:** Deploy Bicep → Deploy function code → Configure app settings (automated)

### Static Web App
- **Why NOT Protected:** Can be recreated via Bicep and frontend redeployed via CI/CD
- **Recreation Process:** Deploy Bicep → Deploy React app → Link backend (semi-automated)

## Lock Level: CanNotDelete

**What it does:**
- ✅ **Allows:** All read and write operations on the resource
- ✅ **Allows:** Updating resource properties
- ✅ **Allows:** Adding/removing child resources (e.g., Key Vault secrets, Storage tables)
- ❌ **Blocks:** Deleting the resource itself

**What it doesn't protect against:**
- ⚠️ Data corruption or modification
- ⚠️ Configuration changes
- ⚠️ Resource group deletion (requires separate resource group lock)

## Automatic Deployment

Resource locks are **automatically applied** when deploying infrastructure via Bicep:

```bash
# Deploy infrastructure (locks are included)
az deployment group create \
  --resource-group Glooko \
  --template-file infra/main.bicep \
  --parameters infra/parameters.current.bicepparam
```

**What happens:**
1. Resources are created/updated
2. Locks are automatically applied to protected resources
3. Locks persist across subsequent deployments

## Verifying Locks

### Option 1: Using What-If Analysis

Before deploying, verify that locks will be created:

```bash
cd infra

az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

**Expected output:**
```
+ Microsoft.Authorization/locks/glookodatawebappstorage-lock (Create)
+ Microsoft.Authorization/locks/glookodatawebapp-kv-lock (Create)
+ Microsoft.Authorization/locks/glookodatawebapp-identity-lock (Create)
```

### Option 2: List Existing Locks

After deployment, verify locks are active:

```bash
# List all locks in resource group
az lock list --resource-group Glooko --output table

# Check specific resource lock
az lock show \
  --name glookodatawebappstorage-lock \
  --resource-group Glooko \
  --resource-type Microsoft.Storage/storageAccounts \
  --resource-name glookodatawebappstorage
```

### Option 3: Azure Portal

1. Navigate to Azure Portal → Resource Group → `Glooko`
2. Select a protected resource (Storage Account, Key Vault, or Managed Identity)
3. Click **Settings** → **Locks** in the left menu
4. Verify lock is listed with level `CanNotDelete`

## Testing Lock Protection

### Test 1: Attempt Resource Deletion (CLI)

```bash
# This should FAIL with a "Locked" error
az storage account delete \
  --name glookodatawebappstorage \
  --resource-group Glooko
```

**Expected error:**
```
The scope 'Microsoft.Storage/storageAccounts/glookodatawebappstorage' cannot perform delete operation 
because following scope(s) are locked: '/subscriptions/{sub}/resourceGroups/Glooko/providers/Microsoft.Storage/storageAccounts/glookodatawebappstorage'. 
Please remove the lock and try again.
```

### Test 2: Attempt Resource Deletion (Portal)

1. Go to Azure Portal → Storage Account → `glookodatawebappstorage`
2. Click **Delete** button
3. Portal should display: **"Cannot delete locked resource"**

### Test 3: Verify Normal Operations Still Work

```bash
# These should SUCCEED (locks don't prevent operations, only deletion)

# Add a Key Vault secret
az keyvault secret set \
  --vault-name glookodatawebapp-kv \
  --name "TestSecret" \
  --value "test-value"

# Create a storage table
az storage table create \
  --name TestTable \
  --account-name glookodatawebappstorage \
  --auth-mode login

# Update managed identity tags
az identity update \
  --name glookodatawebapp-identity \
  --resource-group Glooko \
  --tags "TestTag=TestValue"
```

## Removing Locks (Intentional Deletion)

**⚠️ CAUTION:** Only remove locks when you genuinely need to delete the resource. This is a destructive operation.

### Option 1: Azure Portal (Recommended for Manual Deletion)

1. **Navigate to the resource:**
   - Go to Azure Portal
   - Open Resource Group → `Glooko`
   - Select the resource (Storage Account, Key Vault, or Managed Identity)

2. **Remove the lock:**
   - Click **Settings** → **Locks** in the left menu
   - Select the lock (e.g., `glookodatawebappstorage-lock`)
   - Click **Delete** button
   - Confirm deletion

3. **Delete the resource:**
   - Return to the resource overview page
   - Click **Delete** button
   - Follow confirmation prompts

4. **⚠️ Important:** The lock will be **re-applied** if you redeploy the infrastructure via Bicep

### Option 2: Azure CLI

```bash
# Step 1: Delete the lock
az lock delete \
  --name glookodatawebappstorage-lock \
  --resource-group Glooko \
  --resource-type Microsoft.Storage/storageAccounts \
  --resource-name glookodatawebappstorage

# Step 2: Delete the resource
az storage account delete \
  --name glookodatawebappstorage \
  --resource-group Glooko
```

### Option 3: PowerShell

```powershell
# Step 1: Remove the lock
Remove-AzResourceLock `
  -LockName "glookodatawebappstorage-lock" `
  -ResourceGroupName "Glooko" `
  -ResourceType "Microsoft.Storage/storageAccounts" `
  -ResourceName "glookodatawebappstorage" `
  -Force

# Step 2: Remove the resource
Remove-AzStorageAccount `
  -ResourceGroupName "Glooko" `
  -Name "glookodatawebappstorage" `
  -Force
```

## Lock Lifecycle

### Initial Deployment (New Environment)
```
Deploy Bicep → Create Resources → Apply Locks ✅
```

### Subsequent Deployments (Existing Environment)
```
Deploy Bicep → Update Resources → Locks Remain Unchanged ✅
```

### Manual Lock Removal
```
Delete Lock → Delete Resource → Lock Gone ❌
Next Bicep Deployment → Lock Re-Created ✅
```

### Removing Locks Permanently

If you want to remove locks permanently from the infrastructure:

1. **Edit the Bicep modules** to remove the lock resources:
   - `infra/module_storage.bicep` - Remove `storageAccountLock` resource
   - `infra/module_key-vault.bicep` - Remove `keyVaultLock` resource
   - `infra/module_managed-identity.bicep` - Remove `managedIdentityLock` resource

2. **Deploy the updated template:**
   ```bash
   az deployment group create \
     --resource-group Glooko \
     --template-file infra/main.bicep \
     --parameters infra/parameters.current.bicepparam
   ```

3. **Verify locks are removed:**
   ```bash
   az lock list --resource-group Glooko --output table
   ```

## Best Practices

### ✅ Do:
- Keep locks enabled for production environments
- Verify locks are present using `az lock list` after deployment
- Test deletion protection regularly
- Document any intentional lock removals
- Re-apply locks after intentional deletions if resource is recreated

### ❌ Don't:
- Remove locks unless absolutely necessary
- Disable locks in Bicep templates without team approval
- Assume locks protect against data corruption (they only prevent deletion)
- Forget to remove locks before attempting resource deletion
- Remove locks in production without a valid business reason

## Troubleshooting

### Problem: Deployment Shows Lock Already Exists

**Symptom:**
```
Resource 'Microsoft.Authorization/locks/glookodatawebappstorage-lock' already exists
```

**Solution:** This is expected. Bicep will not recreate the lock if it already exists. This is normal behavior.

### Problem: Cannot Delete Resource Despite Removing Lock via Portal

**Cause:** The lock may have been re-applied by a recent Bicep deployment.

**Solution:**
1. Check if lock exists: `az lock list --resource-group Glooko`
2. If present, remove it again
3. Delete the resource immediately before any automated deployments

### Problem: Lock Shows as "Ignore" in What-If

**Symptom:**
```
~ Microsoft.Authorization/locks/glookodatawebappstorage-lock (Ignore)
```

**Solution:** This is normal. Locks use resource GUIDs internally and may show minor differences that Azure ignores. As long as the lock level is `CanNotDelete`, it's working correctly.

## Additional Resources

- [Azure Resource Locks Documentation](https://learn.microsoft.com/azure/azure-resource-manager/management/lock-resources)
- [Bicep Lock Resource Reference](https://learn.microsoft.com/azure/templates/microsoft.authorization/locks)
- [GlookoDataWebApp Infrastructure README](../README.md)
- [Deployment Guide](../../docs/DEPLOYMENT.md)

## Support

For questions or issues with resource locks:

1. Check this documentation first
2. Review lock status: `az lock list --resource-group Glooko`
3. Test lock behavior using the verification commands above
4. Open an issue on [GitHub](https://github.com/iricigor/GlookoDataWebApp/issues) if problems persist
