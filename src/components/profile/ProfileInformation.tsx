import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { User, MapPin, Phone, AlertTriangle } from 'lucide-react';
import { formatCountryDisplay } from '../../utils/countries';
import { User as UserType } from '../../types';

interface ProfileInformationProps {
  user: UserType | null;
}

const ProfileInformation: React.FC<ProfileInformationProps> = ({ user }) => {
  const { t } = useTranslation();
  const hasMissingInfo = !user?.country || !user?.msisdn;

  return (
    <div className="mb-8">
      <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-primary-500 mr-3" />
          <div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
              {t('profile.profileInformation')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('profile.requiredForTournaments')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-dark-100 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-primary-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.countryOfResidence')}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.country ? (
                    formatCountryDisplay(user.country, true, false)
                  ) : (
                    <span className="text-warning-600 dark:text-warning-400">{t('profile.notProvided')}</span>
                  )}
                </p>
              </div>
            </div>
            {!user?.country && (
              <div className="mt-2 text-xs text-warning-600 dark:text-warning-400">
                {t('profile.requiredForTournamentEligibility')}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-dark-100 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-primary-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.phoneNumber')}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.msisdn ? (
                    user.msisdn
                  ) : (
                    <span className="text-warning-600 dark:text-warning-400">{t('profile.notProvided')}</span>
                  )}
                </p>
              </div>
            </div>
            {!user?.msisdn && (
              <div className="mt-2 text-xs text-warning-600 dark:text-warning-400">
                {t('profile.recommendedForPrizeTournaments')}
              </div>
            )}
          </div>
        </div>

        {hasMissingInfo && (
          <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-warning-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-warning-700 dark:text-warning-300">
                  <p className="font-medium">{t('profile.missingInformation')}</p>
                  <p>{t('profile.completeProfileToParticipate')}</p>
                </div>
              </div>
              <Link
                to="/profile/edit"
                className="bg-warning-600 hover:bg-warning-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                {t('profile.complete')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileInformation;
