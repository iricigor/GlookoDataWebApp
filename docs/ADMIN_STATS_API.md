# Admin Statistics API

This document describes the administrative statistics API implementation in the GlookoDataWebApp.

## Overview

The admin statistics API provides aggregated statistics about application usage for Pro users. This enables monitoring and analytics without exposing individual user data.

## Security Model

### Access Control

The admin API implements a two-tier security model:

1. **Authentication**: Valid Microsoft ID token required (standard for all APIs)
2. **Authorization**: User must be a Pro user (checked against ProUsers table)

### Why Pro Users Only?

- Administrative statistics contain sensitive aggregated data
- Pro users are trusted members who have applied for and been granted elevated access
- This prevents unauthorized access to usage metrics and potential privacy concerns
- Aligns with the security considerations outlined in issue #760

### Data Privacy

- **Only aggregated counts are returned** - no individual user information
- User identities are not exposed through the API
- Statistics are read-only - no ability to modify user data
- All requests are logged with correlation IDs for audit trails

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   React App     │─────▶│  Azure Function  │─────▶│  Table Storage      │
│   (Admin Page)  │◀─────│    (API)         │─────▶│  (UserSettings +    │
└─────────────────┘      └──────────────────┘      │   ProUsers)         │
                                                     └─────────────────────┘
```

## Flow

1. Pro user logs in via Microsoft Authentication
2. Frontend verifies Pro status via `/api/user/check-pro-status`
3. Admin page automatically calls `/api/admin/stats/logged-in-users` with ID token
4. Azure Function validates token and checks Pro user status
5. Function queries UserSettings table to count users
6. Response returns aggregated count
7. Frontend displays statistics

## API Endpoints

### GET /api/admin/stats/logged-in-users

Returns the total count of users who have logged in at least once.

**Headers:**
- `Authorization: Bearer <id_token>` (required)
- `Content-Type: application/json`

**Success Response (200 OK):**
```json
{
  "count": 42
}
```

**Error Responses:**

| Status | Description | errorType |
|--------|-------------|-----------|
| 401 | Invalid or expired token, or missing email claim | `unauthorized` |
| 403 | User is not a Pro user | `authorization` |
| 500 | Server error | `infrastructure` |
| 503 | Storage not configured or access denied | `infrastructure` |

**Error Response Format:**
```json
{
  "error": "Error description",
  "errorType": "authorization",
  "correlationId": "abc123de"
}
```

### Future Endpoints (Planned)

These endpoints are planned but not yet implemented:

- `GET /api/admin/stats/pro-users` - Count of Pro users
- `GET /api/admin/stats/api-calls` - Total API call count
- `GET /api/admin/stats/api-errors` - Total API error count

## Implementation Details

### Backend (Azure Functions)

**File**: `api/src/functions/adminStats.ts`

The backend implementation:

1. **Token Validation**: Uses `extractUserInfoFromToken()` to validate the JWT and extract user info
2. **Pro User Check**: Queries ProUsers table to verify user has Pro access
3. **Statistics Query**: Counts entities in UserSettings table with `partitionKey='users'`
4. **Error Handling**: Comprehensive error handling for all scenarios
5. **Logging**: Structured logging with correlation IDs for debugging

**Key Functions:**

- `checkProUserExists()`: Verifies user is in ProUsers table
- `countLoggedInUsers()`: Counts all users in UserSettings table
- `getLoggedInUsersCount()`: Main handler function

### Frontend

**API Client**: `src/utils/api/adminStatsApi.ts`

Provides typed interface for calling the admin API:
- `getLoggedInUsersCount(idToken)`: Fetches the count

**Hook**: `src/hooks/useAdminStats.ts`

React hook that manages state and auto-fetches statistics:
- Automatically fetches when Pro user token is available
- Handles loading, error, and success states
- Prevents duplicate requests
- Resets on logout

**Admin Page**: `src/pages/Admin.tsx`

Displays statistics with:
- Access control (login required → Pro status check → stats display)
- Loading indicators
- Error handling
- Responsive design

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STORAGE_ACCOUNT_NAME` | Azure Storage account name | Yes |
| `AZURE_CLIENT_ID` | Managed identity client ID | Yes (for managed identity) |
| `AZURE_AD_CLIENT_ID` | Azure App Registration client ID | Optional (for JWT validation) |

### Azure Resources Required

1. **Azure Storage Account** with tables:
   - `UserSettings` - Contains all logged-in users
   - `ProUsers` - Contains authorized Pro users

2. **Managed Identity** with roles:
   - `Storage Table Data Contributor` on UserSettings table
   - `Storage Table Data Contributor` on ProUsers table

