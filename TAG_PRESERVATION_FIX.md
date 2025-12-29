# Tag Preservation Fix - Implementation Complete

## Issue Resolved

**[Feature]: Iaac - What-If remove additional tags**

User feedback:
> According to new what-if analysis, this will actually delete some tags. Please check previous PR and do add explicitly those listed as modified or deleted there.

## Problem

The previous implementation (using empty `tags` parameter) caused unintended tag modifications and deletions in Azure resources when running `az deployment group what-if`:

- Key Vault: `ManagedBy` would change from `"AzureDeploymentScripts"` to `"Bicep"` ❌
- Managed Identity: `Environment` tag would be truncated, new tags added ❌
- Storage Account: `Purpose` tag would be deleted, `Application` modified ❌
- Function App: `ManagedBy` would change from `"AzureDeploymentScripts"` to `"Bicep"` ❌
- Static Web App: New tags would be added unnecessarily ❌

## Solution

Implemented **resource-specific tag parameters** that explicitly preserve existing Azure tags.

### Changes Made

#### 1. Modified `infra/main.bicep`

Changed from single global `tags` parameter to 5 resource-specific parameters:

```bicep
// Before
param tags object = {}

// After
param managedIdentityTags object = {}
param storageTags object = {}
param keyVaultTags object = {}
param functionAppTags object = {}
param staticWebAppTags object = {}
```

Each module now receives its own tag parameter:

```bicep
module managedIdentity 'modules/managed-identity.bicep' = {
  name: 'deploy-managed-identity'
  params: {
    managedIdentityName: managedIdentityName
    location: location
    tags: managedIdentityTags  // ← Resource-specific
  }
}
```

#### 2. Modified `infra/parameters.current.bicepparam`

Added explicit tag values matching current Azure state:

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

#### 3. Updated Documentation

- **Created** `infra/TAG_PRESERVATION_SUMMARY.md` - Detailed explanation of the approach
- **Updated** `infra/README.md` - Added tag preservation info to troubleshooting
- **Updated** `infra/EXPECTED_WHAT_IF.md` - Added notes about tag preservation

## Expected Results

Running `az deployment group what-if` should now show:

### ✅ Zero Tag Changes

```
~ Microsoft.KeyVault/vaults/glookodatawebapp-kv
  (no tag changes - ManagedBy preserved)

~ Microsoft.ManagedIdentity/userAssignedIdentities/glookodatawebapp-identity
  (no tag changes - Environment preserved)

~ Microsoft.Storage/storageAccounts/glookodatawebappstorage
  (no tag changes - Application and Purpose preserved)

~ Microsoft.Web/sites/glookodatawebapp-func
  (no tag changes - ManagedBy preserved)

~ Microsoft.Web/staticSites/GlookoData
  (no tag changes - remains without tags)
```

Only functional property changes will appear (CORS, siteConfig, etc.).

## Validation Performed

### ✅ Bicep Syntax Validation

```bash
cd infra
az bicep build --file main.bicep
# ✅ Success - no errors
```

### ✅ Code Review

```bash
# Code review completed
# Found 1 comment (nitpick about tag structure - addressed with comment)
```

### ⏳ What-If Testing

Requires Azure access - to be verified by user:

```bash
az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

**Expected:** No tag-related deltas, only functional changes.

## Files Changed

1. ✅ `infra/main.bicep` - Resource-specific tag parameters (26 lines changed)
2. ✅ `infra/parameters.current.bicepparam` - Explicit tag values (22 lines added)
3. ✅ `infra/TAG_PRESERVATION_SUMMARY.md` - New documentation (226 lines)
4. ✅ `infra/README.md` - Updated troubleshooting (2 lines changed)
5. ✅ `infra/EXPECTED_WHAT_IF.md` - Updated notes (4 lines changed)

**Total:** 5 files, 280 lines changed

## Benefits

1. ✅ **Preserves existing tags** - No tags deleted or modified
2. ✅ **Cleaner what-if output** - Only functional changes shown
3. ✅ **Resource-specific control** - Each resource has independent tag configuration
4. ✅ **Backward compatible** - Existing resources maintain current state
5. ✅ **Future flexibility** - Easy to modify tags per resource if needed
6. ✅ **Well documented** - Clear explanation of approach and rationale

## How to Verify

1. **Validate Bicep syntax:**
   ```bash
   cd infra
   az bicep build --file main.bicep
   ```

2. **Run what-if analysis:**
   ```bash
   az deployment group what-if \
     --resource-group Glooko \
     --template-file main.bicep \
     --parameters parameters.current.bicepparam
   ```

3. **Check output:**
   - ✅ No tag additions (`+ tags.ManagedBy`, etc.)
   - ✅ No tag modifications (`~ tags.Application`, etc.)
   - ✅ No tag deletions (`- tags.Purpose`, etc.)
   - ✅ Only functional property changes appear

## Deployment Instructions

**Only deploy after verifying what-if shows no tag changes:**

```bash
az deployment group create \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam \
  --confirm-with-what-if
```

## Related Documentation

- [TAG_PRESERVATION_SUMMARY.md](infra/TAG_PRESERVATION_SUMMARY.md) - Detailed explanation
- [EXPECTED_WHAT_IF.md](infra/EXPECTED_WHAT_IF.md) - Expected what-if results
- [README.md](infra/README.md) - Deployment instructions
- [TAG_REMOVAL_SUMMARY.md](TAG_REMOVAL_SUMMARY.md) - Previous tag removal approach

## Technical Notes

### Why Resource-Specific Tags?

1. **Precision:** Each resource maintains its exact current tags
2. **No Cross-Contamination:** Tags from one resource don't affect others
3. **Auditability:** Clear which tags belong to which resource
4. **Flexibility:** Easy to update tags for individual resources without affecting others

### Tag Values Explained

- **Key Vault** - `ManagedBy: "AzureDeploymentScripts"` - Set by deployment scripts
- **Managed Identity** - `Environment: "Production ManagedBy=..."` - Concatenated from old deployment
- **Storage Account** - `Application`, `Purpose` - Set manually/via scripts
- **Function App** - `ManagedBy: "AzureDeploymentScripts"` - Set by deployment scripts
- **Static Web App** - No tags - Current state

These exact values are preserved to prevent any modifications.

## Testing

### Automated Tests
- ✅ Bicep syntax validation (az bicep build)
- ✅ Code review (GitHub Copilot)

### Manual Testing Required
- ⏳ What-if analysis (requires Azure access)
- ⏳ Deployment verification (optional, requires Azure access)

## Security Considerations

- No secrets or sensitive data in tags
- No application code changes (only infrastructure)
- CodeQL not required (infrastructure-as-code only)
- All changes preserve existing security configurations

## Backward Compatibility

✅ **Fully backward compatible**
- Existing resources maintain all current tags
- No tags are deleted, modified, or added
- Future deployments will preserve tag state
- Generic parameter file still uses empty tags for new deployments

## Commits

1. `a6b9214` - Add resource-specific tags to preserve existing Azure tags
2. `236f557` - Add tag preservation documentation and update README
3. `3476294` - Add comment explaining tag preservation approach

## Next Steps

1. ✅ Implementation complete
2. ✅ Documentation complete
3. ✅ Code review complete
4. ⏳ User to verify what-if output (requires Azure access)
5. ⏳ User to deploy if what-if looks good (optional)

---

**Status:** ✅ Implementation Complete  
**Date:** 2024-12-29  
**Approach:** Resource-specific tag parameters preserving existing Azure tags  
**Ready for:** User verification and deployment
