/*
  # Create project_configurations table
  
  1. Purpose
    - Central configuration table for multi-tenant/multi-brand deployments
    - Stores base colors that will be used to generate complete Tailwind palettes
    - Replaces country-based configuration system with config_id-based system
  
  2. New Tables
    - `project_configurations`
      - `id` (uuid, primary key) - Unique identifier
      - `config_id` (varchar, unique) - String identifier used in VITE_PROJECT_CONFIG_ID
      - `config_name` (varchar) - Human-readable name for the configuration
      - `is_active` (boolean) - Whether this configuration is active
      - `brand_name` (varchar) - Brand name to display in the app
      - `logo_path` (varchar) - Path to logo file
      - `favicon_path` (varchar) - Path to favicon file
      - `logo_alt_text` (varchar) - Alt text for logo accessibility
      - `primary_color` (varchar) - Base primary color in hex format (#RRGGBB)
      - `secondary_color` (varchar) - Base secondary color in hex format (#RRGGBB)
      - `product_id` (varchar) - Product identifier for external integrations
      - `campaign_id` (varchar) - Campaign identifier for external integrations
      - `extra_metadata` (jsonb) - Additional flexible metadata
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  3. Security
    - Enable RLS on `project_configurations` table
    - Add policy for public read access to active configurations
    - Add policy for authenticated admin write access
  
  4. Initial Data
    - Insert "default" configuration with orange (#FF6B00) and black (#000000)
    - Insert "test" configuration with yellow (#FFD700) and dark gray (#1a1a1a)
*/

-- Create the project_configurations table
CREATE TABLE IF NOT EXISTS project_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id varchar(50) UNIQUE NOT NULL,
  config_name varchar(200) NOT NULL,
  is_active boolean DEFAULT true,
  brand_name varchar(200) NOT NULL,
  logo_path varchar(500) NOT NULL,
  favicon_path varchar(500) NOT NULL,
  logo_alt_text varchar(200) NOT NULL,
  primary_color varchar(7) NOT NULL,
  secondary_color varchar(7) NOT NULL,
  product_id varchar(100),
  campaign_id varchar(100),
  extra_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_configurations_config_id ON project_configurations(config_id);
CREATE INDEX IF NOT EXISTS idx_project_configurations_is_active ON project_configurations(is_active);

-- Enable Row Level Security
ALTER TABLE project_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active configurations
CREATE POLICY "Anyone can read active configurations"
  ON project_configurations
  FOR SELECT
  USING (is_active = true);

-- Policy: Only authenticated users can insert configurations (admin check can be added later)
CREATE POLICY "Authenticated users can insert configurations"
  ON project_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can update configurations
CREATE POLICY "Authenticated users can update configurations"
  ON project_configurations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Only authenticated users can delete configurations
CREATE POLICY "Authenticated users can delete configurations"
  ON project_configurations
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default configuration (Orange Arena style)
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
  'default',
  'Default Orange Arena Configuration',
  true,
  'Orange Arena',
  '/assets/logos/logo-default.svg',
  '/assets/favicons/favicon-default.svg',
  'Orange Arena E-Sport',
  '#FF6B00',
  '#000000',
  NULL,
  NULL,
  '{}'::jsonb
) ON CONFLICT (config_id) DO NOTHING;

-- Insert test configuration (Yellow/Black style)
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
  'test',
  'Test Yellow Configuration',
  true,
  'Arena Test',
  '/assets/logos/logo-default.svg',
  '/assets/favicons/favicon-default.svg',
  'Arena Test E-Sport',
  '#FFD700',
  '#1a1a1a',
  NULL,
  NULL,
  '{}'::jsonb
) ON CONFLICT (config_id) DO NOTHING;