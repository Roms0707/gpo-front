/*
  # Add Bracket Ready Notification Type

  1. Purpose
    - Extends the player_match_notifications table to support bracket_ready notification type
    - Enables FaceIt-style notifications when tournament brackets are generated
    
  2. Changes
    - Adds check constraint to allow 'bracket_ready' as a valid notification_type
    - Updates the notification_type constraint to include the new bracket_ready type
    
  3. Use Cases
    - Notify all registered tournament participants when bracket is generated
    - Alert players that the tournament is ready to begin
    - Provide countdown and tournament details before matches start
    
  4. Important Notes
    - This migration is safe and non-destructive
    - Existing notifications remain unchanged
    - New bracket_ready notifications will have round_number = 0
    - Metadata will include: tournament_title, total_participants, tournament_start_time, tournament_image
*/

-- Add bracket_ready to notification_type enum if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'player_match_notifications'
  ) THEN
    -- Drop existing constraint if it exists
    ALTER TABLE player_match_notifications 
    DROP CONSTRAINT IF EXISTS player_match_notifications_notification_type_check;
    
    -- Add updated constraint with bracket_ready type
    ALTER TABLE player_match_notifications 
    ADD CONSTRAINT player_match_notifications_notification_type_check 
    CHECK (notification_type IN ('match_starting', 'match_result', 'next_opponent', 'bracket_ready'));
  END IF;
END $$;
