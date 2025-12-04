import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Gamepad2, CheckCircle, XCircle } from 'lucide-react';

interface GamingAccountsSectionProps {
  userProfile: any;
  gamingAccounts: any[];
  isLoading: boolean;
}

const GamingAccountsSection: React.FC<GamingAccountsSectionProps> = ({
  userProfile,
  gamingAccounts,
  isLoading
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 mt-6">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-semibold text-xl flex items-center text-gray-900 dark:text-white">
            <Gamepad2 className="h-5 w-5 mr-2 text-primary-500" />
            {t('gaming.connectedGamingAccounts')}
          </h2>
          <Link to="/profile/edit" className="text-primary-500 hover:text-primary-400 text-sm">
            {t('gaming.manageMyAccounts')}
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : gamingAccounts.length > 0 ? (
          <div className="space-y-2">
            {/* Add Fortnite account if exists */}
            {userProfile?.fortnite_epic_id && (
              <div className="bg-gray-100 dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {userProfile.is_fortnite_validated && userProfile.fortnite_validation_data ? (
                        userProfile.fortnite_validation_data.account?.name || userProfile.fortnite_epic_id
                      ) : (
                        userProfile.fortnite_epic_id
                      )}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (Fortnite)
                    </span>
                  </div>

                  <div className="flex items-center">
                    {userProfile.is_fortnite_validated ? (
                      <CheckCircle className="h-4 w-4 text-success-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other gaming accounts */}
            {userProfile?.gaming_accounts?.map((account: any) => (
              <div key={account.id} className="bg-gray-100 dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {account.is_validated && account.validation_data ? (
                        account.validation_data.personaname || // Steam
                        account.validation_data.account?.name || // Fortnite
                        account.value
                      ) : (
                        account.value
                      )}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({account.game_publisher_ids?.games?.name || t('gaming.unknownGame')})
                    </span>
                  </div>

                  <div className="flex items-center">
                    {account.is_validated ? (
                      <CheckCircle className="h-4 w-4 text-success-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">{t('gaming.noConnectedGamingAccounts')}</p>
            <Link to="/profile/edit" className="text-primary-500 hover:text-primary-400 text-sm">
              {t('gaming.addGamingAccounts')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamingAccountsSection;