# Authentication Configuration

This document describes how to configure authentication providers (Microsoft and Google) for GlookoDataWebApp.

## Overview

The application supports authentication with:
- **Microsoft Accounts** (Outlook, Hotmail, Live, etc.) - Currently implemented
- **Google Accounts** - Prepared for future implementation

Authentication client IDs are configured via Azure Key Vault and injected during the build process as environment variables.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Key Vault                               │
│                  (glookodatawebapp-kv)                           │
│                                                                   │
│   Secrets:                                                        │
│   - MicrosoftClientId                                             │
│   - GoogleClientId                                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Fetched during CI/CD
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GitHub Actions Workflow                         │
│         (azure-static-web-apps-*.yml)                            │
│                                                                   │
│   1. Azure Login                                                  │
│   2. Fetch secrets from Key Vault                                │
│   3. Set as environment variables:                                │
│      - VITE_MICROSOFT_CLIENT_ID                                   │
│      - VITE_GOOGLE_CLIENT_ID                                      │
│   4. Build Vite app (secrets baked into bundle)                   │
│   5. Deploy to Azure Static Web Apps                              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ Deployed bundle
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 React Application (Browser)                      │
│                                                                   │
│   - msalConfig.ts: Uses VITE_MICROSOFT_CLIENT_ID                 │
│   - googleAuthConfig.ts: Uses VITE_GOOGLE_CLIENT_ID              │
│                                                                   │
│   Fallback behavior:                                              │
│   - Microsoft: Uses hardcoded default if not set                  │
│   - Google: Disables Google auth if not set                       │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Steps

### 1. Create Azure App Registration (Microsoft)

If not already created:

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click "New registration"
3. Configure:
   - **Name**: GlookoDataWebApp
   - **Supported account types**: Personal Microsoft accounts only
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URI: `https://glooko.iric.online` (add other domains as needed)
4. After creation, copy the **Application (client) ID**
5. Under "Authentication", ensure:
   - Implicit grant: Disabled (using PKCE flow)
   - Access tokens: Unchecked
   - ID tokens: Unchecked

### 2. Create Google OAuth Client (Optional - Future)

If/when implementing Google authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API" or "Google Identity Services"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `https://glooko.iric.online`
   - **Authorized redirect URIs**: `https://glooko.iric.online`
6. Copy the **Client ID** (format: `*.apps.googleusercontent.com`)

### 3. Store Secrets in Azure Key Vault

Add the client IDs to Azure Key Vault:

```bash
# Microsoft Client ID (required)
az keyvault secret set \
  --vault-name glookodatawebapp-kv \
  --name "MicrosoftClientId" \
  --value "YOUR_MICROSOFT_CLIENT_ID"

# Google Client ID (optional - for future use)
az keyvault secret set \
  --vault-name glookodatawebapp-kv \
  --name "GoogleClientId" \
  --value "YOUR_GOOGLE_CLIENT_ID"
```

**Secret Names** (case-sensitive):
- `MicrosoftClientId` - Microsoft App Registration client ID
- `GoogleClientId` - Google OAuth 2.0 client ID

### 4. Configure GitHub Actions

The deployment workflow requires Azure credentials to fetch secrets from Key Vault.

#### Option A: Service Principal (Recommended)

1. Create a service principal with Key Vault access:

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-glookodata" \
  --role "Key Vault Secrets User" \
  --scopes "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/glookodatawebapp-rg/providers/Microsoft.KeyVault/vaults/glookodatawebapp-kv" \
  --sdk-auth
```

2. Copy the JSON output
3. In GitHub repository settings → Secrets and variables → Actions:
   - Create secret: `AZURE_CREDENTIALS`
   - Paste the JSON from step 2

#### Option B: OpenID Connect (OIDC) - Alternative

For enhanced security, configure Azure AD federated identity credentials. See [Azure documentation](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure).

### 5. Grant Permissions

Ensure the service principal or managed identity has permissions to read Key Vault secrets:

```bash
# Grant Key Vault Secrets User role
az role assignment create \
  --assignee <SERVICE_PRINCIPAL_ID> \
  --role "Key Vault Secrets User" \
  --scope "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/glookodatawebapp-rg/providers/Microsoft.KeyVault/vaults/glookodatawebapp-kv"
