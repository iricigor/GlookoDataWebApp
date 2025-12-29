# Verification Checklist - Tag Preservation Fix

This document provides a step-by-step checklist for verifying the tag preservation implementation.

## ✅ Automated Verification (Completed)

These checks have already been performed automatically:

- [x] **Bicep Syntax Validation**
  ```bash
  az bicep build --file infra/main.bicep
  ```
  Status: ✅ PASSED - No syntax errors

- [x] **Code Review**
  Status: ✅ PASSED - 1 nitpick addressed with clarifying comment

- [x] **Git Commits**
  Status: ✅ COMPLETE - 6 commits pushed successfully

## ⏳ Manual Verification (Requires Azure Access)

These checks require Azure CLI access and should be performed by the user:

### Step 1: Validate Azure Login

```bash
# Check if logged in
az account show

# If not logged in:
az login

# Verify correct subscription
az account list --output table
az account set --subscription "6558e738-8188-4771-a5fb-b62f974f971c"
```

**Expected:** Successfully logged in to correct Azure subscription

### Step 2: Validate Bicep Files

```bash
cd infra

# Build main template
az bicep build --file main.bicep

# Validate parameter file
az bicep build-params --file parameters.current.bicepparam
```

**Expected:** Both commands succeed with no errors

### Step 3: Run What-If Analysis

```bash
cd infra

az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

**Expected Output - Tag Changes Section:**

```
✅ SHOULD SEE: Zero tag-related changes

~ Microsoft.KeyVault/vaults/glookodatawebapp-kv
  (no tag changes)

~ Microsoft.ManagedIdentity/userAssignedIdentities/glookodatawebapp-identity
  (no tag changes)

~ Microsoft.Storage/storageAccounts/glookodatawebappstorage
  (no tag changes)

~ Microsoft.Web/sites/glookodatawebapp-func
  (no tag changes - hidden-link tag is functional, not a regular tag)

~ Microsoft.Web/staticSites/GlookoData
  (no tag changes)
```

### Step 4: Verify Tag Preservation

Check the what-if output carefully for any of these **RED FLAGS**:

❌ **Should NOT see:**
- `+ tags.ManagedBy: "Bicep"` (new tag additions)
- `+ tags.Application: "GlookoDataWebApp"` (new tag additions)
- `~ tags.ManagedBy: "AzureDeploymentScripts" => "Bicep"` (tag modifications)
- `~ tags.Application: "glookodatawebapp" => "GlookoDataWebApp"` (tag modifications)
- `- tags.Purpose: "UserSettings"` (tag deletions)
- `~ tags.Environment: "Production ManagedBy=..." => "Production"` (tag truncation)

✅ **May see (acceptable):**
- `+ tags.hidden-link: /app-insights-resource-id: "..."` (functional tag for App Insights)

### Step 5: Verify Functional Changes Only

The what-if output should only show functional property changes, such as:

✅ **Expected functional changes:**
- CORS configuration updates
- siteConfig properties (linuxFxVersion, etc.)
- Security settings (if applicable)
- Role assignments (new RBAC)

### Step 6: Compare with Current Azure State

Optional but recommended - verify current tags in Azure:

```bash
# Check Key Vault tags
az keyvault show --name glookodatawebapp-kv --query tags

# Check Managed Identity tags
az identity show \
  --name glookodatawebapp-identity \
  --resource-group Glooko \
  --query tags

# Check Storage Account tags
az storage account show \
  --name glookodatawebappstorage \
  --resource-group Glooko \
  --query tags

# Check Function App tags
az functionapp show \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --query tags

# Check Static Web App tags
az staticwebapp show \
  --name GlookoData \
  --resource-group Glooko \
  --query tags
```

**Expected:** Tags should match exactly what's in `parameters.current.bicepparam`:

- Key Vault: `{"ManagedBy": "AzureDeploymentScripts"}`
- Managed Identity: `{"Environment": "Production ManagedBy=GlookoDeploymentModule Application=glookodatawebapp"}`
- Storage Account: `{"Application": "glookodatawebapp", "Purpose": "UserSettings"}`
- Function App: `{"ManagedBy": "AzureDeploymentScripts"}`
- Static Web App: `{}` or `null`

## 🎯 Verification Results

After completing the manual verification steps, document the results here:

### What-If Analysis Results

- [ ] ✅ Zero tag additions
- [ ] ✅ Zero tag modifications
- [ ] ✅ Zero tag deletions
- [ ] ✅ Only functional property changes shown
- [ ] ✅ Output matches expectations in `infra/EXPECTED_WHAT_IF.md`

### Issues Found (if any)

If you encounter any issues, document them here:

```
Issue:


Expected:


Actual:


```

## 📋 Deployment Decision

Based on the verification results:

- [ ] ✅ **APPROVED FOR DEPLOYMENT** - All checks passed, no tag changes detected
- [ ] ❌ **NOT APPROVED** - Issues found, requires investigation
- [ ] ⏸️ **DEFERRED** - Verification postponed

### Deployment Command (if approved)

```bash
cd infra

az deployment group create \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam \
  --confirm-with-what-if
```

**Note:** The `--confirm-with-what-if` flag will show the what-if output again and prompt for final confirmation before deploying.

## 📚 Related Documentation

- [TAG_PRESERVATION_FIX.md](TAG_PRESERVATION_FIX.md) - Complete implementation summary
- [infra/TAG_PRESERVATION_SUMMARY.md](infra/TAG_PRESERVATION_SUMMARY.md) - Detailed technical documentation
- [infra/EXPECTED_WHAT_IF.md](infra/EXPECTED_WHAT_IF.md) - Expected what-if results
- [infra/README.md](infra/README.md) - General infrastructure deployment guide

## 🆘 Troubleshooting

### What-If Shows Tag Changes

If the what-if output still shows tag changes:

1. **Verify parameter file:** Check `infra/parameters.current.bicepparam` has all tag parameters defined
2. **Check Azure state:** Run the tag verification commands in Step 6
3. **Compare values:** Ensure parameter values exactly match current Azure state
4. **Rebuild:** Run `az bicep build --file main.bicep` again

### Tags Don't Match Current State

If current Azure tags differ from parameter file:

1. **Document current state:** Run all tag verification commands and save output
2. **Update parameter file:** Modify `infra/parameters.current.bicepparam` to match current state
3. **Re-run what-if:** Verify no tag changes appear

### Unexpected Errors

If you encounter deployment errors:

1. **Check permissions:** Ensure you have Contributor or Owner role
2. **Verify resource group:** Confirm `Glooko` resource group exists
3. **Review error message:** Look for specific resource or property causing the issue
4. **Consult documentation:** Check [infra/README.md](infra/README.md) troubleshooting section

---

**Last Updated:** 2024-12-29  
**Implementation Status:** ✅ Complete  
**Verification Status:** ⏳ Pending User Verification
