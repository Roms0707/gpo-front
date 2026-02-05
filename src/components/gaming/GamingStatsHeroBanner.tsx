import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  User,
  Share2,
  Eye,
  Trophy,
  Target,
  Gamepad2,
  TrendingUp,
  Star
} from 'lucide-react';
import { User as UserType } from '../../types';
import { GameTheme } from '../../utils/gameThemes';
import PlayerLevelBadge from '../profile/PlayerLevelBadge';

interface GamingStatsHeroBannerProps {
  user: UserType | null;
  theme: GameTheme;
  primaryGameName: string | null;
  xp: number;
  stats: {
    gamesPlayed: number;
    bestScore: number;
    winRate: number;
    connectedAccounts: number;
  };
  onShareClick?: () => void;
  onPreviewClick?: () => void;
}

const GamingStatsHeroBanner: React.FC<GamingStatsHeroBannerProps> = ({
  user,
  theme,
  primaryGameName,
  xp,
  stats,
  onShareClick,
  onPreviewClick
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}40 0%, ${theme.colors.secondary}25 50%, ${theme.colors.primary}20 100%)`
        }}
      />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            ${theme.colors.primary}25 10px,
            ${theme.colors.primary}25 20px
          )`
        }}
      />

      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-25"
        style={{ backgroundColor: theme.colors.primary }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: theme.colors.secondary }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: theme.colors.glow }}
      />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex items-start gap-5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0"
              style={{
                boxShadow: `0 0 40px ${theme.colors.primary}50`,
                border: `3px solid ${theme.colors.primary}70`
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}30` }}
                >
                  <User className="w-10 h-10 text-white/60" />
                </div>
              )}

              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 0 12px ${theme.colors.primary}`
                }}
              >
                <Star className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
                  {user?.username || 'Player'}
                </h1>
                {primaryGameName && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="hidden md:inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${theme.colors.primary}35`,
                      color: theme.colors.primary,
                      border: `1px solid ${theme.colors.primary}50`
                    }}
                  >
                    {primaryGameName}
                  </motion.span>
                )}
              </div>

              <p className="text-sm text-gray-300 mb-3">
                {t('gaming.viewPerformanceAndRankings')}
              </p>

              <div className="hidden md:block">
                <PlayerLevelBadge xp={xp} theme={theme} compact />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShareClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.text,
                boxShadow: `0 4px 15px ${theme.colors.primary}40`
              }}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('gaming.share')}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPreviewClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{t('gaming.viewMyPublicProfile')}</span>
            </motion.button>

            <Link
              to="/profile/settings#gaming-accounts"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('gaming.connectAccounts')}</span>
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6"
        >
          <StatCard
            icon={Trophy}
            value={stats.gamesPlayed}
            label={t('gaming.gamesPlayed')}
            theme={theme}
            delay={0.5}
          />
          <StatCard
            icon={Target}
            value={stats.bestScore.toLocaleString()}
            label={t('gaming.bestScore')}
            theme={theme}
            delay={0.6}
          />
          <StatCard
            icon={TrendingUp}
            value={`${stats.winRate}%`}
            label={t('gaming.winRate')}
            theme={theme}
            delay={0.7}
          />
          <StatCard
            icon={Gamepad2}
            value={stats.connectedAccounts}
            label={t('gaming.connectedAccounts')}
            theme={theme}
            delay={0.8}
          />
        </motion.div>

        <div className="md:hidden mt-4">
          <PlayerLevelBadge xp={xp} theme={theme} />
        </div>
      </div>
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.FC<{ className?: string }>;
  value: number | string;
  label: string;
  theme: GameTheme;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, theme, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className="relative overflow-hidden rounded-xl p-4 backdrop-blur-sm cursor-default"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: `1px solid ${theme.colors.primary}25`
      }}
    >
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}10 0%, transparent 100%)`
        }}
      />
      <div className="relative flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${theme.colors.primary}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: theme.colors.primary }} />
        </div>
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className="text-xl font-bold text-white"
          >
            {value}
          </motion.div>
          <div className="text-xs text-gray-400">{label}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default GamingStatsHeroBanner;