3. **App Registration** for authentication

## Security Considerations

### Why These Security Measures?

1. **Pro User Requirement**:
   - Prevents unauthorized access to usage statistics
   - Statistics could reveal private information about user base
   - Aligns with privacy-first design of the application

2. **No PII in Responses**:
   - Only aggregated counts returned
   - Individual user data never exposed
   - Email addresses only used internally for Pro user verification

3. **Request Logging**:
   - All admin API calls logged with user ID
   - Correlation IDs enable audit trails
   - Failed authorization attempts logged

4. **Token Validation**:
   - Full JWT signature verification using Microsoft JWKS
   - Audience and issuer validation
   - Expiration checking

### Attack Mitigation

| Threat | Mitigation |
|--------|------------|
| Unauthorized access | Pro user check + JWT validation |
| Token replay | Token expiration + signature verification |
| Data enumeration | Only aggregated counts returned |
| Information disclosure | No PII in responses or logs |
| Rate limiting | Azure Functions built-in protection |

## Error Handling

### Frontend Error Handling

The Admin page handles errors gracefully:

| Scenario | User Experience |
|----------|-----------------|
| Not logged in | Login prompt displayed |
| Not a Pro user | Message explaining Pro access requirement with link to apply |
| API unavailable | Statistics show "-" with note about availability |
| Network error | Statistics show "-" (silent failure for better UX) |
| Loading | Shows "Loading..." text |

### Backend Error Handling

All errors are properly categorized and logged:

- **401 Unauthorized**: Invalid token or missing email
- **403 Forbidden**: Valid user but not Pro user
- **503 Service Unavailable**: Storage not configured or inaccessible
- **500 Internal Server Error**: Unexpected errors

## Testing

### Unit Tests

Tests should cover:
- API client with various response scenarios
- Hook state management
- Admin page rendering with different auth states

### Manual Testing

To test the admin statistics API:

1. **Non-Pro User Test**:
   - Login as non-Pro user
   - Navigate to `/admin`
   - Should see "Pro User Access Required" message

2. **Pro User Test**:
   - Login as Pro user (email in ProUsers table)
   - Navigate to `/admin`
   - Should see statistics with actual count

3. **Error Scenarios**:
   - Test with invalid token
   - Test with expired token
   - Test with storage unavailable

### Local Development Testing

1. Start Azure Functions locally:
   ```bash
   cd api
   npm start
   ```

2. Configure frontend proxy in `vite.config.ts`

3. Add test Pro user to local ProUsers table:
   ```bash
   # Use deployment scripts or Azure Storage Explorer
   ```

4. Test the Admin page at `http://localhost:5173/admin`

## Monitoring

### Metrics to Track

- Count of logged-in users (this API)
- API call frequency
- Error rates
- Response times
- Failed authorization attempts

### Logs

All requests include:
- Correlation ID
- User ID (for authenticated requests)
- Timestamp
- Duration
- Status code
- Error details (if any)

Example log entry:
```
[abc123de] GET /api/admin/stats/logged-in-users - Request completed successfully (200) in 125ms
{
  correlationId: "abc123de",
  method: "GET",
  path: "/api/admin/stats/logged-in-users",
  statusCode: 200,
  durationMs: 125,
  userId: "user-guid",
  count: 42
}
```

## Future Enhancements

### Planned Features

1. **Additional Statistics**:
   - Pro users count
   - API calls and errors count
   - Active users (logged in within last 30 days)

2. **Time-Series Data**:
   - Daily/weekly/monthly trends
   - Growth metrics
   - Usage patterns

3. **Advanced Analytics**:
   - User retention metrics
   - Feature usage statistics
   - Geographic distribution (if privacy-compliant)

4. **Real-Time Updates**:
   - WebSocket or polling for live statistics
   - Automatic refresh on Admin page

5. **Export Capabilities**:
   - CSV export for analysis
   - Dashboard integrations

### Security Enhancements

1. **Rate Limiting**: Per-user rate limits on admin endpoints
2. **Audit Logs**: Separate audit log table for admin actions
3. **Role-Based Access**: Different levels of admin access (viewer, analyst, etc.)
4. **IP Allowlisting**: Optional IP restrictions for admin endpoints

## References

- [Azure Functions Security](https://learn.microsoft.com/en-us/azure/azure-functions/security-concepts)
- [Azure Table Storage Access Control](https://learn.microsoft.com/en-us/azure/storage/common/authorize-data-access)
- [JWT Token Validation](https://learn.microsoft.com/en-us/azure/active-directory/develop/id-tokens)
- [Privacy by Design Principles](https://en.wikipedia.org/wiki/Privacy_by_design)
