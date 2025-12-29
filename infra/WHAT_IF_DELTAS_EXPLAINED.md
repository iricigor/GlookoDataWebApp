# What-If Deltas Explained

This document provides a comprehensive explanation of the changes shown in the second `az deployment group what-if` run, focusing on the roleAssignments and other non-tag changes.

## Overview

The what-if output shows changes that will be applied when deploying the Bicep infrastructure templates to the existing Azure environment. The changes fall into several categories:

1. **New RBAC Role Assignments** (2 to create)
2. **Security Enhancements** (Key Vault, Function App)
3. **Configuration Updates** (Function App, Static Web App)
4. **Property Standardization** (Storage Account encryption - unsupported)

---

## 1. Role Assignments (2 to Create)

### 1.1 Storage Table Data Contributor Role

```bicep
+ Microsoft.Storage/storageAccounts/glookodatawebappstorage/providers/Microsoft.Authorization/roleAssignments/1af27705-371b-5d3e-a53c-3df3874492df

properties.roleDefinitionId: "/subscriptions/.../roleDefinitions/0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3"
properties.principalId: "[Managed Identity Principal ID]"
```

**What is this?**
- This assigns the **Storage Table Data Contributor** role to the managed identity `glookodatawebapp-identity`
- The role ID `0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3` is the Azure built-in role for Table Storage access

**Why is it being created?**
- The Bicep template implements **passwordless authentication** using Managed Identity
- Previously, the function app likely used storage account **access keys** (connection strings) to access Table Storage
- This role assignment enables the managed identity to read, write, and delete data in Table Storage without needing keys

**Where is it defined in the code?**
- Template: `infra/main.bicep` lines 148-158
- Role definition ID is stored in variable `storageTableDataContributorRoleId` (line 148)
- The assignment uses `guid()` to generate a deterministic name based on the storage account, managed identity, and role

**Benefits:**
- ✅ **More secure**: No storage keys to manage, rotate, or leak
- ✅ **Better auditing**: RBAC provides better tracking of who accessed what
- ✅ **Automatic key rotation**: Azure manages the authentication tokens
- ✅ **Principle of least privilege**: Only grants access to Tables, not Blobs or other services

**Impact:**
- This is a **safe addition** - it grants permissions but doesn't remove existing access
- The function app configuration still uses connection strings (line 131-132 in function-app.bicep) because it's on a Consumption plan
- This role assignment prepares the infrastructure for a future migration to managed identity-based access

---

### 1.2 Storage Blob Data Contributor Role

```bicep
+ Microsoft.Storage/storageAccounts/glookodatawebappstorage/providers/Microsoft.Authorization/roleAssignments/595708b8-0e71-529e-94b7-dab11d6821f3

properties.roleDefinitionId: "/subscriptions/.../roleDefinitions/ba92f5b4-2d11-453d-a403-e96b0029c9fe"
properties.principalId: "[Managed Identity Principal ID]"
```

**What is this?**
- This assigns the **Storage Blob Data Contributor** role to the managed identity `glookodatawebapp-identity`
- The role ID `ba92f5b4-2d11-453d-a403-e96b0029c9fe` is the Azure built-in role for Blob Storage access

**Why is it being created?**
- Similar to the Table role, this enables passwordless authentication for Blob Storage
- Function apps use Blob Storage for:
  - Storing function code packages (`WEBSITE_RUN_FROM_PACKAGE`)
  - Storing function runtime state and metadata
  - Potentially storing user-uploaded files or temporary data

**Where is it defined in the code?**
- Template: `infra/main.bicep` lines 161-171
- Role definition ID is stored in variable `storageBlobDataContributorRoleId` (line 161)
- Uses the same `guid()` pattern for deterministic naming

**Benefits:**
- ✅ **Secure deployment**: Function code can be deployed without using storage keys
- ✅ **Runtime reliability**: Function runtime can access blob storage for state management
- ✅ **Future-proof**: Enables migration to managed identity for `AzureWebJobsStorage` when moving to Premium plan

**Impact:**
- This is a **safe addition** - grants additional permissions without breaking existing functionality
- Prepares infrastructure for passwordless deployment and runtime

---

## 2. Key Vault Changes

### 2.1 Enable Purge Protection

```bicep
~ Microsoft.KeyVault/vaults/glookodatawebapp-kv
  + properties.enablePurgeProtection: true
```

