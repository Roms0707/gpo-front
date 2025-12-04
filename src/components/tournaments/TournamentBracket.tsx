import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Clock, CheckCircle, X, Crown, Target, Calendar, Award, Maximize2, Filter, Search, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PlayerProfileModal from '../ui/PlayerProfileModal';
import TeamProfileModal from '../ui/TeamProfileModal';
import PostMatchSocialPanel from './PostMatchSocialPanel';

interface Match {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  player1_id: string | null;
  player2_id: string | null;
  player1_name: string | null;
  player2_name: string | null;
  winner_id: string | null;
  is_draw: boolean;
  group_id: string | null;
  created_at: string;
}

interface StandingsEntry {
  player_id: string;
  player_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goal_difference?: number;
}

interface TournamentBracketProps {
  tournamentId: string;
  tournamentFormat: string;
  tournamentStatus: string;
  tournamentType?: string;
  gameId?: string | null;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournamentId,
  tournamentFormat,
  tournamentStatus,
  tournamentType = 'solo',
  gameId
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'ongoing' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Profile modals state
  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [isTeamProfileModalOpen, setIsTeamProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Post-match social panel state
  const [showSocialPanel, setShowSocialPanel] = useState(false);
  const [socialPanelData, setSocialPanelData] = useState<{
    matchId: string;
    tournamentName: string;
    roundNumber: number;
    opponentId: string | null;
    userTeamId: string | null;
  } | null>(null);

  // Check if this is a team tournament
  const isTeamTournament = tournamentType?.toLowerCase().includes('team');

  // Handle player profile click
  const handlePlayerClick = (userId: string | null, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!userId) return;
    console.log('[TournamentBracket] Player clicked with userId:', userId);
    setSelectedPlayerId(userId);
    setIsPlayerProfileModalOpen(true);
  };

