import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { GameTheme, getCardClipPath, getCardBorderRadius } from '../../utils/gameThemes';
import { LucideIcon } from 'lucide-react';

interface GameTabHeaderProps {
  title: string;
  theme: GameTheme;
  icon?: LucideIcon;
  isValidated?: boolean;
  lastUpdated?: Date | string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showRefresh?: boolean;
}

const GameTabHeader: React.FC<GameTabHeaderProps> = ({
  title,
  theme,
  icon: CustomIcon,
  isValidated,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  showRefresh = true
}) => {
  const { t } = useTranslation();
  const Icon = CustomIcon || theme.icon;
  const clipPath = getCardClipPath(theme.shape);
  const borderRadius = getCardBorderRadius(theme.shape);

  const formatLastUpdated = (date: Date | string | null) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('gaming.justNow');
    if (diffMins < 60) return t('gaming.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('gaming.hoursAgo', { count: diffHours });
    return t('gaming.daysAgo', { count: diffDays });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden mb-6"
      style={{
        clipPath: clipPath !== 'none' ? clipPath : undefined,
        borderRadius: clipPath === 'none' ? borderRadius : undefined,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}20 0%, ${theme.colors.secondary}10 100%)`
        }}
      />

      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 8px,
            ${theme.colors.primary}30 8px,
            ${theme.colors.primary}30 16px
          )`
        }}
      />

      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: theme.colors.primary }}
      />

      <div className="relative z-10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${theme.colors.primary}30`,
              boxShadow: `0 0 15px ${theme.colors.primary}20`
            }}
          >
            <Icon className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>

          <div>
            <h2 className="font-heading font-semibold text-lg text-white flex items-center gap-2">
              {title}
              {isValidated !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isValidated
                      ? 'bg-success-500/20 text-success-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {isValidated ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      {t('gaming.validated')}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      {t('gaming.notValidated')}
                    </>
                  )}
                </span>
              )}
            </h2>

            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {t('gaming.lastUpdated')}: {formatLastUpdated(lastUpdated)}
              </div>
            )}
          </div>
        </div>

        {showRefresh && onRefresh && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: `${theme.colors.primary}20`,
              color: theme.colors.primary,
              border: `1px solid ${theme.colors.primary}30`
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('gaming.refresh')}</span>
          </motion.button>
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, ${theme.colors.primary}60 0%, ${theme.colors.secondary}30 50%, transparent 100%)`
        }}
      />
    </motion.div>
  );
};

export default GameTabHeader;