**What is this?**
- Purge protection prevents permanent deletion of the Key Vault and its secrets during the soft-delete retention period
- Once enabled, this setting **cannot be disabled**

**Why is it being added?**
- **Production best practice**: Prevents accidental permanent deletion of secrets
- **Compliance requirement**: Many security frameworks require purge protection for production environments
- **Data protection**: Even if someone deletes the Key Vault, secrets remain recoverable for 90 days (soft-delete retention period)

**Where is it defined in the code?**
- Template: `infra/modules/key-vault.bicep` line 24

**Impact:**
- ⚠️ **One-way change**: Once enabled, purge protection cannot be disabled without recreating the Key Vault
- ✅ **Recommended for production**: This is a security best practice and should be enabled
- ✅ **No functional impact**: Does not change how the Key Vault operates, only adds protection

**Recommendation:** 
- Proceed with this change - it enhances security without any downside for production workloads

---

### 2.2 Network ACLs

```bicep
~ Microsoft.KeyVault/vaults/glookodatawebapp-kv
  + properties.networkAcls:
      bypass: "AzureServices"
      defaultAction: "Allow"
```

**What is this?**
- Network ACLs control which networks can access the Key Vault
- `bypass: "AzureServices"` allows trusted Azure services to access the vault
- `defaultAction: "Allow"` currently allows all networks (will be the baseline for future restriction)

**Why is it being added?**
- **Infrastructure as Code completeness**: Explicitly defines network security policy in template
- **Future security**: Provides baseline for future network restrictions (e.g., changing `defaultAction` to `"Deny"` and allowing specific IPs)
- **Audit trail**: Makes network policy visible in template rather than implicit

**Where is it defined in the code?**
- Template: `infra/modules/key-vault.bicep` lines 30-33

**Current Impact:**
- ✅ **No functional change**: `defaultAction: "Allow"` maintains current open access
- ✅ **Better documentation**: Network policy is now explicit in IaC
- ✅ **Enables future hardening**: Easy to restrict access later by changing `defaultAction` to `"Deny"`

**Future Recommendation:**
- Consider restricting access to specific networks or private endpoints in the future
- Example: `defaultAction: "Deny"` with `ipRules` for specific admin IPs

---

## 3. Function App Changes

### 3.1 CORS Configuration

```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  + properties.siteConfig.cors:
      allowedOrigins: [
        0: "https://glooko.iric.online"
        1: "https://portal.azure.com"
      ]
      supportCredentials: true
```

**What is this?**
- CORS (Cross-Origin Resource Sharing) allows the static web app to make API calls to the function app
- `allowedOrigins` specifies which domains can call the function app
- `supportCredentials: true` allows cookies and authentication headers

**Why is it being added?**
- **Frontend integration**: The static web app at `glooko.iric.online` needs to call function app APIs
- **Azure Portal testing**: `portal.azure.com` access enables testing functions from the Azure Portal
- **Security**: Restricts API access to only trusted origins

**Where is it defined in the code?**
- Template: `infra/modules/function-app.bicep` lines 170-176
- Uses `webAppUrl` parameter from `parameters.current.bicepparam` (line 11)

**Impact:**
- ✅ **Enables frontend-backend communication**: Required for the web app to function
- ✅ **Security improvement**: Explicitly defines allowed origins instead of allowing all
- ⚠️ **Breaking if missing**: Without this, the frontend cannot call the API

**Verification:**
- Ensure `webAppUrl` parameter matches the actual Static Web App URL
- Test frontend API calls after deployment

---

### 3.2 FTPS Disabled

```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  + properties.siteConfig.ftpsState: "Disabled"
```

**What is this?**
- Disables FTP and FTPS (FTP over SSL) access to the function app

**Why is it being added?**
- **Security best practice**: FTP is an insecure protocol, even with SSL
- **Modern deployment**: Function apps should use `WEBSITE_RUN_FROM_PACKAGE` or CI/CD pipelines
- **Attack surface reduction**: Eliminates a potential entry point for attackers

**Where is it defined in the code?**
- Template: `infra/modules/function-app.bicep` line 177

**Impact:**
- ✅ **Security improvement**: Reduces attack surface
- ✅ **No functional impact**: Function apps don't need FTP for deployment
- ✅ **Azure recommendation**: Microsoft recommends disabling FTPS

---

### 3.3 Local MySQL Disabled

```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  + properties.siteConfig.localMySqlEnabled: false
```

**What is this?**
- Disables the local MySQL-in-app feature (a legacy App Service feature)

**Why is it being added?**
- **Not applicable**: Function apps don't use local MySQL
- **Explicit configuration**: Makes it clear this feature is not in use
- **Default best practice**: Azure recommends external database services

**Where is it defined in the code?**
- Template: `infra/modules/function-app.bicep` line 179

**Impact:**
- ✅ **No functional impact**: This app doesn't use MySQL
- ✅ **Clearer configuration**: Explicitly states feature is disabled

---

### 3.4 Minimum TLS Version

```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  + properties.siteConfig.minTlsVersion: "1.2"
```

**What is this?**
- Enforces minimum TLS version 1.2 for all HTTPS connections to the function app

**Why is it being added?**
- **Security compliance**: TLS 1.0 and 1.1 are deprecated and insecure
- **Industry standard**: TLS 1.2 is the current minimum for PCI DSS and other standards
- **Azure recommendation**: Microsoft recommends TLS 1.2 minimum

**Where is it defined in the code?**
- Template: `infra/modules/function-app.bicep` line 178

**Impact:**
- ✅ **Security improvement**: Blocks connections using weak TLS versions
- ⚠️ **Client compatibility**: Ensure all clients support TLS 1.2 (standard since 2008)
- ✅ **Best practice**: Required for compliance

---

### 3.5 .NET Framework Version

```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  + properties.siteConfig.netFrameworkVersion: "v4.6"
```

**What is this?**
- Sets the .NET Framework version for the function app runtime environment

**Why is it being added?**
- **Azure default**: This is a default property for App Service apps
- **Not directly used**: The function app uses Node.js 20 runtime, not .NET
- **Platform requirement**: Azure App Service includes this property even for non-.NET apps

**Where is it defined in the code?**
- Template: `infra/modules/function-app.bicep` line 180

**Impact:**
- ℹ️ **No functional impact**: Node.js runtime is used (configured via `linuxFxVersion`)
- ✅ **Template completeness**: Matches Azure's expected configuration structure

---

### 3.6 HTTPS Only

```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  ~ properties.httpsOnly: false => true
```

**What is this?**
- Forces all HTTP requests to be redirected to HTTPS

**Why is it being changed?**
- **Security critical**: All production apps should enforce HTTPS
- **Data protection**: Prevents sensitive data from being transmitted unencrypted
- **Azure best practice**: Microsoft recommends `httpsOnly: true` for all production apps

**Where is it defined in the code?**
- Template: `infra/modules/function-app.bicep` line 80

**Impact:**
- ✅ **Security improvement**: Critical security enhancement
- ⚠️ **Breaking if HTTP used**: Any HTTP requests will be redirected to HTTPS
- ✅ **Expected behavior**: Modern apps should always use HTTPS

---

### 3.7 Linux FX Version (Case Change)

```bicep
~ Microsoft.Web/sites/glookodatawebapp-func
  ~ properties.siteConfig.linuxFxVersion: "Node|20" => "node|20"
```

**What is this?**
- Changes the case of "Node" to "node" in the runtime configuration string

**Why is it being changed?**
- **Azure's canonical format**: Azure's API returns lowercase "node"
- **Template alignment**: Matches the exact format Azure uses internally
- **Prevents drift**: Eliminates case-sensitive diff in future what-if runs

**Where is it defined in the code?**
- Template: `infra/modules/function-app.bicep` lines 38-39, used in line 82

**Impact:**
- ✅ **No functional impact**: Azure treats "Node|20" and "node|20" identically
- ✅ **Better template hygiene**: Aligns with Azure's canonical format
- ✅ **Idempotency**: Eliminates unnecessary diffs in future deployments

---

## 4. Static Web App Changes

### 4.1 Read-Only Properties Being Removed

```bicep
~ Microsoft.Web/staticSites/GlookoData
  - properties.deploymentAuthPolicy: "DeploymentToken"
  - properties.stableInboundIP: "20.101.2.157"
  - properties.trafficSplitting:
      environmentDistribution.default: 100
```

**What is this?**
- These properties show in the what-if output with a minus sign (`-`), indicating they're not in the template
- They are **read-only** properties managed by Azure

**Why are they being "removed"?**
- **Template vs. Reality mismatch**: What-if compares your template to the actual deployed resource
- **Read-only properties**: These properties cannot be set in Bicep templates
- **Azure-managed values**: Azure automatically maintains these properties
- **What-if limitation**: What-if shows them as "removed" but they won't actually be deleted

