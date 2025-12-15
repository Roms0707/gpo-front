import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Users, User, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { fetchLeaderboardByGameId } from '../../../services/api';
import { GameTheme } from '../../../utils/gameThemes';

interface PlayerRanking {
  id: string;
  user_id: string;
  elo_rating: number;
  wins: number;
  losses: number;
  rank_tier?: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

interface TeamRanking {
  id: string;
  team_id: string;
  elo_rating: number;
  wins: number;
  losses: number;
  rank_tier?: string;
  team?: {
    name: string;
  };
}

interface GameHubLeaderboardTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

const GameHubLeaderboardTab: React.FC<GameHubLeaderboardTabProps> = ({
  gameId,
  gameName,
  theme,
}) => {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<PlayerRanking[]>([]);
  const [teams, setTeams] = useState<TeamRanking[]>([]);
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLeaderboardByGameId(gameId);
        setPlayers(data?.players || []);
        setTeams(data?.teams || []);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        setPlayers([]);
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [gameId]);

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) {
      return {
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        color: '#000',
        shadow: '0 0 20px rgba(255, 215, 0, 0.5)',
      };
    }
    if (rank === 2) {
      return {
        background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
        color: '#000',
        shadow: '0 0 15px rgba(192, 192, 192, 0.4)',
      };
    }
    if (rank === 3) {
      return {
        background: 'linear-gradient(135deg, #CD7F32, #8B4513)',
        color: '#FFF',
        shadow: '0 0 15px rgba(205, 127, 50, 0.4)',
      };
    }
    return {
      background: `${theme.colors.primary}30`,
      color: theme.colors.primary,
      shadow: 'none',
    };
  };

  const getWinRate = (wins: number, losses: number): number => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  const filteredPlayers = players.filter((player) =>
    player.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter((team) =>
    team.team?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 flex-1 bg-dark-300 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-dark-300 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-dark-300 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="bg-dark-200/50 rounded-xl p-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="w-10 h-10 bg-dark-300 rounded-full animate-pulse" />
              <div className="flex-1 h-4 bg-dark-300 rounded animate-pulse" />
              <div className="w-16 h-4 bg-dark-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasData = players.length > 0 || teams.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('gameHub.searchLeaderboard')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-200 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
          />
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'players'
                ? 'text-white'
                : 'text-gray-400 hover:text-white bg-dark-200'
            }`}
            style={activeTab === 'players' ? {
              backgroundColor: `${theme.colors.primary}20`,
              color: theme.colors.primary,
            } : undefined}
          >
            <User className="w-4 h-4" />
            {t('gameHub.topPlayers')}
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'teams'
                ? 'text-white'
                : 'text-gray-400 hover:text-white bg-dark-200'
            }`}
            style={activeTab === 'teams' ? {
              backgroundColor: `${theme.colors.primary}20`,
              color: theme.colors.primary,
            } : undefined}
          >
            <Users className="w-4 h-4" />
            {t('gameHub.topTeams')}
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-12 text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-white mb-2">{t('gameHub.noLeaderboardData')}</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {t('gameHub.noLeaderboardDataDesc')}
          </p>
        </div>
      ) : (
        <div className="bg-dark-200/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-dark-300/50 text-xs text-gray-400 font-medium uppercase tracking-wider">
            <div className="col-span-1">{t('gameHub.rank')}</div>
            <div className="col-span-5">{activeTab === 'players' ? t('gameHub.player') : t('gameHub.team')}</div>
            <div className="col-span-2 text-center">{t('gameHub.winLoss')}</div>
            <div className="col-span-2 text-center">{t('gameHub.winRate')}</div>
            <div className="col-span-2 text-right">{t('gameHub.elo')}</div>
          </div>

          <div className="divide-y divide-gray-800/50">
            {activeTab === 'players' && (
              filteredPlayers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">{t('gameHub.noPlayersRanked')}</div>
              ) : (
                filteredPlayers.map((player, index) => {
                  const rank = index + 1;
                  const winRate = getWinRate(player.wins, player.losses);
                  const rankStyle = getRankBadgeStyle(rank);

                  return (
                    <div
                      key={player.id}
                      className={`
                        grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors hover:bg-dark-300/30
                        ${rank <= 3 ? 'bg-dark-300/20' : ''}
                      `}
                    >
                      <div className="col-span-2 sm:col-span-1">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            background: rankStyle.background,
                            color: rankStyle.color,
                            boxShadow: rankStyle.shadow,
                          }}
                        >
                          {rank <= 3 && <Crown className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {rank > 3 && rank}
                        </div>
                      </div>

                      <div className="col-span-10 sm:col-span-5 flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-dark-400 flex-shrink-0">
                          {player.user?.avatar_url ? (
                            <img
                              src={player.user.avatar_url}
                              alt={player.user?.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <User className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">
                            {player.user?.username || t('common.anonymous')}
                          </p>
                          {player.rank_tier && (
                            <p className="text-xs text-gray-400">{player.rank_tier}</p>
                          )}
                        </div>
                      </div>

                      <div className="hidden sm:flex col-span-2 justify-center">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-success-400">{player.wins}W</span>
                          <span className="text-gray-500">-</span>
                          <span className="text-red-400">{player.losses}L</span>
                        </div>
                      </div>

                      <div className="hidden sm:flex col-span-2 justify-center">
                        <div className="flex items-center gap-1.5">
                          {winRate >= 50 ? (
                            <TrendingUp className="w-4 h-4 text-success-400" />
                          ) : winRate < 50 && winRate > 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          ) : (
                            <Minus className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            winRate >= 50 ? 'text-success-400' : winRate > 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {winRate}%
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block col-span-2 text-right">
                        <p className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                          {player.elo_rating}
                        </p>
                      </div>

                      <div className="col-span-12 sm:hidden flex items-center justify-between mt-2 pt-2 border-t border-gray-800/50">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-success-400">{player.wins}W</span>
                          <span className="text-red-400">{player.losses}L</span>
                          <span className={winRate >= 50 ? 'text-success-400' : 'text-red-400'}>{winRate}%</span>
                        </div>
                        <p className="font-bold" style={{ color: theme.colors.primary }}>{player.elo_rating} ELO</p>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {activeTab === 'teams' && (
              filteredTeams.length === 0 ? (
                <div className="p-8 text-center text-gray-400">{t('gameHub.noTeamsRanked')}</div>
              ) : (
                filteredTeams.map((team, index) => {
                  const rank = index + 1;
                  const winRate = getWinRate(team.wins, team.losses);
                  const rankStyle = getRankBadgeStyle(rank);

                  return (
                    <div
                      key={team.id}
                      className={`
                        grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors hover:bg-dark-300/30
                        ${rank <= 3 ? 'bg-dark-300/20' : ''}
                      `}
                    >
                      <div className="col-span-2 sm:col-span-1">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            background: rankStyle.background,
                            color: rankStyle.color,
                            boxShadow: rankStyle.shadow,
                          }}
                        >
                          {rank <= 3 && <Crown className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {rank > 3 && rank}
                        </div>
                      </div>

                      <div className="col-span-10 sm:col-span-5 flex items-center gap-3">
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${theme.colors.primary}20` }}
                        >
                          <Users className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.primary }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">
                            {team.team?.name || t('common.unknownTeam')}
                          </p>
                          {team.rank_tier && (
                            <p className="text-xs text-gray-400">{team.rank_tier}</p>
                          )}
                        </div>
                      </div>

                      <div className="hidden sm:flex col-span-2 justify-center">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-success-400">{team.wins}W</span>
                          <span className="text-gray-500">-</span>
                          <span className="text-red-400">{team.losses}L</span>
                        </div>
                      </div>

                      <div className="hidden sm:flex col-span-2 justify-center">
                        <div className="flex items-center gap-1.5">
                          {winRate >= 50 ? (
                            <TrendingUp className="w-4 h-4 text-success-400" />
                          ) : winRate < 50 && winRate > 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          ) : (
                            <Minus className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            winRate >= 50 ? 'text-success-400' : winRate > 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {winRate}%
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block col-span-2 text-right">
                        <p className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                          {team.elo_rating}
                        </p>
                      </div>

                      <div className="col-span-12 sm:hidden flex items-center justify-between mt-2 pt-2 border-t border-gray-800/50">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-success-400">{team.wins}W</span>
                          <span className="text-red-400">{team.losses}L</span>
                          <span className={winRate >= 50 ? 'text-success-400' : 'text-red-400'}>{winRate}%</span>
                        </div>
                        <p className="font-bold" style={{ color: theme.colors.primary }}>{team.elo_rating} ELO</p>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHubLeaderboardTab;
