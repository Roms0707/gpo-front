# E-Sports Tournament Platform

Une plateforme de gestion de tournois e-sport.

## Configuration

### Environnements

L'application supporte deux environnements :

- **Staging** (par défaut) : Utilise le fichier `.env.staging`
- **Production** : Utilise le fichier `.env`

Par défaut, tous les scripts npm (dev, build, preview) utilisent l'environnement **staging**.

### Configuration Initiale

1. **Pour l'environnement de staging** :
   ```bash
   cp .env.example .env.staging
   ```
   Puis ajoutez vos clés API de staging dans le fichier `.env.staging`

2. **Pour l'environnement de production** :
   ```bash
   cp .env.example .env
   ```
   Puis ajoutez vos clés API de production dans le fichier `.env`

### Basculer vers la Production

Pour déployer en production, vous devez modifier manuellement le fichier `vite.config.ts` :

Changez cette ligne :
```typescript
const envMode = mode === 'production' ? mode : 'staging';
```

En :
```typescript
const envMode = 'production';
```

Et dans `package.json`, modifiez les scripts pour utiliser le mode production :
```json
"dev": "vite --mode production",
"build": "vite build --mode production",
"preview": "vite preview --mode production"
```

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run preview` - Prévisualise la version de production localement

## Structure du projet

- `/src` - Code source de l'application
- `/src/components` - Composants React réutilisables
- `/src/contexts` - Contexts React pour la gestion d'état global
- `/src/pages` - Pages de l'application
- `/src/services` - Services d'API et utilitaires
- `/src/types` - Types TypeScript
- `/src/lib` - Librairies et configurations

## Schéma de base de données

Le projet utilise Supabase comme base de données. Voici les principales tables :

- `users` - Utilisateurs de la plateforme
- `tournaments` - Tournois disponibles
- `tournament_registrations` - Inscriptions aux tournois
- `teams` - Équipes pour les tournois en équipe
- `team_members` - Membres des équipes
- `tournament_fields` - Champs personnalisés pour les tournois
- `tournament_field_values` - Valeurs des champs personnalisés
- `events` - Événements liés aux tournois