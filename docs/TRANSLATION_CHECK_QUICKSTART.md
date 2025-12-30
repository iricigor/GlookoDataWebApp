# Translation Check Quick Start

## For Contributors

### ✨ Good News: Minimal Translation Requirements!

When adding new user-facing text, you have flexibility:

- **Preferred:** Use i18next with English translation only
- **Acceptable:** Leave hardcoded text in your code
- **Optional:** Add placeholder markers for other languages

Maintainers will handle translations and convert hardcoded text before merging.

### Quick Example - Option 1: Using i18next (Preferred)

```typescript
// 1. Add English translation
// public/locales/en/myFeature.json
{
  "myButton": "Click Here"
}

// 2. Add placeholders for other languages (OPTIONAL)
// public/locales/de/myFeature.json
{
  "myButton": "[DE] Click Here"
}

// 3. Use in your component
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('myFeature');
  return <Button>{t('myButton')}</Button>;
}
```

### Quick Example - Option 2: Hardcoded Text (Acceptable)

```typescript
// Just write your code with hardcoded text
export function MyComponent() {
  return <Button>Click Here</Button>;
}

// Maintainers will convert this to i18next before merging
```

### Running Checks Locally

```bash
# Check for incomplete translations
npm run i18n:check-placeholders

# Check for hardcoded strings (informational)
npm run i18n:check-hardcoded

# Run all translation checks
npm run i18n:check-all
```

## For Maintainers

### Completing Translations

1. **Find placeholders:**
   ```bash
   npm run i18n:check-placeholders
   ```

2. **Replace placeholders with actual translations:**
   ```json
   // Before
   { "myButton": "[DE] Click Here" }
   
   // After
   { "myButton": "Hier klicken" }
   ```

3. **Verify completeness:**
   ```bash
   npm run i18n:check-all
   npm test -- src/i18n-completeness.test.ts
   ```

## Automated Checks

### Nightly Workflow
- **Schedule:** 02:30 UTC every night
- **Checks:** Translation completeness, placeholders, hardcoded strings
- **Location:** `.github/workflows/translation-check.yml`

### On Pull Requests
The workflow also runs on PRs that modify:
- Translation files (`public/locales/**`)
- Source files (`src/**/*.tsx`, `src/**/*.ts`)

### Manual Trigger
You can manually trigger the workflow from GitHub Actions UI.

## Exit Codes

| Check | Exit Code | Behavior |
|-------|-----------|----------|
| `i18n:check-placeholders` | 0 = clean, 1 = found | **Blocking** |
| `i18n:check-hardcoded` | Always 0 | **Warning only** |
| `i18n:check-all` | Always 0 | Runs both, warns if issues |

## What Gets Checked

### ✅ Translation Completeness (always runs)
- All keys exist in all languages
- No missing keys
- No empty values
- Interpolation variables preserved
- HTML tags preserved

### ✅ Placeholder Detection (blocking)
Detects markers like:
- `[DE]` - Needs German translation
- `[CS]` - Needs Czech translation  
- `[EN]` - Needs English translation

### ⚠️ Hardcoded String Detection (warning)
Looks for potential hardcoded UI text that should use i18n:
- JSX text content
- String literals in JSX attributes
- Smart filtering to reduce false positives

## Common Issues

### "Missing keys in translation"
**Solution:** Add the key to all language files

### "Found untranslated placeholders"
**Solution:** Replace `[XX]` with actual translations

### "Potential hardcoded strings"
**Solution:** Review and convert to i18n if they're user-facing

## More Information

- **Full Documentation:** [docs/translation-checks.md](translation-checks.md)
- **Contributing Guide:** [CONTRIBUTING.md](../CONTRIBUTING.md#-localization-and-i18next)
- **Localization Summary:** [summaries/LOCALIZATION_SUMMARY.md](summaries/LOCALIZATION_SUMMARY.md)

## Support

Questions? Open an issue with the `i18n` label!
