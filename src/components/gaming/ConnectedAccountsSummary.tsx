import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Gamepad2, Settings, CheckCircle, XCircle } from 'lucide-react';

interface ConnectedAccountsSummaryProps {
  totalAccounts: number;
  validatedAccounts: number;
  gameAccounts: any[];
}

const ConnectedAccountsSummary: React.FC<ConnectedAccountsSummaryProps> = ({
  totalAccounts,
  validatedAccounts,
  gameAccounts
}) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-xl flex items-center text-gray-900 dark:text-white">
          <Gamepad2 className="h-5 w-5 text-primary-500 mr-2" />
          {t('profile.connectedGameAccounts')}
        </h2>
        <Link
          to="/profile/edit"
          className="text-primary-500 hover:text-primary-400 transition-colors flex items-center text-sm"
        >
          <Settings className="h-4 w-4 mr-1" />
          {t('profile.manage')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-dark-200 rounded-lg">
          <div className="text-2xl font-bold text-primary-400">{totalAccounts}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.accountsConnected')}</div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-dark-200 rounded-lg">
          <div className="text-2xl font-bold text-success-400">{validatedAccounts}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.accountsValidated')}</div>
        </div>
      </div>

      {gameAccounts.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">{t('profile.accountsOverview')}</h3>
          {gameAccounts.slice(0, 3).map((account, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-200 rounded">
              <div className="flex items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {account.game_publisher_ids.games.name}
                </span>
              </div>
              <div className="flex items-center">
                {account.is_validated ? (
                  <CheckCircle className="h-4 w-4 text-success-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-error-400" />
                )}
              </div>
            </div>
          ))}
          {gameAccounts.length > 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              +{gameAccounts.length - 3} {t('profile.otherAccounts')}
            </p>
          )}
        </div>
      )}

      <Link
        to="/profile/edit"
        className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors text-center block"
      >
        {t('profile.manageMyGameAccounts')}
      </Link>
    </div>
  );
};

export default ConnectedAccountsSummary;
