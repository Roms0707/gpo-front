import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, Award, Target, TrendingUp, Star, Gamepad2 } from 'lucide-react';
import { GameTheme, getCardClipPath, getCardBorderRadius } from '../../utils/gameThemes';
import ThemedStatCard from './ThemedStatCard';
import PerformanceCharts from './PerformanceCharts';

interface GamingStatsOverviewProps {
  personalStats: {
    totalGames: number;
    averageScore: number;
    bestScore: number;
    totalScore: number;
    improvement: number;
  };
  gameRankings: any[];
  theme: GameTheme;
  recentScores?: number[];
  winRate?: number;
  playerLevel?: {
    level: number;
    title: string;
    progress: number;
  };
}

const GamingStatsOverview: React.FC<GamingStatsOverviewProps> = ({
  personalStats,
  gameRankings,
  theme,
  recentScores = [],
  winRate = 0,
  playerLevel
}) => {
  const { t } = useTranslation();
  const clipPath = getCardClipPath(theme.shape);
  const borderRadius = getCardBorderRadius(theme.shape);

  const topRanking = gameRankings[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ThemedStatCard
          icon={Trophy}
          value={personalStats.totalGames}
          label={t('gaming.gamesPlayed')}
          theme={theme}
          delay={0}
        />

        <ThemedStatCard
          icon={Award}
          value={personalStats.bestScore.toLocaleString()}
          label={t('gaming.bestScore')}
          theme={theme}
          delay={0.1}
        />

        <ThemedStatCard
          icon={Target}
          value={personalStats.averageScore.toLocaleString()}
          label={t('gaming.averageScore')}
          theme={theme}
          delay={0.2}
        />

        <ThemedStatCard
          icon={TrendingUp}
          value={`${personalStats.improvement > 0 ? '+' : ''}${personalStats.improvement}%`}
          label={t('gaming.progression')}
          theme={theme}
          delay={0.3}
          trend={personalStats.improvement > 0 ? 'up' : personalStats.improvement < 0 ? 'down' : 'neutral'}
        />
      </div>

      {(playerLevel || topRanking) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {playerLevel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden p-5"
              style={{
                backgroundColor: 'rgba(30, 30, 30, 0.9)',
                clipPath: clipPath !== 'none' ? clipPath : undefined,
                borderRadius: clipPath === 'none' ? borderRadius : undefined,
                border: `1px solid ${theme.colors.primary}25`
              }}
            >
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: theme.colors.primary }}
              />

              <div className="relative z-10 flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${theme.colors.primary}25`,
                    boxShadow: `0 0 25px ${theme.colors.primary}30`
                  }}
                >
                  <Star className="w-8 h-8" style={{ color: theme.colors.primary }} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: theme.colors.primary }}
                    >
                      {playerLevel.level}
                    </span>
                    <span className="text-lg text-white font-medium">
                      {playerLevel.title}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${playerLevel.progress}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: theme.colors.primary,
                        boxShadow: `0 0 10px ${theme.colors.primary}`
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(playerLevel.progress)}% {t('gaming.toNextLevel')}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {topRanking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden p-5"
              style={{
                backgroundColor: 'rgba(30, 30, 30, 0.9)',
                clipPath: clipPath !== 'none' ? clipPath : undefined,
                borderRadius: clipPath === 'none' ? borderRadius : undefined,
                border: `1px solid ${theme.colors.primary}25`
              }}
            >
              <div
                className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: theme.colors.secondary }}
              />

              <div className="relative z-10 flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${theme.colors.secondary}25`,
                    boxShadow: `0 0 25px ${theme.colors.secondary}30`
                  }}
                >
                  <Gamepad2 className="w-8 h-8" style={{ color: theme.colors.secondary }} />
                </div>

                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-1">{t('gaming.topGame')}</div>
                  <div className="text-xl font-bold text-white mb-1">
                    {topRanking.game_name || topRanking.games?.name}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      {t('gaming.rank')}: <span style={{ color: theme.colors.primary }}>#{topRanking.rank || '-'}</span>
                    </span>
                    <span className="text-gray-400">
                      ELO: <span style={{ color: theme.colors.secondary }}>{topRanking.elo_rating || '-'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {recentScores.length > 0 && (
        <PerformanceCharts
          theme={theme}
          recentScores={recentScores}
          winRate={winRate}
          averageScore={personalStats.averageScore}
        />
      )}
    </div>
  );
};

export default GamingStatsOverview;
