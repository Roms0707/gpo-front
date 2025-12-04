/*
  # Create featured_events table

  1. New Tables
    - `featured_events`
      - `id` (uuid, primary key)
      - `tournament_id` (uuid, foreign key to tournaments)
      - `is_active` (boolean, default false) - Only one event should be active at a time
      - `banner_image_url` (text) - URL for the hero banner image
      - `event_subtitle` (text) - Custom subtitle for the event
      - `phase_1_label` (text) - Label for first phase (e.g., "Inscription")
      - `phase_1_date` (timestamptz) - Start date of phase 1
      - `phase_2_label` (text) - Label for second phase (e.g., "Phase Qualificative")
      - `phase_2_date` (timestamptz) - Start date of phase 2
      - `phase_3_label` (text) - Label for third phase (e.g., "Finale à Casablanca")
      - `phase_3_date` (timestamptz) - Start date of phase 3
      - `phase_3_end_date` (timestamptz) - End date of phase 3 (when to hide the event)
      - `cta_text` (text) - Call-to-action button text
      - `cta_link` (text) - Call-to-action link
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `featured_events` table
    - Add policy for public read access
    - Add policy for authenticated admin users to manage events

  3. Important Notes
    - Only one event should have is_active = true at a time
    - The event will auto-hide after phase_3_end_date
    - Foreign key relationship with tournaments table for data consistency
*/

-- Create the featured_events table
CREATE TABLE IF NOT EXISTS featured_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  is_active boolean DEFAULT false,
  banner_image_url text,
  event_subtitle text,
  phase_1_label text DEFAULT 'Inscription',
  phase_1_date timestamptz NOT NULL,
  phase_2_label text DEFAULT 'Phase Qualificative',
  phase_2_date timestamptz NOT NULL,
  phase_3_label text DEFAULT 'Finale',
  phase_3_date timestamptz NOT NULL,
  phase_3_end_date timestamptz NOT NULL,
  cta_text text DEFAULT 'Participer au tournoi',
  cta_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index on is_active for performance
CREATE INDEX IF NOT EXISTS idx_featured_events_is_active
  ON featured_events(is_active)
  WHERE is_active = true;

-- Add index on tournament_id
CREATE INDEX IF NOT EXISTS idx_featured_events_tournament_id
  ON featured_events(tournament_id);

-- Enable Row Level Security
ALTER TABLE featured_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active featured events
CREATE POLICY "Anyone can read active featured events"
  ON featured_events
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can read all featured events
CREATE POLICY "Authenticated users can read all featured events"
  ON featured_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert featured events
CREATE POLICY "Only admins can insert featured events"
  ON featured_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- Policy: Only admins can update featured events
CREATE POLICY "Only admins can update featured events"
  ON featured_events
  FOR UPDATE
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

-- Policy: Only admins can delete featured events
CREATE POLICY "Only admins can delete featured events"
  ON featured_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_featured_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_featured_events_updated_at_trigger ON featured_events;
CREATE TRIGGER update_featured_events_updated_at_trigger
  BEFORE UPDATE ON featured_events
  FOR EACH ROW
  EXECUTE FUNCTION update_featured_events_updated_at();

-- Function to ensure only one active event at a time
CREATE OR REPLACE FUNCTION ensure_single_active_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other events
    UPDATE featured_events
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one active event
DROP TRIGGER IF EXISTS ensure_single_active_event_trigger ON featured_events;
CREATE TRIGGER ensure_single_active_event_trigger
  BEFORE INSERT OR UPDATE ON featured_events
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_event();
