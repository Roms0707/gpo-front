# Translation Guide

Complete guide for implementing and managing translations in the Esports Tournament Platform.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Quick Start](#quick-start)
4. [Basic Usage](#basic-usage)
5. [Advanced Patterns](#advanced-patterns)
6. [Best Practices](#best-practices)
7. [Key Naming Conventions](#key-naming-conventions)
8. [Esports Terminology](#esports-terminology)
9. [Tools and Scripts](#tools-and-scripts)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This project uses **i18next** with **react-i18next** for internationalization, supporting:
- 🇫🇷 French (default)
- 🇬🇧 English

All user-facing strings must be translated. The English translation (`en.json`) is the source of truth.

### Key Features

- ✅ Automatic language detection
- ✅ localStorage persistence
- ✅ Nested translation keys
- ✅ Variable interpolation
- ✅ Pluralization support
- ✅ Formatted dates and numbers
- ✅ Type-safe with TypeScript

---

## Project Structure

```
src/
├── locales/
│   ├── en.json          # English translations (source of truth)
│   ├── fr.json          # French translations
│   ├── i18n.ts          # i18next configuration
│   └── README.md        # Locales documentation
├── services/
│   └── translationService.ts  # Translation service wrapper
└── components/
    └── ui/
        └── LanguageSwitcher.tsx  # Language selection component

scripts/
└── check-translations.cjs  # Translation verification script
```

---

## Quick Start

### 1. Import the Hook

```tsx
import { useTranslation } from 'react-i18next';
```

### 2. Use in Component

```tsx
function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('common.description')}</p>
    </div>
  );
}
```

### 3. Add Translation Keys

**en.json:**
```json
{
  "common": {
    "welcome": "Welcome",
    "description": "Get started with our platform"
  }
}
```

**fr.json:**
```json
{
  "common": {
    "welcome": "Bienvenue",
    "description": "Commencez avec notre plateforme"
  }
}
```

---

## Basic Usage

### Simple Text Translation

```tsx
function Header() {
  const { t } = useTranslation();

  return (
    <header>
      <h1>{t('header.title')}</h1>
      <nav>
        <a href="/tournaments">{t('navigation.tournaments')}</a>
        <a href="/leaderboards">{t('navigation.leaderboards')}</a>
      </nav>
    </header>
  );
}
```

### Nested Keys

Use dot notation to access nested translation keys:

```tsx
// Translation file
{
  "tournament": {
    "registration": {
      "title": "Tournament Registration",
      "submit": "Register Now",
      "cancel": "Cancel"
    }
  }
}

// Component
<h2>{t('tournament.registration.title')}</h2>
<button>{t('tournament.registration.submit')}</button>
<button>{t('tournament.registration.cancel')}</button>
```

### Text with HTML Attributes

```tsx
<input
  type="text"
  placeholder={t('forms.usernamePlaceholder')}
  aria-label={t('forms.usernameLabel')}
/>

<button
  aria-label={t('header.openMenu')}
  title={t('header.menuTooltip')}
>
  <MenuIcon />
</button>
```

---

## Advanced Patterns

### Variable Interpolation

Pass variables to translations using the second parameter:

```tsx
// Translation file
{
  "tournament": {
    "participantCount": "{{count}} participants registered",
    "registeredBy": "Registered by {{username}}",
    "startsIn": "Starts in {{time}}"
  }
}

// Component
const { t } = useTranslation();

<p>{t('tournament.participantCount', { count: 42 })}</p>
// Output (EN): "42 participants registered"
// Output (FR): "42 participants inscrits"

<p>{t('tournament.registeredBy', { username: 'ProGamer123' })}</p>
// Output (EN): "Registered by ProGamer123"
// Output (FR): "Inscrit par ProGamer123"

<p>{t('tournament.startsIn', { time: '2 hours' })}</p>
// Output (EN): "Starts in 2 hours"
// Output (FR): "Commence dans 2 hours"
```

### Multiple Variables

```tsx
// Translation file
{
  "match": {
    "result": "{{teamA}} defeated {{teamB}} with a score of {{scoreA}}-{{scoreB}}"
  }
}

// Component
<p>{t('match.result', {
  teamA: 'Team Alpha',
  teamB: 'Team Beta',
  scoreA: 3,
  scoreB: 1
})}</p>
// Output (EN): "Team Alpha defeated Team Beta with a score of 3-1"
// Output (FR): "Team Alpha a battu Team Beta avec un score de 3-1"
```

### Pluralization

i18next automatically handles pluralization using the `count` variable:

```tsx
// Translation file
{
  "tournament": {
    "participants_one": "{{count}} participant",
    "participants_other": "{{count}} participants"
  }
}

// Component
<p>{t('tournament.participants', { count: 1 })}</p>
// Output (EN): "1 participant"
// Output (FR): "1 participant"

<p>{t('tournament.participants', { count: 42 })}</p>
// Output (EN): "42 participants"
// Output (FR): "42 participants"
```

### Complex Pluralization

```tsx
// Translation file
{
  "notification": {
    "friendRequest_zero": "No new friend requests",
    "friendRequest_one": "{{count}} new friend request",
    "friendRequest_other": "{{count}} new friend requests"
  }
}

// Component
<span>{t('notification.friendRequest', { count: 0 })}</span>
// Output (EN): "No new friend requests"

<span>{t('notification.friendRequest', { count: 1 })}</span>
// Output (EN): "1 new friend request"

<span>{t('notification.friendRequest', { count: 5 })}</span>
// Output (EN): "5 new friend requests"
```

### Conditional Translations

```tsx
// Translation file
{
  "profile": {
    "visibility": {
      "public": "public",
      "private": "private"
    },
    "message": "Your profile is {{visibility}}"
  }
}

// Component
const isPublic = true;
const visibility = isPublic ? 'public' : 'private';

<p>{t('profile.message', {
  visibility: t(`profile.visibility.${visibility}`)
})}</p>
// Output (EN): "Your profile is public"
// Output (FR): "Votre profil est public"
```

### Dynamic Keys

```tsx
// Translation file
{
  "status": {
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected"
  }
}

// Component
const registrationStatus = 'approved'; // From API

<StatusBadge>
  {t(`status.${registrationStatus}`)}
</StatusBadge>
// Output (EN): "Approved"
// Output (FR): "Approuvé"
```

### Lists with Pluralization

```tsx
// Translation file
{
  "tournament": {
    "prize_one": "{{count}} prize",
    "prize_other": "{{count}} prizes",
    "team_one": "{{count}} team",
    "team_other": "{{count}} teams"
  }
}

// Component
const prizes = 3;
const teams = 16;

<div>
  <p>{t('tournament.prize', { count: prizes })}</p>
  <p>{t('tournament.team', { count: teams })}</p>
</div>
// Output (EN): "3 prizes" and "16 teams"
// Output (FR): "3 prix" and "16 équipes"
```

### Date Formatting

```tsx
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const { t, i18n } = useTranslation();
const locale = i18n.language === 'fr' ? fr : enUS;
const tournamentDate = new Date('2025-12-25');

<p>
  {t('tournament.startsOn', {
    date: format(tournamentDate, 'PPP', { locale })
  })}
</p>
// Output (EN): "Starts on December 25th, 2025"
// Output (FR): "Commence le 25 décembre 2025"
```

### Component with Translation Props

```tsx
interface TournamentCardProps {
  title: string;
  participantCount: number;
  status: 'open' | 'closed' | 'ongoing';
}

function TournamentCard({ title, participantCount, status }: TournamentCardProps) {
  const { t } = useTranslation();

  return (
    <div className="tournament-card">
      <h3>{title}</h3>
      <p>{t('tournament.participants', { count: participantCount })}</p>
      <StatusBadge>{t(`tournament.status.${status}`)}</StatusBadge>
      <button>{t('tournament.register')}</button>
    </div>
  );
}
```

---

## Best Practices

### 1. Always Use Translation Keys

❌ **Don't:**
```tsx
<button>Register</button>
<p>Welcome to our platform</p>
```

✅ **Do:**
```tsx
<button>{t('common.register')}</button>
<p>{t('common.welcomeMessage')}</p>
```

### 2. Keep Keys Organized by Feature

❌ **Don't:**
```json
{
  "button1": "Submit",
  "text1": "Welcome",
  "label1": "Username"
}
```

✅ **Do:**
```json
{
  "auth": {
    "submit": "Submit",
    "welcome": "Welcome",
    "usernameLabel": "Username"
  }
}
```

### 3. Use Descriptive Key Names

❌ **Don't:**
```json
{
  "t1": "Tournament",
  "msg": "Welcome",
  "btn": "Click"
}
```

✅ **Do:**
```json
{
  "tournament": {
    "title": "Tournament",
    "welcomeMessage": "Welcome",
    "registerButton": "Register Now"
  }
}
```

### 4. Keep Translations Context-Free

❌ **Don't:**
```json
{
  "click": "Click" // Too vague, what should be clicked?
}
```

✅ **Do:**
```json
{
  "tournament": {
    "registerButton": "Register for Tournament",
    "viewDetailsButton": "View Details"
  }
}
```

### 5. Use Interpolation for Dynamic Content

❌ **Don't:**
```tsx
<p>{participants + ' participants registered'}</p>
```

✅ **Do:**
```tsx
<p>{t('tournament.participantsRegistered', { count: participants })}</p>
```

### 6. Avoid String Concatenation

❌ **Don't:**
```tsx
<p>{t('tournament.winner') + ': ' + winnerName}</p>
```

✅ **Do:**
```json
{
  "tournament": {
    "winnerAnnouncement": "Winner: {{name}}"
  }
}
```
```tsx
<p>{t('tournament.winnerAnnouncement', { name: winnerName })}</p>
```

### 7. Use Pluralization Properly

❌ **Don't:**
```tsx
<p>{count === 1 ? '1 team' : count + ' teams'}</p>
```

✅ **Do:**
```tsx
<p>{t('tournament.teams', { count })}</p>
```

### 8. Consistent Naming for ARIA Labels

```tsx
// Translation file
{
  "header": {
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "profileLink": "View your profile"
  }
}

// Component
<button aria-label={t('header.openMenu')}>
  <MenuIcon />
</button>

<Link to="/profile" aria-label={t('header.profileLink')}>
  <UserIcon />
</Link>
```

---

## Key Naming Conventions

### General Structure

```
{section}.{subsection}.{element}{type}
```

**Examples:**
- `tournament.registration.submit` - Action button
- `tournament.registration.title` - Section heading
- `forms.usernamePlaceholder` - Form placeholder
- `errors.invalidEmail` - Error message

### Common Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| `{feature}.title` | `tournament.title` | Page or section title |
| `{feature}.description` | `tournament.description` | Description text |
| `{feature}.{action}Button` | `tournament.registerButton` | Action button |
| `{feature}.{field}Label` | `forms.emailLabel` | Form field label |
| `{feature}.{field}Placeholder` | `forms.emailPlaceholder` | Form placeholder |
| `{feature}.{field}Error` | `forms.emailError` | Error message |
| `navigation.{page}` | `navigation.tournaments` | Navigation link |
| `header.{element}` | `header.openMenu` | Header element |
| `footer.{element}` | `footer.copyright` | Footer element |

### Pluralization Suffixes

| Suffix | Example | Usage |
|--------|---------|-------|
| `_zero` | `participants_zero` | Zero items |
| `_one` | `participants_one` | One item |
| `_other` | `participants_other` | Multiple items |

### Example: Complete Feature Translation

```json
{
  "tournament": {
    "title": "Tournaments",
    "subtitle": "Compete in epic battles",
    "list": {
      "title": "Available Tournaments",
      "emptyState": "No tournaments available",
      "loadingState": "Loading tournaments..."
    },
    "card": {
      "viewDetails": "View Details",
      "register": "Register",
      "participants": "{{count}} participants",
      "prizePool": "Prize Pool: {{amount}}",
      "startsIn": "Starts in {{time}}"
    },
    "registration": {
      "title": "Tournament Registration",
      "teamName": "Team Name",
      "teamNamePlaceholder": "Enter your team name",
      "submit": "Register Now",
      "cancel": "Cancel",
      "success": "Registration successful!",
      "error": "Registration failed. Please try again."
    },
    "status": {
      "upcoming": "Upcoming",
      "ongoing": "Ongoing",
      "completed": "Completed"
    }
  }
}
```

---

## Esports Terminology

### Terms That Should NOT Be Translated

Many esports terms are international and should remain in English:

**Gaming Platforms:**
- Riot ID
- Steam ID
- Epic Games ID
- Battle.net

**Technical Terms:**
- K/D/A (Kills/Deaths/Assists)
- CS (Creep Score)
- APM (Actions Per Minute)
- DPS (Damage Per Second)
- AFK (Away From Keyboard)
- GG (Good Game)

**Tournament Formats:**
- Single Elimination
- Double Elimination
- Round Robin
- Swiss System
- Best of 3 (Bo3)
- Best of 5 (Bo5)

**Bracket Terms:**
- Upper Bracket
- Lower Bracket
- Grand Finals
- Semifinals
- Quarterfinals
- Group Stage
- Playoffs
- Qualifiers

**Game-Specific Terms:**
- Valorant: Agent, Spike, Pistol Round
- League of Legends: Nexus, Baron, Dragon
- CS:GO: Bomb, CT, T
- Fortnite: Battle Pass, V-Bucks

### Terms That SHOULD Be Translated

**General Gaming:**
- Score → Score / Score
- Player → Player / Joueur
- Team → Team / Équipe
- Match → Match / Match
- Win → Win / Victoire
- Loss → Loss / Défaite

**Tournament Organization:**
- Registration → Registration / Inscription
- Prize Pool → Prize Pool / Gains
- Rules → Rules / Règles
- Ranking → Ranking / Classement
- Leaderboard → Leaderboard / Tableau des scores

**UI Elements:**
- All buttons, labels, messages
- Form fields and placeholders
- Navigation items
- Error messages
- Success messages

### Example: Mixed Translation

```json
{
  "tournament": {
    "format": "Format: Single Elimination",
    "mode": "Mode: Best of 3",
    "bracket": "Bracket: Upper Bracket",
    "registerNow": "Register Now",
    "viewRules": "View Rules",
    "prizePool": "Prize Pool: $10,000"
  }
}
```

FR translation:
```json
{
  "tournament": {
    "format": "Format : Single Elimination",
    "mode": "Mode : Best of 3",
    "bracket": "Bracket : Upper Bracket",
    "registerNow": "S'inscrire maintenant",
    "viewRules": "Voir les règles",
    "prizePool": "Gains : 10 000 $"
  }
}
```

---

## Tools and Scripts

### Translation Verification Script

Check translation synchronization:

```bash
npm run check-translations
```

**What it checks:**
- Missing keys in French
- Extra keys in French
- Empty values
- Potentially untranslated strings

**Example output:**
```
✓ Translation files loaded successfully
  EN keys: 554
  FR keys: 554

📊 Summary
------------------------------------------------------------
Total EN keys:          554
Total FR keys:          554
Common keys:            554
Missing in FR:          0

✓ All translations are synchronized! 🎉
```

### Adding New Translations Workflow

1. **Add English translation first** (`en.json`):
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

2. **Run verification script**:
```bash
npm run check-translations
```

3. **Add French translation** (`fr.json`):
```json
{
  "newFeature": {
    "title": "Nouvelle fonctionnalité",
    "description": "Ceci est une nouvelle fonctionnalité"
  }
}
```

4. **Verify again**:
```bash
npm run check-translations
```

5. **Use in component**:
```tsx
<h1>{t('newFeature.title')}</h1>
<p>{t('newFeature.description')}</p>
```

### TranslationService Helper

Access translation functionality outside React components:

```typescript
import { translationService } from '@/services/translationService';

// Get current language
const currentLang = translationService.getCurrentLanguage(); // 'en' | 'fr'

// Change language
await translationService.changeLanguage('fr');

// Get language from country code
const lang = translationService.getLanguageFromCountry('FR'); // 'fr'

// Translate a key
const text = translationService.translate('common.welcome');
```

---

## Troubleshooting

### Issue: Translation Not Showing

**Problem:** Translation key shows instead of translated text
```tsx
<h1>{t('tournament.title')}</h1>
// Shows: "tournament.title" instead of "Tournaments"
```

**Solutions:**
1. Check if the key exists in both `en.json` and `fr.json`
2. Verify the key path is correct (dot notation)
3. Run `npm run check-translations` to find missing keys
4. Check browser console for i18next warnings

### Issue: Interpolation Not Working

**Problem:** Variable shows as `{{variable}}` instead of value
```tsx
<p>{t('tournament.participants', { count: 42 })}</p>
// Shows: "{{count}} participants" instead of "42 participants"
```

**Solutions:**
1. Ensure the variable name matches exactly
2. Check that the second parameter is an object: `{ count: 42 }`
3. Verify the translation file has `{{count}}` not `{count}` or `$count`

### Issue: Pluralization Not Working

**Problem:** Always shows singular or wrong plural form

**Solutions:**
1. Ensure you're passing `count` in the variables: `{ count: value }`
2. Use correct suffixes: `_one` and `_other` (not `_singular` or `_plural`)
3. Make sure the key base name matches (without suffix)

**Example:**
```json
{
  "items_one": "{{count}} item",    // Used when count === 1
  "items_other": "{{count}} items"   // Used when count !== 1
}
```

### Issue: Language Not Changing

**Problem:** Language doesn't switch when using LanguageSwitcher

**Solutions:**
1. Check localStorage for `userLanguagePreference`
2. Verify `translationService.changeLanguage()` is being called
3. Check browser console for errors
4. Ensure components are using `useTranslation()` hook
5. Try clearing browser cache and localStorage

### Issue: Missing Translation Warning

**Problem:** Console shows: `i18next::translator: missingKey en translation.key`

**Solutions:**
1. Run `npm run check-translations` to identify missing keys
2. Add the missing key to both `en.json` and `fr.json`
3. Restart dev server if changes aren't detected

---

## Code Examples Repository

### Complete Component Example

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TournamentRegistrationProps {
  tournamentId: string;
  maxParticipants: number;
  currentParticipants: number;
}

function TournamentRegistration({
  tournamentId,
  maxParticipants,
  currentParticipants
}: TournamentRegistrationProps) {
  const { t } = useTranslation();
  const [teamName, setTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spotsLeft = maxParticipants - currentParticipants;
  const isFull = spotsLeft === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError(t('tournament.registration.errors.teamNameRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await registerForTournament(tournamentId, teamName);
      alert(t('tournament.registration.success'));
    } catch (err) {
      setError(t('tournament.registration.errors.registrationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tournament-registration">
      <h2>{t('tournament.registration.title')}</h2>

      <div className="info">
        <p>{t('tournament.participants', { count: currentParticipants })}</p>
        <p>{t('tournament.spotsLeft', { count: spotsLeft })}</p>
      </div>

      {isFull ? (
        <p className="warning">{t('tournament.registration.tournamentFull')}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="teamName">
            {t('tournament.registration.teamNameLabel')}
          </label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={t('tournament.registration.teamNamePlaceholder')}
            disabled={isSubmitting}
            aria-label={t('tournament.registration.teamNameLabel')}
          />

          {error && (
            <p className="error" role="alert">{error}</p>
          )}

          <div className="actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('common.loading')
                : t('tournament.registration.submit')
              }
            </button>
            <button type="button" onClick={onCancel}>
              {t('tournament.registration.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
```

**Translation keys for this component:**

```json
{
  "tournament": {
    "registration": {
      "title": "Tournament Registration",
      "teamNameLabel": "Team Name",
      "teamNamePlaceholder": "Enter your team name",
      "submit": "Register Now",
      "cancel": "Cancel",
      "success": "Successfully registered for tournament!",
      "tournamentFull": "This tournament is full",
      "errors": {
        "teamNameRequired": "Team name is required",
        "registrationFailed": "Registration failed. Please try again."
      }
    },
    "participants": "{{count}} participants",
    "participants_one": "{{count}} participant",
    "participants_other": "{{count}} participants",
    "spotsLeft": "{{count}} spots left",
    "spotsLeft_one": "{{count}} spot left",
    "spotsLeft_other": "{{count}} spots left"
  },
  "common": {
    "loading": "Loading..."
  }
}
```

---

## Summary

### Quick Reference Checklist

- [ ] Import `useTranslation` hook
- [ ] Extract `t` function: `const { t } = useTranslation()`
- [ ] Use translation keys: `{t('section.key')}`
- [ ] Add keys to both `en.json` and `fr.json`
- [ ] Use interpolation for dynamic content: `{t('key', { var: value })}`
- [ ] Use pluralization with `count` variable
- [ ] Keep esports terms in English
- [ ] Run `npm run check-translations` before committing
- [ ] Follow naming conventions
- [ ] Test both languages

### Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Translation Verification Script](../scripts/README.md)
- [Locales README](../src/locales/README.md)

### Need Help?

1. Check this guide first
2. Run `npm run check-translations` to identify issues
3. Review existing components for examples
4. Check browser console for i18next warnings
5. Consult the team for terminology decisions

---

**Last Updated:** 2025-11-20
**Version:** 1.0.0
