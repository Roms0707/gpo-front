import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTeamData = (tournament: any, user: any, registrationStatus: any) => {
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [userTeamName, setUserTeamName] = useState<string | null>(null);
  const [currentTeamSize, setCurrentTeamSize] = useState<number>(0);
  const [maxTeamSize, setMaxTeamSize] = useState<number | null>(null);
  const [isTeamCaptain, setIsTeamCaptain] = useState<boolean>(false);
  const [isLoadingTeamInfo, setIsLoadingTeamInfo] = useState(false);

  // Function to load user's team information
  const loadUserTeamInfo = async (tournamentId: string, userId: string) => {
    try {
      setIsLoadingTeamInfo(true);

      // Get user's team information
      const { data: teamData, error: teamError } = await supabase
        .from('tournament_registrations')
        .select(`
          team_id,
          teams:team_id (
            id,
            name,
            captain_id
          )
        `)
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .not('team_id', 'is', null)
        .maybeSingle();

      if (teamError) {
        console.error('Error loading user team info:', teamError);
        return;
      }

      if (teamData && teamData.teams) {
        setUserTeamId(teamData.team_id);
        setUserTeamName(teamData.teams.name);
        setIsTeamCaptain(teamData.teams.captain_id === userId);

        // Get current team size
        const { count: teamSize, error: sizeError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', teamData.team_id)
          .eq('status', 'accepted');

        if (sizeError) {
          console.error('Error loading team size:', sizeError);
          setCurrentTeamSize(0);
        } else {
          setCurrentTeamSize(teamSize || 0);
        }
      }
    } catch (error) {
      console.error('Error loading user team info:', error);
    } finally {
      setIsLoadingTeamInfo(false);
    }
  };

  useEffect(() => {
    if (tournament?.max_players_per_team && tournament.max_players_per_team > 0) {
      setMaxTeamSize(tournament.max_players_per_team);
    } else {
      setMaxTeamSize(null);
    }
  }, [tournament?.max_players_per_team]);

  useEffect(() => {
    if (tournament?.id && user?.id && registrationStatus.registered) {
      loadUserTeamInfo(tournament.id, user.id);
    }
  }, [tournament?.id, user?.id, registrationStatus.registered]);

  return {
    userTeamId,
    userTeamName,
    currentTeamSize,
    maxTeamSize,
    isTeamCaptain,
    isLoadingTeamInfo,
    loadUserTeamInfo
  };
};
