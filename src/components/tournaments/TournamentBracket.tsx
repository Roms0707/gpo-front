import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Users, Target, Award, Maximize2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useBracketRoundTimers } from '../../hooks/useBracketRoundTimers';
import PlayerProfileModal from '../ui/PlayerProfileModal';
import TeamProfileModal from '../ui/TeamProfileModal';
import PostMatchSocialPanel from './PostMatchSocialPanel';
import MyCurrentMatch from './bracket/MyCurrentMatch';
import CompactMatchCard from './bracket/CompactMatchCard';
import BracketConnectors from './bracket/BracketConnectors';
import RoundSelector from './bracket/RoundSelector';
import RoundTimer from './bracket/RoundTimer';
import CompactMatchTable from './bracket/CompactMatchTable';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [viewAllRounds, setViewAllRounds] = useState(false);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [isTeamProfileModalOpen, setIsTeamProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [showSocialPanel, setShowSocialPanel] = useState(false);
  const [socialPanelData, setSocialPanelData] = useState<{
    matchId: string;
    tournamentName: string;
    roundNumber: number;
    opponentId: string | null;
    userTeamId: string | null;
  } | null>(null);

  const isTeamTournament = tournamentType?.toLowerCase().includes('team');
  const formatType = tournamentFormat.toLowerCase();
  const isSingleElimination = formatType.includes('single elimination') || formatType.includes('elimination');
  const isRoundRobin = formatType.includes('round robin') || formatType.includes('round-robin');
  const isSwiss = formatType.includes('swiss');

  const { timers, activeRound, getRoundStatus, getRoundTimer, isLoading: timersLoading } = useBracketRoundTimers(tournamentId);

  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!user?.id || !isTeamTournament) return;

      const { data } = await supabase
        .from('tournament_registrations')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('tournament_id', tournamentId)
        .eq('status', 'validated')
        .not('team_id', 'is', null)
        .maybeSingle();

      setUserTeamId(data?.team_id || null);
    };

    fetchUserTeam();
  }, [user?.id, tournamentId, isTeamTournament]);

  useEffect(() => {
    if (!selectedRound && activeRound) {
      setSelectedRound(activeRound);
    }
  }, [activeRound, selectedRound]);

  const handlePlayerClick = (userId: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!userId) return;
    setSelectedPlayerId(userId);
    setIsPlayerProfileModalOpen(true);
  };

  const handleTeamClick = (teamId: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!teamId) return;
    setSelectedTeamId(teamId);
    setIsTeamProfileModalOpen(true);
  };

  const isUserParticipant = useCallback((player1Id: string | null, player2Id: string | null): boolean => {
    if (!user?.id) return false;
    const participantId = isTeamTournament ? userTeamId : user.id;
    if (!participantId) return false;
    return player1Id === participantId || player2Id === participantId;
  }, [user?.id, userTeamId, isTeamTournament]);

  const handleJumpToMatch = useCallback((matchId: string) => {
    const matchElement = matchRefs.current.get(matchId);
    if (matchElement) {
      matchElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      matchElement.classList.add('ring-4', 'ring-primary-500');
      setTimeout(() => {
        matchElement.classList.remove('ring-4', 'ring-primary-500');
      }, 2000);
    }
  }, []);

  const loadMatches = async () => {
    const { data, error: matchError } = await supabase
      .from('tournament_matches')
      .select('id, tournament_id, round, position, player1_id, player2_id, winner_id, is_draw, group_id, created_at')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('position', { ascending: true });

    if (matchError) throw matchError;

    const matchesWithNames = await Promise.all(
      (data || []).map(async (match) => {
        let player1_name = null;
        let player2_name = null;

        if (isTeamTournament) {
          if (match.player1_id) {
            const { data: team1 } = await supabase
              .from('teams')
              .select('name')
              .eq('id', match.player1_id)
              .maybeSingle();
            player1_name = team1?.name || t('tournamentBracket.unknownTeam');
          }
          if (match.player2_id) {
            const { data: team2 } = await supabase
              .from('teams')
              .select('name')
              .eq('id', match.player2_id)
              .maybeSingle();
            player2_name = team2?.name || t('tournamentBracket.unknownTeam');
          }
        } else {
          if (match.player1_id) {
            const { data: player1 } = await supabase
              .from('users')
              .select('username')
              .eq('id', match.player1_id)
              .maybeSingle();
            player1_name = player1?.username || t('tournamentBracket.unknownPlayer');
          }
          if (match.player2_id) {
            const { data: player2 } = await supabase
              .from('users')
              .select('username')
              .eq('id', match.player2_id)
              .maybeSingle();
            player2_name = player2?.username || t('tournamentBracket.unknownPlayer');
          }
        }

        return { ...match, player1_name, player2_name };
      })
    );

    setMatches(matchesWithNames);
  };

  const loadStandings = async () => {
    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('user_id, users:user_id (username), teams:team_id (name)')
      .eq('tournament_id', tournamentId)
      .eq('status', 'approved');

    const standingsMap = new Map<string, StandingsEntry>();

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

    matches.forEach(match => {
      if (match.player1_id && standingsMap.has(match.player1_id)) {
        const entry = standingsMap.get(match.player1_id)!;
        if (match.winner_id || match.is_draw) {
          entry.matches_played++;
          if (match.is_draw) {
            entry.draws++;
            entry.points += 1;
          } else if (match.winner_id === match.player1_id) {
            entry.wins++;
            entry.points += 3;
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
            entry.points += 1;
          } else if (match.winner_id === match.player2_id) {
            entry.wins++;
            entry.points += 3;
          } else {
            entry.losses++;
          }
        }
      }
    });

    const standingsArray = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });

    setStandings(standingsArray);
  };

  useEffect(() => {
    const loadTournamentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadMatches();
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

  useEffect(() => {
    if (!user?.id || !tournamentId || tournamentStatus !== 'ongoing') return;

    const channel = supabase
      .channel(`tournament-matches-${tournamentId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournament_matches',
        filter: `tournament_id=eq.${tournamentId}`
      }, async () => {
        await loadMatches();
        if (isRoundRobin || isSwiss) {
          await loadStandings();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, tournamentId, tournamentStatus, isTeamTournament]);

  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const maxRound = Math.max(...rounds, 1);

  const getRoundName = (round: number) => {
    if (isSingleElimination) {
      const roundsFromEnd = maxRound - round + 1;
      switch (roundsFromEnd) {
        case 1: return t('tournamentBracket.final');
        case 2: return t('tournamentBracket.semi');
        case 3: return t('tournamentBracket.quarter');
        default: return `${t('tournamentBracket.round')} ${round}`;
      }
    }
    return `${t('tournamentBracket.round')} ${round}`;
  };

  const handleRoundNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = rounds.indexOf(selectedRound || activeRound || rounds[0]);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedRound(rounds[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < rounds.length - 1) {
      setSelectedRound(rounds[currentIndex + 1]);
    }
  };

  if (tournamentStatus !== 'ongoing') {
    return (
      <div className="w-full bg-white dark:bg-dark-100 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-800">
        <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">
          {t('tournamentBracket.upcomingBracket')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('tournamentBracket.bracketWillDisplay')}
        </p>
      </div>
    );
  }

  if (isLoading || timersLoading) {
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

  if (matches.length === 0) {
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

  const currentRound = selectedRound || activeRound || rounds[0];
  const currentRoundTimer = getRoundTimer(currentRound);
  const currentRoundMatches = matchesByRound[currentRound] || [];
  const completedInRound = currentRoundMatches.filter(m => m.winner_id || m.is_draw).length;

  const renderSingleEliminationBracket = () => {
    const roundsToShow = viewAllRounds ? rounds : selectedRound ? [selectedRound] : activeRound ? [activeRound] : rounds;
    const matchWidth = 200;
    const matchHeight = 80;
    const roundGap = 80;
    const matchGap = 16;
    const headerHeight = 50;

    return (
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden touch-pan-x scroll-smooth pb-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="relative min-w-max px-4">
            {viewAllRounds && (
              <BracketConnectors
                matchesByRound={matchesByRound}
                rounds={rounds}
                matchWidth={matchWidth}
                matchHeight={matchHeight}
                roundGap={roundGap}
                matchGap={matchGap}
                headerHeight={headerHeight}
              />
            )}

            <div className="flex" style={{ gap: `${roundGap}px` }}>
              {roundsToShow.map((round, roundIndex) => {
                const roundMatches = matchesByRound[round] || [];
                const status = getRoundStatus(round);
                const isActive = round === activeRound;

                return (
                  <div key={round} className="flex flex-col" style={{ width: `${matchWidth}px` }}>
                    <div className={`text-center py-2 px-3 rounded-lg mb-4 font-semibold text-sm ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : status === 'finished'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300'
                    }`}>
                      {getRoundName(round)}
                    </div>

                    <div
                      className="flex flex-col justify-around flex-1"
                      style={{
                        gap: `${matchGap * Math.pow(2, roundIndex)}px`,
                        paddingTop: roundIndex > 0 ? `${(Math.pow(2, roundIndex) - 1) * (matchHeight + matchGap) / 2}px` : 0
                      }}
                    >
                      {roundMatches.map(match => {
                        const isUserMatch = isUserParticipant(match.player1_id, match.player2_id);
                        return (
                          <CompactMatchCard
                            key={match.id}
                            match={match}
                            isTeamTournament={isTeamTournament}
                            isUserMatch={isUserMatch}
                            onPlayerClick={handlePlayerClick}
                            onTeamClick={handleTeamClick}
                            matchRef={(el) => {
                              if (el) matchRefs.current.set(match.id, el);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRoundRobinOrSwiss = () => {
    return (
      <div className="space-y-6">
        <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'matches'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {t('tournamentBracket.matches')}
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'standings'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {t('tournamentBracket.standings')}
          </button>
        </div>

        {activeTab === 'matches' ? (
          <CompactMatchTable
            matchesByRound={matchesByRound}
            rounds={rounds}
            selectedRound={selectedRound}
            viewAllRounds={viewAllRounds}
            activeRound={activeRound}
            isTeamTournament={isTeamTournament}
            isUserParticipant={isUserParticipant}
            getRoundStatus={getRoundStatus}
            getRoundName={getRoundName}
            onPlayerClick={handlePlayerClick}
            onTeamClick={handleTeamClick}
          />
        ) : (
          <div className="bg-white dark:bg-dark-200 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {standings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-dark-300">
                    <tr>
                      <th className="p-3 text-left font-medium text-gray-600 dark:text-gray-400">#</th>
                      <th className="p-3 text-left font-medium text-gray-600 dark:text-gray-400">
                        {isTeamTournament ? t('tournamentBracket.teamColumn') : t('tournamentBracket.playerColumn')}
                      </th>
                      <th className="p-3 text-center font-medium text-gray-600 dark:text-gray-400">{t('tournamentBracket.pointsColumn')}</th>
                      <th className="p-3 text-center font-medium text-gray-600 dark:text-gray-400">{t('tournamentBracket.playedColumn')}</th>
                      <th className="p-3 text-center font-medium text-gray-600 dark:text-gray-400">{t('tournamentBracket.winsColumn')}</th>
                      <th className="p-3 text-center font-medium text-gray-600 dark:text-gray-400">{t('tournamentBracket.drawsColumn')}</th>
                      <th className="p-3 text-center font-medium text-gray-600 dark:text-gray-400">{t('tournamentBracket.lossesColumn')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {standings.map((entry, index) => (
                      <tr
                        key={entry.player_id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-300/50 cursor-pointer transition-colors"
                        onClick={() => isTeamTournament ? handleTeamClick(entry.player_id) : handlePlayerClick(entry.player_id)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {index < 3 && (
                              <Trophy className={`h-4 w-4 ${
                                index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'
                              }`} />
                            )}
                            <span className="font-medium text-gray-700 dark:text-gray-300">{index + 1}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {isTeamTournament && <Users className="h-4 w-4 text-gray-400" />}
                            <span className="font-medium text-gray-900 dark:text-white hover:underline">{entry.player_name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold px-2 py-0.5 rounded-full">
                            {entry.points}
                          </span>
                        </td>
                        <td className="p-3 text-center text-gray-600 dark:text-gray-400">{entry.matches_played}</td>
                        <td className="p-3 text-center font-medium text-green-600 dark:text-green-400">{entry.wins}</td>
                        <td className="p-3 text-center font-medium text-yellow-600 dark:text-yellow-400">{entry.draws}</td>
                        <td className="p-3 text-center font-medium text-red-600 dark:text-red-400">{entry.losses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('tournamentBracket.noStandingsAvailable')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full bg-white dark:bg-dark-100 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800 ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
              {isSingleElimination ? t('tournamentBracket.title') :
               isRoundRobin ? t('tournamentBracket.roundRobinTournament') :
               isSwiss ? t('tournamentBracket.swissTournament') : t('tournamentBracket.title')}
            </h2>
            {isTeamTournament && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {t('tournamentBracket.teamTournament')}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-lg transition-colors"
        >
          {isFullscreen ? <X className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>

      <MyCurrentMatch
        tournamentId={tournamentId}
        matches={matches}
        activeRound={activeRound}
        roundTimer={currentRoundTimer}
        isTeamTournament={isTeamTournament}
        onJumpToMatch={handleJumpToMatch}
        onPlayerClick={handlePlayerClick}
        onTeamClick={handleTeamClick}
      />

      {rounds.length > 1 && (
        <RoundSelector
          rounds={rounds}
          selectedRound={selectedRound}
          activeRound={activeRound}
          viewAllRounds={viewAllRounds}
          getRoundStatus={getRoundStatus}
          getRoundName={getRoundName}
          onRoundSelect={(round) => setSelectedRound(round)}
          onViewAllToggle={() => setViewAllRounds(!viewAllRounds)}
          onNavigate={handleRoundNavigate}
        />
      )}

      {currentRoundTimer && !viewAllRounds && (
        <RoundTimer
          timer={currentRoundTimer}
          roundName={getRoundName(currentRound)}
          completedMatches={completedInRound}
          totalMatches={currentRoundMatches.length}
        />
      )}

      {isSingleElimination ? renderSingleEliminationBracket() : renderRoundRobinOrSwiss()}

      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
        gameId={gameId}
      />

      <TeamProfileModal
        isOpen={isTeamProfileModalOpen}
        onClose={() => setIsTeamProfileModalOpen(false)}
        teamId={selectedTeamId}
      />

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
