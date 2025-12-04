/*
  # Create or update toto table

  1. New Tables
    - `toto`
      - `id` (uuid, primary key) - Unique identifier for each record
      - `guzman` (text) - First data column
      - `servoz` (text) - Second data column
      - `created_at` (timestamptz) - Timestamp of record creation

  2. Security
    - Enable RLS on `toto` table
    - Add policies for authenticated users to perform all operations
*/

-- Create the toto table if it doesn't exist
CREATE TABLE IF NOT EXISTS toto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guzman text,
  servoz text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE toto ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view toto records" ON toto;
DROP POLICY IF EXISTS "Authenticated users can insert toto records" ON toto;
DROP POLICY IF EXISTS "Authenticated users can update toto records" ON toto;
DROP POLICY IF EXISTS "Authenticated users can delete toto records" ON toto;

-- Create policies
CREATE POLICY "Authenticated users can view toto records"
  ON toto
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert toto records"
  ON toto
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update toto records"
  ON toto
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete toto records"
  ON toto
  FOR DELETE
  TO authenticated
  USING (true);