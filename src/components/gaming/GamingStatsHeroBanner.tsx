import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  User,
  Share2,
  Eye,
  Gamepad2,
  Trophy,
  TrendingUp,
  Zap,
  Calendar,
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
    tournamentsPlayed: number;
    winRate: number;
    bestElo: number;
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
  onPreviewClick,
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const heroStats = [
    { icon: Trophy, value: stats.tournamentsPlayed, label: t('gaming.tournamentsPlayed') },
    { icon: TrendingUp, value: `${stats.winRate}%`, label: t('gaming.winRate') },
    { icon: Zap, value: stats.bestElo > 0 ? stats.bestElo.toLocaleString() : '--', label: t('gaming.bestElo') },
  ];

  return (
    <div className="relative overflow-hidden">
      {user?.banner_url ? (
        <img
          src={user.banner_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}40 0%, ${theme.colors.secondary}30 50%, ${theme.colors.primary}20 100%)`,
          }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/70 to-gray-900/95" />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, ${theme.colors.primary}20 10px, ${theme.colors.primary}20 20px)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-end p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onShareClick}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all border border-white/10"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('gaming.share')}</span>
            </button>
            <button
              onClick={onPreviewClick}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all border border-white/10"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/profile/settings#gaming-accounts"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border border-white/10"
              style={{
                backgroundColor: `${theme.colors.primary}30`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
              <span className="hidden lg:inline text-white">{t('gaming.connectAccounts')}</span>
            </Link>
          </div>
        </div>

        <div className="px-6 pb-8 pt-2">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-4 ring-gray-900"
                style={{
                  boxShadow: `0 0 30px ${theme.colors.primary}30`,
                }}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.username}
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
              </div>
            </motion.div>

            <div className="mt-3 text-center">
              {primaryGameName && (
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold mb-1"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    color: theme.colors.primary,
                  }}
                >
                  {primaryGameName}
                </span>
              )}
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
                {user?.username || 'Player'}
              </h1>
              <div className="flex items-center justify-center gap-3 mt-1.5 text-sm text-gray-400">
                <PlayerLevelBadge xp={xp} theme={theme} compact />
                {user?.created_at && (
                  <>
                    <span className="text-gray-600">-</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {t('profile.memberSince', { date: formatDate(user.created_at) })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 max-w-lg mx-auto w-full">
              {heroStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    className="relative overflow-hidden rounded-xl p-3 md:p-4 text-center transition-transform hover:scale-[1.03] backdrop-blur-sm"
                    style={{
                      backgroundColor: `${theme.colors.primary}15`,
                      border: `1px solid ${theme.colors.primary}25`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${theme.colors.primary}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-lg font-bold text-white leading-tight">{stat.value}</div>
                        <div className="text-[11px] text-gray-500 truncate">{stat.label}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamingStatsHeroBanner;
