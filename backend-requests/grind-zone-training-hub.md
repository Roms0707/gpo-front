# Grind Zone Training Hub - Backend Requirements

## 1. Persistent Video Progress Tracking

### New Table: `grind_zone_video_progress`

Track which videos each user has watched per playlist (rubric), replacing the current sessionStorage-only tracking which resets on page refresh.

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK, default gen_random_uuid() | Row ID |
| `user_id` | uuid, NOT NULL, FK -> auth.users(id) | The user |
| `rubric_id` | text, NOT NULL | Galaxy rubric ID (playlist) |
| `video_id` | text, NOT NULL | Galaxy content item ID |
| `game_id` | uuid, NOT NULL | Game this content belongs to |
| `project_config_id` | text | White-label config ID |
| `watched_at` | timestamptz, default now() | When the video was watched |

- Unique constraint on `(user_id, rubric_id, video_id)` to prevent duplicates
- RLS: users can SELECT and INSERT their own rows only
- Index on `(user_id, game_id)` for dashboard queries

### SQL

```sql
CREATE TABLE IF NOT EXISTS grind_zone_video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  rubric_id text NOT NULL,
  video_id text NOT NULL,
  game_id uuid NOT NULL,
  project_config_id text,
  watched_at timestamptz DEFAULT now(),
  UNIQUE(user_id, rubric_id, video_id)
);

CREATE INDEX idx_gz_video_progress_user_game ON grind_zone_video_progress(user_id, game_id);

ALTER TABLE grind_zone_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video progress"
  ON grind_zone_video_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video progress"
  ON grind_zone_video_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

## 2. Generate Training Plan Edge Function

### Endpoint: `generate-training-plan`

Generates a personalized 7-day training plan for a user based on their completed playlists, quiz scores, active coaching quests, and performance data.

### Request

```json
{
  "user_id": "uuid",
  "game_id": "uuid",
  "game_name": "string",
  "performance_context": {} // optional
}
```

### Logic

1. Query `grind_zone_quiz_submissions` for the user's completed playlists
2. Query `coaching_quests` for active quests
3. Query available rubrics from Galaxy for the game
4. Generate a 7-day plan with 2-3 activities per day:
   - `watch_playlist` - Watch a specific uncompleted playlist
   - `complete_quiz` - Take quiz for a watched playlist
   - `skill_lab_warmup` - Play aim trainer or reaction time game
   - `coaching_quest` - Work on an active coaching quest
5. Store each activity as a row in `user_coaching_goals` with:
   - `goal_type`: one of the activity types above
   - `goal_description`: human-readable description
   - `target_value`: 1 (binary completion)
   - `current_value`: 0
   - `week_start_date`: Monday of the current week

### Response

```json
{
  "success": true,
  "plan": {
    "week_start": "2026-02-24",
    "days": [
      {
        "day": "Monday",
        "activities": [
          { "type": "watch_playlist", "title": "Wave Management Basics", "rubric_id": "..." },
          { "type": "skill_lab_warmup", "title": "Aim Trainer Warmup" }
        ]
      }
    ]
  }
}
```

---

## 3. XP Rewards for Grind Zone Activity

### Triggers or Edge Function Logic

Award XP when users complete Grind Zone activities:

- **Quiz Passed** (score >= 80%): +50 XP
- **Playlist Fully Watched** (all videos in rubric): +25 XP
- **First Quiz of the Week**: +10 XP bonus

This should integrate with the existing XP calculation system. Currently XP is computed from tournaments, validated accounts, profile completion, and friends count. The Grind Zone XP should add to the same total.

### Implementation Options

**Option A**: Add a trigger on `grind_zone_quiz_submissions` that fires when `is_completed` becomes `true` and inserts an XP event row.

**Option B**: Add Grind Zone completion counts to the existing `fetch-user-profile-aggregated` Edge Function calculation.

---

## 4. Aggregated User Stats View

### View: `grind_zone_user_stats`

Pre-compute per-user, per-game training stats to avoid expensive aggregation on every page load.

```sql
CREATE OR REPLACE VIEW grind_zone_user_stats AS
SELECT
  s.user_id,
  s.game_id,
  COUNT(DISTINCT s.id) FILTER (WHERE s.is_completed = true) AS playlists_completed,
  COUNT(DISTINCT s.id) FILTER (WHERE s.is_completed = true AND s.score::float / NULLIF(s.total_questions, 0) >= 0.8) AS quizzes_passed,
  COALESCE(AVG(s.score::float / NULLIF(s.total_questions, 0)) FILTER (WHERE s.is_completed = true), 0) AS avg_quiz_score,
  COALESCE(vp.total_videos, 0) AS total_videos_watched
FROM grind_zone_quiz_submissions s
LEFT JOIN (
  SELECT user_id, game_id, COUNT(*) AS total_videos
  FROM grind_zone_video_progress
  GROUP BY user_id, game_id
) vp ON vp.user_id = s.user_id AND vp.game_id = s.game_id
GROUP BY s.user_id, s.game_id, vp.total_videos;
```

RLS: Apply appropriate policies so users can only see their own stats.
