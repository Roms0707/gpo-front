-- Create Country Configurations System
--
-- 1. New Tables
--    - country_configurations: Stores complete configuration for each country
--      including branding, theme colors, localization, and Galaxy API settings
--
-- 2. Security
--    - Enable RLS with public read access
--    - Admin-only write access
--
-- 3. Indexes
--    - Index on country_code for fast lookups
--    - Index on is_active for filtering

CREATE TABLE IF NOT EXISTS country_configurations (
  country_code VARCHAR(10) PRIMARY KEY,
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  brand_name VARCHAR(200) NOT NULL,
  logo_path VARCHAR(500) NOT NULL,
  favicon_path VARCHAR(500) NOT NULL,
  logo_alt_text VARCHAR(200) NOT NULL,
  theme_colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  locale_language VARCHAR(10) NOT NULL DEFAULT 'en_EN',
  locale_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  locale_text_direction VARCHAR(3) NOT NULL DEFAULT 'ltr',
  galaxy_campaign_id VARCHAR(50),
  galaxy_service_id VARCHAR(50),
  galaxy_country_code VARCHAR(10),
  galaxy_language_code VARCHAR(10),
  extra_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_country_configurations_active ON country_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_country_configurations_country_code ON country_configurations(country_code);

-- Enable RLS
ALTER TABLE country_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active country configurations
CREATE POLICY "Public read access to active configurations"
  ON country_configurations
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Authenticated admin users can manage all configurations
CREATE POLICY "Admin users can manage configurations"
  ON country_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default configuration
INSERT INTO country_configurations (
  country_code,
  country_name,
  brand_name,
  logo_path,
  favicon_path,
  logo_alt_text,
  theme_colors,
  locale_language,
  locale_currency,
  locale_text_direction
) VALUES (
  'DEFAULT',
  'Default',
  'Orange Arena',
  '/assets/logos/logo-default.svg',
  '/assets/favicons/favicon-default.svg',
  'Orange Arena E-Sport',
  '{"primary": "#FF6B00", "primaryDark": "#0A391A", "secondary": "#22D862", "background": "#1B1C22", "backgroundLight": "#2A2B35", "backgroundDark": "#0F1015", "text": "#FFFFFF", "textSecondary": "#B8B9C1", "textMuted": "#6B6C7E", "accent": "#FF6B00", "success": "#22D862", "warning": "#FFA500", "error": "#FF4444", "info": "#3B82F6"}'::jsonb,
  'fr_FR',
  'EUR',
  'ltr'
) ON CONFLICT (country_code) DO NOTHING;

-- Insert Tunisia configuration
INSERT INTO country_configurations (
  country_code,
  country_name,
  brand_name,
  logo_path,
  favicon_path,
  logo_alt_text,
  theme_colors,
  locale_language,
  locale_currency,
  locale_text_direction,
  galaxy_campaign_id,
  galaxy_service_id,
  galaxy_country_code,
  galaxy_language_code
) VALUES (
  'TN',
  'Tunisia',
  'Orange Arena Tunisia',
  '/assets/logos/logo-tunisia.svg',
  '/assets/favicons/favicon-tunisia.svg',
  'Orange Arena Tunisia E-Sport',
  '{"primary": "#22D862", "primaryDark": "#0A391A", "secondary": "#FF6B00", "background": "#1B1C22", "backgroundLight": "#2A2B35", "backgroundDark": "#0F1015", "text": "#FFFFFF", "textSecondary": "#B8B9C1", "textMuted": "#6B6C7E", "accent": "#FF6B00", "success": "#22D862", "warning": "#FFA500", "error": "#FF4444", "info": "#3B82F6"}'::jsonb,
  'fr_FR',
  'TND',
  'ltr',
  '4471',
  '1251',
  'tn',
  'fr'
) ON CONFLICT (country_code) DO NOTHING;

-- Insert Ethiopia configuration
INSERT INTO country_configurations (
  country_code,
  country_name,
  brand_name,
  logo_path,
  favicon_path,
  logo_alt_text,
  theme_colors,
  locale_language,
  locale_currency,
  locale_text_direction,
  galaxy_campaign_id,
  galaxy_service_id,
  galaxy_country_code,
  galaxy_language_code
) VALUES (
  'ET',
  'Ethiopia',
  'Ethio Arena',
  '/assets/logos/logo-ethiopia.png',
  '/assets/favicons/favicon-ethiopia.png',
  'Ethio Arena E-Sport',
  '{"primary": "#8bc542", "primaryDark": "#6a9632", "secondary": "#ee7f00", "background": "#393943", "backgroundLight": "#4a4a54", "backgroundDark": "#2a2a32", "text": "#FFFFFF", "textSecondary": "#D1D1D6", "textMuted": "#9B9BA5", "accent": "#ee7f00", "success": "#8bc542", "warning": "#FFA500", "error": "#FF4444", "info": "#3B82F6"}'::jsonb,
  'en_EN',
  'ETB',
  'ltr',
  '4763',
  '1955',
  '  et',
  'en'
) ON CONFLICT (country_code) DO NOTHING;