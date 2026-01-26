import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Award, Target, TrendingUp } from 'lucide-react';

interface GamingStatsOverviewProps {
  personalStats: {
    totalGames: number;
    averageScore: number;
    bestScore: number;
    totalScore: number;
    improvement: number;
  };
  gameRankings: any[];
}

const GamingStatsOverview: React.FC<GamingStatsOverviewProps> = ({
  personalStats,
  gameRankings
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-dark-100 p-6 rounded-xl text-center border border-gray-200 dark:border-gray-800">
        <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trophy className="h-6 w-6 text-primary-500" />
        </div>
        <div className="text-2xl font-bold text-primary-400">{personalStats.totalGames}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.gamesPlayed')}</div>
      </div>

      <div className="bg-white dark:bg-dark-100 p-6 rounded-xl text-center border border-gray-200 dark:border-gray-800">
        <div className="w-12 h-12 bg-warning-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Award className="h-6 w-6 text-warning-500" />
        </div>
        <div className="text-2xl font-bold text-warning-400">{personalStats.bestScore}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.bestScore')}</div>
      </div>

      <div className="bg-white dark:bg-dark-100 p-6 rounded-xl text-center border border-gray-200 dark:border-gray-800">
        <div className="w-12 h-12 bg-success-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Target className="h-6 w-6 text-success-500" />
        </div>
        <div className="text-2xl font-bold text-success-400">{personalStats.averageScore}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.averageScore')}</div>
      </div>

      <div className="bg-white dark:bg-dark-100 p-6 rounded-xl text-center border border-gray-200 dark:border-gray-800">
        <div className="w-12 h-12 bg-info-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="h-6 w-6 text-info-500" />
        </div>
        <div className={`text-2xl font-bold ${
          personalStats.improvement > 0 ? 'text-success-400' :
          personalStats.improvement < 0 ? 'text-error-400' : 'text-gray-400'
        }`}>
          {personalStats.improvement > 0 ? '+' : ''}{personalStats.improvement}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.progression')}</div>
      </div>
    </div>
  );
};

export default GamingStatsOverview;
