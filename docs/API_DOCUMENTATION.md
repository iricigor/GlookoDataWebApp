# API Documentation Page

The API Documentation page provides an interactive Swagger UI interface for exploring and testing the GlookoDataWebApp backend API. This is a developer-focused page accessible directly via URL.

## 📍 Accessing the API Documentation

The API Documentation page is intentionally not linked from the main navigation. To access it:

1. **Direct URL**: Navigate to `/#api-docs` or click [API Documentation](/#api-docs)
2. **From Settings**: Click the "API Docs" button in Settings → About
3. **From Admin Page**: Click the "API Documentation" link in the Admin page header

## 🎨 Page Layout

The API Documentation page uses a **standalone layout** without the main navigation bar or footer, providing maximum screen space for the API explorer.

### Header Section
- **Title**: "Glooko Insights - API Documentation"
- **Subtitle**: "Interactive API explorer with authentication"
- **Quick Links**: Link to Admin page and version information
- **Authentication Card**: Shows login status and provides sign-in/sign-out controls

### Interactive API Explorer
Uses Swagger UI to provide:
- Complete API endpoint documentation
- Interactive "Try it out" functionality
- Request/response examples
- Schema definitions
- Authentication integration

## 🔐 Authentication Integration

### Not Logged In
- Yellow warning banner appears: "Sign in with your Microsoft account to test API endpoints"
- Authentication card shows "Sign in to test authenticated endpoints" with a Login button
- Swagger UI is viewable but authentication token is not automatically added to requests

### Logged In
- Authentication card shows:
  - User's name and email
  - Pro user badge (✨) if applicable
  - Green checkmark with "Token active" status
  - Sign Out button
- **Automatic token injection**: Your ID token is automatically added to all API requests as a Bearer token
- You can test authenticated endpoints directly from the browser

### Pro Users
- Marked with a ✨ sparkle badge
- Can test Pro-only endpoints (AI query, admin statistics, etc.)

## 📚 Available API Endpoints

The API documentation is loaded from `/api-docs/openapi.json` and includes:

### User Endpoints
- `GET /api/user/check-first-login` - Check if user is logging in for the first time
- `GET /api/user/check-pro-status` - Check if user is a Pro user
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Save user settings

### AI Endpoints (Pro Users Only)
- `POST /api/ai/query` - Query AI providers with diabetes-related prompts
- `POST /api/ai/test-ai-key` - Test Pro AI key configuration

### Stats Endpoints (Pro Users Only)
- `GET /api/stats/logged-in-users` - Get count of logged-in users
- `GET /api/stats/traffic` - Get API and web traffic statistics
- `GET /api/stats/unified` - Get all administrative statistics (unified)

## ⚙️ Swagger UI Features

### Try It Out
1. Expand any endpoint
2. Click **"Try it out"**
3. Fill in required parameters
4. Click **"Execute"**
5. View the response in real-time

### Request Interceptor
When logged in, the page automatically:
- Intercepts all API requests
- Adds your Bearer token to the `Authorization` header
- Allows seamless testing of authenticated endpoints

### Configuration
The Swagger UI is configured with:
- **Document Expansion**: List mode (shows endpoint summaries)
- **Filter**: Enabled for quick searching
- **Request Duration**: Displayed for performance monitoring
- **Try It Out**: Enabled by default

## 🛠️ For Developers

### OpenAPI Specification
- **Location**: `public/api-docs/openapi.json`
- **Version**: OpenAPI 3.0.3
- **Base URL**: `/api` (Azure Static Web App API)

### Updating the API Spec
To update the API documentation:

1. Edit `public/api-docs/openapi.json`
2. Follow OpenAPI 3.0.3 specification
3. Include detailed descriptions and examples
4. Add appropriate tags for organization
5. Test the changes by refreshing the API Docs page

### Security Scheme
```yaml
bearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
  description: ID token from Microsoft Authentication (MSAL)
```

All endpoints require Bearer token authentication except where specifically noted.

## 🔗 Related Pages

- **[Admin Page](ADMIN_PAGE.md)** - Administrative features for Pro users
- **[Admin Statistics API](ADMIN_STATS_API.md)** - Technical API details
- **[Authentication Flow](AUTH_FLOW.md)** - How authentication works
- **[First Login API](FIRST_LOGIN_API.md)** - First-time user flow

## 🌐 Multi-Language Support

The API Documentation page supports internationalization:
- **English**: `public/locales/en/apiDocs.json`
- **German**: `public/locales/de/apiDocs.json`
- **Czech**: `public/locales/cs/apiDocs.json`

All UI text (not the API documentation itself) is translated.

## 📱 Responsive Design

The page is fully responsive:
- **Desktop**: Full Swagger UI with all features
- **Tablet**: Optimized layout with collapsible sections
- **Mobile**: Vertical layout with touch-friendly controls

## 🎯 Use Cases

### Testing API Endpoints
- Quickly test API responses without writing code
- Verify authentication and authorization
- Debug API issues in real-time

### API Learning
- Explore available endpoints
- Understand request/response formats
- See example payloads

### Development
- Reference API documentation while coding
- Share API endpoint examples with team members
- Validate API changes before deployment

## 📊 Technical Details

### Frontend Components
- **Location**: `src/pages/APIDocs.tsx`
- **Route**: `/#api-docs` (hash-based routing)
- **Library**: `swagger-ui-react` with custom styling
- **Auth Hook**: Uses `useAuth()` for authentication state
- **Pro Check**: Uses `useProUserCheck()` to verify Pro status

### Custom Styling
- **CSS**: `src/pages/APIDocs.css`
- **Theme Integration**: Respects app theme (light/dark mode)
- **Fluent UI**: Uses Microsoft Fluent UI components for header and authentication card

### Error Handling
- Failed spec loading shows error message
- Network errors are gracefully handled
- Loading states provide user feedback

## 🛡️ Security Considerations

- **No Backend Secrets**: API keys are stored in Azure Key Vault, never exposed to frontend
- **Token Auto-Injection**: Tokens are automatically added but never logged or displayed
- **HTTPS Only**: Production deployment requires HTTPS
- **Token Validation**: All API endpoints validate tokens on the backend

## 📝 See Also

- **Main Documentation**: [README.md](../README.md)
- **Backend API**: [api/README.md](../api/README.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
