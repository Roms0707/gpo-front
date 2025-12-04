/*
  # Setup Automatic Twitch Live Status Sync

  ## Overview
  This migration sets up automatic synchronization of Twitch live status for tournaments every 5 minutes.

  ## IMPORTANT: Manual Setup Required
  After running this migration, you need to:
  1. Enable pg_cron extension in Supabase Dashboard (Database > Extensions)
  2. Enable pg_net extension in Supabase Dashboard (Database > Extensions)
  3. Run this SQL script in the SQL Editor
  4. Set the following Postgres settings in Dashboard (Settings > Database > Settings):
     - app.settings.supabase_url = your_supabase_url
     - app.settings.supabase_anon_key = your_anon_key

  ## Changes Made

  1. **New Tables**
     - `twitch_sync_logs` - Tracks sync execution history, success/failure, and error messages

  2. **Functions**
     - `trigger_twitch_sync()` - PostgreSQL function that calls the Edge Function via HTTP
     - `cleanup_old_sync_logs()` - Removes logs older than 30 days

  3. **Cron Jobs**
     - Schedule `trigger_twitch_sync()` to run every 5 minutes
     - Schedule `cleanup_old_sync_logs()` to run daily at 3 AM

  4. **Indexes**
     - Index on `tournaments(is_twitch_live)` for faster filtering
     - Index on `tournaments(twitch_last_checked)` for monitoring

  5. **Security**
     - Enable RLS on `twitch_sync_logs` table
     - Only authenticated users can read sync logs
*/

-- ============================================================================
-- STEP 1: Enable Required Extensions (do this in Supabase Dashboard first)
-- ============================================================================
-- Go to: Database > Extensions
-- Enable: pg_cron
-- Enable: pg_net

-- ============================================================================
-- STEP 2: Create Tables and Indexes
-- ============================================================================

-- Create twitch_sync_logs table
CREATE TABLE IF NOT EXISTS twitch_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  total_checked integer DEFAULT 0,
  live_channels integer DEFAULT 0,
  offline_channels integer DEFAULT 0,
  errors integer DEFAULT 0,
  error_message text,
  response_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on twitch_sync_logs
ALTER TABLE twitch_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read sync logs
DROP POLICY IF EXISTS "Authenticated users can read sync logs" ON twitch_sync_logs;
CREATE POLICY "Authenticated users can read sync logs"
  ON twitch_sync_logs FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Service role can insert logs
DROP POLICY IF EXISTS "Service role can insert sync logs" ON twitch_sync_logs;
CREATE POLICY "Service role can insert sync logs"
  ON twitch_sync_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can update logs
DROP POLICY IF EXISTS "Service role can update sync logs" ON twitch_sync_logs;
CREATE POLICY "Service role can update sync logs"
  ON twitch_sync_logs FOR UPDATE
  TO service_role
  USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_is_twitch_live
  ON tournaments(is_twitch_live)
  WHERE is_twitch_live = true;

CREATE INDEX IF NOT EXISTS idx_tournaments_twitch_last_checked
  ON tournaments(twitch_last_checked);

CREATE INDEX IF NOT EXISTS idx_twitch_sync_logs_created_at
  ON twitch_sync_logs(created_at DESC);

-- Set default values for existing tournaments if not already set
UPDATE tournaments
SET is_twitch_live = false
WHERE is_twitch_live IS NULL;

-- ============================================================================
-- STEP 3: Create Functions
-- ============================================================================

-- Function to trigger Twitch sync via Edge Function
CREATE OR REPLACE FUNCTION trigger_twitch_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_log_id uuid;
  supabase_url text := 'https://kxpijwthwxlfsxewxrla.supabase.co';
  supabase_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cGlqd3Rod3hsZnN4ZXd4cmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MjAyMDUsImV4cCI6MjA3NTM5NjIwNX0.SODzjbBcw_JWOnvZNUdYvuWZIkGqNb9Ov6Qm9kGEM14';
  request_id bigint;
  result_record record;
BEGIN
  -- Create a new sync log entry
  INSERT INTO twitch_sync_logs (status, started_at)
  VALUES ('running', now())
  RETURNING id INTO sync_log_id;

  -- Make HTTP POST request to Edge Function using pg_net
  BEGIN
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/sync-twitch-live-status',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_key
      ),
      body := '{}'::jsonb
    ) INTO request_id;

    -- Update log as initiated
    UPDATE twitch_sync_logs
    SET
      status = 'initiated',
      completed_at = now()
    WHERE id = sync_log_id;

    RETURN jsonb_build_object(
      'success', true,
      'sync_log_id', sync_log_id,
      'request_id', request_id,
      'message', 'Sync request initiated'
    );

  EXCEPTION WHEN OTHERS THEN
    -- Log the error
    UPDATE twitch_sync_logs
    SET
      status = 'failed',
      completed_at = now(),
      error_message = SQLERRM,
      errors = 1
    WHERE id = sync_log_id;

    -- Return error info
    RETURN jsonb_build_object(
      'success', false,
      'sync_log_id', sync_log_id,
      'error', SQLERRM
    );
  END;
END;
$$;

-- Function to cleanup old sync logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM twitch_sync_logs
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- STEP 4: Setup Cron Jobs
-- ============================================================================

-- Remove any existing jobs with the same names
SELECT cron.unschedule('sync-twitch-live-status-every-5-minutes')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-twitch-live-status-every-5-minutes'
);

SELECT cron.unschedule('cleanup-twitch-sync-logs-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-twitch-sync-logs-daily'
);

-- Create cron job to sync Twitch live status every 5 minutes
SELECT cron.schedule(
  'sync-twitch-live-status-every-5-minutes',
  '*/5 * * * *', -- Every 5 minutes
  $$SELECT trigger_twitch_sync()$$
);

-- Create cron job to cleanup old logs daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-twitch-sync-logs-daily',
  '0 3 * * *', -- Daily at 3 AM UTC
  $$SELECT cleanup_old_sync_logs()$$
);

-- ============================================================================
-- STEP 5: Trigger Initial Sync
-- ============================================================================

-- Trigger an immediate sync to test the setup
SELECT trigger_twitch_sync();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if cron jobs are scheduled
-- SELECT * FROM cron.job WHERE jobname LIKE '%twitch%';

-- Check sync logs
-- SELECT * FROM twitch_sync_logs ORDER BY created_at DESC LIMIT 10;

-- Check tournaments with Twitch URLs
-- SELECT id, title, twitch_url, is_twitch_live, twitch_last_checked
-- FROM tournaments
-- WHERE twitch_url IS NOT NULL
-- ORDER BY twitch_last_checked DESC NULLS LAST;
