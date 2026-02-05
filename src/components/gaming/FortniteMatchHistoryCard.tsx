import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Trophy, Target, Users, MapPin } from 'lucide-react';
import { getGameTheme, getCardClipPath } from '../../utils/gameThemes';

interface FortniteMatchHistoryCardProps {
  matchHistory: any[];
  isLoading?: boolean;
}

const FortniteMatchHistoryCard: React.FC<FortniteMatchHistoryCardProps> = ({
  matchHistory,
  isLoading = false
}) => {
  const { t, i18n } = useTranslation();
  const theme = getGameTheme('Fortnite');
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPlacementColor = (placement: number) => {
    if (placement === 1) return 'text-yellow-500';
    if (placement <= 3) return 'text-orange-500';
    if (placement <= 10) return 'text-green-500';
    return 'text-gray-500';
  };

  const getGameModeDisplay = (mode: string) => {
    const modes: { [key: string]: string } = {
      'solo': t('gaming.solo'),
      'duo': t('gaming.duo'),
      'squad': t('gaming.squad'),
      'ltm': t('gaming.limitedTimeMode')
    };
    return modes[mode] || mode;
  };

  if (isLoading) {
    return (
      <div
        className="bg-white dark:bg-gray-800/90 shadow-lg p-6 relative overflow-hidden"
        style={{
          clipPath: getCardClipPath(theme.shape),
          border: `1px solid ${theme.colors.border}30`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" style={{ color: theme.colors.primary }} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('gaming.fortniteMatchHistory')}
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-dark-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (matchHistory.length === 0) {
    return (
      <div
        className="bg-white dark:bg-gray-800/90 shadow-lg p-6 relative overflow-hidden"
        style={{
          clipPath: getCardClipPath(theme.shape),
          border: `1px solid ${theme.colors.border}30`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" style={{ color: theme.colors.primary }} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('gaming.fortniteMatchHistory')}
          </h3>
        </div>
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Clock className="w-8 h-8" style={{ color: theme.colors.primary }} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('gaming.noMatchHistoryAvailable')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {t('gaming.matchHistoryNotAvailableForAll')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800/90 shadow-lg p-6 relative overflow-hidden"
      style={{
        clipPath: getCardClipPath(theme.shape),
        border: `1px solid ${theme.colors.border}30`,
      }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20, transparent 50%, ${theme.colors.border}20)` }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" style={{ color: theme.colors.primary }} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('gaming.fortniteMatchHistory')}
          </h3>
        </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {matchHistory.slice(0, 10).map((match, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`font-bold text-lg ${getPlacementColor(match.placement || 0)}`}>
                  #{match.placement || 'N/A'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getGameModeDisplay(match.gameMode || 'unknown')}
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {match.dateCollected ? new Date(match.dateCollected).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US') : t('gaming.unknownDate')}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-red-500" />
                <span className="text-gray-600 dark:text-gray-400">{t('gaming.eliminationsShort')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {match.kills || 0}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">{t('gaming.playersShort')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {match.playersLeft || 'N/A'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">{t('gaming.durationShort')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {match.minutesPlayed ? `${match.minutesPlayed}min` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">{t('gaming.scoreShort')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {match.score || 0}
                </span>
              </div>
            </div>

            {match.gameMode && (
              <div className="mt-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('gaming.modeLabel')} {getGameModeDisplay(match.gameMode)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {matchHistory.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('gaming.showingLastMatches', { count: 10, total: matchHistory.length })}
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default FortniteMatchHistoryCard;