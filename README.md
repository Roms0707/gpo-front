# E-Sports Tournament Platform

Une plateforme de gestion de tournois e-sport.

## Configuration

### Configuration Initiale

1. Copiez le fichier d'exemple et configurez vos variables d'environnement :
   ```bash
   cp .env.example .env
   ```

2. Modifiez le fichier `.env` et ajoutez vos clés API :
   - Supabase URL et clé anonyme
   - Twitch Client ID et Secret
   - Galaxy API credentials
   - Riot Games API key
   - Project Configuration ID

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
