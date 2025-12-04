# i18n Quick Reference Guide

## 🚀 Quick Start

### 1. Import and Use
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <div>{t('section.key')}</div>;
};
```

### 2. Common Patterns

#### Simple Text
```typescript
<button>{t('common.save')}</button>
<h1>{t('home.heroTitle')}</h1>
```

#### With Variables
```typescript
<p>{t('home.welcome', { username: user.name })}</p>
<span>{t('tournament.participants', { count: 42 })}</span>
```

#### Pluralization
```typescript
// Translation: "items": "{{count}} item", "items_plural": "{{count}} items"
<p>{t('items', { count: items.length })}</p>
```

## 📋 Most Used Keys

### Common Actions
```typescript
t('common.save')          // Enregistrer / Save
t('common.cancel')        // Annuler / Cancel
t('common.delete')        // Supprimer / Delete
t('common.edit')          // Modifier / Edit
t('common.close')         // Fermer / Close
t('common.loading')       // Chargement... / Loading...
t('common.search')        // Rechercher / Search
t('common.filter')        // Filtrer / Filter
```

### Authentication
```typescript
t('auth.login')           // Connexion / Log In
t('auth.logout')          // Déconnexion / Log Out
t('auth.signup')          // S'inscrire / Sign Up
t('auth.email')           // Email / Email
t('auth.password')        // Mot de passe / Password
t('auth.username')        // Nom d'utilisateur / Username
```

### Forms
```typescript
t('forms.emailPlaceholder')        // votre@email.com / your@email.com
t('forms.passwordPlaceholder')     // •••••••• / ••••••••
t('forms.searchPlaceholder')       // Rechercher... / Search...
```

### Errors
```typescript
t('errors.generic')               // Une erreur s'est produite
t('errors.loadingError')          // Erreur lors du chargement
t('errors.networkError')          // Erreur de connexion réseau
t('validation.required')          // Ce champ est requis
t('validation.invalidEmail')      // Adresse email invalide
```

### Navigation
```typescript
t('navigation.home')              // Accueil / Home
t('navigation.tournaments')       // Tournois / Tournaments
t('navigation.profile')           // Profil / Profile
t('navigation.friends')           // Amis / Friends
t('navigation.leaderboards')      // Classements / Leaderboards
```

## 🔄 Language Switching

### Get Current Language
```typescript
import { useLocale } from '../contexts/LocaleContext';

const { currentLanguage } = useLocale();
console.log(currentLanguage); // 'fr' or 'en'
```

### Change Language
```typescript
const { changeLanguage } = useLocale();

// Switch to English
await changeLanguage('en');

// Switch to French
await changeLanguage('fr');
```

### Language Switcher Component Example
```typescript
import { useLocale } from '../contexts/LocaleContext';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLocale();

  return (
    <div>
      <button
        onClick={() => changeLanguage('fr')}
        disabled={currentLanguage === 'fr'}
      >
        FR
      </button>
      <button
        onClick={() => changeLanguage('en')}
        disabled={currentLanguage === 'en'}
      >
        EN
      </button>
    </div>
  );
};
```

## 📝 Adding New Translations

### 1. Add to fr.json
```json
{
  "myFeature": {
    "title": "Mon Titre",
    "subtitle": "Mon sous-titre",
    "action": "Mon action"
  }
}
```

### 2. Add to en.json
```json
{
  "myFeature": {
    "title": "My Title",
    "subtitle": "My subtitle",
    "action": "My action"
  }
}
```

### 3. Use in Component
```typescript
<h1>{t('myFeature.title')}</h1>
<p>{t('myFeature.subtitle')}</p>
<button>{t('myFeature.action')}</button>
```

## 🎯 Translation Key Structure

```
section.subsection.element
│      │           │
│      │           └─ Specific element (title, button, label)
│      └─ Optional subsection (editForm, listView)
└─ Main section (auth, profile, tournament)
```

### Examples
```
auth.loginTitle
auth.loginForm.emailLabel
auth.loginForm.submitButton

