# Resource Locks Implementation Summary

## Overview

This document summarizes the implementation of Azure Resource Locks for the GlookoDataWebApp infrastructure, as specified in the feature request.

## Implementation Completed

### ✅ Task 1: Add Resource Locks to Bicep Modules

**Files Modified:**
1. `infra/module_storage.bicep` - Added `storageAccountLock` resource
2. `infra/module_key-vault.bicep` - Added `keyVaultLock` resource
3. `infra/module_managed-identity.bicep` - Added `managedIdentityLock` resource

**Lock Configuration:**
- **Resource Type:** `Microsoft.Authorization/locks@2020-05-01`
- **Lock Level:** `CanNotDelete`
- **Scope:** Applied directly to each protected resource
- **Naming Convention:** `{resourceName}-lock`

### ✅ Task 2: Documentation Created

**New Documentation:**
- `infra/docs/RESOURCE_LOCKS.md` - Comprehensive guide covering:
  - Protection strategy and rationale
  - Which resources are protected and why
  - Which resources are NOT protected and why
  - Manual lock removal procedures (Azure Portal, CLI, PowerShell)
  - Verification steps (what-if, Azure Portal, CLI)
  - Testing lock protection
  - Troubleshooting guide

**Updated Documentation:**
- `infra/README.md` - Added resource locks to overview and resources section
- `infra/docs/EXPECTED_WHAT_IF.md` - Updated to include 3 new lock resources in expected output

### ✅ Task 3: Bicep Validation

All Bicep templates validated successfully:

```bash
$ cd infra && ./validate.sh
✓ main.bicep is valid
✓ parameters.current.bicepparam is valid
✓ parameters.generic.bicepparam is valid
✓ module_function-app.bicep is valid
✓ module_key-vault.bicep is valid
✓ module_managed-identity.bicep is valid
✓ module_static-web-app.bicep is valid
✓ module_storage.bicep is valid
```

## Protected Resources

### 1. Storage Account (`glookodatawebappstorage`)
**Lock:** `glookodatawebappstorage-lock`  
**Reason:** Contains **user-generated data** in tables (UserSettings, ProUsers, AIQueryLogs) that cannot be recreated from code.  
**Impact if deleted:** Permanent data loss of all user settings and AI query history.

### 2. Key Vault (`glookodatawebapp-kv`)
**Lock:** `glookodatawebapp-kv-lock`  
**Reason:** Stores **externally-generated secrets** (API keys, OAuth credentials) obtained outside the deployment process.  
**Impact if deleted:** All API keys and OAuth credentials lost; services stop working.

### 3. User-Assigned Managed Identity (`glookodatawebapp-identity`)
**Lock:** `glookodatawebapp-identity-lock`  
**Reason:** Has a **unique Principal ID** referenced in all RBAC role assignments. Recreating generates a new ID, breaking all integrations.  
**Impact if deleted:** All role assignments break; Function App and Static Web App lose access to Storage and Key Vault.

## Resources NOT Protected

### Function App
**Why:** Can be recreated via Bicep and code redeployed via CI/CD.

### Static Web App
**Why:** Can be recreated via Bicep and frontend redeployed via CI/CD.

## Verification Steps

### Step 1: What-If Analysis

Run the what-if command to verify locks will be created:

```bash
cd infra

az deployment group what-if \
  --resource-group Glooko \
  --template-file main.bicep \
  --parameters parameters.current.bicepparam
```

**Expected output:**
```
Resources to create: 5

  + Microsoft.Authorization/locks/glookodatawebappstorage-lock
    - Lock Level: CanNotDelete
    - Notes: Prevents accidental deletion of the storage account containing critical user data.

  + Microsoft.Authorization/locks/glookodatawebapp-kv-lock
    - Lock Level: CanNotDelete
    - Notes: Prevents accidental deletion of the Key Vault containing critical secrets and API keys.

  + Microsoft.Authorization/locks/glookodatawebapp-identity-lock
    - Lock Level: CanNotDelete
    - Notes: Prevents accidental deletion of the managed identity used for passwordless authentication across services.

  + Microsoft.Storage/storageAccounts/.../roleAssignments/... (Storage Table Data Contributor)
  + Microsoft.Storage/storageAccounts/.../roleAssignments/... (Storage Blob Data Contributor)
```

### Step 2: Deploy Infrastructure

After verifying what-if output, deploy the infrastructure:

```bash
az deployment group create \
  --resource-group Glooko \
  --template-file infra/main.bicep \
  --parameters infra/parameters.current.bicepparam \
  --confirm-with-what-if
```

### Step 3: Verify Locks Are Active

