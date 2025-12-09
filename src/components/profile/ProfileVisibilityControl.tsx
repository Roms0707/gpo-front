import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

interface ProfileVisibilityControlProps {
  isProfilePublic: boolean;
  isUpdatingVisibility: boolean;
  onToggle: () => void;
}

const ProfileVisibilityControl: React.FC<ProfileVisibilityControlProps> = ({
  isProfilePublic,
  isUpdatingVisibility,
  onToggle
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-accent-600 dark:text-accent-500 mr-3" />
            <div>
              <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
                {t('profile.visibility')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isProfilePublic
                  ? t('profile.profileVisibleToAll')
                  : t('profile.profilePrivateVisibleToFriends')
                }
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={onToggle}
              disabled={isUpdatingVisibility}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isProfilePublic
                  ? 'bg-accent-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label={isProfilePublic ? t('profile.makePrivate') : t('profile.makePublic')}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isProfilePublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>

            {isUpdatingVisibility && (
              <div className="ml-3">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-accent-500"></div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg">
          <div className="flex items-start">
            <Shield className="h-4 w-4 text-accent-600 dark:text-accent-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-accent-800 dark:text-accent-200">
              <p className="font-medium mb-1">{t('profile.aboutProfileVisibility')}</p>
              <ul className="text-xs space-y-1">
                <li>• <strong>{t('profile.publicProfile')} :</strong> {t('profile.publicVisibilityDescription')}</li>
                <li>• <strong>{t('profile.privateProfile')} :</strong> {t('profile.privateVisibilityDescription')}</li>
                <li>• {t('profile.usernameAlwaysVisible')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileVisibilityControl;