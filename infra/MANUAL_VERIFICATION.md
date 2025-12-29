# Manual Verification Guide for Bicep Infrastructure

This guide walks you through manually verifying the Bicep infrastructure code against your existing Azure deployment.

## Prerequisites

Before you begin, ensure you have:

1. **Azure CLI installed** - Version 2.50.0 or later
   ```bash
   az --version
   ```

2. **Bicep CLI** - Included with Azure CLI 2.50.0+
   ```bash
   az bicep version
   ```

3. **Azure credentials** - Logged in with appropriate permissions
   ```bash
   az login
   ```

4. **Contributor role** - On the target subscription/resource group

## Step-by-Step Manual Verification

### Step 1: Clone the Repository

```bash
# Clone the repository (if not already done)
git clone https://github.com/iricigor/GlookoDataWebApp.git
cd GlookoDataWebApp/infra
```

### Step 2: Review Parameter Files

The repository includes two parameter files:

**`parameters.current.bicepparam`** - Matches your existing production infrastructure:

```bicep
param location = 'westeurope'
param storageAccountName = 'glookodatawebappstorage'
param managedIdentityName = 'glookodatawebapp-identity'
param keyVaultName = 'glookodatawebapp-kv'
param functionAppName = 'glookodatawebapp-func'
param staticWebAppName = 'GlookoData'
param staticWebAppSku = 'Standard'
param webAppUrl = 'https://glooko.iric.online'
```

**`parameters.generic.bicepparam`** - Generic template for new deployments:

```bicep
param location = 'westeurope'
param storageAccountName = 'glookodatawebappstorage'
param managedIdentityName = 'glooko-identity'
param keyVaultName = 'glooko-kv'
param functionAppName = 'glooko-func'
param staticWebAppName = 'glooko-swa'
param staticWebAppSku = 'Standard'
param webAppUrl = 'https://glooko.example.com'
```

For this verification, we'll use **`parameters.current.bicepparam`** to match your existing infrastructure.

### Step 3: Validate Bicep Syntax

First, verify the Bicep files have valid syntax:

```bash
cd infra

# Validate main.bicep
az bicep build --file main.bicep

# If successful, you'll see no errors
```

Expected output:
```
(no output = success)
```

If you see errors, the Bicep code needs to be fixed before proceeding.

### Step 4: Set Azure Context

Ensure you're targeting the correct subscription:

```bash
# List your subscriptions
az account list --output table

# Set the correct subscription if needed
az account set --subscription "Your Subscription Name or ID"

# Verify current subscription
az account show --query "{Name:name, ID:id}" --output table
```

### Step 5: Run What-If Analysis

Now run the what-if command to preview what the deployment would change:

```bash
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

This command will:
- ✅ Connect to Azure
- ✅ Analyze the Bicep template
- ✅ Compare with existing resources
- ✅ Show predicted changes **without making any changes**

**⏱️ This may take 1-2 minutes to complete.**

### Step 6: Interpret What-If Results

The what-if output uses these symbols:

| Symbol | Meaning | Description |
|--------|---------|-------------|
| `+` | **Create** | Resource will be created (new resource) |
| `-` | **Delete** | Resource will be deleted (⚠️ dangerous!) |
| `~` | **Modify** | Resource will be modified |
| `*` | **Ignore** | Change will be ignored (non-functional) |
| `=` | **NoChange** | Resource has no changes |

#### ✅ Success Criteria (Matching Infrastructure)

For a **perfect match** with existing infrastructure, you should see:

```
Resource changes: no change.
```

Or:

```
Resource and property changes are indicated with this symbol:
  = NoChange
  * Ignore

The deployment will update the following scope:

Scope: /subscriptions/.../resourceGroups/Glooko

  * Ignore
    - some property ordering differences

Resource changes: 1 to modify.
```

**✅ Acceptable results:**
- All resources show `= NoChange`
- Some resources show `* Ignore` (minor non-functional differences)
- RBAC role assignments may show `~ Modify` if GUIDs differ

**❌ Unacceptable results:**
- Any `+ Create` for existing resources (means naming mismatch)
- Any `- Delete` operations (⚠️ would delete existing resources)
- Significant `~ Modify` changes (unless expected)

### Step 7: Review Specific Changes

If you see any changes, review them carefully:

#### Example: RBAC Role Assignment Changes

```
  ~ Modify
    Microsoft.Authorization/roleAssignments/abc123...

    ~ properties.principalId: "old-guid" => "new-guid"
```

This is often safe - RBAC assignments are being recreated with new GUIDs.

#### Example: Resource Property Changes

```
  ~ Modify
    Microsoft.Web/sites/glookodatawebapp-func

    ~ properties.siteConfig.appSettings[5]:
      - { "name": "OLD_SETTING", "value": "old_value" }
      + { "name": "NEW_SETTING", "value": "new_value" }
```

Review each change to ensure it's expected.

### Step 8: Compare with Actual Resources

You can compare the what-if results with actual resource properties:

```bash
# Get current Function App settings
az functionapp config appsettings list \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --output table

# Get current Static Web App details
az staticwebapp show \
  --name GlookoData \
  --resource-group Glooko \
  --output json