  // Handle team profile click
  const handleTeamClick = (teamId: string | null, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!teamId) return;
    console.log('[TournamentBracket] Team clicked with teamId:', teamId);
    setSelectedTeamId(teamId);
    setIsTeamProfileModalOpen(true);
  };

  // Check if current user is involved in a match (solo tournament)
  const checkUserInvolvedInSoloMatch = (
    player1Id: string | null,
    player2Id: string | null
  ): boolean => {
    if (!user?.id || !player1Id || !player2Id) return false;
    return user.id === player1Id || user.id === player2Id;
  };

  // Check if current user is involved in a match (team tournament)
  const checkUserInvolvedInTeamMatch = async (
    player1Id: string | null,
    player2Id: string | null
  ): Promise<boolean> => {
    if (!user?.id || !player1Id || !player2Id) return false;

    try {
      const { data: teamMembers } = await supabase
        .from('tournament_registrations')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('tournament_id', tournamentId)
        .eq('status', 'validated')
        .not('team_id', 'is', null);

      if (!teamMembers || teamMembers.length === 0) return false;

      const userTeamIds = teamMembers.map(tm => tm.team_id);
      return userTeamIds.includes(player1Id) || userTeamIds.includes(player2Id);
    } catch (error) {
      console.error('Error checking team involvement:', error);
      return false;
    }
  };

  // Get opponent for solo tournament
  const getOpponentForSoloMatch = (
    player1Id: string | null,
    player2Id: string | null
  ): string | null => {
    if (!user?.id || !player1Id || !player2Id) return null;
    return user.id === player1Id ? player2Id : player1Id;
  };

  // Get opponent for team tournament (captain or first member of opposing team)
  const getOpponentForTeamMatch = async (
    player1Id: string | null,
    player2Id: string | null
  ): Promise<string | null> => {
    if (!user?.id || !player1Id || !player2Id) return null;

    try {
      // Get user's team
      const { data: userTeam } = await supabase
        .from('tournament_registrations')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('tournament_id', tournamentId)
        .eq('status', 'validated')
        .not('team_id', 'is', null)
        .maybeSingle();

      if (!userTeam) return null;

      // Determine opponent team
      const opponentTeamId = userTeam.team_id === player1Id ? player2Id : player1Id;

      // Get captain or first member of opponent team
      const { data: opponentMember } = await supabase
        .from('tournament_registrations')
        .select('user_id')
        .eq('team_id', opponentTeamId)
        .eq('tournament_id', tournamentId)
        .eq('status', 'validated')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      return opponentMember?.user_id || null;
    } catch (error) {
      console.error('Error getting opponent:', error);
      return null;
    }
  };

  // Get user's team ID for team tournaments
  const getUserTeamId = async (): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data } = await supabase
        .from('tournament_registrations')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('tournament_id', tournamentId)
        .eq('status', 'validated')
        .not('team_id', 'is', null)
        .maybeSingle();

      return data?.team_id || null;
    } catch (error) {
      console.error('Error getting user team ID:', error);
      return null;
    }
  };

  // Get tournament name
  const getTournamentName = async (): Promise<string> => {
    try {
      const { data } = await supabase
        .from('tournaments')
        .select('title')
        .eq('id', tournamentId)
        .maybeSingle();

      return data?.title || t('tournamentBracket.tournament');
    } catch (error) {
      console.error('Error getting tournament name:', error);
      return 'Tournament';
    }
  };

  // Handle match completion
  const handleMatchCompleted = async (match: any) => {
    if (!user?.id) return;

    try {
      let isUserInvolved = false;

      if (isTeamTournament) {
        isUserInvolved = await checkUserInvolvedInTeamMatch(
          match.player1_id,
          match.player2_id
        );
      } else {
        isUserInvolved = checkUserInvolvedInSoloMatch(
          match.player1_id,
          match.player2_id
        );
      }

      if (!isUserInvolved) return;

      // Get opponent and team information
      let opponentId: string | null = null;
      let userTeamId: string | null = null;

      if (isTeamTournament) {
        opponentId = await getOpponentForTeamMatch(match.player1_id, match.player2_id);
        userTeamId = await getUserTeamId();
      } else {
        opponentId = getOpponentForSoloMatch(match.player1_id, match.player2_id);
      }

      const tournamentName = await getTournamentName();

      // Set social panel data and show it
      setSocialPanelData({
        matchId: match.id,
        tournamentName,
        roundNumber: match.round,
        opponentId,
        userTeamId
      });

      setShowSocialPanel(true);
    } catch (error) {
      console.error('Error handling match completion:', error);
    }
  };

  // Determine tournament format type
  const formatType = tournamentFormat.toLowerCase();
  const isSingleElimination = formatType.includes('single elimination') || formatType.includes('elimination');
  const isRoundRobin = formatType.includes('round robin') || formatType.includes('round-robin');
  const isSwiss = formatType.includes('swiss');

  useEffect(() => {
    const loadTournamentData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load matches
        await loadMatches();
        
        // Load standings for Round Robin and Swiss formats
        if (isRoundRobin || isSwiss) {
          await loadStandings();
        }
      } catch (err) {
        console.error('Error loading tournament data:', err);
        setError(t('tournamentBracket.errorLoadingTournament'));
      } finally {
        setIsLoading(false);
      }
    };

    if (tournamentId && tournamentStatus === 'ongoing') {
      loadTournamentData();
    }
  }, [tournamentId, tournamentFormat, tournamentStatus, isTeamTournament]);

  // Real-time subscription for match completion
  useEffect(() => {
    if (!user?.id || !tournamentId || tournamentStatus !== 'ongoing') return;

    const channel = supabase
      .channel(`tournament-matches-${tournamentId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournament_matches',
        filter: `tournament_id=eq.${tournamentId}`
      }, async (payload) => {
        const updatedMatch = payload.new;

        // Check if match is completed (has a winner or is a draw)
        if (updatedMatch.winner_id || updatedMatch.is_draw) {
          // Reload matches to update the display
          await loadMatches();
          if (isRoundRobin || isSwiss) {
            await loadStandings();
          }

          // Show social panel if user is involved
          await handleMatchCompleted(updatedMatch);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, tournamentId, tournamentStatus, isTeamTournament]);

  const loadMatches = async () => {
    const { data, error: matchError } = await supabase
      .from('tournament_matches')
      .select(`
        id,
        tournament_id,
        round,
        position,
        player1_id,
        player2_id,
        winner_id,
        is_draw,
        group_id,
        created_at
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('position', { ascending: true });

    if (matchError) {
      throw matchError;
    }

    // Fetch names for the matches based on tournament type
    const matchesWithNames = await Promise.all(
      (data || []).map(async (match) => {
        let player1_name = null;
        let player2_name = null;

        if (isTeamTournament) {
          // For team tournaments, get team names
          if (match.player1_id) {
            const { data: reg1 } = await supabase
              .from('tournament_registrations')
              .select(`
                teams:team_id (
                  name
                )
              `)
              .eq('tournament_id', tournamentId)
              .eq('user_id', match.player1_id)
              .not('team_id', 'is', null)
              .single();

            if (reg1?.teams?.name) {
              player1_name = reg1.teams.name;
            } else {
              const { data: team1 } = await supabase
                .from('teams')
                .select('name')
                .eq('id', match.player1_id)
                .single();
              
              if (team1?.name) {
                player1_name = team1.name;
              } else {
                const { data: user1 } = await supabase
                  .from('users')
                  .select('username')
                  .eq('id', match.player1_id)
                  .single();
                player1_name = user1?.username || t('tournamentBracket.unknownTeam');
              }
            }
          }

          if (match.player2_id) {
            const { data: reg2 } = await supabase
              .from('tournament_registrations')
              .select(`
                teams:team_id (
                  name
                )
              `)
              .eq('tournament_id', tournamentId)
              .eq('user_id', match.player2_id)
              .not('team_id', 'is', null)
              .single();

            if (reg2?.teams?.name) {
              player2_name = reg2.teams.name;
            } else {
              const { data: team2 } = await supabase
                .from('teams')
                .select('name')
                .eq('id', match.player2_id)
                .single();
              
              if (team2?.name) {
                player2_name = team2.name;
              } else {
                const { data: user2 } = await supabase
                  .from('users')
                  .select('username')
                  .eq('id', match.player2_id)
                  .single();
                player2_name = user2?.username || t('tournamentBracket.unknownTeam');
              }
            }
          }
        } else {
          // For solo tournaments, get player names
          if (match.player1_id) {
            const { data: player1 } = await supabase
              .from('users')
              .select('username')
              .eq('id', match.player1_id)
              .single();
            player1_name = player1?.username || t('tournamentBracket.unknownPlayer');
          }

          if (match.player2_id) {
            const { data: player2 } = await supabase
              .from('users')
              .select('username')
              .eq('id', match.player2_id)
              .single();
            player2_name = player2?.username || t('tournamentBracket.unknownPlayer');
          }
        }

        return {
          ...match,
          player1_name,
          player2_name
        };
      })
    );

    setMatches(matchesWithNames);
  };

  const loadStandings = async () => {
    // Get all participants
    const { data: registrations, error: regError } = await supabase
      .from('tournament_registrations')
      .select(`
        user_id,
        users:user_id (
          username
        ),
        teams:team_id (
          name
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'approved');

    if (regError) {
      console.error('Error loading registrations:', regError);
      return;
    }

    // Calculate standings from matches
    const standingsMap = new Map<string, StandingsEntry>();

    // Initialize standings for all participants
    registrations?.forEach(reg => {
      const playerId = reg.user_id;
      const playerName = isTeamTournament 
        ? (reg.teams?.name || t('tournamentBracket.unknownTeam'))
        : (reg.users?.username || t('tournamentBracket.unknownPlayer'));

      standingsMap.set(playerId, {
        player_id: playerId,
        player_name: playerName,
        matches_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        goal_difference: 0
      });
    });

    // Update standings based on match results
    matches.forEach(match => {
      if (match.player1_id && standingsMap.has(match.player1_id)) {
        const entry = standingsMap.get(match.player1_id)!;
        if (match.winner_id || match.is_draw) {
          entry.matches_played++;
          if (match.is_draw) {
            entry.draws++;
            entry.points += 1; // 1 point for a draw
          } else if (match.winner_id === match.player1_id) {
            entry.wins++;
            entry.points += 3; // 3 points for a win
          } else {
            entry.losses++;
          }
        }
      }

      if (match.player2_id && standingsMap.has(match.player2_id)) {
        const entry = standingsMap.get(match.player2_id)!;
        if (match.winner_id || match.is_draw) {
          entry.matches_played++;
          if (match.is_draw) {
            entry.draws++;
            entry.points += 1; // 1 point for a draw
          } else if (match.winner_id === match.player2_id) {
            entry.wins++;
            entry.points += 3; // 3 points for a win
          } else {
            entry.losses++;
          }
        }
      }
    });

    // Convert to array and sort by points, then by wins
    const standingsArray = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });

    setStandings(standingsArray);
  };

  const scrollBracket = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const filterMatches = (matchesToFilter: Match[]) => {
    let filtered = matchesToFilter;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(match => {
        const isCompleted = !!match.winner_id || match.is_draw;
        const isOngoing = !isCompleted && match.player1_id && match.player2_id;
        const isPending = !isCompleted && (!match.player1_id || !match.player2_id);

        switch (filterStatus) {
          case 'completed': return isCompleted;
          case 'ongoing': return isOngoing;
          case 'pending': return isPending;
          default: return true;
        }
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(match => {
        const query = searchQuery.toLowerCase();
        return (
          match.player1_name?.toLowerCase().includes(query) ||
          match.player2_name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  };

  // Don't render if not ongoing
  if (tournamentStatus !== 'ongoing') {
    return (
      <div className="w-full bg-white dark:bg-dark-100 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-800">
        <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">{t('tournamentBracket.upcomingBracket')}</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('tournamentBracket.bracketWillDisplay')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full bg-dark-100 rounded-xl p-6">
        <h2 className="font-heading font-bold text-2xl mb-6 flex items-center">
          <Trophy className="h-6 w-6 text-warning-500 mr-2" />
          {t('tournamentBracket.title')}
        </h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">{t('tournamentBracket.loadingBracket')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="font-heading font-bold text-2xl mb-6 flex items-center text-gray-900 dark:text-white">
          <Trophy className="h-6 w-6 text-warning-500 mr-2" />
          {t('tournamentBracket.title')}
        </h2>
        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // For Round Robin and Swiss, show even if no matches yet (show empty state)
  if (matches.length === 0 && isSingleElimination) {
    return (
      <div className="w-full bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="font-heading font-bold text-2xl mb-6 flex items-center text-gray-900 dark:text-white">
          <Trophy className="h-6 w-6 text-warning-500 mr-2" />
          {t('tournamentBracket.title')}
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-700 dark:text-gray-400">{t('tournamentBracket.bracketNotAvailable')}</p>
        </div>
      </div>
    );
  }

  // Render Single Elimination Bracket
  const renderSingleEliminationBracket = () => {
    // Group matches by round
    const matchesByRound = matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
    const maxRound = Math.max(...rounds);

    // Get round name based on the number of rounds from the end
    const getRoundName = (round: number) => {
      const roundsFromEnd = maxRound - round + 1;
      
      switch (roundsFromEnd) {
        case 1:
          return t('tournamentBracket.final');
        case 2:
          return t('tournamentBracket.semi');
        case 3:
          return t('tournamentBracket.quarter');
        case 4:
          return 'R1';
        default:
          return `R${round}`;
      }
    };

    // Render a single match card
    const renderMatch = (match: Match) => {
      const isPlayer1Winner = match.winner_id === match.player1_id;
      const isPlayer2Winner = match.winner_id === match.player2_id;
      const isCompleted = !!match.winner_id;

      return (
        <div key={match.id} className="bg-white dark:bg-dark-200 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden min-w-[200px] md:min-w-[240px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
          {/* Match header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-3 md:px-4 py-2 md:py-2.5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-xs md:text-sm font-semibold text-white relative z-10">{t('tournamentBracket.matchNumber', { number: match.position })}</span>
          </div>

          {/* Players/Teams */}
          <div className="p-3 md:p-4 space-y-2 md:space-y-3">
            {/* Player/Team 1 */}
            <div
              className={`flex items-center justify-between p-2 md:p-3 rounded-lg transition-all duration-200 ${
                isPlayer1Winner ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/60 shadow-md' :
                isCompleted ? 'bg-gray-100 dark:bg-dark-300 opacity-70' : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-300 dark:to-dark-400 hover:from-gray-100 hover:to-gray-200 dark:hover:from-dark-400 dark:hover:to-dark-500 border border-gray-200 dark:border-gray-700'
              } ${match.player1_id && match.player1_name !== 'Bye' ? 'cursor-pointer touch-manipulation' : ''}`}
              onClick={(e) => {
                if (match.player1_id && match.player1_name !== 'Bye') {
                  e.stopPropagation();
                  isTeamTournament ? handleTeamClick(match.player1_id, e) : handlePlayerClick(match.player1_id, e);
                }
              }}
            >
              <div className="flex items-center min-w-0 flex-1">
                {isPlayer1Winner && (
                  <Crown className="h-4 md:h-5 w-4 md:w-5 text-yellow-400 mr-2 flex-shrink-0 animate-pulse" />
                )}
                {isTeamTournament && (
                  <Users className="h-3.5 w-3.5 text-primary-500 mr-1.5 flex-shrink-0" />
                )}
                <span className={`text-sm md:text-base truncate font-medium ${isPlayer1Winner ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'} ${match.player1_id && match.player1_name !== 'Bye' ? 'hover:underline' : ''}`}>
                  {match.player1_name || t('tournamentBracket.bye')}
                </span>
              </div>
            </div>

            {/* Player/Team 2 */}
            <div
              className={`flex items-center justify-between p-2 md:p-3 rounded-lg transition-all duration-200 ${
                isPlayer2Winner ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/60 shadow-md' :
                isCompleted ? 'bg-gray-100 dark:bg-dark-300 opacity-70' : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-300 dark:to-dark-400 hover:from-gray-100 hover:to-gray-200 dark:hover:from-dark-400 dark:hover:to-dark-500 border border-gray-200 dark:border-gray-700'
              } ${match.player2_id && match.player2_name !== 'Bye' ? 'cursor-pointer touch-manipulation' : ''}`}
              onClick={(e) => {
                if (match.player2_id && match.player2_name !== 'Bye') {
                  e.stopPropagation();
                  isTeamTournament ? handleTeamClick(match.player2_id, e) : handlePlayerClick(match.player2_id, e);
                }
              }}
            >
              <div className="flex items-center min-w-0 flex-1">
                {isPlayer2Winner && (
                  <Crown className="h-4 md:h-5 w-4 md:w-5 text-yellow-400 mr-2 flex-shrink-0 animate-pulse" />
                )}
                {isTeamTournament && (
                  <Users className="h-3.5 w-3.5 text-primary-500 mr-1.5 flex-shrink-0" />
                )}
                <span className={`text-sm md:text-base truncate font-medium ${isPlayer2Winner ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'} ${match.player2_id && match.player2_name !== 'Bye' ? 'hover:underline' : ''}`}>
                  {match.player2_name || t('tournamentBracket.bye')}
                </span>
              </div>
            </div>
          </div>

          {/* Match status */}
          <div className="px-3 md:px-4 pb-2.5 md:pb-3 mt-1">
            {isCompleted && (
              <div className="flex items-center justify-center text-xs md:text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-1.5 rounded-lg">
                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                <span>{t('tournamentBracket.completed')}</span>
              </div>
            )}
            {!isCompleted && match.player1_id && match.player2_id && (
              <div className="flex items-center justify-center text-xs md:text-sm font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 py-1.5 rounded-lg">
                <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 animate-pulse" />
                <span>{t('tournamentBracket.ongoing')}</span>
              </div>
            )}
            {!isCompleted && (!match.player1_id || !match.player2_id) && (
              <div className="flex items-center justify-center text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-1.5 rounded-lg">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                <span>{t('tournamentBracket.pending')}</span>
              </div>
            )}
          </div>
        </div>
      );
    };

    const filteredMatchesByRound = Object.keys(matchesByRound).reduce((acc, roundKey) => {
      const round = Number(roundKey);
      const filtered = filterMatches(matchesByRound[round]);
      if (filtered.length > 0) {
        acc[round] = filtered;
      }
      return acc;
    }, {} as Record<number, Match[]>);

    const filteredRounds = Object.keys(filteredMatchesByRound).map(Number).sort((a, b) => a - b);

    return (
      <div className="relative">
        {/* Navigation buttons for desktop */}
        <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none z-20 px-2">
          <button
            onClick={() => scrollBracket('left')}
            className="pointer-events-auto bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-full p-3 shadow-lg border border-gray-300 dark:border-gray-700 transition-all hover:scale-110"
            aria-label={t('tournamentBracket.scrollLeft')}
          >
            <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => scrollBracket('right')}
            className="pointer-events-auto bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-full p-3 shadow-lg border border-gray-300 dark:border-gray-700 transition-all hover:scale-110"
            aria-label={t('tournamentBracket.scrollRight')}
          >
            <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain scroll-smooth scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-800"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex space-x-6 md:space-x-10 min-w-max pb-6 px-4">
            {filteredRounds.map(round => (
              <div key={round} className="flex flex-col items-center space-y-4 md:space-y-5 min-w-[200px] md:min-w-[260px]">
                {/* Round header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-center w-full text-base md:text-lg shadow-lg border border-primary-500/50">
                  <div className="flex items-center justify-center">
                    <Trophy className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    {getRoundName(round)}
                  </div>
                </div>

                {/* Matches in this round */}
                <div className="flex flex-col space-y-4 md:space-y-5 w-full">
                  {filteredMatchesByRound[round].map(renderMatch)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicators */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-dark-100 to-transparent pointer-events-none z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-dark-100 to-transparent pointer-events-none z-10"></div>
      </div>
    );
  };

  // Render Round Robin or Swiss format
  const renderRoundRobinOrSwiss = () => {
    // Group matches by round for Round Robin/Swiss
    const matchesByRound = matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

    const renderMatch = (match: Match) => {
      const isPlayer1Winner = match.winner_id === match.player1_id;
      const isPlayer2Winner = match.winner_id === match.player2_id;
      const isCompleted = !!match.winner_id || match.is_draw;
      const isDraw = match.is_draw;

      return (
        <div key={match.id} className="bg-white dark:bg-dark-200 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-300 px-3 py-1 rounded-full">
                {match.group_id ? `${t('tournamentBracket.group')} ${match.group_id}` : `${t('tournamentBracket.match')} ${match.position}`}
              </span>
              <span className="text-xs md:text-sm font-medium text-primary-600 dark:text-primary-400">
                {t('tournamentBracket.round')} {match.round}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Player 1 */}
              <div
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  isPlayer1Winner ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/60 shadow-sm' :
                  isDraw ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/60' :
                  isCompleted ? 'bg-gray-100 dark:bg-dark-300 opacity-70' : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-300 dark:to-dark-400 border border-gray-200 dark:border-gray-700'
                } ${match.player1_id && match.player1_name !== 'TBD' ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={(e) => {
                  if (match.player1_id && match.player1_name !== 'TBD') {
                    isTeamTournament ? handleTeamClick(match.player1_id, e) : handlePlayerClick(match.player1_id, e);
                  }
                }}
              >
                <div className="flex items-center min-w-0 flex-1">
                  {isPlayer1Winner && <Crown className="h-4 md:h-5 w-4 md:w-5 text-yellow-400 mr-2 flex-shrink-0 animate-pulse" />}
                  {isTeamTournament && <Users className="h-3.5 w-3.5 text-primary-500 mr-1.5 flex-shrink-0" />}
                  <span className={`text-sm md:text-base truncate font-medium ${isPlayer1Winner ? 'font-bold text-green-600 dark:text-green-400' : isDraw ? 'font-semibold text-yellow-600 dark:text-yellow-400' : 'text-gray-800 dark:text-gray-200'} ${match.player1_id && match.player1_name !== 'TBD' ? 'hover:underline' : ''}`}>
                    {match.player1_name || t('tournamentBracket.tbd')}
                  </span>
                </div>
              </div>
              
              {/* VS or Result */}
              <div className="text-center py-2">
                <div className={`inline-block px-4 py-1 rounded-full text-xs md:text-sm font-bold ${
                  isDraw ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                  'bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400'
                }`}>
                  {isCompleted && isDraw ? t('tournamentBracket.draw') : t('tournamentBracket.vs')}
                </div>
              </div>
              
              {/* Player 2 */}
              <div
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  isPlayer2Winner ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/60 shadow-sm' :
                  isDraw ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/60' :
                  isCompleted ? 'bg-gray-100 dark:bg-dark-300 opacity-70' : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-300 dark:to-dark-400 border border-gray-200 dark:border-gray-700'
                } ${match.player2_id && match.player2_name !== 'TBD' ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={(e) => {
                  if (match.player2_id && match.player2_name !== 'TBD') {
                    isTeamTournament ? handleTeamClick(match.player2_id, e) : handlePlayerClick(match.player2_id, e);
                  }
                }}
              >
                <div className="flex items-center min-w-0 flex-1">
                  {isPlayer2Winner && <Crown className="h-4 md:h-5 w-4 md:w-5 text-yellow-400 mr-2 flex-shrink-0 animate-pulse" />}
                  {isTeamTournament && <Users className="h-3.5 w-3.5 text-primary-500 mr-1.5 flex-shrink-0" />}
                  <span className={`text-sm md:text-base truncate font-medium ${isPlayer2Winner ? 'font-bold text-green-600 dark:text-green-400' : isDraw ? 'font-semibold text-yellow-600 dark:text-yellow-400' : 'text-gray-800 dark:text-gray-200'} ${match.player2_id && match.player2_name !== 'TBD' ? 'hover:underline' : ''}`}>
                    {match.player2_name || t('tournamentBracket.tbd')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Status */}
            <div className="mt-4">
              {isCompleted ? (
                <div className="flex items-center justify-center text-xs md:text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-2 rounded-lg">
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  {t('tournamentBracket.completed')}
                </div>
              ) : match.player1_id && match.player2_id ? (
                <div className="flex items-center justify-center text-xs md:text-sm font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 py-2 rounded-lg">
                  <Zap className="h-4 w-4 mr-1.5 animate-pulse" />
                  En cours
                </div>
              ) : (
                <div className="flex items-center justify-center text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 rounded-lg">
                  <Clock className="h-4 w-4 mr-1.5" />
                  En attente
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    const filteredMatchesByRound = Object.keys(matchesByRound).reduce((acc, roundKey) => {
      const round = Number(roundKey);
      const filtered = filterMatches(matchesByRound[round]);
      if (filtered.length > 0) {
        acc[round] = filtered;
      }
      return acc;
    }, {} as Record<number, Match[]>);

    const filteredRounds = Object.keys(filteredMatchesByRound).map(Number).sort((a, b) => a - b);

    return (
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b-2 border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 md:px-6 py-3 font-semibold text-sm md:text-base transition-all duration-200 touch-manipulation rounded-t-lg ${
              activeTab === 'matches'
                ? 'text-primary-600 dark:text-primary-400 border-b-4 border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-300'
            }`}
          >
            <Calendar className="h-3 md:h-4 w-3 md:w-4 inline mr-1 md:mr-2" />
            {t('tournamentBracket.matches')}
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-4 md:px-6 py-3 font-semibold text-sm md:text-base transition-all duration-200 touch-manipulation rounded-t-lg ${
              activeTab === 'standings'
                ? 'text-primary-600 dark:text-primary-400 border-b-4 border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-300'
            }`}
          >
            <Award className="h-3 md:h-4 w-3 md:w-4 inline mr-1 md:mr-2" />
            {t('tournamentBracket.standings')}
          </button>
        </div>

        {activeTab === 'matches' ? (
          <div className="space-y-6">
            {filteredRounds.length > 0 ? (
              filteredRounds.map(round => (
                <div key={round}>
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2.5 rounded-lg mb-4 flex items-center shadow-md">
                    <Trophy className="h-5 w-5 mr-2" />
                    <h3 className="font-bold text-base md:text-lg">
                      {t('tournamentBracket.round')} {round}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {filteredMatchesByRound[round].map(renderMatch)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-200 dark:to-dark-300 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('tournamentBracket.noMatchesScheduled')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-500">{t('tournamentBracket.matchesWillAppear')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-200 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg">
            {standings.length > 0 ? (
              <div className="overflow-x-auto touch-pan-x scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-800" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-left bg-white dark:bg-dark-200 min-w-[500px]">
                  <thead className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                    <tr>
                      <th className="p-3 md:p-4 font-bold text-sm md:text-base">#</th>
                      <th className="p-3 md:p-4 font-bold text-sm md:text-base">{isTeamTournament ? t('tournamentBracket.teamColumn') : t('tournamentBracket.playerColumn')}</th>
                      <th className="p-3 md:p-4 font-bold text-center text-sm md:text-base">{t('tournamentBracket.pointsColumn')}</th>
                      <th className="p-3 md:p-4 font-bold text-center text-sm md:text-base">{t('tournamentBracket.playedColumn')}</th>
                      <th className="p-3 md:p-4 font-bold text-center text-sm md:text-base">{t('tournamentBracket.winsColumn')}</th>
                      <th className="p-3 md:p-4 font-bold text-center text-sm md:text-base">{t('tournamentBracket.drawsColumn')}</th>
                      <th className="p-3 md:p-4 font-bold text-center text-sm md:text-base">{t('tournamentBracket.lossesColumn')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {standings.map((entry, index) => (
                      <tr
                        key={entry.player_id}
                        className={`hover:bg-primary-50 dark:hover:bg-dark-300/50 transition-all duration-150 cursor-pointer touch-manipulation active:bg-primary-100 dark:active:bg-dark-300 ${
                          index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/10' : ''
                        }`}
                        onClick={() => isTeamTournament ? handleTeamClick(entry.player_id) : handlePlayerClick(entry.player_id)}
                      >
                        <td className="p-3 md:p-4 text-center">
                          <div className="flex items-center justify-center">
                            {index < 3 && (
                              <Trophy className={`h-5 w-5 mr-2 ${
                                index === 0 ? 'text-yellow-400' :
                                index === 1 ? 'text-gray-400' :
                                'text-amber-600'
                              }`} />
                            )}
                            <span className={`font-bold text-base md:text-lg ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-amber-600' :
                            'text-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 md:p-4">
                          <div className="flex items-center">
                            {isTeamTournament && <Users className="h-4 w-4 text-primary-500 mr-2 flex-shrink-0" />}
                            <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white hover:underline truncate">{entry.player_name}</span>
                          </div>
                        </td>
                        <td className="p-3 md:p-4 text-center">
                          <span className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold text-base md:text-lg px-3 py-1 rounded-full">
                            {entry.points}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-center font-medium text-sm md:text-base text-gray-700 dark:text-gray-300">{entry.matches_played}</td>
                        <td className="p-3 md:p-4 text-center font-semibold text-sm md:text-base text-green-600 dark:text-green-400">{entry.wins}</td>
                        <td className="p-3 md:p-4 text-center font-semibold text-sm md:text-base text-yellow-600 dark:text-yellow-400">{entry.draws}</td>
                        <td className="p-3 md:p-4 text-center font-semibold text-sm md:text-base text-red-600 dark:text-red-400">{entry.losses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-200 dark:to-dark-300 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('tournamentBracket.noStandingsAvailable')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-500">{t('tournamentBracket.standingsWillUpdate')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full bg-gradient-to-br from-white to-gray-50 dark:from-dark-100 dark:to-dark-200 rounded-2xl p-4 md:p-8 border-2 border-gray-200 dark:border-gray-800 shadow-xl ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''
    }`}>
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-3 rounded-xl mr-4 shadow-lg">
            <Trophy className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl md:text-3xl text-gray-900 dark:text-white">
              {isSingleElimination ? t('tournamentBracket.title') :
               isRoundRobin ? t('tournamentBracket.roundRobinTournament') :
               isSwiss ? t('tournamentBracket.swissTournament') : t('tournamentBracket.title')}
            </h2>
            {isTeamTournament && <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
              <Users className="h-3.5 w-3.5 mr-1" />
              {t('tournamentBracket.teamTournament')}
            </span>}
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-300 hover:bg-gray-200 dark:hover:bg-dark-400 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <Maximize2 className="h-4 w-4" />
          {isFullscreen ? t('tournamentBracket.exit') : t('tournamentBracket.fullscreen')}
        </button>
      </div>

      {/* Filter and search controls */}
      <div className="mb-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('tournamentBracket.searchPlayerOrTeam')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-200 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm md:text-base focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-400'
            }`}
          >
            <Filter className="h-4 w-4" />
            {t('tournamentBracket.all')}
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-400'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {t('tournamentBracket.completed')}
          </button>
          <button
            onClick={() => setFilterStatus('ongoing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'ongoing'
                ? 'bg-yellow-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-400'
            }`}
          >
            <Zap className="h-4 w-4" />
            En cours
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'pending'
                ? 'bg-gray-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-400'
            }`}
          >
            <Clock className="h-4 w-4" />
            En attente
          </button>
        </div>
      </div>

      {/* Mobile scroll hint */}
      {isSingleElimination && (
        <div className="mb-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30 rounded-xl p-4 flex items-center text-sm font-medium text-primary-700 dark:text-primary-300 shadow-sm">
          <svg className="h-6 w-6 mr-3 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>{t('tournamentBracket.scrollHorizontally')}</span>
        </div>
      )}

      {/* Format indicator and stats */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{t('tournamentBracket.format')}:</span>
          <span className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold shadow-md">
            {tournamentFormat}
          </span>
        </div>
        {matches.length > 0 && (
          <div className="flex items-center gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {t('tournamentBracket.completedMatches', { count: matches.filter(m => m.winner_id || m.is_draw).length })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {t('tournamentBracket.ongoingMatches', { count: matches.filter(m => !m.winner_id && !m.is_draw && m.player1_id && m.player2_id).length })}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Render appropriate format */}
      {isSingleElimination ? renderSingleEliminationBracket() : renderRoundRobinOrSwiss()}
      
      {/* Legend */}
      <div className="mt-8 p-5 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-200 dark:to-dark-300 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-inner">
        <h4 className="font-bold text-base mb-4 text-gray-900 dark:text-white flex items-center">
          <div className="w-1 h-6 bg-primary-600 rounded-full mr-3"></div>
          {t('tournamentBracket.legend')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center bg-white dark:bg-dark-100 p-2 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">{t('tournamentBracket.completed')}</span>
          </div>
          <div className="flex items-center bg-white dark:bg-dark-100 p-2 rounded-lg">
            <Zap className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">En cours</span>
          </div>
          <div className="flex items-center bg-white dark:bg-dark-100 p-2 rounded-lg">
            <Clock className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">En attente</span>
          </div>
          <div className="flex items-center bg-white dark:bg-dark-100 p-2 rounded-lg">
            <Crown className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">{t('tournamentBracket.winner')}</span>
          </div>
          {isTeamTournament && (
            <div className="flex items-center bg-white dark:bg-dark-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{t('tournamentBracket.team')}</span>
            </div>
          )}
          {(isRoundRobin || isSwiss) && (
            <>
              <div className="flex items-center bg-white dark:bg-dark-100 p-2 rounded-lg">
                <div className="w-5 h-5 bg-yellow-600/20 border-2 border-yellow-500/50 rounded mr-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{t('tournamentBracket.draw')}</span>
              </div>
              <div className="flex items-center bg-white dark:bg-dark-100 p-2 rounded-lg col-span-2">
                <Award className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{t('tournamentBracket.points')}: {t('tournamentBracket.pointsAbbreviation')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
        gameId={gameId}
      />

      {/* Team Profile Modal */}
      <TeamProfileModal
        isOpen={isTeamProfileModalOpen}
        onClose={() => setIsTeamProfileModalOpen(false)}
        teamId={selectedTeamId}
      />

      {/* Post-Match Social Panel */}
      {showSocialPanel && socialPanelData && (
        <PostMatchSocialPanel
          matchId={socialPanelData.matchId}
          tournamentId={tournamentId}
          tournamentName={socialPanelData.tournamentName}
          roundNumber={socialPanelData.roundNumber}
          opponentId={socialPanelData.opponentId}
          userTeamId={socialPanelData.userTeamId}
          onClose={() => {
            setShowSocialPanel(false);
            setSocialPanelData(null);
          }}
        />
      )}
    </div>
  );
};

export default TournamentBracket;