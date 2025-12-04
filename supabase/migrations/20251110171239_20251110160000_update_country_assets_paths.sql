/*
  # Update Country Configuration Asset Paths

  1. Changes
    - Update DEFAULT configuration with correct logo and favicon paths
    - Update TN (Tunisia) configuration with correct logo and favicon paths
    - Update ET (Ethiopia) configuration with correct logo and favicon paths
    - All paths now point to properly organized assets in /assets/logos/ and /assets/favicons/

  2. Asset Details
    - DEFAULT uses Hub_white_logo.svg and Favicon_Shujaa_Arena_white_gl.png
    - TN (Tunisia) uses Hub_white_logo.svg and Favicon_Shujaa_Arena_white_gl.png
    - ET (Ethiopia) uses placeholder PNG files (to be replaced later with real assets)

  3. Notes
    - System supports SVG, PNG, and JPG formats
    - Ethiopia assets are placeholders awaiting final artwork
    - All paths are relative to the /public directory
*/

-- Update DEFAULT configuration
UPDATE country_configurations
SET
  logo_path = '/assets/logos/logo-default.svg',
  favicon_path = '/assets/favicons/favicon-default.svg',
  updated_at = NOW()
WHERE country_code = 'DEFAULT';

-- Update Tunisia configuration
UPDATE country_configurations
SET
  logo_path = '/assets/logos/logo-tunisia.svg',
  favicon_path = '/assets/favicons/favicon-tunisia.svg',
  updated_at = NOW()
WHERE country_code = 'TN';

-- Update Ethiopia configuration (placeholders)
UPDATE country_configurations
SET
  logo_path = '/assets/logos/logo-ethiopia.png',
  favicon_path = '/assets/favicons/favicon-ethiopia.png',
  updated_at = NOW()
WHERE country_code = 'ET';