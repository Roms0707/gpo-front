/*
  # Add full_prize field to tournaments table

  1. Changes
    - Add `full_prize` column to `tournaments` table to store the calculated total prize pool
    - Add `prize_currency` column to store the currency code (FCFA, EUR, USD, etc.)
    - The `full_prize` field will contain the sum of all numeric prizes from `tournament_prizes`
    - The existing `main_prize` field will continue to be used for non-numeric prizes or display purposes
  
  2. Purpose
    - Store pre-calculated prize pool totals for better performance
    - Support displaying "Prize Pool: 1.75M FCFA (1st: 1M FCFA)" format
    - Enable flexible prize display for both numeric and non-numeric rewards
  
  3. Notes
    - `full_prize` can be null if prizes are non-numeric or not yet calculated
    - `prize_currency` defaults to 'FCFA' to match existing tournament structure
    - Existing tournaments will have null `full_prize` until calculated/synced
*/

-- Add full_prize column to store calculated total prize pool
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'full_prize'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN full_prize text;
  END IF;
END $$;

-- Add prize_currency column to store currency code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'prize_currency'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN prize_currency text DEFAULT 'FCFA';
  END IF;
END $$;

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN tournaments.full_prize IS 'Calculated total prize pool from all tournament_prizes. Can be null if prizes are non-numeric.';
COMMENT ON COLUMN tournaments.prize_currency IS 'Currency code for prize amounts (FCFA, EUR, USD, etc.)';
