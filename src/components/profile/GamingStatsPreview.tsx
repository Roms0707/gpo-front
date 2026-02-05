import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, TrendingUp } from 'lucide-react';

const GamingStatsPreview: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 mt-6">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-semibold text-xl flex items-center text-gray-900 dark:text-white">
            <Gamepad2 className="h-5 w-5 mr-2 text-primary-500" />
            {t('gaming.myGameStats')}
          </h2>
          <Link to="/profile/gaming-stats" className="text-primary-500 hover:text-primary-400 text-sm flex items-center">
            {t('gaming.viewAllMyStats')}
            <TrendingUp className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary-500" />
            </div>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('gaming.viewDetailedPerformance')}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {t('gaming.discoverCompleteStats')}
          </p>
          <Link
            to="/profile/gaming-stats"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm transition-colors inline-flex items-center"
          >
            <Gamepad2 className="h-4 w-4 mr-2" />
            {t('gaming.viewMyGameStats')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GamingStatsPreview;