**Details on each property:**

1. **`deploymentAuthPolicy: "DeploymentToken"`**
   - How the Static Web App authenticates deployments
   - Azure manages this automatically based on the deployment method
   - Will remain "DeploymentToken" after deployment

2. **`stableInboundIP: "20.101.2.157"`**
   - The IP address assigned by Azure to the Static Web App
   - Azure assigns this and it cannot be changed via template
   - Will remain the same after deployment

3. **`trafficSplitting.environmentDistribution.default: 100`**
   - Traffic routing configuration for staging environments
   - Azure maintains this automatically
   - 100 = 100% of traffic goes to production environment
   - Will remain at 100 after deployment

**Where to verify:**
- Azure Portal: Check the Static Web App after deployment
- Azure CLI: `az staticwebapp show -n GlookoData -g Glooko`

**Impact:**
- ✅ **No actual change**: These properties will be maintained by Azure
- ✅ **Safe to deploy**: The minus sign is informational only
- ℹ️ **What-if noise**: This is a known limitation of what-if for read-only properties

---

### 4.2 Build Properties Being Added

```bicep
~ Microsoft.Web/staticSites/GlookoData
  + properties.buildProperties:
      apiLocation: "api"
      appLocation: "/"
      outputLocation: "dist"
```

**What is this?**
- Configuration for the Static Web App build process
- Tells Azure where to find the source code and where the build output will be

**Why is it being added?**
- **Explicit configuration**: Makes build configuration part of Infrastructure as Code
- **Consistency**: Ensures builds use the correct paths every time
- **Documentation**: Build configuration is visible in the template, not just in workflow files

**Details on each property:**

1. **`apiLocation: "api"`**
   - Location of Azure Functions API code (if present)
   - In this project, API functions are in the `api/` directory
   - Static Web Apps can include serverless API endpoints

2. **`appLocation: "/"`**
   - Root directory of the application source code
   - `/` means the app code is at the repository root
   - This is where `package.json`, `src/`, etc. are located

3. **`outputLocation: "dist"`**
   - Directory where the build output (compiled assets) will be placed
   - Vite builds the app to the `dist/` directory (configured in `vite.config.ts`)
   - Azure will serve files from this directory

**Where is it defined in the code?**
- Template: `infra/modules/static-web-app.bicep` lines 39-42
- These values match the GitHub Actions workflow in `.github/workflows/azure-static-web-apps-*.yml`

**Impact:**
- ✅ **Better documentation**: Build configuration is now in IaC, not just in workflow files
- ✅ **Consistency**: Ensures all deployments use the same build configuration
- ✅ **No breaking change**: These values match the current GitHub Actions workflow

**Verification:**
- Compare with `.github/workflows/` files to ensure alignment
- Check `vite.config.ts` to confirm output directory is `dist`

---

## 5. Storage Account Changes

### 5.1 Encryption Services (Unsupported)

```bicep
~ Microsoft.Storage/storageAccounts/glookodatawebappstorage
  x properties.encryption.services:
      blob.enabled: true
      file.enabled: true
      table.enabled: true
```

**What is this?**
- Shows that encryption is enabled for Blob, File, and Table services
- The `x` symbol means **unsupported** by what-if analysis

**Why is it marked as unsupported?**
- **What-if limitation**: Encryption service configuration has complex behavior that what-if cannot fully analyze
- **Azure-managed encryption**: These properties are partially read-only
- **Default behavior**: Encryption is always enabled for new storage accounts (cannot be disabled)

**Where is it defined in the code?**
- Template: `infra/modules/storage.bicep` lines 46-58
- Explicitly enables encryption for blob, file, and table services

**Impact:**
- ✅ **No actual change**: Encryption is already enabled and will remain enabled
- ℹ️ **What-if noise**: The `x` marker is informational only
- ✅ **Security maintained**: All data remains encrypted at rest

**Additional context:**
- Azure Storage encryption uses Microsoft-managed keys by default
- Encryption cannot be disabled - it's a mandatory Azure security feature
- The template explicitly declares this configuration for clarity

---

## Summary Table

