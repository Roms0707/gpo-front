# Translation Verification Script

## Overview

The `check-translations.cjs` script ensures synchronization between English (EN) and French (FR) translation files. It identifies missing keys, empty values, and potential translation issues.

## Usage

Run the script from the project root:

```bash
npm run check-translations
```

## What It Checks

### 1. Missing Keys
- **Missing in FR**: Keys that exist in `en.json` but not in `fr.json`
- **Extra in FR**: Keys that exist in `fr.json` but not in `en.json`

### 2. Empty Values
- Keys with empty strings, null, or undefined values
- Checked in both EN and FR files

### 3. Potentially Untranslated Strings
- Keys where EN and FR values are identical
- Helps identify strings that may have been copied without translation
- Excludes short values (≤3 characters) and interpolation keys

## Exit Codes

- **0**: Success (no errors, may have warnings)
- **1**: Failure (missing keys found)

## Output Format

The script provides a color-coded report:

- 🔴 **Red (Errors)**: Missing keys in French - must be fixed
- 🟡 **Yellow (Warnings)**: Extra keys, empty values, or potentially untranslated strings
- 🟢 **Green (Success)**: All translations synchronized

## Example Output

```
================================================================================
Translation Verification Report
================================================================================

Loading translation files...
  EN: /path/to/en.json
  FR: /path/to/fr.json

✓ Translation files loaded successfully
  EN keys: 554
  FR keys: 554

❌ Missing Keys in French (3)
------------------------------------------------------------
The following keys exist in EN but are missing in FR:

  [profile]
    ✗ profile.newFeature
      EN value: "New Feature"

⚠️  Potentially Untranslated Strings (56)
------------------------------------------------------------
The following keys have identical values in EN and FR:

  ! auth.email
    Value: "Email"

📊 Summary
------------------------------------------------------------
Total EN keys:          554
Total FR keys:          551
Common keys:            551
Missing in FR:          3
Extra in FR:            0
Empty values (EN):      0
Empty values (FR):      0
Potentially untranslated: 56

================================================================================
✗ Translation synchronization issues found!
Please fix the missing keys before deploying.
```

## Integration with CI/CD

You can add this script to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Check translations
  run: npm run check-translations
```

This ensures all translations are synchronized before deployment.

## Common Issues

### Issue: "Potentially untranslated" warnings for proper nouns

**Solution**: These are often expected for:
- Brand names (e.g., "Riot ID", "Steam ID")
- International terms (e.g., "Email", "Messages")
- Technical terms (e.g., "K/D/A", "Bracket")
- Format strings (e.g., "({{current}} / {{total}})")

These warnings are informational and don't fail the build.

### Issue: Missing keys after adding new features

**Solution**:
1. Add the English translation first
2. Run `npm run check-translations`
3. Add the corresponding French translations
4. Verify with `npm run check-translations` again

## Script Features

- ✅ Flattens nested JSON structures
- ✅ Detects missing keys in either language
- ✅ Identifies empty/null values
- ✅ Finds potential copy-paste errors
- ✅ Groups issues by section for easier fixing
- ✅ Color-coded terminal output
- ✅ Detailed summary statistics
- ✅ Non-zero exit code on errors (CI/CD friendly)

## File Structure

```
src/locales/
├── en.json          # English translations (source of truth)
├── fr.json          # French translations
└── i18n.ts          # i18next configuration

scripts/
├── check-translations.cjs  # Verification script
└── README.md               # This file
```

## Maintenance

Run this script:
- Before committing new translations
- Before deploying to production
- In CI/CD pipeline
- After adding new features with user-facing text

## Best Practices

1. **Always add EN first**: English is the source of truth
2. **Run the script frequently**: Catch issues early
3. **Fix errors before warnings**: Missing keys are critical
4. **Review warnings**: Ensure proper translations, not copy-paste
5. **Keep translations synchronized**: Don't let them drift apart
