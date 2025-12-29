# Google Authentication Troubleshooting Guide

## Understanding the Two Google Client ID Variables

The GlookoDataWebApp uses **TWO separate Google Client ID configurations**:

### 1. Frontend (Static Web App) - `VITE_GOOGLE_CLIENT_ID`

**Purpose:** Used for initiating the Google OAuth redirect flow  
**Set in:** GitHub repo variables or `.env.local` for local development  
**Used by:** React app (`src/utils/googleAuthFlow.ts`)  
**Injected:** At build time by Vite  

**How it works:**
```
User clicks "Sign in with Google"
  ↓
Frontend reads import.meta.env.VITE_GOOGLE_CLIENT_ID
  ↓
Redirects to: https://accounts.google.com/o/oauth2/v2/auth?client_id=VITE_GOOGLE_CLIENT_ID&...
  ↓
User authenticates with Google
  ↓
Google redirects back with authorization code
```

### 2. Backend (Function App) - `GOOGLE_CLIENT_ID`

**Purpose:** Used for validating Google ID tokens  
**Set in:** Azure Function App Settings (can use Key Vault reference)  
**Used by:** Azure Functions (`api/src/utils/azureUtils.ts`)  
**Loaded:** At Function App startup from `process.env`  

**How it works:**
```
Frontend calls /api/user/check-pro-status with Google ID token
  ↓
Function App reads process.env.GOOGLE_CLIENT_ID
  ↓
JWT validation checks if token.aud === GOOGLE_CLIENT_ID
  ↓
If match → 200 OK
If mismatch → 401 Unauthorized
```

## Common Misconception

❌ **WRONG:** "Google redirect is working, so the Function App can read from Key Vault"

✅ **CORRECT:** "Google redirect uses the **frontend's** client ID (`VITE_GOOGLE_CLIENT_ID`). The Function App's Key Vault issue only appears **after login** when calling backend APIs."

## Troubleshooting 401 Errors After Google Login

### Symptom

```
✅ Google login redirect works
✅ User successfully authenticates with Google
✅ Gets redirected back to the app
❌ Gets 401 errors when calling /api/user/check-pro-status or /api/user/check-first-login
```

### Diagnosis

Check the Function App logs for:
```
JWT validation failed: jwt audience invalid. expected: @Microsoft.KeyVault(SecretUri=...)
```

This means:
1. The Function App's `GOOGLE_CLIENT_ID` environment variable contains a Key Vault reference
2. Azure is **NOT** resolving the reference to the actual secret value
3. The JWT validation tries to use the literal string `@Microsoft.KeyVault(...)` as the expected audience
4. This doesn't match the actual Google Client ID in the token → 401 error

### Root Cause

The Function App's managed identity doesn't have permission to read secrets from Key Vault, OR the managed identity is not properly configured.

### Solution

1. **Verify managed identity is enabled:**
   ```powershell
   # Check if Function App has managed identity
   $functionApp = Get-AzFunctionApp -ResourceGroupName "glookodatawebapp-rg" -Name "glookodatawebapp-func"
   $functionApp.IdentityPrincipalId  # Should return a GUID, not null
   ```

2. **Grant Key Vault access:**
   ```powershell
   # Using deployment script (recommended)
   Set-GlookoKeyVault -AssignIdentity
   
   # Or manually
   $keyVault = Get-AzKeyVault -VaultName "glookodatawebapp-kv"
   $identity = Get-AzFunctionApp -ResourceGroupName "glookodatawebapp-rg" -Name "glookodatawebapp-func"
   
   New-AzRoleAssignment `
     -ObjectId $identity.IdentityPrincipalId `
     -RoleDefinitionName "Key Vault Secrets User" `
     -Scope $keyVault.ResourceId
   ```

3. **Restart the Function App:**
   ```powershell
   Restart-AzFunctionApp -ResourceGroupName "glookodatawebapp-rg" -Name "glookodatawebapp-func"
   ```
   
   **Important:** Environment variables are loaded only at Function App startup. After fixing permissions, you **MUST** restart the Function App for Azure to re-resolve the Key Vault references.

4. **Verify resolution:**
   
   After restart, check the logs. You should see:
   - ✅ No error about "unresolved Key Vault reference"
   - ✅ Successful JWT validation
   - ✅ 200 responses from `/api/user/check-pro-status`

### Alternative: Use Direct Values Instead of Key Vault

If Key Vault is causing issues, you can temporarily use direct values:

1. Go to Azure Portal → Function App → Environment variables
2. Change `GOOGLE_CLIENT_ID` from:
   ```
   @Microsoft.KeyVault(SecretUri=https://glookodatawebapp-kv.vault.azure.net/secrets/google-client-id)
   ```
   to:
   ```
   your-actual-client-id.apps.googleusercontent.com
   ```
3. Save and restart

**Note:** This is less secure than Key Vault references but can help isolate the issue.

## Verification Checklist

- [ ] Frontend redirect to Google works (confirms `VITE_GOOGLE_CLIENT_ID` is configured)
- [ ] User can authenticate with Google and get redirected back
- [ ] Function App logs show **no** "unresolved Key Vault reference" errors
- [ ] Function App has managed identity enabled
- [ ] Managed identity has "Key Vault Secrets User" role on the Key Vault
- [ ] Function App has been restarted after permission changes
- [ ] `/api/user/check-pro-status` returns 200 (not 401)
- [ ] `/api/user/check-first-login` returns 200 (not 401)

## Environment Variable Loading Behavior

**Critical Understanding:**

Environment variables in Azure Functions are loaded **once at process startup**, NOT on each request:

1. Function App starts (cold start or restart)
2. Azure runtime checks App Settings for `@Microsoft.KeyVault(...)` patterns
3. If managed identity has permissions → Fetches secret and injects into `process.env`
4. If resolution fails → Leaves literal string in `process.env`
5. Node.js process starts
6. Module-level code executes: `const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID`
7. Value is cached for the lifetime of the process

**Implications:**
- Fixing permissions doesn't help until the Function App is restarted
- After restart, the new resolved value will be used
- No need to restart for each request - the value is cached

## Related Files

- `api/src/utils/azureUtils.ts` - JWT validation code (backend)
- `src/utils/googleAuthFlow.ts` - OAuth redirect code (frontend)
- `src/config/googleConfig.ts` - Frontend Google configuration
- `api/src/functions/googleTokenExchange.ts` - Token exchange endpoint
