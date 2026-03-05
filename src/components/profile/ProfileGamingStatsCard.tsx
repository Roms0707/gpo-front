import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Trophy,
  Target,
  Swords,
  TrendingUp,
  ChevronRight,
  Star,
  Shield
} from 'lucide-react';
import { GameTheme, getGameTheme } from '../../utils/gameThemes';
import { calculatePlayerLevel } from '../../hooks/usePlayerPrimaryGame';

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

interface ProfileGamingStatsCardProps {
  stats: {
    tournamentsPlayed: number;
    winRate: number;
    connectedAccounts: number;
    validatedAccounts: number;
  };
  playerRankings: PlayerRanking[];
  theme: GameTheme;
  xp: number;
}

const ProfileGamingStatsCard: React.FC<ProfileGamingStatsCardProps> = ({
  stats,
  playerRankings,
  theme,
  xp
}) => {
  const { t } = useTranslation();
  const playerLevel = calculatePlayerLevel(xp);

  const totalWins = playerRankings.reduce((sum, r) => sum + (r.wins || 0), 0);
  const totalLosses = playerRankings.reduce((sum, r) => sum + (r.losses || 0), 0);
  const topRanking = [...playerRankings].sort((a, b) => (b.elo_rating || 0) - (a.elo_rating || 0))[0];
  const topGameTheme = topRanking?.games?.name ? getGameTheme(topRanking.games.name) : null;

  const statItems = [
    {
      icon: Trophy,
      value: stats.tournamentsPlayed,
      label: t('gaming.totalTournaments', 'Tournaments'),
      color: theme.colors.primary
    },
    {
      icon: Target,
      value: `${stats.winRate}%`,
      label: t('gaming.winRate', 'Win Rate'),
      color: stats.winRate >= 50 ? '#22c55e' : stats.winRate > 0 ? '#f59e0b' : theme.colors.primary
    },
    {
      icon: Swords,
      value: `${totalWins}/${totalLosses}`,
      label: t('profile.winsLosses', 'W / L'),
      color: theme.colors.secondary
    },
    {
      icon: Shield,
      value: `${stats.validatedAccounts}/${stats.connectedAccounts}`,
      label: t('profile.verifiedAccounts', 'Verified'),
      color: theme.colors.primary
    }
  ];

  const hasData = stats.tournamentsPlayed > 0 || playerRankings.length > 0 || stats.connectedAccounts > 0;

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{
        borderColor: `${theme.colors.primary}25`,
        backgroundColor: `${theme.colors.primary}05`
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}15` }}
            >
              <Gamepad2 className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {t('gaming.myGamingStats', 'Gaming Stats')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('profile.quickPerformanceOverview', 'Quick performance overview')}
              </p>
            </div>
          </div>
          <Link
            to="/profile/gaming-stats"
            className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: theme.colors.primary }}
          >
            {t('gaming.viewFullStats', 'See More')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!hasData ? (
          <div
            className="rounded-xl p-6 text-center border"
            style={{
              borderColor: `${theme.colors.primary}15`,
              background: `linear-gradient(135deg, ${theme.colors.primary}05 0%, ${theme.colors.secondary}05 100%)`
            }}
          >
            <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-sm text-gray-400 mb-3">
              {t('gaming.participateToSeeStats', 'Play in tournaments to see your stats here.')}
            </p>
            <Link
              to="/profile/gaming-stats"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: `${theme.colors.primary}15`,
                color: theme.colors.primary
              }}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              {t('gaming.viewMyGameStats', 'View Stats')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {statItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  className="rounded-xl p-3 text-center border transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    borderColor: `${item.color}15`,
                    backgroundColor: `${item.color}08`
                  }}
                >
                  <item.icon
                    className="w-4 h-4 mx-auto mb-1.5"
                    style={{ color: item.color }}
                  />
                  <div className="text-base font-bold text-white leading-tight">
                    {item.value}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 leading-tight truncate">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {topRanking && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.35 }}
                className="rounded-xl p-3.5 border"
                style={{
                  borderColor: `${topGameTheme?.colors.primary || theme.colors.primary}15`,
                  background: `linear-gradient(135deg, ${topGameTheme?.colors.primary || theme.colors.primary}08 0%, transparent 100%)`
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${topGameTheme?.colors.primary || theme.colors.primary}18` }}
                  >
                    <Gamepad2
                      className="w-5 h-5"
                      style={{ color: topGameTheme?.colors.primary || theme.colors.primary }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {topRanking.games?.name || t('gaming.unknownGame', 'Unknown')}
                      </span>
                      {topRanking.rank_tier && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${topGameTheme?.colors.primary || theme.colors.primary}20`,
                            color: topGameTheme?.colors.primary || theme.colors.primary
                          }}
                        >
                          {topRanking.rank_tier}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {topRanking.elo_rating} ELO
                      </span>
                      <span className="text-xs">
                        <span className="text-green-400">{topRanking.wins}W</span>
                        <span className="text-gray-600 mx-1">/</span>
                        <span className="text-red-400">{topRanking.losses}L</span>
                      </span>
                    </div>
                  </div>
                  <TrendingUp
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: topGameTheme?.colors.primary || theme.colors.primary }}
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.35 }}
              className="rounded-xl p-3 border"
              style={{
                borderColor: `${theme.colors.primary}15`,
                backgroundColor: `${theme.colors.primary}05`
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}18` }}
                >
                  <Star className="w-4 h-4" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {t('gaming.level', 'Level')} {playerLevel.level} - {playerLevel.title}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {Math.round(playerLevel.progress)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${playerLevel.progress}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: theme.colors.primary,
                        boxShadow: `0 0 8px ${theme.colors.primary}60`
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileGamingStatsCard;
