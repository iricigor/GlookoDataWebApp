# Translation Checks Documentation

## Overview

The GlookoDataWebApp includes automated translation checks to ensure high-quality internationalization across all supported languages (English, German, Czech).

## Automated Checks

### 1. Translation Completeness Tests

**What it checks:**
- All translation keys exist across all languages
- No missing keys in any language
- No extra keys that shouldn't be there
- No empty translation values
- Interpolation variables (e.g., `{{variable}}`) are preserved
- HTML tags are preserved across translations

**When it runs:**
- On every PR that changes translation files
- As part of the nightly translation check workflow

**How to run manually:**
```bash
npm test -- src/i18n-completeness.test.ts
```

**Exit behavior:** Fails if any issues are found (blocking)

---

### 2. Placeholder Detection

**What it checks:**
- Detects placeholder markers like `[DE]`, `[CS]`, `[EN]` in translation files
- These markers indicate incomplete translations

**When it runs:**
- Nightly at 02:30 UTC
- On PRs that modify translation files
- Can be triggered manually via workflow_dispatch

**How to run manually:**
```bash
npm run i18n:check-placeholders
```

**Exit behavior:** Fails if placeholders are found (blocking in CI)

**Example placeholder:**
```json
{
  "myFeature": {
    "title": "[DE] My Feature Title"
  }
}
```

---

### 3. Hardcoded String Detection

**What it checks:**
- Scans source code for potential hardcoded user-facing strings
- Looks for JSX text content and string literals in JSX attributes
- Excludes technical strings, constants, URLs, etc.

**When it runs:**
- Nightly at 02:30 UTC
- On PRs that modify source files
- Can be triggered manually via workflow_dispatch

**How to run manually:**
```bash
npm run i18n:check-hardcoded
```

**Exit behavior:** Warning only (non-blocking) - reports findings but doesn't fail

**Note:** This is a heuristic check and may produce false positives. Manual review is recommended.

---

## Workflow: Nightly Translation Check

**Schedule:** Runs every night at 02:30 UTC

**Triggers:**
- Scheduled (cron)
- Manual trigger (workflow_dispatch)
- Pull requests affecting:
  - Translation files (`public/locales/**`)
  - Source files (`src/**/*.tsx`, `src/**/*.ts`)
  - Check scripts (`scripts/check-*.ts`)

**What it does:**
1. Runs translation completeness tests
2. Checks for placeholder markers
3. Scans for hardcoded strings
4. Generates a summary report
5. Uploads results as artifacts

**Artifacts:**
- Translation check results (retained for 30 days)

---

## For Contributors

### Adding New Translations

**You are NOT required to provide translations for all languages!**

**You can even leave hardcoded text in your contributions!**

When adding new user-facing text, you have flexibility:

**Option 1: Use i18next (Preferred)**

1. **Add English translation**
   ```json
   // public/locales/en/navigation.json
   {
     "navigation": {
       "myNewButton": "My New Feature"
     }
   }
   ```

2. **Add placeholders for other languages** (optional)
   ```json
   // public/locales/de/navigation.json
   {
     "navigation": {
       "myNewButton": "[DE] My New Feature"
     }
   }
   ```

3. **Use the translation in your component**
   ```tsx
   import { useTranslation } from 'react-i18next';
   
   export function MyComponent() {
     const { t } = useTranslation('navigation');
     return <Button>{t('navigation.myNewButton')}</Button>;
   }
   ```

**Option 2: Leave Hardcoded Text (Acceptable)**

Simply write your code with hardcoded strings:

```tsx
export function MyComponent() {
  return <Button>My New Feature</Button>;
}
```

The automated check will flag hardcoded strings for maintainers to convert to i18next.

**Maintainers will complete the translations and convert hardcoded text before merging.**

### Using Placeholder Markers

When you can't provide a complete translation, use placeholder markers:

- `[DE]` - Needs German translation
- `[CS]` - Needs Czech translation
- `[EN]` - Needs English translation (rare)

**Format:**
```json
{
  "key": "[LANG] English text here"
}
```

The automated nightly check will detect these and notify maintainers.

---

## For Maintainers

### Completing Translations

1. **Check for placeholder markers:**
   ```bash
   npm run i18n:check-placeholders
   ```

