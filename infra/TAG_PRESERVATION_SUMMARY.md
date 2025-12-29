# Tag Preservation Summary

## Issue

[Feature]: Iaac - What-If remove additional tags

**User Comment:** 
> According to new what-if analysis, this will actually delete some tags. Please check previous PR and do add explicitly those listed as modified or deleted there.

## Problem Statement

The previous tag removal implementation (using empty `tags` parameter) caused unintended consequences:
- Some existing tags would be **deleted** from Azure resources
- Some existing tags would be **modified** to different values
- Resources would lose their current tag state

Based on the what-if output, the following tags were at risk:

### Tags Being Modified or Deleted

1. **Key Vault** (`glookodatawebapp-kv`):
   - `ManagedBy: "AzureDeploymentScripts"` → Would change to `"Bicep"` ❌

2. **Managed Identity** (`glookodatawebapp-identity`):
   - `Environment: "Production ManagedBy=GlookoDeploymentModule Application=glookodatawebapp"` → Would change to `"Production"` ❌
   - New tags would be added ❌

3. **Storage Account** (`glookodatawebappstorage`):
   - `Purpose: "UserSettings"` → Would be deleted ❌
   - `Application: "glookodatawebapp"` → Would change to `"GlookoDataWebApp"` ❌
   - New `ManagedBy: "Bicep"` would be added ❌

4. **Function App** (`glookodatawebapp-func`):
   - `ManagedBy: "AzureDeploymentScripts"` → Would change to `"Bicep"` ❌

5. **Static Web App** (`GlookoData`):
   - No existing tags → New tags would be added ❌

## Solution Implemented

Changed from a single global `tags` parameter to **resource-specific tag parameters** that explicitly preserve existing Azure tags.

### Changes to `main.bicep`

**Before:**
```bicep
@description('Tags to apply to all resources')
param tags object = {}
```

**After:**
```bicep
@description('Tags to apply to the managed identity')
param managedIdentityTags object = {}

@description('Tags to apply to the storage account')
param storageTags object = {}

@description('Tags to apply to the key vault')
param keyVaultTags object = {}

@description('Tags to apply to the function app')
param functionAppTags object = {}

@description('Tags to apply to the static web app')
param staticWebAppTags object = {}
```

Each module now receives its own tag parameter instead of a shared one:

```bicep
module managedIdentity 'modules/managed-identity.bicep' = {
  name: 'deploy-managed-identity'
  params: {
    managedIdentityName: managedIdentityName
    location: location
    tags: managedIdentityTags  // ← Resource-specific tags
  }
}
```

### Changes to `parameters.current.bicepparam`

Added explicit tag values matching the current Azure state:

```bicep
// Resource-specific tags to preserve existing Azure resource tags
param managedIdentityTags = {
  Environment: 'Production ManagedBy=GlookoDeploymentModule Application=glookodatawebapp'
}

param storageTags = {
  Application: 'glookodatawebapp'
  Purpose: 'UserSettings'
}

param keyVaultTags = {
  ManagedBy: 'AzureDeploymentScripts'
}

param functionAppTags = {
  ManagedBy: 'AzureDeploymentScripts'
}

param staticWebAppTags = {}
```

## Expected What-If Results

After this fix, running `az deployment group what-if` should show:

### ✅ No Tag Changes

```
~ Microsoft.KeyVault/vaults/glookodatawebapp-kv [2023-07-01]
  (no tag changes - ManagedBy preserved)

~ Microsoft.ManagedIdentity/userAssignedIdentities/glookodatawebapp-identity [2023-01-31]
  (no tag changes - Environment preserved as is)

~ Microsoft.Storage/storageAccounts/glookodatawebappstorage [2023-01-01]
  (no tag changes - Application and Purpose preserved)
  x properties.encryption.services:
      blob.enabled:  true
      file.enabled:  true
      table.enabled: true

~ Microsoft.Web/sites/glookodatawebapp-func [2023-01-01]
  (no tag changes - ManagedBy preserved)
  + properties.siteConfig.cors: { ... }
  ~ properties.siteConfig.linuxFxVersion: "Node|20" => "node|20"

~ Microsoft.Web/staticSites/GlookoData [2023-01-01]
  (no tag changes - remains without tags)
  - properties.deploymentAuthPolicy: "DeploymentToken"
  - properties.stableInboundIP: "20.101.2.157"
```

