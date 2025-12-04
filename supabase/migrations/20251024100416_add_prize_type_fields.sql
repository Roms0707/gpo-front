/*
  # Add Prize Type Fields to Tournament Prizes

  1. Changes
    - Add `prize_type` column (ENUM: 'monetary', 'physical_digital') to distinguish reward types
    - Add `monetary_amount` column (DECIMAL) to store numeric monetary values
    - Add `currency` column (TEXT) to store currency code (FCFA, EUR, USD, etc.)
    - Add `redemption_code` column (TEXT) to store codes for physical/digital rewards
    - Modify `image_url` column description to clarify usage for physical/digital rewards

  2. Purpose
    - Support both monetary and physical/digital prize types in tournaments
    - Enable flexible reward systems with proper data structure
    - Maintain backward compatibility with existing prize_name field
    - Allow tournaments to offer mixed reward types (monetary OR physical/digital per position)

  3. Business Logic
    - If prize_type = 'monetary': monetary_amount and currency must be set, prize_name can be auto-generated
    - If prize_type = 'physical_digital': prize_name (description) and optionally image_url should be set
    - redemption_code is only relevant for physical_digital prizes (for winners to claim)
    - Each position can only have ONE prize type (not both)

  4. Notes
    - Existing prizes will default to 'monetary' type for backward compatibility
    - The prize_name field remains as the primary description field for all types
    - Display logic will be handled in the frontend based on prize_type
*/

-- Create ENUM type for prize_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prize_type_enum') THEN
    CREATE TYPE prize_type_enum AS ENUM ('monetary', 'physical_digital');
  END IF;
END $$;

-- Add prize_type column with default 'monetary' for backward compatibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_prizes' AND column_name = 'prize_type'
  ) THEN
    ALTER TABLE tournament_prizes ADD COLUMN prize_type prize_type_enum DEFAULT 'monetary';
  END IF;
END $$;

-- Add monetary_amount column for storing numeric prize values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_prizes' AND column_name = 'monetary_amount'
  ) THEN
    ALTER TABLE tournament_prizes ADD COLUMN monetary_amount DECIMAL(15, 2);
  END IF;
END $$;

-- Add currency column with default 'FCFA'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_prizes' AND column_name = 'currency'
  ) THEN
    ALTER TABLE tournament_prizes ADD COLUMN currency TEXT DEFAULT 'FCFA';
  END IF;
END $$;

-- Add redemption_code column for physical/digital prizes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_prizes' AND column_name = 'redemption_code'
  ) THEN
    ALTER TABLE tournament_prizes ADD COLUMN redemption_code TEXT;
  END IF;
END $$;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN tournament_prizes.prize_type IS 'Type of prize: monetary (cash) or physical_digital (goods/codes)';
COMMENT ON COLUMN tournament_prizes.monetary_amount IS 'Numeric value for monetary prizes. Required if prize_type is monetary.';
COMMENT ON COLUMN tournament_prizes.currency IS 'Currency code for monetary prizes (FCFA, EUR, USD, etc.)';
COMMENT ON COLUMN tournament_prizes.redemption_code IS 'Code for winners to claim physical/digital prizes. Only used for physical_digital type.';
COMMENT ON COLUMN tournament_prizes.image_url IS 'Image URL for the prize. Primarily used for physical_digital prizes to show product image.';
COMMENT ON COLUMN tournament_prizes.prize_name IS 'Description of the prize. Used for both monetary (e.g., "1,000,000 FCFA") and physical_digital (product description) types.';

-- Create index for filtering by prize_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'tournament_prizes' AND indexname = 'idx_tournament_prizes_prize_type'
  ) THEN
    CREATE INDEX idx_tournament_prizes_prize_type ON tournament_prizes(prize_type);
  END IF;
END $$;

-- Create index for tournament_id + prize_type for efficient queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'tournament_prizes' AND indexname = 'idx_tournament_prizes_tournament_prize_type'
  ) THEN
    CREATE INDEX idx_tournament_prizes_tournament_prize_type ON tournament_prizes(tournament_id, prize_type);
  END IF;
END $$;
