/*
  # Match Social Features - Friend Requests and Team Chat

  ## Overview
  This migration adds comprehensive social features for post-match interactions including:
  - Friend request system between match opponents
  - Team-based chat functionality
  - Message read status tracking
  - Comprehensive security through RLS policies

  ## New Tables

  ### `match_friend_requests`
  Manages friend requests sent between players after matches
  - `id` (uuid, primary key) - Unique identifier
  - `match_id` (uuid) - Reference to the match
  - `sender_id` (uuid) - User who sent the request
  - `receiver_id` (uuid) - User who received the request
  - `status` (text) - Request status: 'pending', 'accepted', 'rejected'
  - `message` (text, optional) - Personal message with the request
  - `created_at` (timestamptz) - When request was sent
  - `updated_at` (timestamptz) - When status last changed

  ### `match_team_chat_messages`
  Stores chat messages within team contexts during/after matches
  - `id` (uuid, primary key) - Unique identifier
  - `match_id` (uuid) - Reference to the match
  - `team_id` (uuid) - Reference to the team
  - `sender_id` (uuid) - User who sent the message
  - `content` (text) - Message content
  - `created_at` (timestamptz) - When message was sent

  ### `match_team_chat_read_status`
  Tracks which users have read which messages
  - `id` (uuid, primary key) - Unique identifier
  - `message_id` (uuid) - Reference to the message
  - `user_id` (uuid) - User who read the message
  - `read_at` (timestamptz) - When message was read

  ## Security (RLS)
  
  ### Friend Requests
  1. Users can view their own sent/received requests
  2. Users can create requests for matches they participated in
  3. Users can update only their received requests
  4. Users can delete their own sent requests

  ### Team Chat
  1. Team members can view their team's chat messages
  2. Team members can send messages to their team
  3. Team members can mark messages as read
  4. Only message owners can delete their messages

  ## Indexes
  - Fast lookups by match_id, sender_id, receiver_id, team_id
  - Optimized queries for pending requests and unread messages
*/

-- Create match_friend_requests table
CREATE TABLE IF NOT EXISTS match_friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_requests CHECK (sender_id != receiver_id),
  CONSTRAINT unique_match_friend_request UNIQUE (match_id, sender_id, receiver_id)
);

-- Create match_team_chat_messages table
CREATE TABLE IF NOT EXISTS match_team_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  team_id uuid NOT NULL,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create match_team_chat_read_status table
CREATE TABLE IF NOT EXISTS match_team_chat_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES match_team_chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  CONSTRAINT unique_message_read UNIQUE (message_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_friend_requests_match ON match_friend_requests(match_id);
CREATE INDEX IF NOT EXISTS idx_match_friend_requests_sender ON match_friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_match_friend_requests_receiver ON match_friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_match_friend_requests_status ON match_friend_requests(status);

CREATE INDEX IF NOT EXISTS idx_match_team_chat_messages_match ON match_team_chat_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_match_team_chat_messages_team ON match_team_chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_match_team_chat_messages_sender ON match_team_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_match_team_chat_messages_created ON match_team_chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_team_chat_read_status_message ON match_team_chat_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_match_team_chat_read_status_user ON match_team_chat_read_status(user_id);

-- Enable RLS
ALTER TABLE match_friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_team_chat_read_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_friend_requests

-- Users can view their own sent or received requests
CREATE POLICY "Users can view own friend requests"
  ON match_friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send friend requests (creation will be validated by edge function)
CREATE POLICY "Users can send friend requests"
  ON match_friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can update requests they received (to accept/reject)
CREATE POLICY "Users can update received requests"
  ON match_friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Users can delete their own sent requests
CREATE POLICY "Users can delete own sent requests"
  ON match_friend_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- RLS Policies for match_team_chat_messages

-- Team members can view their team's messages
CREATE POLICY "Team members can view team messages"
  ON match_team_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = match_team_chat_messages.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.status = 'active'
    )
  );

-- Team members can send messages
CREATE POLICY "Team members can send messages"
  ON match_team_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = match_team_chat_messages.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.status = 'active'
    )
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON match_team_chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- RLS Policies for match_team_chat_read_status

-- Users can view their own read status
CREATE POLICY "Users can view own read status"
  ON match_team_chat_read_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
  ON match_team_chat_read_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_friend_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on match_friend_requests
DROP TRIGGER IF EXISTS update_match_friend_requests_updated_at ON match_friend_requests;
CREATE TRIGGER update_match_friend_requests_updated_at
  BEFORE UPDATE ON match_friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_match_friend_requests_updated_at();