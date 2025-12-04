/*
  # Create country whitelist table for geo-based access control

  1. New Tables
    - `country_whitelist`
      - `id` (uuid, primary key) - Unique identifier
      - `country_code` (text, unique, not null) - ISO 3166-1 alpha-2 country code (e.g., FR, US)
      - `country_name` (text, not null) - Human-readable country name
      - `is_active` (boolean, default true) - Whether this whitelist entry is currently active
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update
  
  2. Security
    - Enable RLS on `country_whitelist` table
    - Add policy for public read access (needed for GeoIP function)
    - Add policy for admin-only write access
  
  3. Initial Data
    - Insert France (FR) as the first whitelisted country
  
  4. Indexes
    - Add index on country_code for fast lookups
    - Add composite index on (country_code, is_active) for optimal query performance
  
  5. Notes
    - This table is used by the GeoIP Edge Function to determine which countries
      get unrestricted access to all tournaments regardless of eligibility restrictions
    - Users from whitelisted countries can see and register for ANY tournament
    - The system is designed to be easily extensible to other countries in the future
*/

-- Create the country_whitelist table
CREATE TABLE IF NOT EXISTS country_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text UNIQUE NOT NULL,
  country_name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_country_whitelist_country_code 
  ON country_whitelist(country_code);

CREATE INDEX IF NOT EXISTS idx_country_whitelist_active 
  ON country_whitelist(country_code, is_active) 
  WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE country_whitelist ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (needed for GeoIP Edge Function)
CREATE POLICY "Public can read active whitelisted countries"
  ON country_whitelist
  FOR SELECT
  TO public
  USING (true);

-- Policy for authenticated admin users to manage whitelist
CREATE POLICY "Admins can manage country whitelist"
  ON country_whitelist
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- Insert initial data: France as the first whitelisted country
INSERT INTO country_whitelist (country_code, country_name, is_active)
VALUES ('FR', 'France', true)
ON CONFLICT (country_code) DO UPDATE
  SET is_active = true,
      updated_at = now();

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_country_whitelist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_country_whitelist_updated_at ON country_whitelist;
CREATE TRIGGER trigger_update_country_whitelist_updated_at
  BEFORE UPDATE ON country_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION update_country_whitelist_updated_at();