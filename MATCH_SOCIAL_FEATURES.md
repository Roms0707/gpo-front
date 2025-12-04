# Match Ready Social Features

This document describes the friend request and team chat features implemented in the Match Ready modal system.

## Overview

When a match is ready, players can now:
1. **Add their opponent as a friend** directly from the match notification
2. **Send direct messages** to their opponent
3. **Open team chat** to coordinate with teammates (for team-based matches)

## Features

### 1. Friend Request System

#### Friendship Status Detection
The modal automatically detects the friendship status between the current user and their opponent:
- **Not Friends**: Shows "Add Friend" button
- **Already Friends**: Displays "Amis" (Friends) badge
- **Request Sent**: Shows "En attente" (Pending) status
- **Request Received**: Displays "Accepter" (Accept) button

#### Implementation
- Uses `checkFriendshipStatus()` to determine relationship status
- Fetches opponent profile information including avatar and country
- Real-time updates when friendship status changes
- Prevents duplicate friend requests

### 2. Direct Messaging

#### Features
- One-on-one chat with match opponent
- Automatic match context message generation
- Includes tournament name, round number, and bracket link
- Pre-populated first message to break the ice

#### Context Message Format
```
⚔️ Match Ready!

Tournament: [Tournament Name]
Round: [Round Number]
Opponent: [Opponent Username]

Good luck and have a great match!

🔗 View bracket: [Bracket URL]
```

### 3. Team Chat

#### Features
- Dedicated chat channel for team members
- Automatic team member enrollment
- Welcome message with team roster
- Persists throughout the tournament
- Channel type: `match_team`

#### Team Chat Creation
- Creates or retrieves existing team chat channel
- Adds all validated team members automatically
- Sends welcome message with context
- Links to specific match and tournament

#### Welcome Message Format
```
👥 Team Chat Created!

Tournament: [Tournament Name]
Round: [Round Number]

Team Members:
1. [Player 1]
2. [Player 2]
...

Coordinate with your team and good luck! 🎮
```

## Database Schema

### New Fields in `player_match_notifications`
- `opponent_user_id`: UUID reference to opponent's user account
- `team_id`: UUID reference to the team for team-based matches

### New Fields in `channels`
- `match_id`: Links channel to specific match
- `tournament_id`: Links channel to tournament
- `team_id`: Links channel to team
- `channel_type`: Type of channel (regular, match_team, direct, community)
- `metadata`: JSONB field for additional context
- `is_archived`: Boolean flag for completed matches

### Indexes
- `idx_player_match_notifications_opponent_user_id`: Fast opponent lookups
- `idx_channels_match_id`: Match-based channel queries
- `idx_channels_tournament_id`: Tournament-based channel queries
- `idx_channels_team_id`: Team-based channel queries
- `idx_user_relationships_both_users`: Bidirectional friend lookups

## Services

### `matchFriendshipService.ts`
Handles all friendship-related operations:
- `checkFriendshipStatus()`: Check relationship between two users
- `getOpponentUserProfile()`: Fetch opponent profile data
- `generateMatchContextMessage()`: Create automatic context message
- `generateTeamChatWelcomeMessage()`: Create team welcome message

### `matchTeamChatService.ts`
Manages team chat channels:
- `getTeamMembersForMatch()`: Fetch all team members
- `findExistingMatchTeamChannel()`: Check for existing channel
- `createMatchTeamChannel()`: Create new team channel
- `addTeamMembersToChannel()`: Enroll team members
- `sendTeamChatWelcomeMessage()`: Send welcome message
- `createAndInitializeTeamChat()`: Complete setup in one call

## Component Updates

### MatchNotificationModal
Enhanced with:
- Opponent profile card with avatar
- Dynamic friend status badge/button
- Dual chat buttons (Direct Message & Team Chat)
- Loading states for async operations
- Error handling with user feedback
- Nested modal support for chat windows

## User Flow

### Adding a Friend
1. User receives match notification
2. Modal loads opponent profile and friendship status
3. User clicks "Add Friend" button
4. System sends friend request
5. Button changes to "En attente" (Pending)
6. Opponent can accept from their Friends page
7. Status updates to "Amis" (Friends) in real-time

### Starting Direct Chat
1. User clicks "Message" button
2. ChatModal opens with opponent as recipient
3. First message is pre-filled with match context
4. User can edit or send as-is
5. Standard direct messaging functionality

### Opening Team Chat
1. User clicks "Chat d'équipe" button
2. System creates or retrieves team channel
3. All team members are automatically added
4. Welcome message is sent with team roster
5. ChannelModal opens for team coordination

## Security

### RLS Policies
- Team chat channels only accessible to team members
- Validates team membership through tournament registrations
- Direct messages restricted to sender and recipient
- Friend requests require authentication

### Permission Checks
- Team chat validates tournament registration status
- Only validated team members can access channels
- Friend requests check for existing relationships
- Prevents self-friend requests

## Error Handling

### Graceful Degradation
- Missing opponent profile: Shows username only
- Failed friend request: Toast notification with retry
- Team chat creation failure: Error message with details
- Network errors: User-friendly error messages

### Loading States
- Spinner while loading opponent data
- Disabled buttons during API calls
- Loading indicator for team chat creation
- Prevents duplicate actions during processing

## Best Practices

### When to Use
- Use direct messages for tactical opponent communication
- Use team chat for team coordination and strategy
- Add friends for future matchups and networking
- Send context messages to establish friendly competition

### User Experience
- Friend buttons show immediate feedback
- Chat opens in overlay without losing match context
- Team chat persists across sessions
- All actions are reversible and non-destructive

## Future Enhancements

### Potential Features
- Unread message badges on chat buttons
- Quick emoji reactions in team chat
- Voice chat integration for teams
- Match statistics sharing in chat
- Tournament-wide announcements
- Post-match friend suggestions
- Team performance analytics in chat

### Analytics Opportunities
- Track friend request acceptance rates
- Measure team chat engagement
- Monitor match context message usage
- Analyze chat activity vs match performance
