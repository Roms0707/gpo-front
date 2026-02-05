import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Users,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  Edit3,
  Share2,
  RefreshCw,
  Gamepad2,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';
import { GameTheme, getCardClipPath, getCardBorderRadius } from '../../utils/gameThemes';

interface GamingAccount {
  id: string;
  value: string;
  is_validated?: boolean;
  game_publisher_ids?: {
    games?: {
      id: string;
      name: string;
    };
    label?: string;
  };
}

interface TournamentStats {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
}

interface GamingStatsSidebarProps {
  theme: GameTheme;
  tournamentStats: TournamentStats;
  gamingAccounts: GamingAccount[];
  winRate: number;
  globalRank?: number;
  totalPlayers?: number;
  aimTrainerBestScore: number;
  reactionTimeBestScore: number;
  onRefresh?: () => void;
  onShare?: () => void;
  isRefreshing?: boolean;
}

const GamingStatsSidebar: React.FC<GamingStatsSidebarProps> = ({
  theme,
  tournamentStats,
  gamingAccounts,
  winRate,
  globalRank,
  totalPlayers,
  aimTrainerBestScore,
  reactionTimeBestScore,
  onRefresh,
  onShare,
  isRefreshing = false
}) => {
  const { t } = useTranslation();
  const validatedCount = gamingAccounts.filter(a => a.is_validated).length;
  const clipPath = getCardClipPath(theme.shape);
  const borderRadius = getCardBorderRadius(theme.shape);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="relative overflow-hidden p-5"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          clipPath: clipPath !== 'none' ? clipPath : undefined,
          borderRadius: clipPath === 'none' ? borderRadius : undefined,
          border: `1px solid ${theme.colors.primary}30`
        }}
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: theme.colors.primary }}
        />

        <h3 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: theme.colors.primary }} />
          {t('gaming.quickStats')}
        </h3>

        <div className="space-y-3">
          <QuickStatRow
            icon={Trophy}
            label={t('gaming.tournaments')}
            value={tournamentStats.total}
            subValue={`${tournamentStats.ongoing} ${t('gaming.ongoing').toLowerCase()}`}
            theme={theme}
          />
          <QuickStatRow
            icon={Target}
            label={t('gaming.winRate')}
            value={`${winRate}%`}
            theme={theme}
            highlight={winRate >= 50}
          />
          {globalRank && totalPlayers && (
            <QuickStatRow
              icon={Globe}
              label={t('gaming.globalRank')}
              value={`#${globalRank.toLocaleString()}`}
              subValue={`/ ${totalPlayers.toLocaleString()}`}
              theme={theme}
            />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden p-5"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          clipPath: clipPath !== 'none' ? clipPath : undefined,
          borderRadius: clipPath === 'none' ? borderRadius : undefined,
          border: `1px solid ${theme.colors.primary}30`
        }}
      >
        <h3 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4" style={{ color: theme.colors.primary }} />
          {t('gaming.connectedAccounts')}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">
            {validatedCount} / {gamingAccounts.length} {t('gaming.validated')}
          </span>
          <div className="flex gap-1">
            {[...Array(Math.min(gamingAccounts.length, 5))].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: i < validatedCount ? theme.colors.primary : 'rgba(255,255,255,0.2)'
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {gamingAccounts.slice(0, 5).map((account, index) => (
            <div
              key={account.id || index}
              className="flex items-center justify-between py-2 px-3 rounded-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <span className="text-sm text-gray-300 truncate flex-1">
                {account.game_publisher_ids?.games?.name || account.game_publisher_ids?.label || t('gaming.unknownGame')}
              </span>
              {account.is_validated ? (
                <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {gamingAccounts.length > 5 && (
          <Link
            to="/profile/settings#gaming-accounts"
            className="mt-3 text-sm flex items-center justify-center gap-1 py-2"
            style={{ color: theme.colors.primary }}
          >
            +{gamingAccounts.length - 5} {t('gaming.moreAccounts')}
          </Link>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden p-5"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          clipPath: clipPath !== 'none' ? clipPath : undefined,
          borderRadius: clipPath === 'none' ? borderRadius : undefined,
          border: `1px solid ${theme.colors.primary}30`
        }}
      >
        <h3 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: theme.colors.primary }} />
          {t('gaming.trainingGames')}
        </h3>

        <div className="space-y-3">
          <Link
            to="/profile/gaming-stats"
            onClick={() => {
              const el = document.getElementById('walkthrough-tab-aim-trainer');
              if (el) el.click();
            }}
            className="block p-3 rounded-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.primary}20`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span className="text-sm text-white">{t('gaming.aimTrainer')}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: theme.colors.primary }}>
                  {aimTrainerBestScore > 0 ? aimTrainerBestScore.toLocaleString() : '-'}
                </div>
                <div className="text-xs text-gray-500">{t('gaming.bestScore')}</div>
              </div>
            </div>
          </Link>

          <Link
            to="/profile/gaming-stats"
            onClick={() => {
              const el = document.querySelector('[data-tab="reaction-time"]');
              if (el) (el as HTMLElement).click();
            }}
            className="block p-3 rounded-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.primary}20`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: theme.colors.secondary }} />
                <span className="text-sm text-white">{t('gaming.reactionTime')}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: theme.colors.secondary }}>
                  {reactionTimeBestScore > 0 ? `${reactionTimeBestScore}ms` : '-'}
                </div>
                <div className="text-xs text-gray-500">{t('gaming.bestTime')}</div>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-2"
      >
        <Link
          to="/profile/settings#gaming-accounts"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: `${theme.colors.primary}20`,
            color: theme.colors.primary,
            border: `1px solid ${theme.colors.primary}40`
          }}
        >
          <Edit3 className="w-4 h-4" />
          {t('profile.editProfile')}
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onShare}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <Share2 className="w-4 h-4" />
            {t('gaming.share')}
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('gaming.refresh')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface QuickStatRowProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  theme: GameTheme;
  highlight?: boolean;
}

const QuickStatRow: React.FC<QuickStatRowProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  theme,
  highlight = false
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${theme.colors.primary}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-right">
        <span
          className="font-bold"
          style={{ color: highlight ? theme.colors.primary : '#fff' }}
        >
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-gray-500 ml-1">{subValue}</span>
        )}
      </div>
    </div>
  );
};

export default GamingStatsSidebar;
