import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SteamBansCardProps {
  bans: {
    communityBanned: boolean;
    vacBanned: boolean;
    numberOfVACBans: number;
    daysSinceLastBan: number;
    numberOfGameBans: number;
    economyBan: string;
  };
}

const SteamBansCard: React.FC<SteamBansCardProps> = ({ bans }) => {
  const { t } = useTranslation();
  const hasAnyBan = bans.communityBanned || bans.vacBanned || bans.numberOfGameBans > 0 || bans.economyBan !== 'none';

  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center mb-4">
        <Shield className="h-5 w-5 text-primary-500 mr-2" />
        <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
          {t('gaming.banStatus')}
        </h3>
      </div>

      {!hasAnyBan ? (
        <div className="flex items-center justify-center py-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-3" />
            <p className="text-success-400 font-medium">{t('gaming.cleanAccount')}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.noBansDetected')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* VAC Bans */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div className="flex items-center">
              {bans.vacBanned ? (
                <XCircle className="h-5 w-5 text-error-400 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success-400 mr-2" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('gaming.vacBan')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {bans.vacBanned ? `${bans.numberOfVACBans} ${t('gaming.bans')}` : t('gaming.noVacBan')}
                </p>
              </div>
            </div>
            {bans.vacBanned && bans.daysSinceLastBan > 0 && (
              <span className="text-sm text-error-400">
                {t('gaming.daysAgo', { days: bans.daysSinceLastBan })}
              </span>
            )}
          </div>

          {/* Community Ban */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div className="flex items-center">
              {bans.communityBanned ? (
                <XCircle className="h-5 w-5 text-error-400 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success-400 mr-2" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('gaming.communityBan')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {bans.communityBanned ? t('gaming.bannedFromCommunity') : t('gaming.noCommunityBan')}
                </p>
              </div>
            </div>
          </div>

          {/* Game Bans */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div className="flex items-center">
              {bans.numberOfGameBans > 0 ? (
                <XCircle className="h-5 w-5 text-error-400 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success-400 mr-2" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('gaming.gameBans')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {bans.numberOfGameBans > 0 ? `${bans.numberOfGameBans} ${t('gaming.bans')}` : t('gaming.noGameBans')}
                </p>
              </div>
            </div>
          </div>

          {/* Economy Ban */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div className="flex items-center">
              {bans.economyBan !== 'none' ? (
                <AlertTriangle className="h-5 w-5 text-warning-400 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success-400 mr-2" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('gaming.economyBan')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {bans.economyBan !== 'none' ? bans.economyBan : t('gaming.noEconomyBan')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SteamBansCard;
