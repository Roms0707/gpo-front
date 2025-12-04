# Reaction Time Game Implementation

## Overview
A fully functional HTML5 reaction time test game integrated into the Gaming Stats page. Players test their reflexes by clicking when the screen turns green, and scores are tracked in the database with leaderboards and personal statistics.

## Implementation Components

### 1. Database Setup
**File:** `supabase/migrations/create_reaction_time_scores_table.sql`

- **Table:** `reaction_time_scores`
  - Columns: `id`, `user_id`, `game_id`, `score` (in milliseconds), `created_at`, `updated_at`
  - Row Level Security (RLS) enabled with policies for read, insert, update, and delete
  - Indexes on `user_id`, `game_id`, `score`, and composite `game_id + score`
  - Auto-update trigger for `updated_at` timestamp

- **Game Entry:** Created in `games` table
  - ID: `e4b0a5a8-c325-4925-8e9c-83d53dcb771c`
  - Name: "Reaction Time Test"
  - Publisher: "Platform Games"

### 2. HTML5 Game
**File:** `/public/reaction-time-game/index.html`

**Game Flow:**
1. Start screen with instructions
2. "Get Ready" screen with random wait time (2-5 seconds)
3. "Wait for it..." red screen (1-2 seconds)
4. Green "CLICK NOW!" screen (timer starts)
5. Results screen showing reaction time and rating

**Features:**
- Too-soon detection (clicking before green)
- Performance ratings: Excellent (<200ms), Great (<250ms), Good (<300ms), Average (<400ms)
- Session statistics: current attempt, average, best, total attempts
- Smooth animations and transitions
- Mobile-responsive design
- PostMessage API for parent communication

### 3. React Component
**File:** `/src/components/games/ReactionTimeGame.tsx`

**Props:**
- `gameName`: Display name for the game
- `gameId`: UUID linking to games table entry

**Features:**
- Real-time leaderboard (top 10 fastest times)
- Personal statistics panel with:
  - Total games played
  - Average reaction time
  - Best (fastest) reaction time
  - Performance improvement percentage
  - Score history (last 20 attempts)
- Local storage persistence for offline stats
- Database integration for authenticated users
- Tips overlay with game instructions
- Fullscreen mode support
- Reset statistics functionality

**State Management:**
- Local state for UI (leaderboard visibility, personal stats, tips overlay)
- LocalStorage for guest user stats persistence
- Supabase real-time queries for leaderboard and personal history

### 4. Translation Support
**Files:** `/src/locales/en.json`, `/src/locales/fr.json`

**New Translation Keys:**
- `gaming.reactionTime`: "Reaction Time" / "Temps de Réaction"
- `gaming.improveYourReactionFor`: Game subtitle
- `gaming.averageReactionTime`: "Average Time" / "Temps Moyen"
- `gaming.fastestReaction`: "Fastest Time" / "Temps le Plus Rapide"
- `gaming.milliseconds`: "ms"
- `gaming.tipWaitForGreen`: Instruction to wait for green screen
- `gaming.tipClickAsFastAsYou`: Click fast instruction
- `gaming.tipDontClickTooEarly`: Warning about clicking too early
- `gaming.tipPracticeImproves`: Practice tip
- `gaming.fastestTimes`: "Fastest Times" / "Temps les Plus Rapides"
- Plus ratings: excellent, good, average, needsImprovement

### 5. Integration
**File:** `/src/pages/GamingStatsPage.tsx`

**Changes:**
- Imported `ReactionTimeGame` component
- Added `'reaction-time'` to activeTab type definition
- Added "Reaction Time" tab button in navigation
- Created dedicated tab content section for Reaction Time game
- Passed game ID (`e4b0a5a8-c325-4925-8e9c-83d53dcb771c`) to component

## How It Works

### For Guest Users:
1. Play the game without authentication
2. See session stats stored in localStorage
3. View global leaderboard (read-only)
4. Prompted to login to save scores permanently

### For Authenticated Users:
1. Play the game
2. Scores automatically saved to database with game_id reference
3. View personal statistics and improvement trends
4. Compare with global leaderboard
5. Track performance over time (last 20 games)

### Score Calculation:
- Measures time from green screen appearing to user click
- Stored in milliseconds (integer)
- Lower score = better (faster reaction)
- Leaderboard sorted ascending (fastest first)

### Communication Flow:
```
HTML5 Game (iframe) → postMessage → React Component → Supabase Database
                    ←    Stats    ← React State     ← Query Results
```

**Messages:**
- `{ source: 'reactionTime', type: 'gameStarted' }` - Hide tips overlay
- `{ source: 'reactionTime', type: 'gameEnded', stats: { score, attempts, average, best } }` - Save score

## Database Queries

### Leaderboard Query:
```sql
SELECT id, score, created_at, users(username, avatar_url)
FROM reaction_time_scores
WHERE game_id = 'e4b0a5a8-c325-4925-8e9c-83d53dcb771c'
ORDER BY score ASC
LIMIT 10
```

### Personal Stats Query:
```sql
SELECT id, score, created_at, users(username, avatar_url)
FROM reaction_time_scores
WHERE user_id = <user_id> AND game_id = <game_id>
ORDER BY created_at DESC
LIMIT 20
```

### Insert Score:
```sql
INSERT INTO reaction_time_scores (user_id, game_id, score)
VALUES (<user_id>, <game_id>, <score_in_ms>)
```

## Future Enhancements

Potential improvements:
1. Multiple rounds mode (best of 5)
2. Difficulty levels (varying wait times)
3. Sound effects
4. Practice mode with unlimited attempts
5. Achievement system (sub-200ms club, consistency awards)
6. Graph visualization of improvement over time
7. Age/demographic comparison statistics
8. Tournament integration

## Testing

To test the implementation:
1. Navigate to Gaming Stats page (requires login)
2. Click "Reaction Time" tab
3. Click to start the game
4. Wait for green screen and click
5. Verify score appears and is saved
6. Check leaderboard updates
7. View personal statistics panel
8. Test with multiple attempts
9. Verify localStorage persistence for stats

## Security

- RLS policies ensure users can only insert their own scores
- Public read access for leaderboards (competitive transparency)
- User can only update/delete their own scores
- Score validation: CHECK constraint (score > 0 AND score < 10000)
- Foreign key constraints on user_id and game_id

## Performance Considerations

- Indexes on frequently queried columns (user_id, game_id, score)
- Composite index for game leaderboard queries
- Limit queries to reasonable sizes (10 for leaderboard, 20 for history)
- localStorage used to reduce database reads for guest users
- Efficient RLS policies with simple conditions

---

**Implementation Date:** November 25, 2025
**Game ID:** e4b0a5a8-c325-4925-8e9c-83d53dcb771c
**Status:** ✅ Fully Implemented and Tested
