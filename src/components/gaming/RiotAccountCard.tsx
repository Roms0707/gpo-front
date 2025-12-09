import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Star, Trophy, Swords, Crown, CheckCircle, ExternalLink, TrendingUp, Loader, AlertTriangle } from 'lucide-react';

interface RiotAccountCardProps {
  account: {
    value: string;
    is_validated: boolean;
    validation_data?: any;
    validation_date?: string;
  };
  onLoadMatchHistory?: () => void;
  isLoadingMatches?: boolean;
}

const RiotAccountCard: React.FC<RiotAccountCardProps> = ({ account, onLoadMatchHistory, isLoadingMatches }) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  
  if (!account.is_validated || !account.validation_data) {
    return (
      <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 dark:bg-dark-300 rounded-lg flex items-center justify-center mr-4">
              <Shield className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
                {account.value}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('gaming.accountNotValidated')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { summonerInfo, rankedStats } = account.validation_data;
  const soloQueueStats = rankedStats?.find((stat: any) => stat.queueType === 'RANKED_SOLO_5x5');
  
  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center mr-4">
            <Shield className="h-6 w-6 text-accent-500" />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
                {account.value}
              </h3>
              <CheckCircle className="h-5 w-5 text-success-400 ml-2" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('gaming.level')} {summonerInfo?.summonerLevel || 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-accent-600 hover:text-accent-500 transition-colors text-sm"
          >
            {showDetails ? t('gaming.hide') : t('gaming.details')}
          </button>

          {onLoadMatchHistory && (
            <button
              onClick={onLoadMatchHistory}
              disabled={isLoadingMatches}
              className="bg-accent-600 hover:bg-accent-700 disabled:bg-accent-600/50 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
            >
              {isLoadingMatches ? (
                <>
                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                  {t('gaming.loading')}
                </>
              ) : (
                t('gaming.loadHistory')
              )}
            </button>
          )}
        </div>
      </div>
      
      {showDetails && soloQueueStats && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-warning-500 mr-2" />
              <span className="font-medium text-gray-900 dark:text-white">
                {soloQueueStats.tier} {soloQueueStats.rank}
              </span>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-accent-500">{soloQueueStats.leaguePoints} LP</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-success-400">{soloQueueStats.wins}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.wins')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-error-400">{soloQueueStats.losses}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.losses')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-info-400">
                {Math.round((soloQueueStats.wins / (soloQueueStats.wins + soloQueueStats.losses)) * 100)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.winRate')}</div>
            </div>
          </div>
          
          {(soloQueueStats.hotStreak || soloQueueStats.veteran) && (
            <div className="flex items-center justify-center space-x-2 pt-2">
              {soloQueueStats.hotStreak && (
                <span className="bg-error-600/20 text-error-400 px-2 py-1 rounded text-xs flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {t('gaming.hotStreak')}
                </span>
              )}
              {soloQueueStats.veteran && (
                <span className="bg-warning-600/20 text-warning-400 px-2 py-1 rounded text-xs flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  {t('gaming.veteran')}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {!showDetails && soloQueueStats && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-4 w-4 text-warning-500 mr-2" />
              <span className="font-medium text-gray-900 dark:text-white">
                {soloQueueStats.tier} {soloQueueStats.rank}
              </span>
            </div>
            <div className="text-right">
              <div className="font-bold text-accent-500">{soloQueueStats.leaguePoints} LP</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiotAccountCard;