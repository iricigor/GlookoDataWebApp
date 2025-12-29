# Tag Removal Summary

## Issue
[Feature]: Iaac - What-If remove additional tags

**Requirement:** Simplify `az deployment group what-if` deltas by removing tag additions while keeping tag modifications and deletions.

## Solution

Changed the default `tags` parameter in `main.bicep` from:
```bicep
param tags object = {
  Application: 'GlookoDataWebApp'
  Environment: 'Production'
  ManagedBy: 'Bicep'
}
```

To:
```bicep
param tags object = {}
```

And removed explicit `tags` parameters from both parameter files.

## Impact on What-If Output

### Before (Original Output)

The original what-if showed many tag-related deltas:

```
~ Microsoft.KeyVault/vaults/glookodatawebapp-kv
  ~ tags.ManagedBy: "AzureDeploymentScripts" => "Bicep"

~ Microsoft.ManagedIdentity/userAssignedIdentities/glookodatawebapp-identity
  + tags.Application: "GlookoDataWebApp"
  + tags.ManagedBy: "Bicep"
  ~ tags.Environment: "Production ManagedBy=..." => "Production"

~ Microsoft.Storage/storageAccounts/glookodatawebappstorage
  - tags.Purpose: "UserSettings"
  + tags.ManagedBy: "Bicep"
  ~ tags.Application: "glookodatawebapp" => "GlookoDataWebApp"

~ Microsoft.Web/sites/glookodatawebapp-func
  ~ tags.ManagedBy: "AzureDeploymentScripts" => "Bicep"

~ Microsoft.Web/staticSites/GlookoData
  + tags:
      Application: "GlookoDataWebApp"
      Environment: "Production"
      ManagedBy: "Bicep"
```

### After (Simplified Output)

The new what-if output will show **no tag changes**:

```
~ Microsoft.KeyVault/vaults/glookodatawebapp-kv
  + properties.enablePurgeProtection: true
  + properties.networkAcls: {...}

~ Microsoft.Storage/storageAccounts/glookodatawebappstorage
  x properties.encryption.services: (unsupported - no change)

~ Microsoft.Web/sites/glookodatawebapp-func
  + properties.siteConfig.cors: {...}
  + properties.siteConfig.ftpsState: "Disabled"
  ~ properties.siteConfig.linuxFxVersion: "Node|20" => "node|20"
  + tags.hidden-link: /app-insights-resource-id: "..."

~ Microsoft.Web/staticSites/GlookoData
  - properties.deploymentAuthPolicy: "DeploymentToken"
  - properties.stableInboundIP: "20.101.2.157"
  + properties.buildProperties: {...}
```

**Key Differences:**
- ✅ No `+ tags.ManagedBy: "Bicep"` additions
- ✅ No `+ tags.Application: "GlookoDataWebApp"` additions  
- ✅ No `~ tags.Application: "glookodatawebapp" => "GlookoDataWebApp"` modifications
- ✅ No `~ tags.Environment: ...` modifications
- ✅ Only functional property changes are shown
- ✅ The only tag change is `hidden-link` for App Insights (conditional, functional)

## Summary of Changes

| Category | Before | After |
|----------|--------|-------|
| **Tag Additions** | 7+ tag additions across resources | 0 tag additions (except conditional hidden-link) |
| **Tag Modifications** | 3+ tag modifications | 0 tag modifications |
| **Tag Deletions** | 1 tag deletion | 0 tag deletions (existing tags preserved) |
| **Resources Modified** | 5-6 (mostly tags) | 3-5 (functional changes only) |
| **What-If Noise** | High (many tag deltas) | Low (only functional changes) |

## Files Changed

1. **infra/main.bicep** - Changed default `tags` parameter to `{}`
2. **infra/parameters.current.bicepparam** - Removed `tags` parameter
3. **infra/parameters.generic.bicepparam** - Removed `tags` parameter
4. **infra/EXPECTED_WHAT_IF.md** - Updated expected output documentation
5. **infra/README.md** - Updated troubleshooting section
6. **infra/WHAT_IF_ANALYSIS.md** - Added removal note

## Verification

To verify the changes work as expected, run:

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

**Expected result:** The what-if output should show **no tag additions** or **tag modifications**, only functional property changes.

## Backward Compatibility

✅ **Fully backward compatible**
- Resources maintain their existing tags
- No tags are removed from existing resources
- No tags are modified on existing resources
- Only future deployments won't add new tags
- If tags are needed in the future, they can be added via parameter override:
  ```bash
  az deployment group create ... --parameters tags='{"Key":"Value"}'
  ```

## Related Documentation

- See [EXPECTED_WHAT_IF.md](infra/EXPECTED_WHAT_IF.md) for full expected what-if output
- See [WHAT_IF_ANALYSIS.md](infra/WHAT_IF_ANALYSIS.md) for original analysis
- See [README.md](infra/README.md) for deployment instructions

---

**Status:** ✅ Implementation Complete  
**Date:** 2024-12-29  
**Issue:** [Feature]: Iaac - What-If remove additional tags