```

## How It Works

### Build-Time Configuration

1. **GitHub Actions workflow** runs on deployment
2. **Azure Login** authenticates using `AZURE_CREDENTIALS` secret
3. **Fetch secrets** from Key Vault using Azure CLI:
   ```bash
   az keyvault secret show --vault-name glookodatawebapp-kv --name MicrosoftClientId --query value -o tsv
   ```
4. **Set environment variables** for Vite build:
   - `VITE_MICROSOFT_CLIENT_ID`
   - `VITE_GOOGLE_CLIENT_ID`
5. **Vite build process** injects these values into the bundle
6. **Deploy** the compiled bundle to Azure Static Web Apps

### Runtime Behavior

#### Microsoft Authentication
- **Config file**: `src/config/msalConfig.ts`
- **Environment variable**: `VITE_MICROSOFT_CLIENT_ID`
- **Fallback**: Hardcoded default client ID (656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c)
- **Behavior**: Always enabled, uses fallback if Key Vault secret not set

```typescript
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || 
                            DEFAULT_MICROSOFT_CLIENT_ID;
```

#### Google Authentication
- **Config file**: `src/config/googleAuthConfig.ts`
- **Environment variable**: `VITE_GOOGLE_CLIENT_ID`
- **Fallback**: Empty string (disables Google auth)
- **Behavior**: Disabled unless client ID is provided

```typescript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const isGoogleAuthAvailable = () => GOOGLE_CLIENT_ID.length > 0;
```

## Local Development

For local development, create a `.env.local` file (ignored by git):

```bash
# .env.local
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

Or use the hardcoded defaults (no configuration needed for Microsoft).

## Security Considerations

### Client IDs Are Public
- OAuth 2.0 client IDs for public clients (SPAs) are **not secrets**
- Safe to expose in client-side code and browser DevTools
- No client secrets are used or required for browser-based applications
- Security is provided by:
  - PKCE (Proof Key for Code Exchange) flow
  - Redirect URI restrictions in Azure/Google configuration
  - Token validation and expiration

### Why Store in Key Vault?
Although client IDs are public, storing them in Key Vault provides:
- **Centralized configuration** - Single source of truth
- **Audit trail** - Who accessed/modified the values
- **Easy rotation** - Update in one place, redeploy to apply
- **Environment separation** - Different client IDs for dev/staging/prod

### Masked in Logs
The GitHub Actions workflow masks the client IDs in logs using `::add-mask::` to prevent accidental exposure in CI/CD logs.

## Troubleshooting

### Authentication Fails with "Invalid Client ID"

**Symptoms**: Microsoft/Google login fails with client ID error

**Resolution**:
1. Check if secrets exist in Key Vault:
   ```bash
   az keyvault secret show --vault-name glookodatawebapp-kv --name MicrosoftClientId
   ```
2. Verify GitHub Actions has access to Key Vault
3. Check workflow logs for secret fetch errors
4. Re-run deployment workflow to rebuild with correct secrets

### GitHub Actions Can't Access Key Vault

**Symptoms**: Workflow fails at "Get Auth Secrets from Key Vault" step

**Resolution**:
1. Verify `AZURE_CREDENTIALS` secret exists in GitHub
2. Check service principal has "Key Vault Secrets User" role
3. Ensure Key Vault firewall allows GitHub Actions IPs (or disable firewall)
4. Verify service principal is not expired

### Google Authentication Not Working

**Symptoms**: Google login button shows "Coming Soon" or is disabled

**Resolution**:
1. Check if `GoogleClientId` secret exists in Key Vault
2. Verify the secret was fetched during build (check workflow logs)
3. Google authentication is not yet implemented in the UI
4. This is expected behavior until Google auth feature is completed

## Related Documentation

- [Deployment Guide](../../docs/DEPLOYMENT.md) - General deployment documentation
- [Key Vault Deployment Script](./deploy-azure-key-vault.sh) - Script to deploy Key Vault
- [Deployment Scripts README](./README.md) - All deployment scripts documentation
- [MSAL Configuration](../../src/config/msalConfig.ts) - Microsoft authentication config
- [Google Auth Configuration](../../src/config/googleAuthConfig.ts) - Google authentication config

## Support

For issues or questions:
- Open an issue on [GitHub Issues](https://github.com/iricigor/GlookoDataWebApp/issues)
- Check [Azure Static Web Apps documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- Review [MSAL.js documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