| Change | Type | Impact | Action |
|--------|------|--------|--------|
| Storage Table Data Contributor role | Create | Safe - Enables passwordless auth | ✅ Accept |
| Storage Blob Data Contributor role | Create | Safe - Enables passwordless auth | ✅ Accept |
| Key Vault purge protection | Add | Security improvement (one-way) | ✅ Accept |
| Key Vault network ACLs | Add | Explicit config, no functional change | ✅ Accept |
| Function App CORS | Add | Required for frontend-backend communication | ✅ Accept |
| Function App FTPS disabled | Add | Security improvement | ✅ Accept |
| Function App local MySQL disabled | Add | Not used, explicit config | ✅ Accept |
| Function App min TLS version | Add | Security improvement | ✅ Accept |
| Function App .NET version | Add | Platform default, no impact | ✅ Accept |
| Function App HTTPS only | Modify | Security critical | ✅ Accept |
| Function App linuxFxVersion case | Modify | Template hygiene, no functional impact | ✅ Accept |
| Static Web App read-only properties | Remove (informational) | No actual change, Azure-managed | ✅ Accept |
| Static Web App build properties | Add | Better documentation | ✅ Accept |
| Storage encryption services | Unsupported | No change, what-if limitation | ℹ️ Informational |

---

## Recommendations

### Before Deployment

1. ✅ **Review CORS origins**: Verify `webAppUrl` parameter matches your Static Web App URL
2. ✅ **Backup secrets**: Although purge protection is being enabled, take a backup of Key Vault secrets as a precaution
3. ✅ **Test TLS 1.2**: Ensure all clients support TLS 1.2 (standard since 2008, should not be an issue)
4. ✅ **Verify HTTPS**: Ensure no code or scripts rely on HTTP access to the function app

### After Deployment

1. ✅ **Test API calls**: Verify the static web app can call the function app APIs
2. ✅ **Check monitoring**: Verify Application Insights is still receiving telemetry
3. ✅ **Verify HTTPS**: Test that HTTP requests are redirected to HTTPS
4. ✅ **Validate role assignments**: Use Azure Portal to verify the two new role assignments are created

### Future Improvements

1. 🔄 **Migrate to managed identity storage**: When moving to Premium plan, migrate `AzureWebJobsStorage` to use managed identity instead of connection strings
2. 🔄 **Restrict Key Vault network access**: Consider changing `defaultAction` from `"Allow"` to `"Deny"` and adding specific IP rules or private endpoints
3. 🔄 **Enable CORS origin validation**: Consider restricting CORS to specific origins instead of supporting credentials

---

## Diagnostic Message Explanation

The what-if output includes this diagnostic:

```
Diagnostics (1): 
[extensionResourceId(...)] (Unsupported) Changes to the resource declared at 'properties.template.resources[4].properties.template.resources[1]' on line 1 and column 11452 cannot be analyzed because its resource ID or API version cannot be calculated until the deployment is under way.
```

**What is this?**
- This refers to the **Key Vault role assignment** for the managed identity
- The role assignment is an "extension resource" that extends an existing resource (the Key Vault)

**Why does this appear?**
- **What-if limitation**: The role assignment uses `guid()` and `reference()` functions that are evaluated during deployment
- **Dynamic resource ID**: The exact resource ID cannot be determined until the managed identity principal ID is available
- **API version dependency**: The resource depends on another resource being deployed first

**Impact:**
- ✅ **No impact on deployment**: The role assignment will deploy correctly
- ℹ️ **Informational only**: This is a known limitation of what-if analysis for extension resources
- ✅ **Tested pattern**: This is a standard pattern for RBAC role assignments in Bicep

**Where is it defined?**
- Template: `infra/modules/key-vault.bicep` lines 40-48
- Uses `guid(keyVault.id, managedIdentityPrincipalId, keyVaultSecretsUserRoleId)` for deterministic naming
- Grants "Key Vault Secrets User" role to the managed identity

---

## Conclusion

All changes shown in the what-if output are **expected, documented, and safe to deploy**. The changes fall into three categories:

1. **Security Improvements**: RBAC role assignments, purge protection, HTTPS enforcement, FTPS disabled, min TLS version
2. **Configuration Additions**: CORS, network ACLs, build properties - making implicit configuration explicit in IaC
3. **Informational/No Impact**: Read-only properties, unsupported properties, case changes

**Recommendation: Proceed with deployment.** These changes enhance security and make the infrastructure more maintainable without breaking existing functionality.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-29  
**Related Documents:** 
- `WHAT_IF_ANALYSIS.md` - Initial what-if analysis and fixes
- `EXPECTED_WHAT_IF.md` - Expected what-if output after fixes
- `README.md` - General infrastructure documentation
