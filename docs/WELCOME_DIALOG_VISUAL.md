# Welcome Dialog Visual Description

This document describes the visual appearance of the Welcome Dialog shown to first-time users.

## Dialog States

The WelcomeDialog component has three distinct visual states:

### 1. Loading State (Initial)

When the dialog first appears, it shows a loading state while creating the user's settings:

```
┌────────────────────────────────────────────────┐
│  Welcome to Glooko Data Web App!               │
├────────────────────────────────────────────────┤
│                                                │
│  This is your first time using our             │
│  application with your Microsoft account.      │
│                                                │
│  We are setting up your personal cloud         │
│  storage for application settings.             │
│                                                │
│  ◌ Creating your settings storage...           │
│                                                │
│  Your email address (user@example.com) will be │
│  stored to associate your settings with your   │
│  account.                                      │
│                                                │
└────────────────────────────────────────────────┘
```

**Visual Elements:**
- **Title**: "Welcome to Glooko Data Web App!" (large, bold)
- **Body Text**: Informative messages about setup
- **Spinner**: Rotating loading indicator
- **Status Text**: "Creating your settings storage..."
- **Email Note**: Small text showing user's email
- **No buttons**: User cannot close during loading

### 2. Success State

After successfully creating settings, the dialog shows a success message with countdown:

```
┌────────────────────────────────────────────────┐
│  Welcome to Glooko Data Web App!               │
├────────────────────────────────────────────────┤
│                                                │
│  This is your first time using our             │
│  application with your Microsoft account.      │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │ ✓ Success! Your settings storage has   │   │
│  │   been created successfully.            │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  Your preferences will now be synchronized     │
│  across devices when you sign in.              │
│                                                │
│  This dialog will close automatically in       │
│  8 seconds...                                  │
│                                                │
├────────────────────────────────────────────────┤
│                                    [ Close ]   │
└────────────────────────────────────────────────┘
```

**Visual Elements:**
- **Success Banner**: Green background with checkmark icon
- **Success Text**: "Success! Your settings storage has been created successfully."
- **Info Text**: Explanation of what happens next
- **Countdown**: "This dialog will close automatically in X seconds..."
- **Close Button**: Blue primary button allowing manual close

**Countdown Animation:**
- Starts at 10 seconds
- Decrements every second: 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
- Automatically closes at 0

### 3. Error State

If settings creation fails, the dialog shows an error message:

```
┌────────────────────────────────────────────────┐
│  Welcome to Glooko Data Web App!               │
├────────────────────────────────────────────────┤
│                                                │
│  This is your first time using our             │
│  application with your Microsoft account.      │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │ ✗ Error: Failed to create settings     │   │
│  │   storage. You can try again by logging│   │
│  │   out and back in.                      │   │
│  └────────────────────────────────────────┘   │
│                                                │
├────────────────────────────────────────────────┤
│                                    [ Close ]   │
└────────────────────────────────────────────────┘
```

**Visual Elements:**
- **Error Banner**: Red background with error icon (X)
- **Error Text**: Specific error message with recovery instructions
- **Close Button**: Only way to dismiss the dialog

## Design Specifications

### Colors (Fluent UI Tokens)

- **Title**: `tokens.colorNeutralForeground1` (default text color)
- **Body Text**: `tokens.colorNeutralForeground1` (default text color)
- **Small Text**: `tokens.colorNeutralForeground2` (secondary text color)
- **Success Banner**: `tokens.colorStatusSuccessForeground1` (green)
- **Error Banner**: `tokens.colorStatusDangerForeground1` (red)
- **Button**: `tokens.colorBrandForeground1` (brand blue)

### Typography

- **Dialog Title**: Large, bold font (Fluent UI DialogTitle)
- **Body Text**: Standard size, regular weight
- **Email Text**: Smaller size (tokens.fontSizeBase300)
- **Countdown Text**: Smaller, secondary color

### Spacing

- **Content Gap**: 16px between elements
- **Message Container**: 12px internal spacing
- **Padding**: 24px around dialog body

### Interactions

1. **Loading State**
   - No user interaction possible
   - Spinner indicates ongoing process
   - User must wait for completion

2. **Success State**
   - Countdown timer updates every second
   - "Close" button clickable at any time
   - Auto-close at countdown completion
   - Clicking "Close" stops countdown and closes immediately

3. **Error State**
   - "Close" button is only interaction
   - No auto-close (user must manually close)
   - Can log out and retry as suggested

### Accessibility

- **Modal Type**: Alert - prevents interaction with underlying content
- **Keyboard Navigation**: Escape key doesn't close during loading
- **Screen Reader**: All text content is accessible
- **Focus Management**: Close button receives focus when enabled
- **ARIA**: Proper roles and labels for all interactive elements

## User Experience Flow

```
User logs in for first time
        ↓
Dialog appears (Loading State)
        ↓
[2-3 seconds - creating settings]
        ↓
Success state appears
        ↓
Countdown: 10... 9... 8... 7... 6... 5... 4... 3... 2... 1...
        ↓
← User can click "Close" anytime
        ↓
Dialog closes
        ↓
User continues to application
```

## Responsive Design

The dialog is responsive and adapts to different screen sizes:

- **Desktop**: Standard dialog size (~500px width)
- **Tablet**: Scales appropriately
- **Mobile**: Full-width with adjusted padding

All text remains readable, and the close button remains accessible on all screen sizes.

## Component Hierarchy

```
Dialog (Fluent UI)
└── DialogSurface
    └── DialogBody
        ├── DialogTitle
        │   └── "Welcome to Glooko Data Web App!"
        ├── DialogContent
        │   └── Message Container
        │       ├── Welcome Text
        │       ├── Status Message (Loading/Success/Error)
        │       ├── Info Text
        │       └── Countdown Text (if success)
        └── DialogActions
            └── Close Button (if success or error)
```

## Integration Notes

The dialog:
- Renders as a modal overlay (blocks background interaction)
- Appears automatically when triggered by `useWelcomeDialog` hook
- Does NOT appear on subsequent logins for the same user
- Only shows when user email is available
- Positioned center of screen
- Z-index handled by Fluent UI Dialog component

## Example Usage in Code

```typescript
<WelcomeDialog
  open={showWelcomeDialog}
  userEmail="user@example.com"
  onClose={closeWelcomeDialog}
  onCreateSettings={createUserSettings}
/>
```

When `open={true}`, the dialog will:
1. Automatically call `createUserSettings()`
2. Show appropriate state based on result
3. Handle countdown and auto-close
4. Call `onClose()` when closed
