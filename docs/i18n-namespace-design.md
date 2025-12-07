# i18next Namespace Segmentation Design

## Overview

This document describes the namespace segmentation strategy for the GlookoDataWebApp i18next implementation. Namespace segmentation splits the monolithic `translation.json` file into smaller, functionally-scoped files to prevent merge conflicts and improve maintainability.

## Namespace Structure

### Proposed Namespaces

Based on analysis of the current translation structure, we propose the following namespace organization:

| Namespace | Description | Source Keys | Size | Use Cases |
|-----------|-------------|-------------|------|-----------|
| `common` | Shared UI elements, buttons, actions | `common`, `appTitle`, `brandName`, `brandAltText`, `footer` | ~255 chars | Used across all components |
| `navigation` | Navigation menu and related elements | `navigation` | ~444 chars | Header, navigation components |
| `home` | Home page content | `home` | ~675 chars | Home page |
| `dataUpload` | Data upload page and related features | `dataUpload` | ~3874 chars | Data upload page, file list, upload guide |
| `dialogs` | All dialog components | `loginDialog`, `logoutDialog`, `welcomeDialog`, `cookieConsent`, `infrastructureErrorDialog` | ~2362 chars | Various dialog components |
| `notifications` | Toast and notification messages | `toast` | ~269 chars | Toast notifications |

### Rationale

1. **`common`**: Most frequently used, shared across all pages - should rarely change
2. **`navigation`**: Self-contained navigation-related strings
3. **`home`**: Home page is a distinct feature area
4. **`dataUpload`**: Largest section (3.8KB), most likely to have concurrent development
5. **`dialogs`**: Groups all dialog-related translations together
6. **`notifications`**: Separate notification messages from other UI elements

### Future Namespace Expansion

As the application grows, additional namespaces can be added:
- `reports` - For reports page translations
- `aiAnalysis` - For AI analysis page translations
- `settings` - For settings page translations
- `errors` - For error messages
- `validation` - For form validation messages

## File Structure

### Current Structure
```
public/locales/
├── en/
│   └── translation.json
├── de/
│   └── translation.json
└── cs/
    └── translation.json
```

### New Structure
```
public/locales/
├── en/
│   ├── common.json
│   ├── navigation.json
│   ├── home.json
│   ├── dataUpload.json
│   ├── dialogs.json
│   └── notifications.json
├── de/
│   ├── common.json
│   ├── navigation.json
│   ├── home.json
│   ├── dataUpload.json
│   ├── dialogs.json
│   └── notifications.json
└── cs/
    ├── common.json
    ├── navigation.json
    ├── home.json
    ├── dataUpload.json
    ├── dialogs.json
    └── notifications.json
```

## Key Mapping

### common.json
- `common` (all keys)
- `appTitle`
- `brandName`
- `brandAltText`
- `footer` (all keys)

### navigation.json
- `navigation` (all keys)

### home.json
- `home` (all keys)

### dataUpload.json
- `dataUpload` (all keys)

### dialogs.json
- `cookieConsent` (all keys)
- `loginDialog` (all keys)
- `logoutDialog` (all keys)
- `welcomeDialog` (all keys)
- `infrastructureErrorDialog` (all keys)

### notifications.json
- `toast` (all keys)

## Usage Examples

### Common Namespace (Default)
```typescript
// Auto-loaded as default namespace
const { t } = useTranslation();
const title = t('appTitle'); // "Glooko Data Web App"
const saveButton = t('common.save'); // "Save"
```

### Specific Namespace
```typescript
// Load specific namespace
const { t } = useTranslation('dataUpload');
const title = t('title'); // "Data Upload"
const prompt = t('uploadZone.dropFilesPrompt'); // "Drop ZIP files here..."
```

### Multiple Namespaces
```typescript
// Load multiple namespaces
const { t } = useTranslation(['common', 'dialogs']);
const cancel = t('common.cancel'); // "Cancel"
const loginTitle = t('dialogs.loginDialog.title'); // "Login with Microsoft"
```

### Cross-namespace Translation
```typescript
// Use namespace prefix
const { t } = useTranslation('dataUpload');
const cancel = t('common:common.cancel'); // Access common namespace
```

## Implementation Strategy

### Phase 1: Infrastructure Setup
1. Create new namespace files for all languages
2. Update i18n.ts configuration
3. Update test infrastructure

### Phase 2: Migration (Backward Compatible)
- Keep original translation.json files temporarily
- Update i18n config to load both old and new namespaces
- Components continue working without changes

### Phase 3: Component Updates
- Update components to use specific namespaces where beneficial
- Remove namespace prefixes where appropriate

### Phase 4: Cleanup
- Remove old translation.json files
- Final validation and testing

## Benefits

1. **Reduced Merge Conflicts**: Multiple developers can work on different features without conflicts
2. **Faster Load Times**: Load only necessary namespaces per page/component
3. **Better Organization**: Clear separation of concerns
4. **Easier Maintenance**: Smaller files are easier to navigate and update
5. **Scalability**: Easy to add new namespaces as the app grows

## Migration Notes

- Backward compatibility maintained during migration
- No breaking changes to existing components
- Tests updated to validate all namespaces
- Documentation updated with new namespace guidelines
