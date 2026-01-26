import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, TrendingUp } from 'lucide-react';

interface SteamLevelCardProps {
  level: number;
  profile: {
    personaname: string;
    timecreated?: number;
  };
}

const SteamLevelCard: React.FC<SteamLevelCardProps> = ({ level, profile }) => {
  const { t } = useTranslation();

  const calculateAccountAge = () => {
    if (!profile.timecreated) return null;
    const now = new Date();
    const created = new Date(profile.timecreated * 1000);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  };

  const accountAge = calculateAccountAge();

  const getLevelColor = (level: number) => {
    if (level >= 100) return 'text-purple-400';
    if (level >= 50) return 'text-warning-400';
    if (level >= 20) return 'text-info-400';
    if (level >= 10) return 'text-success-400';
    return 'text-gray-400';
  };

  const getLevelBadge = (level: number) => {
    if (level >= 100) return { text: t('gaming.legendary'), color: 'bg-purple-600/20 text-purple-400' };
    if (level >= 50) return { text: t('gaming.expert'), color: 'bg-warning-600/20 text-warning-400' };
    if (level >= 20) return { text: t('gaming.experienced'), color: 'bg-info-600/20 text-info-400' };
    if (level >= 10) return { text: t('gaming.active'), color: 'bg-success-600/20 text-success-400' };
    return { text: t('gaming.beginner'), color: 'bg-gray-600/20 text-gray-400' };
  };

  const badge = getLevelBadge(level);

  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Star className="h-5 w-5 text-primary-500 mr-2" />
          <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
            {t('gaming.steamLevel')}
          </h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
          {badge.text}
        </span>
      </div>

      <div className="text-center py-4">
        <div className={`text-6xl font-bold mb-2 ${getLevelColor(level)}`}>
          {level}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('gaming.steamLevelOf', { name: profile.personaname })}
        </p>

        {accountAge && (
          <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>{t('gaming.accountCreatedYearsAgo', { count: accountAge, years: accountAge })}</span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary-400">
              {Math.floor(level / 10)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.badges')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-warning-400">
              {level * 100}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.estimatedXP')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-success-400">
              {Math.floor(level / 5)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.activeYears')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SteamLevelCard;
