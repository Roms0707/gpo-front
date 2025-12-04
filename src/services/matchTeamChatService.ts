import { supabase } from '../lib/supabase';

export interface TeamMember {
  id: string;
  username: string;
  avatar_url?: string | null;
}

export interface MatchTeamChannel {
  id: string;
  name: string;
  match_id: string;
  tournament_id: string;
  team_id: string;
  created_at: string;
  metadata?: any;
}

export const getTeamMembersForMatch = async (
  teamId: string
): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select(`
        user_id,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'validated');

    if (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }

    return (data || []).map(item => ({
      id: item.users.id,
      username: item.users.username,
      avatar_url: item.users.avatar_url
    }));
  } catch (error) {
    console.error('Error in getTeamMembersForMatch:', error);
    throw error;
  }
};

export const findExistingMatchTeamChannel = async (
  matchId: string,
  teamId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('id')
      .eq('match_id', matchId)
      .eq('team_id', teamId)
      .eq('channel_type', 'match_team')
      .maybeSingle();

    if (error) {
      console.error('Error finding existing match team channel:', error);
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in findExistingMatchTeamChannel:', error);
    throw error;
  }
};

export const createMatchTeamChannel = async (
  matchId: string,
  tournamentId: string,
  teamId: string,
  tournamentName: string,
  roundNumber: number,
  createdBy: string
): Promise<string> => {
  try {
    const existingChannelId = await findExistingMatchTeamChannel(matchId, teamId);

    if (existingChannelId) {
      return existingChannelId;
    }

    const { data, error } = await supabase.rpc('create_match_team_channel', {
      p_match_id: matchId,
      p_tournament_id: tournamentId,
      p_team_id: teamId,
      p_tournament_name: tournamentName,
      p_round_number: roundNumber,
      p_created_by: createdBy
    });

    if (error) {
      console.error('Error creating match team channel:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createMatchTeamChannel:', error);
    throw error;
  }
};

export const addTeamMembersToChannel = async (
  channelId: string,
  teamMembers: TeamMember[]
): Promise<void> => {
  try {
    const membersToAdd = teamMembers.map(member => ({
      channel_id: channelId,
      user_id: member.id,
      role: 'member'
    }));

    const { error } = await supabase
      .from('channel_members')
      .upsert(membersToAdd, {
        onConflict: 'channel_id,user_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.error('Error adding team members to channel:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in addTeamMembersToChannel:', error);
    throw error;
  }
};

export const sendTeamChatWelcomeMessage = async (
  channelId: string,
  senderId: string,
  welcomeMessage: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          channel_id: channelId,
          content: welcomeMessage,
          type: 'system'
        }
      ]);

    if (error) {
      console.error('Error sending welcome message:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in sendTeamChatWelcomeMessage:', error);
    throw error;
  }
};

export const createAndInitializeTeamChat = async (
  matchId: string,
  tournamentId: string,
  teamId: string,
  tournamentName: string,
  roundNumber: number,
  currentUserId: string
): Promise<string> => {
  try {
    const channelId = await createMatchTeamChannel(
      matchId,
      tournamentId,
      teamId,
      tournamentName,
      roundNumber,
      currentUserId
    );

    const teamMembers = await getTeamMembersForMatch(teamId);

    await addTeamMembersToChannel(channelId, teamMembers);

    const welcomeMessage = `👥 Team Chat Created!\n\nTournament: ${tournamentName}\nRound: ${roundNumber}\n\nTeam Members:\n${teamMembers.map((m, i) => `${i + 1}. ${m.username}`).join('\n')}\n\nCoordinate with your team and good luck! 🎮`;

    await sendTeamChatWelcomeMessage(channelId, currentUserId, welcomeMessage);

    return channelId;
  } catch (error) {
    console.error('Error in createAndInitializeTeamChat:', error);
    throw error;
  }
};

export const getMatchTeamChannel = async (
  matchId: string,
  teamId: string
): Promise<MatchTeamChannel | null> => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('id, name, match_id, tournament_id, team_id, created_at, metadata')
      .eq('match_id', matchId)
      .eq('team_id', teamId)
      .eq('channel_type', 'match_team')
      .maybeSingle();

    if (error) {
      console.error('Error fetching match team channel:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getMatchTeamChannel:', error);
    throw error;
  }
};