### Key Improvements

| Resource | Before | After |
|----------|--------|-------|
| **Key Vault** | `~ tags.ManagedBy: "AzureDeploymentScripts" => "Bicep"` | ✅ No tag changes |
| **Managed Identity** | `+ tags.Application`, `+ tags.ManagedBy`, `~ tags.Environment` | ✅ No tag changes |
| **Storage Account** | `- tags.Purpose`, `+ tags.ManagedBy`, `~ tags.Application` | ✅ No tag changes |
| **Function App** | `~ tags.ManagedBy: "AzureDeploymentScripts" => "Bicep"` | ✅ No tag changes |
| **Static Web App** | `+ tags: { ... }` (3 new tags) | ✅ No tag changes |

## Benefits

1. ✅ **Preserves existing tags** - No tags deleted or modified
2. ✅ **Cleaner what-if output** - Only shows functional changes, not tag noise
3. ✅ **Resource-specific control** - Each resource can have different tags if needed
4. ✅ **Backward compatible** - Existing resources maintain their current state
5. ✅ **Future flexibility** - Easy to add/modify tags per resource

## How to Verify

```bash
cd infra

# Validate Bicep syntax
az bicep build --file main.bicep

# Run what-if analysis
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

**Expected:** The what-if output should show **zero tag changes**. Only functional property changes should appear (CORS, siteConfig, etc.).

## Files Modified

1. **infra/main.bicep**
   - Changed from single `tags` parameter to 5 resource-specific tag parameters
   - Updated all module calls to use resource-specific tag parameters

2. **infra/parameters.current.bicepparam**
   - Added explicit tag values for each resource
   - Tags match current Azure state to prevent modifications

## Important Notes

### Why Resource-Specific Tags?

1. **Precision:** Each resource maintains its exact current tags
2. **No Cross-Contamination:** Tags from one resource don't affect others
3. **Auditability:** Clear which tags belong to which resource
4. **Flexibility:** Easy to update tags for individual resources

### Existing Tags Preserved

The tags explicitly set in `parameters.current.bicepparam` match **exactly** what is currently in Azure:

- Key Vault keeps `ManagedBy: "AzureDeploymentScripts"` (from deployment scripts)
- Managed Identity keeps `Environment: "Production ManagedBy=GlookoDeploymentModule Application=glookodatawebapp"` (from old deployment)
- Storage Account keeps `Application: "glookodatawebapp"` and `Purpose: "UserSettings"` (from manual/script tagging)
- Function App keeps `ManagedBy: "AzureDeploymentScripts"` (from deployment scripts)
- Static Web App has no tags (current state)

### Generic Deployments

The `parameters.generic.bicepparam` file does NOT set tags (uses defaults `{}`), allowing new deployments to start without legacy tags.

## Testing

Tested with:
```bash
az bicep build --file main.bicep
# ✅ Compilation successful
```

## Related Documentation

- Original issue: [Feature]: Iaac - What-If remove additional tags
- Previous fix: [TAG_REMOVAL_SUMMARY.md](../TAG_REMOVAL_SUMMARY.md)
- See [EXPECTED_WHAT_IF.md](infra/EXPECTED_WHAT_IF.md) for full expected output
- See [README.md](infra/README.md) for deployment instructions

---

**Status:** ✅ Implementation Complete  
**Date:** 2024-12-29  
**Implementation:** Resource-specific tag parameters preserving existing Azure tags
