# Google Authentication Setup Guide

This document describes how to configure Google OAuth authentication for the GlookoDataWebApp.

## Prerequisites

- Access to Google Cloud Console
- Application deployed or running locally

## Step 1: Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: `Glooko Data Web App`
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `openid`, `profile`, `email`
   - Save and continue

6. Back in the Credentials page, create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `Glooko Data Web App`
   - Authorized JavaScript origins:
     - For local development: `http://localhost:5173`
     - For production: `https://yourdomain.com`
   - Authorized redirect URIs:
     - For local development: `http://localhost:5173`
     - For production: `https://yourdomain.com`
   - Click **Create**

7. Copy the **Client ID** (you'll need this)

## Step 2: Configure the Application

### For Local Development

Create a `.env` file in the project root (if it doesn't exist):

```bash
AUTH_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### For Azure Static Web App (Production)

Add the environment variable in Azure Portal:

1. Go to your Azure Static Web App
2. Navigate to **Configuration**
3. Add a new application setting:
   - Name: `AUTH_GOOGLE_CLIENT_ID`
   - Value: Your Google OAuth Client ID
4. Save the changes

## Step 3: Test the Implementation

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser
3. Click the "Login" button
4. You should see both "Sign in with Microsoft" and "Sign in with Google" buttons
5. Click "Sign in with Google"
6. Complete the Google sign-in flow
7. Verify that you're logged in successfully

## How It Works

### Authentication Flow

1. **User clicks "Sign in with Google"**
   - The GoogleLogin component from `@react-oauth/google` is rendered
   - User is redirected to Google's authentication page

2. **User authenticates with Google**
   - User enters credentials on Google's page
   - Grants permissions to the app
   - Google generates a JWT credential

3. **App receives the credential**
   - The `onSuccess` callback in LoginDialog receives the credential
   - Credential is passed to `loginWithGoogle` function in useAuth

4. **Extract user information**
   - JWT credential is decoded to extract:
     - User name
     - Email address
     - Profile photo URL
   - Auth state is updated with provider set to "Google"

5. **Backend storage**
   - When user settings are saved, the provider field is included
   - Azure Table Storage stores: email, settings, firstLoginDate, lastLoginDate, and provider

### Provider Field in Database

The `provider` field in the UserSettings table stores which authentication provider the user used:
- `"Microsoft"` - User logged in with Microsoft account
- `"Google"` - User logged in with Google account

This allows the application to:
- Track which authentication method users prefer
- Apply provider-specific logic if needed in the future
- Maintain backward compatibility (defaults to "Microsoft" for existing users)

## Security Considerations

1. **Client ID is safe to expose**: The Google OAuth Client ID can be safely included in client-side code. It's designed to be public.

2. **No client secret needed**: Public web applications using OAuth 2.0 don't require a client secret.

3. **JWT validation**: The credential received from Google is a signed JWT that can be validated by your backend if needed.

4. **HTTPS requirement**: In production, Google OAuth requires HTTPS. Make sure your app is served over HTTPS.

## Troubleshooting

### "Redirect URI mismatch" error

This means the redirect URI in your Google OAuth configuration doesn't match the URL you're accessing the app from.

**Solution**: Make sure the URL in your browser exactly matches one of the authorized redirect URIs in Google Cloud Console.

### "Access blocked: This app's request is invalid" error

This typically means:
- The OAuth consent screen is not properly configured
- The requested scopes are not approved
- The app is still in testing mode with limited users

**Solution**: 
1. Go to Google Cloud Console > OAuth consent screen
2. Make sure all required fields are filled
3. Add test users if the app is in testing mode
4. Verify the scopes are correct

### "Invalid client ID" error

**Solution**: Check that:
1. The `AUTH_GOOGLE_CLIENT_ID` environment variable is set correctly
2. The client ID matches the one from Google Cloud Console
3. You've restarted the development server after setting the environment variable

### Google login button not showing

**Solution**: 
1. Check browser console for errors
2. Verify the `@react-oauth/google` package is installed
3. Make sure the GoogleOAuthProvider is wrapping your app in `main.tsx`

## Additional Resources

- [Google Identity: Authentication](https://developers.google.com/identity/gsi/web)
- [@react-oauth/google Documentation](https://github.com/MomenSherif/react-oauth)
- [Google Cloud Console](https://console.cloud.google.com/)
