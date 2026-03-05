import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Gamepad2,
  ChevronRight,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { GameTheme, getGameTheme } from '../../utils/gameThemes';

interface PlayerRanking {
  id: string;
  elo_rating: number;
  wins: number;
  losses: number;
  rank_tier?: string;
  games?: {
    id: string;
    name: string;
  };
}

interface ProfileStatsTabProps {
  playerRankings: PlayerRanking[];
  theme: GameTheme;
  isLoading?: boolean;
}

const ProfileStatsTab: React.FC<ProfileStatsTabProps> = ({
  playerRankings,
  theme,
  isLoading = false
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (playerRankings.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">
          {t('profile.noStats', 'No Stats Yet')}
        </h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          {t('profile.noStatsDesc', 'Play in tournaments to build your stats and rankings.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {playerRankings.map((ranking) => {
        const gameTheme = getGameTheme(ranking.games?.name);
        const totalGames = ranking.wins + ranking.losses;
        const winRate = totalGames > 0 ? Math.round((ranking.wins / totalGames) * 100) : 0;

        return (
          <div
            key={ranking.id}
            className="rounded-xl p-4 border transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: `${gameTheme.colors.primary}06`,
              borderColor: `${gameTheme.colors.primary}20`
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${gameTheme.colors.primary}15` }}
              >
                <Gamepad2 className="w-6 h-6" style={{ color: gameTheme.colors.primary }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white truncate">
                    {ranking.games?.name || 'Unknown'}
                  </h4>
                  {ranking.rank_tier && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{
                        backgroundColor: `${gameTheme.colors.primary}20`,
                        color: gameTheme.colors.primary
                      }}
                    >
                      {ranking.rank_tier}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="font-medium">{ranking.elo_rating} ELO</span>
                  <span className="text-gray-600">|</span>
                  <span>
                    <span className="text-green-400">{ranking.wins}W</span>
                    {' / '}
                    <span className="text-red-400">{ranking.losses}L</span>
                  </span>
                  <span className="text-gray-600">|</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {winRate}% WR
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Link
        to="/profile/gaming-stats"
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
      >
        {t('profile.viewAllStats', 'View Detailed Stats')}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default ProfileStatsTab;
