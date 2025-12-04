# Match Social Features Integration Guide

This guide explains how to integrate the match social features (friend requests and team chat) into your tournament system.

## Overview

The match social features allow players to:
1. Send friend requests to opponents after completing a match
2. Chat with teammates during and after matches
3. Build connections within the gaming community

## Database Tables

The following tables have been created:

### `match_friend_requests`
- Stores friend requests between players after matches
- Fields: match_id, sender_id, receiver_id, status, message, created_at, updated_at
- Statuses: pending, accepted, rejected

### `match_team_chat_messages`
- Stores team chat messages for a specific match
- Fields: match_id, team_id, sender_id, content, created_at

### `match_team_chat_read_status`
- Tracks which users have read which messages
- Fields: message_id, user_id, read_at

## Components

### 1. PostMatchSocialPanel
Main component that appears after a match is completed.

**Props:**
```typescript
{
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  roundNumber: number;
  opponentId: string | null;
  userTeamId: string | null;
  onClose: () => void;
}
```

**Usage:**
```tsx
import PostMatchSocialPanel from './components/tournaments/PostMatchSocialPanel';

<PostMatchSocialPanel
  matchId="match-uuid"
  tournamentId="tournament-uuid"
  tournamentName="Summer Championship"
  roundNumber={2}
  opponentId="opponent-user-id"
  userTeamId="team-uuid"
  onClose={() => setShowPanel(false)}
/>
```

### 2. AddFriendModal
Modal for sending friend requests to opponents.

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  opponentId: string;
  opponentUsername: string;
  opponentAvatar: string | null;
  tournamentName: string;
  roundNumber: number;
  onSuccess: () => void;
}
```

### 3. TeamChatModal
Modal for team communication during matches.

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  tournamentId: string;
  teamId: string;
  tournamentName: string;
  roundNumber: number;
}
```

## Integration Steps

### Step 1: Listen for Match Completion

Add a real-time subscription to detect when matches are completed:

```typescript
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { user } = useAuth();

useEffect(() => {
  if (!user?.id || !tournamentId) return;

  const channel = supabase
    .channel(`tournament-matches-${tournamentId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tournament_matches',
      filter: `tournament_id=eq.${tournamentId}`
    }, async (payload) => {
      const updatedMatch = payload.new;

      // Check if match is completed (has a winner)
      if (updatedMatch.winner_id) {
        // Check if current user is involved in this match
        const isUserInvolved = await checkIfUserInvolvedInMatch(
          updatedMatch.id,
          updatedMatch.player1_id,
          updatedMatch.player2_id
        );

        if (isUserInvolved) {
          // Show social panel
          showPostMatchSocialPanel(updatedMatch);
        }
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id, tournamentId]);
```

### Step 2: Determine User Involvement

For solo tournaments:

```typescript
const checkIfUserInvolvedInMatch = async (
  matchId: string,
  player1Id: string | null,
  player2Id: string | null
): Promise<boolean> => {
  if (!user?.id) return false;
  return user.id === player1Id || user.id === player2Id;
};
```

For team tournaments:

```typescript
const checkIfUserInvolvedInMatch = async (
  matchId: string,
  team1Id: string | null,
  team2Id: string | null
): Promise<boolean> => {
  if (!user?.id) return false;

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (!teamMembers || teamMembers.length === 0) return false;

  const userTeamIds = teamMembers.map(tm => tm.team_id);
  return userTeamIds.includes(team1Id || '') || userTeamIds.includes(team2Id || '');
};
```

### Step 3: Get Opponent Information

For solo tournaments:

```typescript
const getOpponentForMatch = (
  player1Id: string | null,
  player2Id: string | null
): string | null => {
  if (!user?.id || !player1Id || !player2Id) return null;

  if (user.id === player1Id) {
    return player2Id;
  } else if (user.id === player2Id) {
    return player1Id;
  }

  return null;
};
```

For team tournaments (get opposing team's representative player):

```typescript
const getOpponentForMatch = async (
  team1Id: string | null,
  team2Id: string | null
): Promise<string | null> => {
  if (!user?.id || !team1Id || !team2Id) return null;

  // Get user's team
  const { data: userTeam } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!userTeam) return null;

  // Determine opponent team
  const opponentTeamId = userTeam.team_id === team1Id ? team2Id : team1Id;

  // Get captain or first member of opponent team
  const { data: opponentMember } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', opponentTeamId)
    .eq('status', 'active')
    .order('role', { ascending: true })
    .limit(1)
    .maybeSingle();

  return opponentMember?.user_id || null;
};
```

### Step 4: Show the Social Panel

```typescript
const [showSocialPanel, setShowSocialPanel] = useState(false);
const [matchData, setMatchData] = useState({
  matchId: '',
  roundNumber: 0,
  opponentId: null as string | null,
  userTeamId: null as string | null
});

const showPostMatchSocialPanel = async (match: any) => {
  const opponent = await getOpponentForMatch(
    match.player1_id,
    match.player2_id
  );

  let teamId = null;
  if (isTeamTournament) {
    teamId = await getUserTeamId();
  }

  setMatchData({
    matchId: match.id,
    roundNumber: match.round,
    opponentId: opponent,
    userTeamId: teamId
  });

  setShowSocialPanel(true);
};

// In your render:
{showSocialPanel && (
  <PostMatchSocialPanel
    matchId={matchData.matchId}
    tournamentId={tournamentId}
    tournamentName={tournamentName}
    roundNumber={matchData.roundNumber}
    opponentId={matchData.opponentId}
    userTeamId={matchData.userTeamId}
    onClose={() => setShowSocialPanel(false)}
  />
)}
```

## Example Implementation

See `PostMatchSocialPanelExample.tsx` for a complete working example that can be integrated into the TournamentPage.

## Features

### Friend Requests
- Users can send friend requests to opponents after matches
- Optional personal message with the request
- Request status tracking (pending, accepted, rejected)
- Prevents duplicate requests

### Team Chat
- Real-time messaging between team members
- Automatic welcome message on first use
- Message read status tracking
- Persistent chat history for the match

## Security

All tables use Row Level Security (RLS):
- Friend requests: Users can only view/modify their own requests
- Team chat: Only team members can view/send messages
- Read status: Users can only manage their own read status

## Notes

1. The social panel automatically checks for existing friend requests to prevent duplicates
2. Team chat is only available for team tournaments
3. Friend requests are only available when there's a valid opponent
4. The panel can be dismissed and won't show again for the same match
5. All operations are protected by RLS policies for security