**Option A: Using Azure CLI**
```bash
# List all locks in resource group
az lock list --resource-group Glooko --output table

# Expected output:
# Name                                Level         ResourceName
# ----------------------------------  ------------  -------------------------
# glookodatawebappstorage-lock       CanNotDelete  glookodatawebappstorage
# glookodatawebapp-kv-lock           CanNotDelete  glookodatawebapp-kv
# glookodatawebapp-identity-lock     CanNotDelete  glookodatawebapp-identity
```

**Option B: Using Azure Portal**
1. Navigate to Azure Portal → Resource Group → `Glooko`
2. Select a protected resource (Storage Account, Key Vault, or Managed Identity)
3. Click **Settings** → **Locks**
4. Verify lock is listed with level `CanNotDelete`

### Step 4: Test Lock Protection

Attempt to delete a protected resource (should fail):

```bash
# This should FAIL with a "Locked" error
az storage account delete \
  --name glookodatawebappstorage \
  --resource-group Glooko

# Expected error message:
# "The scope 'Microsoft.Storage/storageAccounts/glookodatawebappstorage' 
#  cannot perform delete operation because following scope(s) are locked.
#  Please remove the lock and try again."
```

## Success Criteria Met

✅ **Resource locks added to Bicep modules:**
- Storage Account lock in `module_storage.bicep`
- Key Vault lock in `module_key-vault.bicep`
- Managed Identity lock in `module_managed-identity.bicep`

✅ **Lock configuration:**
- Resource Type: `Microsoft.Authorization/locks@2020-05-01`
- Lock Level: `CanNotDelete`
- Applied to Storage Account, Key Vault, and Managed Identity

✅ **Documentation created:**
- Manual lock removal process documented in `infra/docs/RESOURCE_LOCKS.md`
- Includes Azure Portal, CLI, and PowerShell procedures

✅ **Bicep validation:**
- All templates validated successfully with `./validate.sh`
- No syntax errors or configuration issues

⏳ **Pending verification (requires Azure environment):**
- What-if analysis to confirm locks are detected as new resources
- Actual deployment to apply locks
- Testing deletion protection

## Next Steps for User

1. **Review the implementation:**
   - Check the modified Bicep files
   - Review the documentation in `infra/docs/RESOURCE_LOCKS.md`
   - Verify the expected what-if output in `infra/docs/EXPECTED_WHAT_IF.md`

2. **Run what-if analysis:**
   ```bash
   cd infra
   az deployment group what-if \
     --resource-group Glooko \
     --template-file main.bicep \
     --parameters parameters.current.bicepparam
   ```

3. **Deploy to a test environment first:**
   - Create a sandbox resource group
   - Deploy using `parameters.generic.bicepparam`
   - Test lock functionality
   - Verify deletion protection works

4. **Deploy to production:**
   ```bash
   az deployment group create \
     --resource-group Glooko \
     --template-file infra/main.bicep \
     --parameters infra/parameters.current.bicepparam \
     --confirm-with-what-if
   ```

5. **Verify locks are active:**
   ```bash
   az lock list --resource-group Glooko --output table
   ```

6. **Test deletion protection:**
   - Attempt to delete a protected resource via Portal or CLI
   - Verify it fails with a "Locked" error

## Files Changed

```
infra/
├── module_storage.bicep           (modified - added storageAccountLock)
├── module_key-vault.bicep         (modified - added keyVaultLock)
├── module_managed-identity.bicep  (modified - added managedIdentityLock)
├── README.md                      (modified - added resource locks to overview)
└── docs/
    ├── RESOURCE_LOCKS.md          (new - comprehensive lock management guide)
    └── EXPECTED_WHAT_IF.md        (modified - added locks to expected output)
```

## Additional Notes

### Protection Strategy

The implementation follows a clear strategy:
- **Protect resources with irreplaceable data** (Storage Account)
- **Protect resources with externally-generated secrets** (Key Vault)
- **Protect resources with unique identities** that break integrations if recreated (Managed Identity)
- **Don't protect resources that can be easily recreated** (Function App, Static Web App)

### Lock Behavior

- **CanNotDelete** allows all operations EXCEPT deletion
- Administrators can still:
  - Read and write data
  - Update resource properties
  - Add/remove child resources (secrets, tables)
  - Modify RBAC role assignments
- Administrators CANNOT:
  - Delete the resource itself (without first removing the lock)

### Automatic Application

Locks are automatically applied when deploying via Bicep:
- New deployments: Locks created along with resources
- Existing deployments: Locks added if not present
- Subsequent deployments: Locks remain unchanged

## References

- **Feature Request:** [Issue: IaaC - Resource Locks]
- **Azure Documentation:** [Lock resources to prevent changes](https://learn.microsoft.com/azure/azure-resource-manager/management/lock-resources)
- **Bicep Reference:** [Microsoft.Authorization/locks](https://learn.microsoft.com/azure/templates/microsoft.authorization/locks)
- **Local Documentation:** `infra/docs/RESOURCE_LOCKS.md`
