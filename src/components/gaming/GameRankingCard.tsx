import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Star, TrendingUp } from 'lucide-react';

interface GameRankingCardProps {
  ranking: {
    game_name: string;
    rank: number;
    tier: string;
    elo_rating: number;
    wins: number;
    losses: number;
    win_rate: number;
  };
  onClick?: () => void;
}

const GameRankingCard: React.FC<GameRankingCardProps> = ({ ranking, onClick }) => {
  const { t } = useTranslation();
  return (
    <div
      className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-primary-600/10 dark:bg-primary-600/20 p-3 rounded-lg mr-4">
            <Gamepad2 className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
              {ranking.game_name || t('gaming.unknownGame')}
            </h3>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Star className="h-4 w-4 text-warning-500 mr-1" />
              <span>{t('gaming.rankLabel')}{ranking.rank || 'N/A'}</span>
              {ranking.tier && (
                <span className="ml-2 px-2 py-1 bg-primary-600/10 text-primary-600 dark:text-primary-400 rounded text-xs">
                  {ranking.tier}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center bg-primary-600/10 dark:bg-primary-600/20 px-4 py-3 rounded-lg">
          <TrendingUp className="h-5 w-5 text-primary-500 mr-2" />
          <div className="text-right">
            <div className="font-bold text-2xl text-primary-400">{ranking.elo_rating}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('gaming.eloRating')}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-success-400">{ranking.wins}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.wins')}</div>
        </div>
        <div>
          <div className="text-lg font-bold text-error-400">{ranking.losses}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.losses')}</div>
        </div>
        <div>
          <div className={`text-lg font-bold ${
            ranking.win_rate >= 70 ? 'text-success-400' :
            ranking.win_rate >= 50 ? 'text-info-400' :
            'text-error-400'
          }`}>
            {ranking.win_rate}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.winRate')}</div>
        </div>
      </div>
    </div>
  );
};

export default GameRankingCard;
