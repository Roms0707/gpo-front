import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import PostMatchSocialPanel from './PostMatchSocialPanel';

interface PostMatchSocialPanelExampleProps {
  tournamentId: string;
  tournamentName: string;
  tournamentType: string;
}

const PostMatchSocialPanelExample: React.FC<PostMatchSocialPanelExampleProps> = ({
  tournamentId,
  tournamentName,
  tournamentType
}) => {
  const { user } = useAuth();
  const [showSocialPanel, setShowSocialPanel] = useState(false);
  const [matchData, setMatchData] = useState<{
    matchId: string;
    roundNumber: number;
    opponentId: string | null;
    userTeamId: string | null;
  } | null>(null);

  const isTeamTournament = tournamentType?.toLowerCase().includes('team');

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

        if (updatedMatch.winner_id) {
          const isUserInvolved = await checkIfUserInvolvedInMatch(
            updatedMatch.id,
            updatedMatch.player1_id,
            updatedMatch.player2_id
          );

          if (isUserInvolved) {
            const opponent = await getOpponentForMatch(
              updatedMatch.player1_id,
              updatedMatch.player2_id
            );

            let teamId = null;
            if (isTeamTournament) {
              teamId = await getUserTeamId(updatedMatch.player1_id);
            }

            setMatchData({
              matchId: updatedMatch.id,
              roundNumber: updatedMatch.round,
              opponentId: opponent,
              userTeamId: teamId
            });

            setShowSocialPanel(true);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, tournamentId, isTeamTournament]);

  const checkIfUserInvolvedInMatch = async (
    matchId: string,
    player1Id: string | null,
    player2Id: string | null
  ): Promise<boolean> => {
    if (!user?.id) return false;

    if (isTeamTournament) {
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!teamMembers || teamMembers.length === 0) return false;

      const userTeamIds = teamMembers.map(tm => tm.team_id);
      return userTeamIds.includes(player1Id || '') || userTeamIds.includes(player2Id || '');
    } else {
      return user.id === player1Id || user.id === player2Id;
    }
  };

  const getOpponentForMatch = async (
    player1Id: string | null,
    player2Id: string | null
  ): Promise<string | null> => {
    if (!user?.id || !player1Id || !player2Id) return null;

    if (isTeamTournament) {
      const { data: userTeam } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!userTeam) return null;

      if (userTeam.team_id === player1Id) {
        return player2Id;
      } else if (userTeam.team_id === player2Id) {
        return player1Id;
      }
    } else {
      if (user.id === player1Id) {
        return player2Id;
      } else if (user.id === player2Id) {
        return player1Id;
      }
    }

    return null;
  };

  const getUserTeamId = async (playerId: string | null): Promise<string | null> => {
    if (!user?.id || !playerId) return null;

    const { data } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    return data?.team_id || null;
  };

  if (!showSocialPanel || !matchData) return null;

  return (
    <PostMatchSocialPanel
      matchId={matchData.matchId}
      tournamentId={tournamentId}
      tournamentName={tournamentName}
      roundNumber={matchData.roundNumber}
      opponentId={matchData.opponentId}
      userTeamId={matchData.userTeamId}
      onClose={() => setShowSocialPanel(false)}
    />
  );
};

export default PostMatchSocialPanelExample;
