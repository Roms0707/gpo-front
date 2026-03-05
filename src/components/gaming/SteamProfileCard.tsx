import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Calendar, MapPin, ExternalLink, Shield, AlertTriangle } from 'lucide-react';

interface SteamProfileCardProps {
  profile: {
    steamid: string;
    personaname: string;
    profileurl: string;
    avatar: string;
    avatarfull: string;
    profilestate: number;
    communityvisibilitystate: number;
    lastlogoff?: number;
    timecreated?: number;
    loccountrycode?: string;
  };
}

const SteamProfileCard: React.FC<SteamProfileCardProps> = ({ profile }) => {
  const { t, i18n } = useTranslation();

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return t('gaming.notAvailable');
    const localeMap: Record<string, string> = { fr: 'fr-FR', es: 'es-ES', en: 'en-US' };
    return new Date(timestamp * 1000).toLocaleDateString(localeMap[i18n.language] || 'en-US');
  };

  const getVisibilityStatus = (state: number) => {
    switch (state) {
      case 1: return { text: t('gaming.private'), color: 'text-error-400' };
      case 2: return { text: t('gaming.friendsOnly'), color: 'text-warning-400' };
      case 3: return { text: t('gaming.public'), color: 'text-success-400' };
      default: return { text: t('gaming.unknown'), color: 'text-gray-400' };
    }
  };

  const visibility = getVisibilityStatus(profile.communityvisibilitystate);

  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 bg-gray-200 dark:bg-dark-300">
            <img
              src={profile.avatarfull || profile.avatar}
              alt={profile.personaname}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
              {profile.personaname}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('gaming.steamID')}: {profile.steamid}
            </p>
            <div className="flex items-center mt-1">
              <Shield className="h-4 w-4 mr-1" />
              <span className={`text-sm ${visibility.color}`}>
                {visibility.text}
              </span>
            </div>
          </div>
        </div>

        <a
          href={profile.profileurl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center text-sm"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          {t('gaming.viewOnSteam')}
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.timecreated && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('gaming.accountCreated')}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(profile.timecreated)}
              </p>
            </div>
          </div>
        )}

        {profile.lastlogoff && (
          <div className="flex items-center">
            <User className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('gaming.lastLogon')}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(profile.lastlogoff)}
              </p>
            </div>
          </div>
        )}

        {profile.loccountrycode && (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('gaming.country')}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {profile.loccountrycode}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SteamProfileCard;
