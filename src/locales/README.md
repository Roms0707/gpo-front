# Internationalization (i18n) System

This project uses **react-i18next** for internationalization, enabling support for multiple languages across the entire application.

## Overview

The i18n system is fully integrated with the existing `LocaleContext`, allowing for seamless language switching based on country/region configuration or manual user preference.

## Available Languages

- **French (fr)** - Default language
- **English (en)** - Secondary language

## Directory Structure

```
src/locales/
├── i18n.ts          # i18n configuration
├── fr.json          # French translations
├── en.json          # English translations
└── README.md        # This file
```

## Translation Files Structure

The translation JSON files are organized hierarchically:

- `common` - Common UI elements (buttons, actions, status)
- `auth` - Authentication related texts
- `validation` - Form validation messages
- `errors` - Error messages
- `navigation` - Navigation labels and menu items
- `header` - Header component texts
- `footer` - Footer component texts
- `home` - Home page specific texts
- `tournament` - Tournament related texts
- `profile` - Profile page texts
- `friends` - Friends feature texts
- `messages` - Messaging texts
- `notifications` - Notification texts
- `leaderboards` - Leaderboard texts
- `support` - Support/help texts
- `games` - Game related texts
- `communities` - Community texts
- `chat` - Chat feature texts
- `forms` - Form labels and placeholders
- `status` - Status labels
- `dates` - Date/time related texts
- `actions` - Action buttons and labels
- `gaming` - Gaming accounts and stats
- `errors404` - 404 page texts
- `errorBoundary` - Error boundary texts

## How to Use Translations in Components

### 1. Import the `useTranslation` hook

```typescript
import { useTranslation } from 'react-i18next';
```

### 2. Use the hook in your component

```typescript
const MyComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.loading')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

### 3. Using translations with interpolation

For dynamic values, use interpolation:

```typescript
// Translation key in JSON: "welcome": "Welcome, {{username}}!"
<p>{t('home.welcome', { username: user.name })}</p>

// With count for pluralization
// Translation keys: "items": "{{count}} item", "items_plural": "{{count}} items"
<p>{t('home.items', { count: items.length })}</p>
```

### 4. Using translations with HTML

```typescript
// Use dangerouslySetInnerHTML only when necessary
<div dangerouslySetInnerHTML={{ __html: t('home.richText') }} />
```

## Language Switching

### Automatic Language Detection

The system automatically detects the user's language based on:
1. Country configuration from `LocaleContext`
2. Browser language settings
3. Falls back to French (default)

### Manual Language Change

```typescript
import { useLocale } from '../contexts/LocaleContext';

const MyComponent: React.FC = () => {
  const { changeLanguage, currentLanguage } = useLocale();

  const handleLanguageChange = async (lang: 'fr' | 'en') => {
    await changeLanguage(lang);
  };

  return (
    <button onClick={() => handleLanguageChange('en')}>
      Switch to English
    </button>
  );
};
```

## Adding New Translation Keys

### 1. Add the key to both language files

**fr.json:**
```json
{
  "mySection": {
    "myNewKey": "Mon nouveau texte"
  }
}
```

**en.json:**
```json
{
  "mySection": {
    "myNewKey": "My new text"
  }
}
```

### 2. Use the key in your component

```typescript
<p>{t('mySection.myNewKey')}</p>
```

## Best Practices

### 1. Naming Conventions

- Use descriptive, hierarchical keys: `section.subsection.element`
- Keep keys lowercase with camelCase for better readability
- Group related translations under the same section

**Good:**
```json
{
  "profile": {
    "editButton": "Edit Profile",
    "saveButton": "Save Changes"
  }
}
```

**Bad:**
```json
{
  "EDIT_PROFILE_BTN": "Edit Profile",
  "profile_save": "Save Changes"
}
```

### 2. Avoid Hardcoded Text

Always use translation keys instead of hardcoded strings:

**Bad:**
```typescript
<button>Save</button>
```

**Good:**
```typescript
<button>{t('common.save')}</button>
```

### 3. Handle Pluralization

Use the `_plural` suffix for plural forms:

```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

```typescript
<p>{t('items', { count: items.length })}</p>
```

### 4. Keep Translations Consistent

- Reuse common translations from the `common` section
- Maintain consistent terminology across the application
- Review existing keys before creating new ones

### 5. Context Matters

Provide enough context in translation keys to understand their usage:

**Good:**
```json
{
  "tournament": {
    "registerButton": "Register",
    "registrationSuccess": "Successfully registered for tournament"
  }
}
```

**Bad:**
```json
{
  "button": "Register",
  "success": "Success"
}
```

## Testing Translations

### Check for Missing Keys

If a translation key is missing, the key itself will be displayed (e.g., `home.missingKey`).

### Switch Languages During Development

Use browser console to quickly test language switching:

```javascript
// In browser console
window.localStorage.setItem('userLanguagePreference', 'en');
location.reload();
```

## Extracting Hardcoded Text

To find hardcoded text that needs translation:

1. Search for strings in JSX: Look for patterns like `>Text<` or `"Text"`
2. Look for:
   - Button labels
   - Error messages
   - Form labels and placeholders
   - Page titles and headings
   - Status messages
   - Toast notifications
3. Replace with `{t('section.key')}`

## Integration with LocaleContext

The translation system is integrated with the existing `LocaleContext`:

- Language automatically changes based on country configuration
- Manual language changes are persisted in localStorage
- The `currentLanguage` state is available from `useLocale()`

## Example: Complete Component with Translations

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../contexts/LocaleContext';

const WelcomeComponent: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLocale();

  return (
    <div>
      <h1>{t('home.heroTitle')}</h1>
      <p>{t('home.heroSubtitle')}</p>

      <div>
        <button
          onClick={() => changeLanguage('fr')}
          disabled={currentLanguage === 'fr'}
        >
          Français
        </button>
        <button
          onClick={() => changeLanguage('en')}
          disabled={currentLanguage === 'en'}
        >
          English
        </button>
      </div>

      <p>{t('home.activeTournaments', { count: 5 })}</p>
      <button>{t('common.viewMore')}</button>
    </div>
  );
};

export default WelcomeComponent;
```

## Troubleshooting

### Translations not loading

- Check that i18n is imported in `main.tsx`
- Verify JSON files have valid syntax
- Check browser console for errors

### Wrong language displaying

- Clear localStorage: `localStorage.removeItem('userLanguagePreference')`
- Check `LocaleContext` configuration
- Verify country-to-language mapping in `translationService.ts`

### Missing translations

- Ensure the key exists in both `fr.json` and `en.json`
- Check for typos in translation keys
- Verify the translation file is properly imported

## Future Enhancements

- Add more languages (Arabic, Spanish, etc.)
- Implement language-specific number and date formatting
- Add translation management UI for non-developers
- Create automated translation coverage reports
