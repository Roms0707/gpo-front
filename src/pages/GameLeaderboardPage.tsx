import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, Medal, Trophy, ChevronDown, ChevronUp, User, Users, Calendar } from 'lucide-react';
import { useConfigGames } from '../hooks/useConfigGames';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';
import TeamProfileModal from '../components/ui/TeamProfileModal';
import RecentMatchItem from '../components/ui/RecentMatchItem';
import { getGameTheme, getCardClipPath, getCardBorderRadius, getCardCornerAccent } from '../utils/gameThemes';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  country: string;
  avatar_url: string | null;
  total_points: number;
  elo?: number;
  tournaments_played: number;
  wins: number;
  top_5: number;
  win_rate?: number;
  matches?: number;
  losses?: number;
  rank_tier?: string;
}

interface TeamLeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  captain_name: string;
  total_points: number;
  elo?: number;
  tournaments_played: number;
  wins: number;
  top_5: number;
  win_rate?: number;
  matches?: number;
  losses?: number;
  rank_tier?: string;
}

interface RecentMatch {
  id: string;
  date: string;
  type: 'Team' | 'Solo' | 'Tournament';
  player1: string;
  player1_id: string;
  player2: string;
  player2_id: string;
  score: string;
  elo_change: number;
  is_tournament: boolean;
}

const GameLeaderboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { gameId } = useParams<{ gameId: string }>();
  const { games: configGames, isLoading: configLoading } = useConfigGames();

  const configGame = useMemo(
    () => configGames.find(g => g.id === gameId && g.slug !== 'other-games' && !g.is_collection),
    [configGames, gameId]
  );

  const [game, setGame] = useState<any>(null);
  const [soloLeaderboard, setSoloLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [hasSoloData, setHasSoloData] = useState(false);
  const [hasTeamData, setHasTeamData] = useState(false);
  const [activeTab, setActiveTab] = useState<'solo' | 'team'>('solo');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSeason, setSelectedSeason] = useState('current');
  const [selectedRankTier, setSelectedRankTier] = useState('All Ranks');
  const [isMobile, setIsMobile] = useState(false);

  // Player profile modal state
  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Team profile modal state
  const [isTeamProfileModalOpen, setIsTeamProfileModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (configGame && !game) {
      setGame({
        id: configGame.id,
        name: configGame.name,
        publisher: configGame.publisher,
        image_url: configGame.image_url,
      });
    }
  }, [configGame]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadAggregatedGameLeaderboard = async () => {
      if (!gameId) return;

      try {
        setIsLoading(true);

        // Call the new aggregated Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-game-leaderboard-aggregated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            game_id: gameId,
            leaderboard_type: 'both',
            search_query: searchQuery,
            rank_tier: selectedRankTier,
            sort_field: sortField,
            sort_direction: sortDirection,
            limit: 100,
            offset: 0
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch leaderboard data');
        }

        const leaderboardData = result.data;

        // Set game data
        setGame(leaderboardData.game);

        // Set leaderboard data
        setSoloLeaderboard(leaderboardData.solo_leaderboard || []);
        setTeamLeaderboard(leaderboardData.team_leaderboard || []);
        setHasSoloData(leaderboardData.has_solo_data);
        setHasTeamData(leaderboardData.has_team_data);

        // Set recent matches
        setRecentMatches(leaderboardData.recent_matches || []);

      } catch (error) {
        console.error('Error loading game or leaderboard:', error);

        setHasSoloData(false);
        setHasTeamData(false);
        setSoloLeaderboard([]);
        setTeamLeaderboard([]);
        setRecentMatches([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMatches(false);
      }
    };

    loadAggregatedGameLeaderboard();
  }, [gameId, selectedSeason, searchQuery, selectedRankTier, sortField, sortDirection]);

  if (!configLoading && configGames.length > 0 && !configGame) {
    return <Navigate to="/leaderboards" replace />;
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default direction
      setSortField(field);
      if (field === 'rank') {
        setSortDirection('asc');
      } else if (field === 'username' || field === 'team_name') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4" /> :
      <ChevronDown className="h-4 w-4" />;
  };

  // Apply sorting and filtering for solo leaderboard
  const filteredAndSortedSoloLeaderboard = soloLeaderboard
    .filter(entry =>
      entry.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedRankTier === 'All Ranks' || entry.rank_tier === selectedRankTier)
    )
    .sort((a, b) => {
      let comparison = 0;

      switch(sortField) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'total_points':
          comparison = (a.total_points || 0) - (b.total_points || 0);
          break;
        case 'elo':
          comparison = (a.elo || 0) - (b.elo || 0);
          break;
        case 'win_rate':
          comparison = (a.win_rate || 0) - (b.win_rate || 0);
          break;
        case 'wins':
          comparison = a.wins - b.wins;
          break;
        case 'matches':
          comparison = (a.matches || 0) - (b.matches || 0);
          break;
        default:
          comparison = a.rank - b.rank;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Apply sorting and filtering for team leaderboard
  const filteredAndSortedTeamLeaderboard = teamLeaderboard
    .filter(entry =>
      entry.team_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedRankTier === 'All Ranks' || entry.rank_tier === selectedRankTier)
    )
    .sort((a, b) => {
      let comparison = 0;

      switch(sortField) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'team_name':
          comparison = a.team_name.localeCompare(b.team_name);
          break;
        case 'total_points':
          comparison = (a.total_points || 0) - (b.total_points || 0);
          break;
        case 'elo':
          comparison = (a.elo || 0) - (b.elo || 0);
          break;
        case 'win_rate':
          comparison = (a.win_rate || 0) - (b.win_rate || 0);
          break;
        case 'wins':
          comparison = a.wins - b.wins;
          break;
        case 'matches':
          comparison = (a.matches || 0) - (b.matches || 0);
          break;
        default:
          comparison = a.rank - b.rank;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Get rank badge based on tier
  const getRankBadge = (rankTier: string) => {
    switch(rankTier) {
      case 'DIAMOND':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500 text-white">{t('leaderboards.diamond').toUpperCase()}</span>;
      case 'PLATINUM':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-teal-500 text-white">{t('leaderboards.platinum').toUpperCase()}</span>;
      case 'GOLD':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500 text-white">{t('leaderboards.gold').toUpperCase()}</span>;
      case 'SILVER':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-400 text-white">{t('leaderboards.silver').toUpperCase()}</span>;
      case 'BRONZE':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-amber-700 text-white">{t('leaderboards.bronze').toUpperCase()}</span>;
      default:
        return null;
    }
  };

  const formatWinLoss = (wins: number, matches: number = 0) => {
    const losses = matches - wins;
    return `${wins} - ${losses}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    if (activeTab === 'solo') {
      return {
        hasData: hasSoloData,
        data: filteredAndSortedSoloLeaderboard,
        emptyMessage: t('leaderboards.noSoloRankingAvailable')
      };
    } else {
      return {
        hasData: hasTeamData,
        data: filteredAndSortedTeamLeaderboard,
        emptyMessage: t('leaderboards.noTeamRankingAvailable')
      };
    }
  };

  const currentData = getCurrentData();

  // Handle player profile click
  const handlePlayerClick = (userId: string) => {
    setSelectedPlayerId(userId);
    setIsPlayerProfileModalOpen(true);
  };

  // Handle team profile click
  const handleTeamClick = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsTeamProfileModalOpen(true);
  };

  const theme = getGameTheme(game?.name);
  const GameIcon = theme.icon;
  const clipPath = getCardClipPath(theme.shape);
  const borderRadius = getCardBorderRadius(theme.shape);
  const cornerAccents = getCardCornerAccent(theme.shape);

  return (
    <div className="min-h-screen pb-16 bg-gray-50 dark:bg-dark-200">
      {!isLoading && game && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${game.image_url || 'https://images.pexels.com/photos/7919/pexels-photo.jpg'})`,
              filter: 'blur(20px)',
              transform: 'scale(1.1)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}CC 0%, ${theme.colors.secondary}99 50%, transparent 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-dark-200 via-transparent to-transparent" />

          {cornerAccents.topLeft && (
            <div
              className="absolute top-0 left-0 w-16 h-16 opacity-30"
              style={{
                borderTop: `3px solid ${theme.colors.border}`,
                borderLeft: `3px solid ${theme.colors.border}`,
              }}
            />
          )}
          {cornerAccents.topRight && (
            <div
              className="absolute top-0 right-0 w-16 h-16 opacity-30"
              style={{
                borderTop: `3px solid ${theme.colors.border}`,
                borderRight: `3px solid ${theme.colors.border}`,
              }}
            />
          )}
          {cornerAccents.bottomLeft && (
            <div
              className="absolute bottom-20 left-0 w-16 h-16 opacity-30"
              style={{
                borderBottom: `3px solid ${theme.colors.border}`,
                borderLeft: `3px solid ${theme.colors.border}`,
              }}
            />
          )}
          {cornerAccents.bottomRight && (
            <div
              className="absolute bottom-20 right-0 w-16 h-16 opacity-30"
              style={{
                borderBottom: `3px solid ${theme.colors.border}`,
                borderRight: `3px solid ${theme.colors.border}`,
              }}
            />
          )}

          <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
            <div className="flex items-end gap-6">
              <div
                className="w-24 h-24 md:w-32 md:h-32 overflow-hidden shadow-2xl flex-shrink-0 relative"
                style={{
                  clipPath: clipPath !== 'none' ? clipPath : undefined,
                  borderRadius: clipPath === 'none' ? borderRadius : undefined,
                  border: `3px solid ${theme.colors.primary}`,
                  boxShadow: `0 0 40px ${theme.colors.glow}`,
                }}
              >
                <img
                  src={game.image_url || 'https://images.pexels.com/photos/7919/pexels-photo.jpg'}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, ${theme.colors.primary}40, transparent 50%)`,
                  }}
                />
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-3 mb-2">
                  <GameIcon
                    className="h-6 w-6 md:h-8 md:w-8"
                    style={{ color: theme.colors.primary }}
                  />
                  <h1 className="font-heading font-bold text-2xl md:text-4xl text-white drop-shadow-lg">
                    {game.name}
                  </h1>
                </div>
                <p className="text-white/80 text-sm md:text-base">{game.publisher}</p>
                <p
                  className="text-sm font-medium mt-1"
                  style={{ color: theme.colors.primary }}
                >
                  {t('leaderboards.leaderboard')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-3/4">
            <Link
              to="/leaderboards"
              className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('leaderboards.backToLeaderboards')}
            </Link>

            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-dark-100 rounded-xl mb-4 w-2/3"></div>
                <div className="h-80 bg-dark-100 rounded-xl"></div>
              </div>
            ) : (
              <>

                {/* Tab Navigation */}
                <div
                  className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden mb-6 border border-gray-200 dark:border-gray-800"
                  style={{
                    borderTop: `3px solid ${theme.colors.primary}`,
                  }}
                >
                  <div className="flex border-b border-gray-800">
                    <button
                      onClick={() => setActiveTab('solo')}
                      className={`flex-1 px-6 py-4 font-medium text-sm transition-all flex items-center justify-center relative ${
                        activeTab === 'solo'
                          ? 'text-white'
                          : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-200'
                      }`}
                      style={activeTab === 'solo' ? {
                        backgroundColor: theme.colors.primary,
                      } : undefined}
                    >
                      <GameIcon className="h-4 w-4 mr-2" />
                      {t('leaderboards.soloRanking')}
                      {activeTab === 'solo' && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('team')}
                      className={`flex-1 px-6 py-4 font-medium text-sm transition-all flex items-center justify-center relative ${
                        activeTab === 'team'
                          ? 'text-white'
                          : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-200'
                      }`}
                      style={activeTab === 'team' ? {
                        backgroundColor: theme.colors.primary,
                      } : undefined}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {t('leaderboards.teamRanking')}
                      {activeTab === 'team' && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                      )}
                    </button>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                      <div className="flex-1">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                            style={{ color: theme.colors.primary }}
                          />
                          <input
                            type="text"
                            placeholder={activeTab === 'solo' ? t('leaderboards.searchPlayer') : t('leaderboards.searchTeam')}
                            className="input pl-10 w-full bg-white dark:bg-dark-300 border-gray-300 dark:border-gray-700 focus:ring-2 transition-all"
                            style={{
                              '--tw-ring-color': theme.colors.primary,
                            } as React.CSSProperties}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={!currentData.hasData}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            className="input appearance-none pr-8 bg-white dark:bg-dark-300 border-gray-300 dark:border-gray-700 cursor-pointer focus:ring-2 transition-all"
                            style={{
                              '--tw-ring-color': theme.colors.primary,
                            } as React.CSSProperties}
                            value={selectedRankTier}
                            onChange={(e) => setSelectedRankTier(e.target.value)}
                            disabled={!currentData.hasData}
                          >
                            <option value="All Ranks">{t('leaderboards.allRanks')}</option>
                            <option value="DIAMOND">{t('leaderboards.diamond')}</option>
                            <option value="PLATINUM">{t('leaderboards.platinum')}</option>
                            <option value="GOLD">{t('leaderboards.gold')}</option>
                            <option value="SILVER">{t('leaderboards.silver')}</option>
                            <option value="BRONZE">{t('leaderboards.bronze')}</option>
                          </select>
                          <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none"
                            style={{ color: theme.colors.primary }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {!currentData.hasData ? (
                    <div className="p-8 text-center">
                      <Trophy className="h-16 w-16 text-gray-700 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">
                        {currentData.emptyMessage}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {t('leaderboards.noRankingDataYet', { type: activeTab === 'solo' ? 'solo' : t('leaderboards.team').toLowerCase() })}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-500">
                        {t('leaderboards.rankingsWillAppear', { type: activeTab === 'solo' ? t('leaderboards.players') : t('leaderboards.teams') })}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead
                          className="text-gray-700 dark:text-gray-300"
                          style={{
                            background: `linear-gradient(90deg, ${theme.colors.primary}15, transparent)`,
                          }}
                        >
                          <tr>
                            <th
                              className="p-4 font-medium cursor-pointer transition-colors relative"
                              onClick={() => handleSort('rank')}
                              style={{ borderLeft: `3px solid ${theme.colors.primary}` }}
                            >
                              <div className="flex items-center hover:opacity-70">
                                <span>#</span>
                                {getSortIcon('rank')}
                              </div>
                            </th>
                            <th
                              className="p-4 font-medium cursor-pointer transition-colors"
                              onClick={() => handleSort(activeTab === 'solo' ? 'username' : 'team_name')}
                            >
                              <div className="flex items-center hover:opacity-70">
                                <span>{activeTab === 'solo' ? t('leaderboards.player').toUpperCase() : t('leaderboards.team').toUpperCase()}</span>
                                {getSortIcon(activeTab === 'solo' ? 'username' : 'team_name')}
                              </div>
                            </th>
                            {activeTab === 'team' && (
                              <th className="p-4 font-medium text-center">
                                <span>{t('leaderboards.captain').toUpperCase()}</span>
                              </th>
                            )}
                            <th
                              className="p-4 font-medium cursor-pointer transition-colors text-center"
                            >
                              <div className="flex items-center justify-center hover:opacity-70">
                                <span>{t('leaderboards.rank').toUpperCase()}</span>
                              </div>
                            </th>
                            <th
                              className="p-4 font-medium cursor-pointer transition-colors text-center"
                              onClick={() => handleSort('elo')}
                            >
                              <div className="flex items-center justify-center hover:opacity-70">
                                <span>{t('leaderboards.elo').toUpperCase()}</span>
                                {getSortIcon('elo')}
                              </div>
                            </th>
                            <th
                              className="p-4 font-medium cursor-pointer transition-colors text-center"
                              onClick={() => handleSort('matches')}
                            >
                              <div className="flex items-center justify-center hover:opacity-70">
                                <span>V/D</span>
                                {getSortIcon('matches')}
                              </div>
                            </th>
                            <th
                              className="p-4 font-medium cursor-pointer transition-colors text-center"
                              onClick={() => handleSort('win_rate')}
                            >
                              <div className="flex items-center justify-center hover:opacity-70">
                                <span>{t('leaderboards.winRate').toUpperCase()}</span>
                                {getSortIcon('win_rate')}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {activeTab === 'solo' ? (
                            // Solo leaderboard rows
                            filteredAndSortedSoloLeaderboard.map((entry) => (
                              <tr
                                key={entry.user_id}
                                className="transition-all cursor-pointer group"
                                style={{ background: 'transparent' }}
                                onClick={() => handlePlayerClick(entry.user_id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = `linear-gradient(90deg, ${theme.colors.glow}, transparent)`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <td className="p-4 text-center">
                                  <div className="flex justify-center">
                                    {entry.rank <= 3 ? (
                                      <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{
                                          backgroundColor: entry.rank === 1
                                            ? 'rgba(234, 179, 8, 0.2)'
                                            : entry.rank === 2
                                            ? 'rgba(156, 163, 175, 0.2)'
                                            : 'rgba(180, 83, 9, 0.2)',
                                          color: entry.rank === 1
                                            ? '#EAB308'
                                            : entry.rank === 2
                                            ? '#9CA3AF'
                                            : '#B45309',
                                          boxShadow: `0 0 8px ${theme.colors.glow}`,
                                        }}
                                      >
                                        <Medal className="h-5 w-5" />
                                      </div>
                                    ) : (
                                      <span className="font-medium text-gray-900 dark:text-white">{entry.rank}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                                      {entry.avatar_url ? (
                                        <img
                                          src={entry.avatar_url}
                                          alt={entry.username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <User className="h-4 w-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-900 dark:text-white">{entry.username}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  {getRankBadge(entry.rank_tier || '')}
                                </td>
                                <td
                                  className="p-4 text-center font-bold"
                                  style={{ color: theme.colors.primary }}
                                >
                                  {entry.elo || 0}
                                </td>
                                <td className="p-4 text-center text-gray-900 dark:text-white">
                                  {formatWinLoss(entry.wins, entry.matches || 0)}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`font-medium ${
                                    (entry.win_rate || 0) >= 70 ? 'text-green-500' :
                                    (entry.win_rate || 0) >= 50 ? 'text-blue-500' :
                                    'text-red-500'
                                  }`}>
                                    {entry.win_rate || 0}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            // Team leaderboard rows
                            filteredAndSortedTeamLeaderboard.map((entry) => (
                              <tr
                                key={entry.team_id}
                                className="transition-all cursor-pointer group"
                                style={{ background: 'transparent' }}
                                onClick={() => handleTeamClick(entry.team_id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = `linear-gradient(90deg, ${theme.colors.glow}, transparent)`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <td className="p-4 text-center">
                                  <div className="flex justify-center">
                                    {entry.rank <= 3 ? (
                                      <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{
                                          backgroundColor: entry.rank === 1
                                            ? 'rgba(234, 179, 8, 0.2)'
                                            : entry.rank === 2
                                            ? 'rgba(156, 163, 175, 0.2)'
                                            : 'rgba(180, 83, 9, 0.2)',
                                          color: entry.rank === 1
                                            ? '#EAB308'
                                            : entry.rank === 2
                                            ? '#9CA3AF'
                                            : '#B45309',
                                          boxShadow: `0 0 8px ${theme.colors.glow}`,
                                        }}
                                      >
                                        <Medal className="h-5 w-5" />
                                      </div>
                                    ) : (
                                      <span className="font-medium text-gray-900 dark:text-white">{entry.rank}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center">
                                    <Users
                                      className="h-5 w-5 mr-3"
                                      style={{ color: theme.colors.primary }}
                                    />
                                    <div>
                                      <span className="font-medium text-gray-900 dark:text-white">{entry.team_name}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{entry.captain_name}</span>
                                </td>
                                <td className="p-4 text-center">
                                  {getRankBadge(entry.rank_tier || '')}
                                </td>
                                <td
                                  className="p-4 text-center font-bold"
                                  style={{ color: theme.colors.primary }}
                                >
                                  {entry.elo || 0}
                                </td>
                                <td className="p-4 text-center text-gray-900 dark:text-white">
                                  {formatWinLoss(entry.wins, entry.matches || 0)}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`font-medium ${
                                    (entry.win_rate || 0) >= 70 ? 'text-green-500' :
                                    (entry.win_rate || 0) >= 50 ? 'text-blue-500' :
                                    'text-red-500'
                                  }`}>
                                    {entry.win_rate || 0}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}

                          {currentData.data.length === 0 && currentData.hasData && (
                            <tr>
                              <td colSpan={activeTab === 'solo' ? 6 : 7} className="p-8 text-center text-gray-600 dark:text-gray-400">
                                {t('leaderboards.noResultsFound', { type: activeTab === 'solo' ? t('leaderboards.player').toLowerCase() : t('leaderboards.team').toLowerCase() })}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full md:w-1/4">
            {/* Recent Matches Card */}
            <div
              className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800"
              style={{ borderTop: `3px solid ${theme.colors.primary}` }}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 min-h-[60px] flex items-center overflow-visible">
                <div className="flex items-center">
                  <Trophy
                    className="h-5 w-5 mr-2"
                    style={{ color: theme.colors.primary }}
                  />
                  <h2 className="font-medium text-gray-900 dark:text-white whitespace-nowrap text-base leading-relaxed">{t('leaderboards.recentMatches')}</h2>
                </div>
              </div>

              {isLoadingMatches ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-dark-300 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 dark:bg-dark-300 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-dark-300 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : recentMatches.length > 0 ? (
                <div>
                  {recentMatches.map((match) => (
                    <RecentMatchItem
                      key={match.id}
                      match={match}
                      onPlayerClick={handlePlayerClick}
                      onTeamClick={handleTeamClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t('leaderboards.noRecentMatches')}
                  </p>
                </div>
              )}
            </div>

            {/* Game Stats Card */}
            <div
              className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden mt-6 border border-gray-200 dark:border-gray-800"
              style={{ borderTop: `3px solid ${theme.colors.secondary}` }}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center">
                  <Calendar
                    className="h-5 w-5 mr-2"
                    style={{ color: theme.colors.primary }}
                  />
                  <h2 className="font-medium text-gray-900 dark:text-white">{t('leaderboards.gameStatistics')}</h2>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ backgroundColor: `${theme.colors.primary}15` }}
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.primary }}
                    >
                      {filteredAndSortedSoloLeaderboard.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('leaderboards.rankedPlayers')}</div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ backgroundColor: `${theme.colors.secondary}15` }}
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.secondary }}
                    >
                      {filteredAndSortedTeamLeaderboard.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('leaderboards.rankedTeams')}</div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ backgroundColor: `${theme.colors.primary}10` }}
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.primary }}
                    >
                      {recentMatches.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('leaderboards.recentMatches')}</div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ backgroundColor: `${theme.colors.secondary}10` }}
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.secondary }}
                    >
                      {recentMatches.filter(m => m.is_tournament).length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('leaderboards.tournamentMatches')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default GameLeaderboardPage;
