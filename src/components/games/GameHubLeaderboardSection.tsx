import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, TrendingUp, TrendingDown, Minus, ChevronRight, Users, User } from 'lucide-react';
import { fetchLeaderboardByGameId } from '../../services/api';
import { getGameTheme } from '../../utils/gameThemes';

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

interface GameHubLeaderboardSectionProps {
  gameId: string;
  gameName: string;
}

const GameHubLeaderboardSection: React.FC<GameHubLeaderboardSectionProps> = ({
  gameId,
  gameName
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerRanking[]>([]);
  const [teams, setTeams] = useState<TeamRanking[]>([]);
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
  const [isLoading, setIsLoading] = useState(true);

  const theme = getGameTheme(gameName);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLeaderboardByGameId(gameId);
        setPlayers((data?.players || []).slice(0, 5));
        setTeams((data?.teams || []).slice(0, 3));
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
      };
    }
    if (rank === 2) {
      return {
        background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
        color: '#000',
      };
    }
    if (rank === 3) {
      return {
        background: 'linear-gradient(135deg, #CD7F32, #8B4513)',
        color: '#FFF',
      };
    }
    return {
      background: theme.colors.primary,
      color: theme.colors.text,
    };
  };

  const getWinRate = (wins: number, losses: number): number => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 w-48 bg-dark-300 rounded animate-pulse"></div>
        <div className="bg-dark-200/50 rounded-xl p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="w-8 h-8 bg-dark-300 rounded-full animate-pulse"></div>
              <div className="flex-1 h-4 bg-dark-300 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const hasData = players.length > 0 || teams.length > 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Crown className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('gameHub.leaderboard')}</h2>
        </div>

        <button
          onClick={() => navigate(`/leaderboards/${gameId}`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          {t('gameHub.viewFullLeaderboard')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {!hasData ? (
        <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-8 text-center">
          <Crown className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('gameHub.noLeaderboardData')}</p>
        </div>
      ) : (
        <div className="bg-dark-200/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('players')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'players'
                  ? 'text-white bg-dark-300/50'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{
                borderBottom: activeTab === 'players' ? `2px solid ${theme.colors.primary}` : 'none',
              }}
            >
              <User className="w-4 h-4" />
              {t('gameHub.topPlayers')}
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'teams'
                  ? 'text-white bg-dark-300/50'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{
                borderBottom: activeTab === 'teams' ? `2px solid ${theme.colors.primary}` : 'none',
              }}
            >
              <Users className="w-4 h-4" />
              {t('gameHub.topTeams')}
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'players' && (
              <div className="space-y-2">
                {players.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">{t('gameHub.noPlayersRanked')}</p>
                ) : (
                  players.map((player, index) => {
                    const rank = index + 1;
                    const winRate = getWinRate(player.wins, player.losses);

                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-dark-300/30 hover:bg-dark-300/50 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={getRankBadgeStyle(rank)}
                        >
                          {rank}
                        </div>

                        <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-400">
                          {player.user?.avatar_url ? (
                            <img
                              src={player.user.avatar_url}
                              alt={player.user?.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {player.user?.username || t('common.anonymous')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {player.wins}W - {player.losses}L ({winRate}%)
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className="font-bold"
                            style={{ color: theme.colors.primary }}
                          >
                            {player.elo_rating}
                          </p>
                          <p className="text-xs text-gray-400">ELO</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="space-y-2">
                {teams.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">{t('gameHub.noTeamsRanked')}</p>
                ) : (
                  teams.map((team, index) => {
                    const rank = index + 1;
                    const winRate = getWinRate(team.wins, team.losses);

                    return (
                      <div
                        key={team.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-dark-300/30 hover:bg-dark-300/50 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={getRankBadgeStyle(rank)}
                        >
                          {rank}
                        </div>

                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${theme.colors.primary}20` }}
                        >
                          <Users className="w-5 h-5" style={{ color: theme.colors.primary }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {team.team?.name || t('common.unknownTeam')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {team.wins}W - {team.losses}L ({winRate}%)
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className="font-bold"
                            style={{ color: theme.colors.primary }}
                          >
                            {team.elo_rating}
                          </p>
                          <p className="text-xs text-gray-400">ELO</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default GameHubLeaderboardSection;
