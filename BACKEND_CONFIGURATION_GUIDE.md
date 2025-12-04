# PROMPT POUR LE BACK-OFFICE - Gestion de la table `project_configurations`

## Contexte
Le front-end utilise un système de configuration multi-tenant basé sur la table Supabase `project_configurations`. Cette table permet de personnaliser l'apparence et le branding de l'application selon différentes configurations (marques, campagnes, etc.).

## Structure de la table `project_configurations`

La table contient les colonnes suivantes :

### Colonnes obligatoires

- `config_id` (varchar, unique) - Identifiant unique de la configuration (exemple: "default", "test", "partner-xyz")
- `config_name` (varchar) - Nom descriptif de la configuration (exemple: "Configuration Orange Arena par défaut")
- `brand_name` (varchar) - Nom de la marque affiché dans l'application (exemple: "Orange Arena")
- `logo_path` (varchar) - Chemin vers le fichier logo (exemple: "/assets/logos/logo-default.svg")
- `favicon_path` (varchar) - Chemin vers le fichier favicon (exemple: "/assets/favicons/favicon-default.svg")
- `logo_alt_text` (varchar) - Texte alternatif pour l'accessibilité (exemple: "Orange Arena E-Sport")
- `primary_color` (varchar) - Couleur primaire au format hexadécimal avec # (exemple: "#FF6B00")
- `secondary_color` (varchar) - Couleur secondaire au format hexadécimal avec # (exemple: "#000000")

### Colonnes optionnelles

- `is_active` (boolean) - Indique si la configuration est active (défaut: true)
- `product_id` (varchar) - Identifiant produit pour intégrations externes (peut être null)
- `campaign_id` (varchar) - Identifiant campagne pour intégrations externes (peut être null)
- `extra_metadata` (jsonb) - Métadonnées additionnelles au format JSON (défaut: {})

### Colonnes automatiques

- `id` (uuid) - Généré automatiquement
- `created_at` (timestamptz) - Généré automatiquement
- `updated_at` (timestamptz) - Généré automatiquement

## Fonctionnalités requises pour le back-office

### 1. CRÉER une nouvelle configuration

```sql
INSERT INTO project_configurations (
  config_id,
  config_name,
  is_active,
  brand_name,
  logo_path,
  favicon_path,
  logo_alt_text,
  primary_color,
  secondary_color,
  product_id,
  campaign_id,
  extra_metadata
) VALUES (
  'nom-unique-de-config',
  'Nom descriptif de la configuration',
  true,
  'Nom de la Marque',
  '/assets/logos/logo-custom.svg',
  '/assets/favicons/favicon-custom.svg',
  'Nom de la Marque E-Sport',
  '#FF6B00',
  '#000000',
  'product-123',
  'campaign-456',
  '{"custom_key": "custom_value"}'::jsonb
);
```

### 2. MODIFIER une configuration existante

```sql
UPDATE project_configurations
SET
  brand_name = 'Nouveau Nom',
  primary_color = '#00FF00',
  secondary_color = '#FFFFFF',
  updated_at = now()
WHERE config_id = 'nom-unique-de-config';
```

### 3. DÉSACTIVER une configuration (sans la supprimer)

```sql
UPDATE project_configurations
SET
  is_active = false,
  updated_at = now()
WHERE config_id = 'nom-unique-de-config';
```

### 4. SUPPRIMER définitivement une configuration

```sql
DELETE FROM project_configurations
WHERE config_id = 'nom-unique-de-config';
```

### 5. LISTER toutes les configurations

```sql
SELECT * FROM project_configurations
ORDER BY created_at DESC;
```

## Règles importantes

1. **Format des couleurs :** Les couleurs DOIVENT être au format hexadécimal avec # (exemple: "#FF6B00", pas "FF6B00")

2. **config_id unique :** Chaque `config_id` doit être unique dans la table. Utiliser des noms en minuscules avec tirets (exemple: "orange-arena", "partner-xyz")

3. **is_active :** Seules les configurations avec `is_active = true` sont accessibles par le front-end

4. **Chemins des assets :** Les chemins `logo_path` et `favicon_path` doivent pointer vers des fichiers existants dans le projet front-end

5. **Sécurité RLS :**
   - Les utilisateurs non authentifiés peuvent LIRE les configurations actives
   - Seuls les utilisateurs authentifiés peuvent CRÉER/MODIFIER/SUPPRIMER des configurations

## Utilisation côté front-end

Le front-end sélectionne la configuration via la variable d'environnement `VITE_PROJECT_CONFIG_ID`. Par exemple :

- `VITE_PROJECT_CONFIG_ID=default` chargera la configuration avec `config_id = 'default'`
- `VITE_PROJECT_CONFIG_ID=test` chargera la configuration avec `config_id = 'test'`

## Exemple complet de nouvelle configuration

