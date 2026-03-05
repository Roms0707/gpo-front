# Fix AI Coaching - Missing OpenAI API Key

## Problem

The `ai-coaching-chat` edge function is deployed and ACTIVE (`fce1feac-1ac3-4af1-975b-bd86a1f4fbc7`) but **cannot function** because `OPENAI_API_KEY` is not configured as a Supabase Edge Function secret.

Currently deployed secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `DISCORD_BOT_TOKEN`

**Missing:** `OPENAI_API_KEY` (and optionally `OPENAI_MODEL` if the function supports model selection)

Every user message sent to the AI coach currently fails silently. The frontend hook (`useAICoachingSession`) catches the error and removes the user's message from the chat, but no error feedback is shown to the user.

---

## Impact

The entire AI coaching feature is non-functional. This affects:

- **9 fully configured games:** League of Legends, Valorant, Fortnite, Apex Legends, Counter Strike 2, Call of Duty: Warzone, Overwatch, Rocket League, FC26
- **6 database tables** already populated with coaching config: `coaching_ai_config`, `game_coaching_ui_config`, `coaching_topic_content_links`, `ai_coaching_sessions`, `coaching_content_recommendations`, `coaching_quests`
- **Frontend components fully built:** `AICoachChat`, `CoachingSessionsSidebar`, `PerformanceContextCard`, `ManualGameProfileSetup`, `CoachingQuestPanel`, `CoachingMessageRenderer`, `VideoSuggestionsInline`, `GameHubCoachingTab`
- **Hooks ready:** `useAICoachingSession`, `useLoLCoachingAnalysis`, `useGameCoachingConfig`

---

## Required Action

### 1. Add `OPENAI_API_KEY` Secret

Add a valid OpenAI API key as a Supabase Edge Function secret named `OPENAI_API_KEY`.

This key must have access to the Chat Completions API (GPT-4o or GPT-4o-mini recommended).

### 2. (Optional) Add `OPENAI_MODEL` Secret

If the edge function reads a model name from environment variables, set `OPENAI_MODEL` to the desired model (e.g. `gpt-4o-mini` for cost efficiency, `gpt-4o` for quality).

---

## Verification Steps

After adding the secret:

1. **Send a test message** in any game's Coaching tab (e.g. League of Legends)
2. **Verify the response** comes back as `{ success: true, message: "..." }`
3. **Check `ai_coaching_sessions` table** - a new row should be created with the session messages
4. **Check `coaching_content_recommendations`** - video recommendations should be stored if the AI suggests videos
5. **Verify `coaching_ai_config` is consumed** - the edge function should read `custom_prompt_section`, `behavior_toggle`, `emphasis_areas`, and `topic_priority` rows to build the system prompt per game

---

## Frontend Error Handling Note

The frontend hook `useAICoachingSession` (line 165-168) already catches errors and sets an `error` state, but `GameHubCoachingTab` (line 78-87) does **not** destructure or display the `error` value from the hook. Once the key is added and working, a follow-up frontend task should:

- Destructure `error` from `useAICoachingSession`
- Display an inline error banner in the chat when the edge function fails
- Add retry capability for failed messages

This is a **frontend-only** change and does not require backend work.

---

## Related Edge Functions

| Function | Status | Purpose |
|---|---|---|
| `ai-coaching-chat` | ACTIVE (broken) | Main AI chat - needs `OPENAI_API_KEY` |
| `fetch-coaching-videos` | ACTIVE | Fetches video recommendations for coaching |
| `fetch-external-stats` | ACTIVE | Fetches external player stats for coaching context |

---

## Priority

**High** - This is a complete feature blocker. The entire coaching experience (chat, quests, video recommendations) depends on this edge function working.
