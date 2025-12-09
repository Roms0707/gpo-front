import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Trophy, Target, Calendar, Loader2, AlertCircle, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FortniteAccountCardProps {
  account: {
    username: string;
    platform: string;
    isValidated?: boolean;
    validationData?: any;
  };
  onLoadStats: (username: string, platform: string) => Promise<void>;
  isLoadingStats: boolean;
  statsData?: any;
}

const FortniteAccountCard: React.FC<FortniteAccountCardProps> = ({
  account,
  onLoadStats,
  isLoadingStats,
  statsData
}) => {
  const { t, i18n } = useTranslation();
  const [platform, setPlatform] = useState<'epic' | 'psn' | 'xbl'>('epic');
  const [username, setUsername] = useState(account.username || '');
  const [error, setError] = useState<string | null>(null);
  const [isAccountValidated, setIsAccountValidated] = useState(account.isValidated || false);

  // Update local state when account prop changes
  useEffect(() => {
    setUsername(account.username || '');
    setIsAccountValidated(account.isValidated || false);
  }, [account.username, account.isValidated]);

  const handleLoadStats = async () => {
    if (!username.trim()) {
      setError(t('gaming.pleaseEnterUsername'));
      return;
    }

    setError(null);
    try {
      await onLoadStats(username, platform);
    } catch (error) {
      setError(t('gaming.errorLoadingStatistics'));
    }
  };

  const formatNumber = (num: number) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  };

  const getWinRate = () => {
    if (!statsData?.stats?.all?.overall) return 0;
    const { wins, matches } = statsData.stats.all.overall;
    return matches > 0 ? ((wins / matches) * 100).toFixed(1) : '0.0';
  };

  const getKD = () => {
    if (!statsData?.stats?.all?.overall) return 0;
    const { kills, deaths } = statsData.stats.all.overall;
    return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-accent-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('gaming.fortniteAccount')}
          {isAccountValidated && (
            <span className="ml-2 text-xs bg-success-500/20 text-success-400 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              {t('gaming.validated')}
            </span>
          )}
        </h3>
      </div>

      {/* Account Configuration Section */}
      {(!isAccountValidated || !statsData) && (
        <div className="space-y-4">
          {isAccountValidated && account.validationData && (
            <div className="bg-success-500/10 border border-success-500/30 p-3 rounded-lg mb-4">
              <div className="flex items-center text-success-400 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>{t('gaming.accountValidatedName', { name: account.validationData.account?.name || username })}</span>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('gaming.epicGamesUsernameLabel')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('gaming.enterYourUsername')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              disabled={isAccountValidated}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('gaming.epicIdCaseSensitive')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('gaming.platform')}
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as 'epic' | 'psn' | 'xbl')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              disabled={isAccountValidated}
            >
              <option value="epic">{t('gaming.epicGames')}</option>
              <option value="psn">{t('gaming.playstation')}</option>
              <option value="xbl">{t('gaming.xboxLive')}</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
                {error.includes(t('gaming.playerNotFound')) && (
                  <p className="mt-1 text-xs">
                    {t('gaming.hintEpicId')}
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleLoadStats}
            disabled={isLoadingStats}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {isLoadingStats ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('gaming.loading')}
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                {t('gaming.loadStatistics')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Stats Display Section */}
      {statsData && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {statsData.account?.name || username}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('gaming.platform')}: {platform.toUpperCase()}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {t('gaming.lastUpdated')} {new Date().toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
              </p>
            </div>
          </div>

          {statsData.stats?.all?.overall && (
            <>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">{t('gaming.generalStatistics')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg">
                  <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatNumber(statsData.stats.all.overall.wins || 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.victories')}</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-lg">
                  <Target className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatNumber(statsData.stats.all.overall.kills || 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.eliminations')}</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg">
                  <div className="w-6 h-6 mx-auto mb-1 flex items-center justify-center">
                    <span className="text-blue-500 font-bold text-sm">K/D</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {getKD()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.kdRatio')}</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg">
                  <div className="w-6 h-6 mx-auto mb-1 flex items-center justify-center">
                    <span className="text-green-500 font-bold text-xs">WIN</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {getWinRate()}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.victoryRate')}</div>
                </div>
              </div>
            </>
          )}

          {statsData.stats?.all?.overall && (
            <>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 mt-6">{t('gaming.detailedStatistics')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-6 h-6 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-400 font-bold text-xs">#</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatNumber(statsData.stats.all.overall.matches || 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.matchesPlayed')}</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatNumber(statsData.stats.all.overall.minutesPlayed || 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.minutesPlayed')}</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatNumber(statsData.stats.all.overall.score || 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.totalScore')}</div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleLoadStats}
              disabled={isLoadingStats}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {isLoadingStats ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('gaming.refreshing')}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {t('gaming.refreshStats')}
                </>
              )}
            </button>
            
            {!isAccountValidated && (
              <Link
                to="/profile/edit"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <User className="w-4 h-4" />
                {t('gaming.validateAccount')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Empty State when no stats loaded */}
      {!statsData && isAccountValidated && !isLoadingStats && !error && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-blue-800">{t('gaming.fortniteStatsComingSoon')}</p>
          <button
            onClick={handleLoadStats}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto font-medium"
          >
            <Trophy className="w-4 h-4" />
            {t('gaming.viewMyStatistics')}
          </button>
        </div>
      )}
    </div>
  );
};

export default FortniteAccountCard;