```sql
INSERT INTO project_configurations (
  config_id,
  config_name,
  is_active,
  brand_name,
  logo_path,
  favicon_path,
  logo_alt_text,
  primary_color,
  secondary_color,
  product_id,
  campaign_id,
  extra_metadata
) VALUES (
  'partner-acme',
  'Configuration Partenaire ACME',
  true,
  'ACME Gaming Arena',
  '/assets/logos/logo-acme.svg',
  '/assets/favicons/favicon-acme.svg',
  'ACME Gaming Arena E-Sport',
  '#FF0000',
  '#1a1a1a',
  'acme-product-001',
  'acme-campaign-winter-2024',
  '{"partner_tier": "gold", "features": ["premium_support", "custom_branding"]}'::jsonb
);
```

## Génération automatique des couleurs

Le front-end génère automatiquement une palette complète de couleurs Tailwind (50, 100, 200...950) à partir des `primary_color` et `secondary_color`. Vous n'avez besoin de fournir que les couleurs de base.

## API REST recommandée pour le back-office

Si vous créez une interface d'administration, voici les endpoints recommandés :

### GET /api/configurations
Liste toutes les configurations

**Réponse :**
```json
[
  {
    "id": "uuid",
    "config_id": "default",
    "config_name": "Default Configuration",
    "is_active": true,
    "brand_name": "Orange Arena",
    "logo_path": "/assets/logos/logo-default.svg",
    "favicon_path": "/assets/favicons/favicon-default.svg",
    "logo_alt_text": "Orange Arena E-Sport",
    "primary_color": "#FF6B00",
    "secondary_color": "#000000",
    "product_id": null,
    "campaign_id": null,
    "extra_metadata": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /api/configurations
Créer une nouvelle configuration

**Requête :**
```json
{
  "config_id": "partner-xyz",
  "config_name": "Partner XYZ Configuration",
  "is_active": true,
  "brand_name": "XYZ Arena",
  "logo_path": "/assets/logos/logo-xyz.svg",
  "favicon_path": "/assets/favicons/favicon-xyz.svg",
  "logo_alt_text": "XYZ Arena E-Sport",
  "primary_color": "#00FF00",
  "secondary_color": "#1a1a1a",
  "product_id": "xyz-001",
  "campaign_id": "xyz-winter",
  "extra_metadata": {}
}
```

### PUT /api/configurations/:config_id
Modifier une configuration existante

**Requête :**
```json
{
  "brand_name": "Nouveau Nom",
  "primary_color": "#0000FF"
}
```

### DELETE /api/configurations/:config_id
Supprimer une configuration

### PATCH /api/configurations/:config_id/toggle
Activer/Désactiver une configuration

**Requête :**
```json
{
  "is_active": false
}
```

## Validation des données

### Règles de validation recommandées

- `config_id` : Requis, unique, alphanumerique avec tirets, 3-50 caractères
- `config_name` : Requis, 3-200 caractères
- `brand_name` : Requis, 3-200 caractères
- `logo_path` : Requis, chemin valide commençant par "/"
- `favicon_path` : Requis, chemin valide commençant par "/"
- `logo_alt_text` : Requis, 3-200 caractères
- `primary_color` : Requis, format hexadécimal #RRGGBB
- `secondary_color` : Requis, format hexadécimal #RRGGBB
- `product_id` : Optionnel, 0-100 caractères
- `campaign_id` : Optionnel, 0-100 caractères
- `extra_metadata` : Optionnel, objet JSON valide

### Exemple de validation en JavaScript

```javascript
function validateHexColor(color) {
  return /^#[0-9A-F]{6}$/i.test(color);
}

function validateConfigId(configId) {
  return /^[a-z0-9-]{3,50}$/.test(configId);
}

function validateConfiguration(data) {
  const errors = [];

  if (!validateConfigId(data.config_id)) {
    errors.push('config_id must be 3-50 characters, lowercase alphanumeric with hyphens');
  }

  if (!validateHexColor(data.primary_color)) {
    errors.push('primary_color must be in #RRGGBB format');
  }

  if (!validateHexColor(data.secondary_color)) {
    errors.push('secondary_color must be in #RRGGBB format');
  }

  return errors;
}
```

## Notes techniques

### Gestion du cache

Le service front-end `projectConfigService` gère un cache des configurations. Après une modification dans le back-office, le front-end rechargera automatiquement la configuration au prochain démarrage de l'application.

### Base de données

La table utilise Row Level Security (RLS) de Supabase. Assurez-vous que les utilisateurs du back-office sont authentifiés pour pouvoir créer/modifier/supprimer des configurations.

### Assets

Avant de créer une configuration avec de nouveaux `logo_path` et `favicon_path`, assurez-vous que ces fichiers existent dans le dossier `public/assets/` du front-end.
