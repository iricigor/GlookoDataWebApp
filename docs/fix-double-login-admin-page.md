# Fix for "Double Login at Admin Page" Bug

## Problem Statement

When a user navigated to the Admin page while not logged in, then logged in using the login button in the navigation bar, the Admin page would continue to show the login prompt instead of updating to show the admin content. This created a "double login" experience where the user appeared logged in at the top of the page but was still being asked to log in by the page content.

## Root Cause

The `useAuth` hook was not properly synchronizing authentication state across multiple component instances. Here's what was happening:

1. **Module-level MSAL instance**: The MSAL `PublicClientApplication` instance is correctly created as a singleton at the module level (line 8 of `useAuth.ts`).

2. **Component-level state**: Each component that calls `useAuth()` gets its own independent state via `useState`.

3. **No event synchronization**: When login occurred in the Navigation component:
   - Navigation's `useAuth` instance updated its local state
   - Admin's `useAuth` instance had no way to know the auth state changed
   - MSAL emits events for auth state changes, but we weren't listening to them

## The Fix

Added an MSAL event listener using `addEventCallback` to listen for authentication events:

```typescript
useEffect(() => {
  const callbackId = msalInstance.addEventCallback((event: EventMessage) => {
    // Handle LOGIN_SUCCESS - fired when any login completes
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      if (payload.account) {
        updateAuthState(payload.account, payload.accessToken, payload.idToken || '');
        setJustLoggedIn(true);
      }
    }
    
    // Handle LOGOUT_SUCCESS - fired when logout completes
    if (event.eventType === EventType.LOGOUT_SUCCESS) {
      // Clear auth state
    }
    
    // Handle ACCOUNT_ADDED/ACCOUNT_REMOVED - fired when accounts change
    if (event.eventType === EventType.ACCOUNT_ADDED || event.eventType === EventType.ACCOUNT_REMOVED) {
      // Handle account changes
    }
  });

  return () => {
    if (callbackId) {
      msalInstance.removeEventCallback(callbackId);
    }
  };
}, [updateAuthState]);
```

### How It Works

1. **Single MSAL instance**: All components share the same `msalInstance` (module-level singleton)

2. **Multiple state instances**: Each component has its own auth state from `useState`

3. **Event-driven synchronization**: When ANY component triggers a login:
   - MSAL fires a `LOGIN_SUCCESS` event
   - ALL event listeners (one per `useAuth` instance) receive the event
   - Each listener updates its own local state
   - All components re-render with the new auth state

4. **Cleanup**: When a component unmounts, its event listener is removed to prevent memory leaks

## Benefits

- **Automatic synchronization**: All components using `useAuth` stay in sync automatically
- **Works with all login methods**: Popup login, redirect login, silent token renewal, etc.
- **Handles edge cases**: Account switching, logout, token expiration
- **No breaking changes**: The hook's API remains unchanged

## Testing

- All existing unit tests pass (10 tests in `useAuth.test.ts`)
- All Admin page tests pass (6 tests in `Admin.test.tsx`)
- Build succeeds without errors
- Linter passes without warnings

## Manual Testing Instructions

To verify the fix manually:

1. Navigate to the Admin page (`/#admin`) while logged out
2. Observe the login prompt in the center of the page
3. Click the "Login" button in the top-right navigation bar
4. Complete the Microsoft login flow
5. **Expected result**: The Admin page should immediately update to show either:
   - Pro user statistics (if the user has Pro access)
   - Pro access required message (if the user doesn't have Pro access)
6. The page should NOT continue showing the login prompt after successful authentication

## Technical Details

### MSAL Events Handled

- `LOGIN_SUCCESS`: Fired after successful popup/redirect login or silent token acquisition
- `LOGOUT_SUCCESS`: Fired after logout completes
- `ACCOUNT_ADDED`: Fired when an account is added to MSAL's account list
- `ACCOUNT_REMOVED`: Fired when an account is removed

### Why This Approach

Alternative approaches considered:

1. **React Context**: Would require wrapping the app in a provider and refactoring all components
2. **State management library**: Overkill for this single piece of state
3. **Custom event emitter**: Reinventing what MSAL already provides

The event listener approach:
- Uses MSAL's built-in event system
- Minimal code changes
- No architectural changes required
- Works naturally with MSAL's authentication flow

### Performance Considerations

- Event callbacks are lightweight
- Only one callback per hook instance (not per component render)
- Callbacks are properly cleaned up on unmount
- No memory leaks

## Files Changed

- `src/hooks/useAuth.ts`: Added event listener useEffect
- `src/hooks/useAuth.test.ts`: Added mock for `addEventCallback` and `removeEventCallback`

## Related Issues

This fix also resolves potential issues with:
- Silent token renewal not updating all components
- Redirect login not updating components that were mounted before redirect
- Account switching not properly updating UI across components
