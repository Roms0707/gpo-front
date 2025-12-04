import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Star, Trophy, Swords, Crown, CheckCircle, ExternalLink, TrendingUp, Loader, AlertTriangle } from 'lucide-react';
import { ValorantRankedData } from '../../types';

interface ValorantAccountCardProps {
  account: {
    value: string; // Riot ID (gameName#tagLine)
    is_validated: boolean;
    validation_data?: {
      rankedData?: ValorantRankedData;
      region?: string;
      error?: string;
    };
    validation_date?: string;
  };
  onLoadMatchHistory?: (puuid: string, region: string) => void;
  isLoadingMatches?: boolean;
}

// Helper to get Valorant rank icon
const getValorantRankIcon = (competitiveTier: number) => {
  // This would ideally map competitiveTier to an image URL
  // For now, return a generic icon or a placeholder
  switch (competitiveTier) {
    case 24: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Immortal3.png';
    case 23: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Immortal2.png';
    case 22: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Immortal1.png';
    case 21: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Diamond3.png';
    case 20: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Diamond2.png';
    case 19: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Diamond1.png';
    case 18: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Platinum3.png';
    case 17: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Platinum2.png';
    case 16: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Platinum1.png';
    case 15: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Gold3.png';
    case 14: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Gold2.png';
    case 13: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Gold1.png';
    case 12: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Silver3.png';
    case 11: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Silver2.png';
    case 10: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Silver1.png';
    case 9: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Bronze3.png';
    case 8: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Bronze2.png';
    case 7: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Bronze1.png';
    case 6: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Iron3.png';
    case 5: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Iron2.png';
    case 4: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Iron1.png';
    default: return 'https://www.riotgames.com/darkroom/800/assets/val/img/ranked/Unranked.png';
  }
};

const getValorantRankName = (competitiveTier: number) => {
  switch (competitiveTier) {
    case 24: return 'Immortal 3';
    case 23: return 'Immortal 2';
    case 22: return 'Immortal 1';
    case 21: return 'Diamond 3';
    case 20: return 'Diamond 2';
    case 19: return 'Diamond 1';
    case 18: return 'Platinum 3';
    case 17: return 'Platinum 2';
    case 16: return 'Platinum 1';
    case 15: return 'Gold 3';
    case 14: return 'Gold 2';
    case 13: return 'Gold 1';
    case 12: return 'Silver 3';
    case 11: return 'Silver 2';
    case 10: return 'Silver 1';
    case 9: return 'Bronze 3';
    case 8: return 'Bronze 2';
    case 7: return 'Bronze 1';
    case 6: return 'Iron 3';
    case 5: return 'Iron 2';
    case 4: return 'Iron 1';
    default: return 'Unranked';
  }
};

const ValorantAccountCard: React.FC<ValorantAccountCardProps> = ({ account, onLoadMatchHistory, isLoadingMatches }) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  
  if (!account.is_validated || !account.validation_data?.rankedData) {
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
                {t('gaming.accountNotValidatedOrDataUnavailable')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { rankedData, region, error: validationError } = account.validation_data;
  const [gameName, tagLine] = account.value.split('#');

  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mr-4">
            <Shield className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
                {gameName}#{tagLine}
              </h3>
              <CheckCircle className="h-5 w-5 text-success-400 ml-2" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('gaming.region')}: {region?.toUpperCase()}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-primary-500 hover:text-primary-400 transition-colors text-sm"
          >
            {showDetails ? t('gaming.hide') : t('gaming.details')}
          </button>
          
          {onLoadMatchHistory && rankedData?.puuid && region && (
            <button
              onClick={() => onLoadMatchHistory(rankedData.puuid, region)}
              disabled={isLoadingMatches}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
            >
              {isLoadingMatches ? (
                <>
                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                  {t('gaming.loading')}...
                </>
              ) : (
                t('gaming.loadMatchHistory')
              )}
            </button>
          )}
        </div>
      </div>
      
      {validationError && (
        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {rankedData && (
        <>
          <div className="flex items-center justify-center mb-4">
            <img 
              src={getValorantRankIcon(rankedData.competitiveTier)} 
              alt={getValorantRankName(rankedData.competitiveTier)} 
              className="h-20 w-20 object-contain"
            />
          </div>
          <div className="text-center mb-4">
            <h4 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
              {getValorantRankName(rankedData.competitiveTier)}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {rankedData.rankedRating} RR
            </p>
          </div>

          {showDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-success-400">{rankedData.numberOfWins}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.wins')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-info-400">{rankedData.leaderboardRank || 'N/A'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.ranking')}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ValorantAccountCard;