# Get current Storage Account details
az storage account show \
  --name glookodatawebappstorage \
  --resource-group Glooko \
  --output json

# Get current Key Vault details
az keyvault show \
  --name glookodatawebapp-kv \
  --output json

# Get current Managed Identity details
az identity show \
  --name glookodatawebapp-identity \
  --resource-group Glooko \
  --output json
```

### Step 9: Verify Role Assignments

Check current RBAC role assignments:

```bash
# Get all role assignments for the managed identity
MI_PRINCIPAL_ID=$(az identity show \
  --name glookodatawebapp-identity \
  --resource-group Glooko \
  --query principalId -o tsv)

az role assignment list \
  --assignee "${MI_PRINCIPAL_ID}" \
  --resource-group Glooko \
  --output table
```

Expected roles:
- **Storage Table Data Contributor** on Storage Account
- **Storage Blob Data Contributor** on Storage Account
- **Key Vault Secrets User** on Key Vault

## Troubleshooting What-If Results

### Issue: Resources Show as "Create" (Should be "NoChange")

**Problem:** Resource names don't match existing resources.

**Solution:**
1. Check parameter file values match exactly
2. Verify resource names in Azure Portal
3. Update `parameters.current.bicepparam` if needed

```bash
# List actual resource names
az resource list \
  --resource-group Glooko \
  --query "[].{Name:name, Type:type}" \
  --output table
```

### Issue: Function App Shows Many Changes

**Problem:** App settings or configuration differences.

**Solution:** Review the specific settings in the what-if output and compare with actual Function App:

```bash
# Get current Function App configuration
az functionapp show \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --output json > current-function-app.json

# Compare with Bicep template
```

### Issue: Static Web App Shows Changes

**Problem:** Static Web Apps have some properties managed by GitHub Actions.

**Solution:** Review the changes - some may be expected due to GitHub integration.

### Issue: RBAC Role Assignments Show as "Modify"

**Problem:** Role assignment GUIDs are calculated differently.

**Solution:** This is often safe. The Bicep uses `guid()` function which may generate different GUIDs than existing assignments.

**Verification:**
```bash
# Check if the roles are correctly assigned
az role assignment list \
  --assignee "${MI_PRINCIPAL_ID}" \
  --resource-group Glooko \
  --output table

# Expected: Storage Table Data Contributor, Storage Blob Data Contributor
```

## Common Parameter Adjustments

If you need to adjust parameters to match your exact infrastructure:

1. **Edit parameters.current.bicepparam:**

```bicep
using './main.bicep'

param location = 'westeurope'  // Match your region
param storageAccountName = 'glookodatawebappstorage'  // Exact name
param managedIdentityName = 'glookodatawebapp-identity'  // Exact name
param keyVaultName = 'glookodatawebapp-kv'  // Exact name
param functionAppName = 'glookodatawebapp-func'  // Exact name
param staticWebAppName = 'GlookoData'  // Exact name (case-sensitive)
param staticWebAppSku = 'Standard'  // Free or Standard
param webAppUrl = 'https://glooko.iric.online'  // Your domain
```

2. **Re-run what-if:**

```bash
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

## Next Steps After Successful Verification

Once what-if shows **"No Change"** or only **"Ignore"** changes:

✅ **The Bicep code is confirmed to match your infrastructure!**

You can now:

1. **Use this as your IaC baseline** for future infrastructure changes
2. **Set up CI/CD** to deploy infrastructure changes via GitHub Actions
3. **Version control** your infrastructure alongside your application code
4. **Deploy to new environments** using `parameters.generic.bicepparam`

## Additional Verification (Optional)

### Verify Table Storage

```bash
# Check if tables exist
az storage table list \
  --account-name glookodatawebappstorage \
  --auth-mode login \
  --output table

# Expected: UserSettings, ProUsers, AIQueryLogs
```

### Verify Key Vault Secrets

```bash
# List secrets (not values)
az keyvault secret list \
  --vault-name glookodatawebapp-kv \
  --query "[].name" \
  --output table

# Expected: PerplexityApiKey, GeminiApiKey, google-client-id, google-client-secret
```

### Verify Function App Backend Link

```bash
# Check if Static Web App has backend linked
az staticwebapp backends list \
  --name GlookoData \
  --resource-group Glooko \
  --output table

# Expected: One backend pointing to glookodatawebapp-func
```

**Note:** The backend link is **not** created by Bicep and must be configured manually. See the main README for instructions.

## Summary

This manual verification process ensures that:

- ✅ Bicep template syntax is valid
- ✅ Parameters match your existing infrastructure exactly
- ✅ What-if shows no unexpected changes
- ✅ RBAC role assignments are correct
- ✅ Infrastructure is ready for IaC management

If you encounter any issues during verification, review the Troubleshooting section or open an issue on GitHub.

## Automated Verification

For convenience, you can use the automated verification script:

```bash
cd infra
./verify.sh
```

This script automates Steps 1-6 and provides a summary of the results.

## Resources

- [Azure Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure CLI What-If](https://learn.microsoft.com/azure/azure-resource-manager/bicep/deploy-what-if)
- [Main Infrastructure README](./README.md)
- [GlookoDataWebApp Deployment Guide](../docs/DEPLOYMENT.md)
