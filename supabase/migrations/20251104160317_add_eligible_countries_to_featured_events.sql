/*
  # Add eligible_countries to featured_events table

  1. Changes
    - Add `eligible_countries` column to `featured_events` table
      - Type: text (nullable)
      - Format: Comma-separated list of country codes (e.g., "CI, MA, SN")
      - NULL or empty means event is available globally
      - Used to filter events based on user's country

  2. Important Notes
    - This field follows the same format as tournaments.eligible_countries
    - When an active featured_event exists with specific countries, only authenticated users from those countries will see the full event
    - Non-authenticated users will see a placeholder when any active event exists
    - Authenticated users from non-eligible countries will see the normal homepage
*/

-- Add eligible_countries column to featured_events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'featured_events' AND column_name = 'eligible_countries'
  ) THEN
    ALTER TABLE featured_events ADD COLUMN eligible_countries text;
  END IF;
END $$;

-- Add index for performance when filtering by eligible_countries
CREATE INDEX IF NOT EXISTS idx_featured_events_eligible_countries
  ON featured_events(eligible_countries)
  WHERE eligible_countries IS NOT NULL;
