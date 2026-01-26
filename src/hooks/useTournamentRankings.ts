import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTournamentRankings = (activeTab: string, tournament: any) => {
  const [tournamentRankings, setTournamentRankings] = useState<any[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);

  useEffect(() => {
    const loadTournamentRankings = async () => {
      if (activeTab === 'classement' && tournament?.id) {
        try {
          setIsLoadingRankings(true);

          const isTeamTournament = tournament.mode?.toLowerCase().includes('team');

          if (isTeamTournament) {
            // Load team rankings for team tournaments
            // Get teams with their captains for this tournament
            const { data: teamData, error: teamError } = await supabase
              .from('teams')
              .select(`
                id,
                name,
                captain_id,
                tournament_registrations!inner(
                  tournament_id,
                  status
                )
              `)
              .eq('tournament_registrations.tournament_id', tournament.id)
              .eq('tournament_registrations.status', 'approved');

            if (teamError) {
              console.error('Error loading team data:', teamError);
              setTournamentRankings([]);
              return;
            }

            // For each team, calculate wins/losses from tournament_matches using captain_id
            const rankingsWithStats = await Promise.all(
              (teamData || []).map(async (team, index) => {
                // Get matches where this team's captain participated
                const { data: matches, error: matchError } = await supabase
                  .from('tournament_matches')
                  .select('*')
                  .eq('tournament_id', tournament.id)
                  .or(`player1_id.eq.${team.captain_id},player2_id.eq.${team.captain_id}`);

                if (matchError) {
                  console.error('Error loading team matches:', matchError);
                  return {
                    rank: index + 1,
                    team_id: team.id,
                    team_name: team.name,
                    captain_id: team.captain_id,
                    wins: 0,
                    losses: 0,
                    total_matches: 0,
                    win_rate: 0
                  };
                }

                // Count wins where the captain (representing the team) won
                const wins = matches?.filter(match => match.winner_id === team.captain_id).length || 0;
                const totalMatches = matches?.filter(match => match.winner_id !== null).length || 0;
                const losses = totalMatches - wins;
                const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

                return {
                  rank: index + 1,
                  team_id: team.id,
                  team_name: team.name,
                  captain_id: team.captain_id,
                  wins,
                  losses,
                  total_matches: totalMatches,
                  win_rate: winRate
                };
              })
            );

            // Sort by wins (descending), then by win rate (descending), then by name (ascending)
            const sortedRankings = rankingsWithStats.sort((a, b) => {
              if (b.wins !== a.wins) return b.wins - a.wins;
              if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
              return a.team_name.localeCompare(b.team_name);
            });

            // Update ranks after sorting
            const finalRankings = sortedRankings.map((team, index) => ({
              ...team,
              rank: index + 1
            }));

            setTournamentRankings(finalRankings);
          } else {
            // Load player rankings for solo tournaments
            const { data: playerRegistrations, error: playerError } = await supabase
              .from('tournament_registrations')
              .select(`
                user_id,
                users!inner(
                  id,
                  username,
                  avatar_url
                )
              `)
              .eq('tournament_id', tournament.id)
              .eq('status', 'approved');

            if (playerError) {
              console.error('Error loading player rankings:', playerError);
              setTournamentRankings([]);
              return;
            }

            // For each player, calculate wins/losses from tournament_matches
            const rankingsWithStats = await Promise.all(
              (playerRegistrations || []).map(async (registration, index) => {
                const player = registration.users;

                // Get matches where this player participated
                const { data: matches, error: matchError } = await supabase
                  .from('tournament_matches')
                  .select('*')
                  .eq('tournament_id', tournament.id)
                  .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`);

                if (matchError) {
                  console.error('Error loading player matches:', matchError);
                  return {
                    rank: index + 1,
                    user_id: player.id,
                    username: player.username,
                    avatar_url: player.avatar_url,
                    wins: 0,
                    losses: 0,
                    total_matches: 0,
                    win_rate: 0
                  };
                }

                const wins = matches?.filter(match => match.winner_id === player.id).length || 0;
                const totalMatches = matches?.filter(match => match.winner_id !== null).length || 0;
                const losses = totalMatches - wins;
                const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

                return {
                  rank: index + 1,
                  user_id: player.id,
                  username: player.username,
                  avatar_url: player.avatar_url,
                  wins,
                  losses,
                  total_matches: totalMatches,
                  win_rate: winRate
                };
              })
            );

            // Sort by wins (descending), then by win rate (descending), then by username (ascending)
            const sortedRankings = rankingsWithStats.sort((a, b) => {
              if (b.wins !== a.wins) return b.wins - a.wins;
              if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
              return a.username.localeCompare(b.username);
            });

            // Update ranks after sorting
            const finalRankings = sortedRankings.map((player, index) => ({
              ...player,
              rank: index + 1
            }));

            setTournamentRankings(finalRankings);
          }
        } catch (error) {
          console.error('Error loading tournament rankings:', error);
          setTournamentRankings([]);
        } finally {
          setIsLoadingRankings(false);
        }
      }
    };

    loadTournamentRankings();
  }, [activeTab, tournament?.id, tournament?.mode]);

  return {
    tournamentRankings,
    isLoadingRankings
  };
};
