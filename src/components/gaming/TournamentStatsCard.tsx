import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Calendar, Award, Target } from 'lucide-react';

interface TournamentStatsCardProps {
  tournamentStats: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  };
}

const TournamentStatsCard: React.FC<TournamentStatsCardProps> = ({ tournamentStats }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
      <h2 className="font-heading font-semibold text-xl mb-6 flex items-center text-gray-900 dark:text-white">
        <Trophy className="h-5 w-5 text-warning-500 mr-2" />
        {t('gaming.tournamentStatistics')}
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-dark-200 rounded-lg">
          <div className="w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Trophy className="h-4 w-4 text-primary-500" />
          </div>
          <div className="text-2xl font-bold text-primary-400">{tournamentStats.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.total')}</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 dark:bg-dark-200 rounded-lg">
          <div className="w-8 h-8 bg-warning-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Calendar className="h-4 w-4 text-warning-500" />
          </div>
          <div className="text-2xl font-bold text-warning-400">{tournamentStats.upcoming}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.upcoming')}</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 dark:bg-dark-200 rounded-lg">
          <div className="w-8 h-8 bg-error-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Target className="h-4 w-4 text-error-500" />
          </div>
          <div className="text-2xl font-bold text-error-400">{tournamentStats.ongoing}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.ongoing')}</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 dark:bg-dark-200 rounded-lg">
          <div className="w-8 h-8 bg-success-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Award className="h-4 w-4 text-success-500" />
          </div>
          <div className="text-2xl font-bold text-success-400">{tournamentStats.completed}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.completed')}</div>
        </div>
      </div>
    </div>
  );
};

export default TournamentStatsCard;