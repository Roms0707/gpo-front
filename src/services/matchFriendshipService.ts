import { supabase } from '../lib/supabase';

export interface FriendshipStatus {
  areFriends: boolean;
  hasPendingRequest: boolean;
  requestSentByCurrentUser: boolean;
  requestSentByOpponent: boolean;
  relationshipId?: string;
}

export const checkFriendshipStatus = async (
  currentUserId: string,
  opponentUserId: string
): Promise<FriendshipStatus> => {
  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .select('id, user_id_1, user_id_2, status')
      .or(
        `and(user_id_1.eq.${currentUserId},user_id_2.eq.${opponentUserId}),and(user_id_1.eq.${opponentUserId},user_id_2.eq.${currentUserId})`
      )
      .maybeSingle();

    if (error) {
      console.error('Error checking friendship status:', error);
      throw error;
    }

    if (!data) {
      return {
        areFriends: false,
        hasPendingRequest: false,
        requestSentByCurrentUser: false,
        requestSentByOpponent: false
      };
    }

    const isAccepted = data.status === 'accepted';
    const isPending = data.status === 'pending';
    const sentByCurrentUser = data.user_id_1 === currentUserId;

    return {
      areFriends: isAccepted,
      hasPendingRequest: isPending,
      requestSentByCurrentUser: isPending && sentByCurrentUser,
      requestSentByOpponent: isPending && !sentByCurrentUser,
      relationshipId: data.id
    };
  } catch (error) {
    console.error('Error in checkFriendshipStatus:', error);
    throw error;
  }
};

export const getOpponentUserProfile = async (opponentUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, country, bio, discord_handle, riot_game_name, riot_tagline, fortnite_epic_id')
      .eq('id', opponentUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching opponent profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getOpponentUserProfile:', error);
    throw error;
  }
};

export interface GameIdEntry {
  label: string;
  value: string;
  key: string;
}

export const getOpponentGameIdsForTournament = async (
  opponentUserId: string,
  tournamentId: string
): Promise<GameIdEntry[]> => {
  try {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('game_id')
      .eq('id', tournamentId)
      .maybeSingle();

    if (tournamentError || !tournament?.game_id) {
      console.error('Error fetching tournament game_id:', tournamentError);
      return [];
    }

    const { data: gameIds, error: gameIdsError } = await supabase
      .from('game_publisher_id_for_users')
      .select(`
        value,
        game_publisher_ids (
          label,
          id_name
        )
      `)
      .eq('user_id', opponentUserId)
      .eq('game_id', tournament.game_id);

    if (gameIdsError) {
      console.error('Error fetching opponent game IDs:', gameIdsError);
      return [];
    }

    if (!gameIds || gameIds.length === 0) {
      return [];
    }

    return gameIds
      .filter((item: { value: string; game_publisher_ids: { label: string; id_name: string } | null }) =>
        item.value && item.game_publisher_ids
      )
      .map((item: { value: string; game_publisher_ids: { label: string; id_name: string } | null }) => ({
        label: item.game_publisher_ids!.label,
        value: item.value,
        key: item.game_publisher_ids!.id_name
      }));
  } catch (error) {
    console.error('Error in getOpponentGameIdsForTournament:', error);
    return [];
  }
};

export const generateMatchContextMessage = (
  tournamentName: string,
  roundNumber: number,
  opponentUsername: string,
  t: (key: string, params?: any) => string,
  tournamentId?: string
): string => {
  let message = `⚔️ ${t('postMatchSocial.matchReady')}\n\n`;
  message += `${t('postMatchSocial.tournamentLabel')}: ${tournamentName}\n`;
  message += `${t('postMatchSocial.roundLabel')}: ${roundNumber}\n`;
  message += `${t('postMatchSocial.opponentLabel')}: ${opponentUsername}\n\n`;
  message += `${t('postMatchSocial.goodLuck')}`;

  if (tournamentId) {
    message += `\n\n🔗 ${t('postMatchSocial.viewBracket')}: ${window.location.origin}/tournaments/${tournamentId}?tab=bracket`;
  }

  return message;
};

export const generateTeamChatWelcomeMessage = (
  tournamentName: string,
  roundNumber: number,
  teamMembers: string[],
  t: (key: string, params?: any) => string
): string => {
  let message = `👥 ${t('postMatchSocial.teamChatCreated')}\n\n`;
  message += `${t('postMatchSocial.tournamentLabel')}: ${tournamentName}\n`;
  message += `${t('postMatchSocial.roundLabel')}: ${roundNumber}\n\n`;
  message += `${t('postMatchSocial.teamMembersLabel')}:\n`;
  teamMembers.forEach((member, index) => {
    message += `${index + 1}. ${member}\n`;
  });
  message += `\n${t('postMatchSocial.goodLuck')} 🎮`;

  return message;
};
