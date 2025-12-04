/*
  # Add Profile Completion Flag

  1. Changes
    - Add `is_profile_completed` boolean column to `users` table
    - Set default value to `false` for new users
    - Update existing users with completed profiles to `true`

  2. Migration Logic
    - Users with a country set AND username set are considered to have completed their profile
    - New users will default to `false` and must complete profile on first login

  3. Notes
    - This separates profile completion status from country code validation
    - Allows 'TN' to be a valid default country without forcing profile completion
*/

-- Add is_profile_completed column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_profile_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN is_profile_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update existing users who have completed their profiles
-- Consider profile complete if they have a username and country set
UPDATE users
SET is_profile_completed = true
WHERE username IS NOT NULL
  AND username != ''
  AND country IS NOT NULL
  AND country != ''
  AND is_profile_completed IS NOT true;

-- Add comment to column for documentation
COMMENT ON COLUMN users.is_profile_completed IS
  'Tracks whether user has completed initial profile setup. Set to true after first profile edit save.';
