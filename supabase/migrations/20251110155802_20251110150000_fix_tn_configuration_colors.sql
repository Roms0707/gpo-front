/*
  # Fix Tunisia Configuration Colors

  1. Changes
    - Update TN configuration to have correct accent color (#22D862 instead of #FF6B00)
    - Update TN configuration to have correct secondary color (#0A391A instead of #FF6B00)
    - This aligns the TN configuration with the expected green theme

  2. Notes
    - PRIMARY stays #22D862 (green) - correct
    - SECONDARY changes from #FF6B00 (orange) to #0A391A (dark green)
    - ACCENT changes from #FF6B00 (orange) to #22D862 (green)
    - All other colors remain unchanged
*/

UPDATE country_configurations
SET
  theme_colors = jsonb_set(
    jsonb_set(
      theme_colors,
      '{accent}',
      '"#22D862"'
    ),
    '{secondary}',
    '"#0A391A"'
  ),
  updated_at = NOW()
WHERE country_code = 'TN';