profile.editForm.saveButton
profile.settings.privacyTitle

tournament.card.registerButton
tournament.details.prizePool
```

## 🔧 Debugging

### Check Current Language
```javascript
// In browser console
localStorage.getItem('userLanguagePreference')
```

### Force Language
```javascript
// In browser console
localStorage.setItem('userLanguagePreference', 'en');
location.reload();
```

### Clear Language Preference
```javascript
// In browser console
localStorage.removeItem('userLanguagePreference');
location.reload();
```

### Check for Missing Keys
Look in browser console for warnings like:
```
i18next: key "section.missingKey" not found
```

## ⚡ Performance Tips

### 1. Reuse Common Keys
Instead of:
```json
{
  "page1": { "save": "Enregistrer" },
  "page2": { "save": "Enregistrer" },
  "page3": { "save": "Enregistrer" }
}
```

Use:
```json
{
  "common": { "save": "Enregistrer" }
}
```

Then:
```typescript
<button>{t('common.save')}</button>
```

### 2. Avoid Inline Translations
**Bad:**
```typescript
{items.map(item => <div>{t('item', { name: item.name })}</div>)}
```

**Good:**
```typescript
const itemText = t('item', { name: item.name });
{items.map(item => <div>{itemText}</div>)}
```

## 🐛 Common Mistakes

### ❌ Don't
```typescript
// Hardcoded text
<button>Save</button>

// Wrong interpolation
<p>{t('welcome', username)}</p>

// Missing translation key
<div>{t('nonexistent.key')}</div>
```

### ✅ Do
```typescript
// Use translation
<button>{t('common.save')}</button>

// Correct interpolation
<p>{t('welcome', { username })}</p>

// Add missing keys to JSON first
<div>{t('existing.key')}</div>
```

## 📚 Full Key Reference

### All Sections
- `common` - Common UI elements
- `auth` - Authentication
- `validation` - Form validation
- `errors` - Error messages
- `navigation` - Navigation
- `header` - Header component
- `footer` - Footer component
- `home` - Home page
- `tournament` - Tournaments
- `profile` - User profile
- `friends` - Friends features
- `messages` - Messaging
- `notifications` - Notifications
- `leaderboards` - Rankings
- `support` - Help/Support
- `games` - Games
- `communities` - Communities
- `chat` - Chat features
- `forms` - Form elements
- `status` - Status labels
- `dates` - Date/time
- `actions` - Action buttons
- `gaming` - Gaming accounts
- `errors404` - 404 page
- `errorBoundary` - Error boundary

## 🔗 Resources

- Full Documentation: `src/locales/README.md`
- Implementation Guide: `I18N_IMPLEMENTATION_GUIDE.md`
- Example Component: `src/components/layout/Footer.tsx`

## 💡 Pro Tips

1. **Keep keys flat when possible**: `auth.loginTitle` is better than `auth.login.title.main`
2. **Be consistent**: Use same terminology across translations
3. **Test both languages**: Always check French AND English
4. **Update both files**: Never add key to only one language file
5. **Use meaningful names**: `profile.editButton` not `profile.btn1`

## 🎨 Text Length Considerations

Different languages have different text lengths. Test your UI with both languages:

- French text is typically 10-20% longer than English
- Buttons should have flexible width or ellipsis
- Multi-line text containers should allow wrapping
- Fixed-width layouts may need adjustment

Example:
```css
/* Allow button text to wrap if needed */
.btn {
  white-space: normal;
  min-height: 40px;
}
```

---

**Quick Start Checklist:**
- [ ] Import `useTranslation`
- [ ] Add `const { t } = useTranslation();`
- [ ] Replace text with `t('key')`
- [ ] Test in both languages
- [ ] Check console for warnings

**Need Help?** Check `src/locales/README.md` for detailed documentation!
