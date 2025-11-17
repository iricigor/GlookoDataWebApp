# Azure App Registration Deployment Guide

This guide explains how to set up Microsoft authentication for the GlookoDataWebApp using Azure App Registration.

## Overview

The `deploy-azure-app-registration.sh` script automates the creation and configuration of an Azure App Registration in Microsoft Entra ID (formerly Azure AD). This enables users to sign in to the application using their personal Microsoft accounts.

## Prerequisites

Before running the script, ensure you have:

1. **Access to Azure Cloud Shell**
   - Visit [shell.azure.com](https://shell.azure.com)
   - Or use the Cloud Shell button in the Azure Portal

2. **Appropriate Permissions**
   - Ability to create App Registrations in your Azure tenant
   - Typically requires "Application Administrator" or "Global Administrator" role

3. **Target Application URL**
   - The script is pre-configured for `https://glooko.iric.online`
   - You can modify this in the script if deploying to a different URL

## How to Use

### Step 1: Access Azure Cloud Shell

1. Open [Azure Portal](https://portal.azure.com)
2. Click the Cloud Shell icon (>_) in the top navigation bar
3. Select **Bash** as your shell environment

### Step 2: Upload the Script

1. Download the script from the repository:
   ```bash
   git clone https://github.com/iricigor/GlookoDataWebApp.git
   cd GlookoDataWebApp/scripts/deployment
   ```

   Or create a new file and copy the script content:
   ```bash
   vi deploy-azure-app-registration.sh
   # Paste the script content
   # Press ESC, then :wq to save and exit
   ```

2. Make the script executable:
   ```bash
   chmod +x deploy-azure-app-registration.sh
   ```

### Step 3: Run the Script

Execute the script:
```bash
./deploy-azure-app-registration.sh
```

The script will:
- ✅ Check Azure CLI availability
- ✅ Verify you're logged in to Azure
- ✅ Create or update the App Registration
- ✅ Configure redirect URIs for authentication
- ✅ Set up API permissions (Microsoft Graph)
- ✅ Display configuration details

### Step 4: Review the Output

The script displays important information at the end:

```
Application Details:
  - Application Name: GlookoDataWebApp
  - Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  - Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  - Sign-in Audience: PersonalMicrosoftAccount
```

**Save these values!** You'll need them to configure your web application.

## Configuration Details

### Sign-in Audience

The script configures the app for **Personal Microsoft Accounts Only**:
- Users can sign in with their personal Microsoft accounts (outlook.com, hotmail.com, etc.)
- Work or school accounts are NOT allowed
- This matches the requirement for consumer-facing applications

If you need to allow work/school accounts, modify the `SIGN_IN_AUDIENCE` constant in the script:
- `PersonalMicrosoftAccount` - Personal accounts only ✅ (current setting)
- `AzureADandPersonalMicrosoftAccount` - Both personal and work/school accounts
- `AzureADMyOrg` - Single organization only
- `AzureADMultipleOrgs` - Multiple organizations only

### Redirect URIs

The script configures these redirect URIs:

**Production:**
- `https://glooko.iric.online`
- `https://glooko.iric.online/`
- `https://glooko.iric.online/auth/callback`

**Local Development:**
- `http://localhost:5173`
- `http://localhost:5173/`
- `http://localhost:5173/auth/callback`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5173/`
- `http://127.0.0.1:5173/auth/callback`

**Note:** Both `localhost` and `127.0.0.1` are included because they are treated as different origins by MSAL and Azure AD. This ensures authentication works regardless of which hostname is used to access the local development server.

These are used for authentication redirects after successful login.

### API Permissions

The script requests these Microsoft Graph permissions:
- `openid` - Sign in and read user profile
- `profile` - Read user's profile information
- `email` - Read user's email address
- `User.Read` - Read user's basic profile

These are **delegated permissions** that users consent to during sign-in.

## Integration with Web Application

After running the script, integrate the App Registration with your web application:

### 1. Add Configuration to Your App

Create a configuration object with the values from the script output:

```javascript
// authConfig.js
const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID_FROM_SCRIPT",
    authority: "https://login.microsoftonline.com/consumers",
    redirectUri: "https://glooko.iric.online"
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};
```

### 2. Use MSAL.js Library

Install the Microsoft Authentication Library (MSAL) for JavaScript:

```bash
npm install @azure/msal-browser
```

### 3. Implement Authentication

Example implementation:

```javascript
import { PublicClientApplication } from "@azure/msal-browser";

// Initialize MSAL
const msalInstance = new PublicClientApplication(msalConfig);

// Sign in
async function signIn() {
  try {
    const loginResponse = await msalInstance.loginPopup({
      scopes: ["openid", "profile", "email", "User.Read"]
    });
    console.log("Logged in!", loginResponse);
  } catch (error) {
    console.error("Login failed:", error);
  }
}

// Sign out
async function signOut() {
  await msalInstance.logoutPopup();
}
```

## Customization

You can customize the script by modifying these constants at the beginning:

```bash
# Application Configuration
readonly APP_NAME="GlookoDataWebApp"
readonly APP_DESCRIPTION="Web application for importing, visualizing..."

# Web Application URL
readonly WEB_APP_URL="https://glooko.iric.online"

# Redirect URIs
readonly REDIRECT_URIS=(
    "${WEB_APP_URL}"
    "${WEB_APP_URL}/"
    "${WEB_APP_URL}/auth/callback"
)

# Account Types
readonly SIGN_IN_AUDIENCE="PersonalMicrosoftAccount"
```

## Troubleshooting

### Script Fails with "Not logged in to Azure"

**Solution:** Run `az login` in Cloud Shell or ensure you're using Azure Cloud Shell with an active session.

### App Already Exists

The script detects existing App Registrations with the same name and prompts you to update it. Answer 'y' to update or 'n' to exit.

### Permission Errors

**Error:** "Insufficient privileges to complete the operation"

**Solution:** You need "Application Administrator" or "Global Administrator" role to create App Registrations. Contact your Azure administrator.

### Admin Consent Required

Some environments require admin consent for API permissions. If needed, run:

```bash
az ad app permission admin-consent --id YOUR_APP_ID
```

## Security Best Practices

1. **Never Commit Secrets**
   - Client ID is safe to expose in client-side code
   - Never commit client secrets (not used for SPAs)
   - Use environment variables for sensitive configuration

2. **Use PKCE Flow**
   - For Single Page Applications (SPAs), use Authorization Code Flow with PKCE
   - This provides better security than implicit flow

3. **Configure CORS Properly**
   - Ensure your web server allows authentication redirects
   - Set appropriate CORS headers

4. **Regular Updates**
   - Keep MSAL library updated
   - Review and rotate credentials periodically

## Additional Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Single Page Application Authentication](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-overview)

## Support

For issues with the script or Azure configuration:
1. Check the [GitHub repository issues](https://github.com/iricigor/GlookoDataWebApp/issues)
2. Review Azure Portal logs
3. Consult Microsoft Entra ID documentation

---

**Last Updated:** 2025-11-14