2. **Translate the text** or use a translation service

3. **Replace placeholder with actual translation:**
   ```json
   // Before
   "myButton": "[DE] Save Changes"
   
   // After
   "myButton": "Änderungen speichern"
   ```

4. **Verify completeness:**
   ```bash
   npm run i18n:check-all
   npm test -- src/i18n-completeness.test.ts
   ```

### Reviewing Hardcoded Strings

The hardcoded string checker provides warnings for potential issues:

1. **Run the check:**
   ```bash
   npm run i18n:check-hardcoded
   ```

2. **Review reported strings** - Some may be false positives

3. **For actual hardcoded strings:**
   - Add translation to appropriate namespace
   - Replace with `t()` function call
   - Test in multiple languages

---

## Scripts Reference

### Available Commands

| Command | Description | Exit Behavior |
|---------|-------------|---------------|
| `npm test -- src/i18n-completeness.test.ts` | Run translation completeness tests | Blocking |
| `npm run i18n:check-placeholders` | Check for placeholder markers | Blocking |
| `npm run i18n:check-hardcoded` | Detect hardcoded strings | Warning |
| `npm run i18n:check-all` | Run all translation checks | Mixed |

### Script Files

- `scripts/check-translation-placeholders.ts` - Placeholder detection
- `scripts/check-hardcoded-strings.ts` - Hardcoded string detection
- `src/i18n-completeness.test.ts` - Translation completeness tests

---

## CI/CD Integration

### Pull Request Checks

When a PR modifies translation files or source code:
1. Translation completeness tests run
2. Placeholder detection runs
3. Hardcoded string detection runs (warning only)

**PR will be blocked if:**
- Translation keys are missing across languages
- Placeholder markers are found in translations

**PR will show warnings for:**
- Potential hardcoded strings (informational)

### Nightly Monitoring

The nightly workflow provides ongoing monitoring:
- Catches issues that might have been missed
- Generates historical reports
- Helps maintain translation quality over time

---

## Best Practices

### For All Contributors

1. ✅ **Prefer `t()` function** for user-facing text (but hardcoded text is acceptable)
2. ✅ **Add English translations** if using i18n
3. ✅ **Use placeholders** if you can't translate other languages
4. ✅ **Test in multiple languages** when possible
5. ℹ️ **Hardcoded strings are acceptable** - Maintainers will convert them to i18n

### For Translators

1. ✅ **Preserve interpolation variables** (e.g., `{{count}}`)
2. ✅ **Preserve HTML tags** structure
3. ✅ **Maintain the same meaning** as English text
4. ✅ **Keep similar text length** when possible
5. ✅ **Test translated text** in the UI

---

## Troubleshooting

### "Missing keys in translation" error

**Cause:** A translation key exists in one language but not in others.

**Fix:**
1. Identify the missing key from the error message
2. Add the key to all language files with appropriate translations
3. Use placeholder markers if translation is not ready

### "Extra keys in translation" error

**Cause:** A translation key exists in one language but not in English.

**Fix:**
1. Remove the extra key from non-English languages
2. OR add the key to English if it should exist

### "Empty values" error

**Cause:** A translation value is an empty string.

**Fix:**
1. Provide a value for the key
2. OR remove the key entirely if not needed

### Placeholder detection fails

**Cause:** Placeholder markers found in translation files.

**Fix:**
1. Complete the translations
2. OR leave placeholders for maintainers to handle (they will complete before merge)

---

## Future Enhancements

Potential improvements to the translation check system:

1. **Machine translation integration** - Suggest translations via API
2. **Translation coverage reports** - Track percentage translated
3. **Unused key detection** - Find keys that are never used in code
4. **Translation memory** - Reuse similar translations
5. **Context-aware suggestions** - Better translation recommendations
6. **Multi-language testing** - Automated UI testing in all languages

---

## Related Documentation

- [i18next Namespace Design](i18n-namespace-design.md)
- [Localization Formatters](LOCALIZATION_FORMATTERS.md) - Date/number formatting
- [Contributing Guide](../CONTRIBUTING.md) - Localization section

---

## Support

For questions or issues with translation checks:
1. Check this documentation
2. Review existing translation files for examples
3. Open a GitHub issue with the `i18n` label
4. Ask in project discussions
