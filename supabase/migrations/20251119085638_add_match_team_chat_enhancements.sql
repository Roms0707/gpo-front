/*
  # Add Match Team Chat Enhancements

  This migration enhances the match notification and team chat systems to support:
  - Direct opponent user ID linking in match notifications
  - Team-based chat channels for match coordination
  - Match context metadata for chat channels
  - Improved indexes for friend status lookups

  ## Changes

  1. **player_match_notifications table enhancements**
     - Add opponent_user_id column for direct user reference
     - Add team_id column to link match participants to their team
     - Add index on opponent_id for faster lookups
  
  2. **channels table enhancements**
     - Add match_id column to link channels to specific matches
     - Add tournament_id column for tournament context
     - Add channel_type to distinguish between regular, match, and team channels
     - Add metadata jsonb field for additional context
     - Add is_archived flag for completed match channels
     - Add indexes for match and tournament lookups
  
  3. **user_relationships table enhancements**
     - Add composite index on both user IDs for bidirectional friend lookups
  
  4. **Security**
     - RLS policies updated to support new fields
     - Team chat channels only accessible to team members
*/

-- Add opponent_user_id and team_id to player_match_notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_match_notifications' AND column_name = 'opponent_user_id'
  ) THEN
    ALTER TABLE player_match_notifications ADD COLUMN opponent_user_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_match_notifications' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE player_match_notifications ADD COLUMN team_id uuid;
  END IF;
END $$;

-- Add index on opponent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_match_notifications_opponent_id 
ON player_match_notifications(opponent_id);

-- Add index on opponent_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_match_notifications_opponent_user_id 
ON player_match_notifications(opponent_user_id);

-- Enhance channels table for match-based team chat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channels' AND column_name = 'match_id'
  ) THEN
    ALTER TABLE channels ADD COLUMN match_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channels' AND column_name = 'tournament_id'
  ) THEN
    ALTER TABLE channels ADD COLUMN tournament_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channels' AND column_name = 'channel_type'
  ) THEN
    ALTER TABLE channels ADD COLUMN channel_type text DEFAULT 'regular';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channels' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE channels ADD COLUMN metadata jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channels' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE channels ADD COLUMN is_archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channels' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE channels ADD COLUMN team_id uuid;
  END IF;
END $$;

-- Add indexes for match and tournament channels
CREATE INDEX IF NOT EXISTS idx_channels_match_id ON channels(match_id);
CREATE INDEX IF NOT EXISTS idx_channels_tournament_id ON channels(tournament_id);
CREATE INDEX IF NOT EXISTS idx_channels_team_id ON channels(team_id);
CREATE INDEX IF NOT EXISTS idx_channels_channel_type ON channels(channel_type);

-- Add composite index on user_relationships for bidirectional lookups
CREATE INDEX IF NOT EXISTS idx_user_relationships_both_users 
ON user_relationships(user_id_1, user_id_2);

CREATE INDEX IF NOT EXISTS idx_user_relationships_user_id_2_status 
ON user_relationships(user_id_2, status);

-- Add constraint to ensure channel_type is valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'channels_channel_type_check'
  ) THEN
    ALTER TABLE channels 
    ADD CONSTRAINT channels_channel_type_check 
    CHECK (channel_type IN ('regular', 'match_team', 'direct', 'community'));
  END IF;
END $$;

-- Update RLS policies for channels to support match team channels
DROP POLICY IF EXISTS "Users can view channels they are members of" ON channels;
CREATE POLICY "Users can view channels they are members of"
  ON channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channels.id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Add policy for viewing match team channels
CREATE POLICY "Team members can view their match team channels"
  ON channels FOR SELECT
  TO authenticated
  USING (
    channel_type = 'match_team' 
    AND team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_registrations.team_id = channels.team_id
      AND tournament_registrations.user_id = auth.uid()
    )
  );

-- Add function to create match team channel
CREATE OR REPLACE FUNCTION create_match_team_channel(
  p_match_id uuid,
  p_tournament_id uuid,
  p_team_id uuid,
  p_tournament_name text,
  p_round_number integer,
  p_created_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel_id uuid;
  v_channel_name text;
BEGIN
  -- Generate channel name
  v_channel_name := 'Team Chat - ' || p_tournament_name || ' (Round ' || p_round_number || ')';
  
  -- Create channel
  INSERT INTO channels (
    name,
    created_by,
    channel_type,
    match_id,
    tournament_id,
    team_id,
    is_private,
    metadata
  ) VALUES (
    v_channel_name,
    p_created_by,
    'match_team',
    p_match_id,
    p_tournament_id,
    p_team_id,
    true,
    jsonb_build_object(
      'tournament_name', p_tournament_name,
      'round_number', p_round_number,
      'created_from_match', true
    )
  )
  RETURNING id INTO v_channel_id;
  
  RETURN v_channel_id;
END;
$$;
