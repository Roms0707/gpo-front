/*
  # Create Reaction Time Scores Table

  1. New Tables
    - `reaction_time_scores`
      - `id` (uuid, primary key) - Unique identifier for each score entry
      - `user_id` (uuid, foreign key) - References users table
      - `game_id` (uuid, foreign key) - References games table to link scores to specific games
      - `score` (integer) - Reaction time in milliseconds (lower is better)
      - `created_at` (timestamptz) - When the score was recorded
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `reaction_time_scores` table
    - Add policy for anyone to read scores (for public leaderboards)
    - Add policy for authenticated users to insert their own scores
    - Add policy for users to read their own score history

  3. Indexes
    - Index on `user_id` for fast user history queries
    - Index on `game_id` for game-specific leaderboards
    - Index on `score` for leaderboard ordering
    - Composite index on `game_id, score` for optimized leaderboard queries

  4. Important Notes
    - Scores are stored in milliseconds
    - Lower scores are better (faster reaction time)
    - Each score is linked to a specific game via game_id
    - Users can have multiple scores to track improvement over time
*/

-- Create the reaction_time_scores table
CREATE TABLE IF NOT EXISTS reaction_time_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score > 0 AND score < 10000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reaction_time_scores_user_id ON reaction_time_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_reaction_time_scores_game_id ON reaction_time_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_reaction_time_scores_score ON reaction_time_scores(score);
CREATE INDEX IF NOT EXISTS idx_reaction_time_scores_game_score ON reaction_time_scores(game_id, score);
CREATE INDEX IF NOT EXISTS idx_reaction_time_scores_created_at ON reaction_time_scores(created_at DESC);

-- Enable Row Level Security
ALTER TABLE reaction_time_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read scores (for leaderboards)
CREATE POLICY "Anyone can view reaction time scores"
  ON reaction_time_scores
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own scores
CREATE POLICY "Users can insert own reaction time scores"
  ON reaction_time_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own scores
CREATE POLICY "Users can update own reaction time scores"
  ON reaction_time_scores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own scores
CREATE POLICY "Users can delete own reaction time scores"
  ON reaction_time_scores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reaction_time_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS set_reaction_time_scores_updated_at ON reaction_time_scores;
CREATE TRIGGER set_reaction_time_scores_updated_at
  BEFORE UPDATE ON reaction_time_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_time_scores_updated_at();
