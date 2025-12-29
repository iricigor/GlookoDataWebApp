# Admin Page

The Admin page provides administrative features and statistics for Pro users. This is a hidden page that can only be accessed directly via URL.

## 📍 Accessing the Admin Page

The Admin page is intentionally not linked from the main navigation. To access it:

1. **Direct URL**: Navigate to `/#admin` or click [Admin Page](/#admin)
2. **From Settings**: Click the "API Documentation" link in Settings → About, then click "Admin page" from the API Docs header
3. **From API Docs**: Click the "Admin page" link in the API Documentation header

## 🔐 Access Requirements

### For All Users
- The page is accessible to anyone, but features vary based on authentication status

### Non-Authenticated Users
- Shown a login prompt
- Must use the Login button in the navigation bar to sign in

### Authenticated (Non-Pro) Users
- Shown a message about Pro access requirement
- Provided with a link to apply for Pro access

### Pro Users
- Full access to all administrative features and statistics
- See [Becoming a Pro User](#becoming-a-pro-user) below

## ✨ Features for Pro Users

### User Statistics
Pro users can view:

- **Logged In Users**: Total count of users who have logged in at least once
- **Pro Users**: Total count of users with Pro access

### API & Web Statistics
Monitor application traffic with customizable time periods:

- **Web Calls**: HTTP requests to static pages (HTML, CSS, JS)
- **Web Errors**: Failed web requests (4xx/5xx status codes)
- **API Calls**: HTTP requests to backend API endpoints
- **API Errors**: Failed API requests (4xx/5xx status codes)

**Time Period Options:**
- Last 1 Hour
- Last 1 Day

### AI Configuration Testing
Pro users can test the Pro AI key configuration:

- **Infrastructure Test**: Verifies Key Vault access and environment configuration
- **Full Test**: Tests infrastructure plus sends a test query to the configured AI provider

**Test Results Include:**
- AI provider name (Perplexity, Gemini, Grok, or DeepSeek)
- Key Vault name and configuration
- Secret name and accessibility status
- Success/failure status with detailed messages

## 🎯 Becoming a Pro User

Pro access is granted on a case-by-case basis. To apply:

1. Navigate to the Admin page while logged in
2. Click the **"Apply for Pro Access"** button
3. Fill out the Pro access request template on GitHub
4. Wait for approval from the maintainers

**Pro Access Benefits:**
- Access to administrative statistics
- Ability to use backend AI features (when configured)
- Priority support for feature requests
- Marked with a ✨ sparkle badge in the UI

## 🔗 Related Pages

- **[API Documentation Page](API_DOCUMENTATION.md)** - Interactive API explorer
- **[Admin Statistics API](ADMIN_STATS_API.md)** - Technical details about the statistics API
- **[Authentication Flow](AUTH_FLOW.md)** - How user authentication works

## 🛡️ Privacy & Security

- All statistics are **aggregated counts only** - no individual user data is exposed
- Pro user verification happens on the backend via Azure Table Storage
- All API requests require valid Microsoft authentication tokens
- Statistics are read-only and cannot modify user data

## 📊 Technical Details

### Frontend Components
- **Location**: `src/pages/Admin.tsx`
- **Route**: `/#admin` (hash-based routing)
- **Auth Hook**: Uses `useAuth()` for authentication state
- **Pro Check**: Uses `useProUserCheck()` to verify Pro status

### Backend APIs Used
- `GET /api/user/check-pro-status` - Verify Pro user status
- `GET /api/glookoAdmin/stats/logged-in-users` - Get user counts
- `GET /api/glookoAdmin/stats/traffic` - Get traffic statistics
- `POST /api/glookoAdmin/test-ai-key` - Test AI configuration

### Translations
All text is localized using the `admin` namespace:
- English: `public/locales/en/admin.json`
- German: `public/locales/de/admin.json`
- Czech: `public/locales/cs/admin.json`

## 📝 See Also

- **Main Documentation**: [README.md](../README.md)
- **API Reference**: [API Documentation](api/README.md)
- **Settings Guide**: [SETTINGS.md](SETTINGS.md)
