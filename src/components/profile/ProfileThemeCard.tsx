import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Palette, Sparkles, ChevronRight } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { Game } from '../../types';

interface ProfileThemeCardProps {
  theme: GameTheme;
  primaryGameName: string | null;
  favoriteGame: Game | null;
}

const ProfileThemeCard: React.FC<ProfileThemeCardProps> = ({
  theme,
  primaryGameName,
  favoriteGame
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{
        borderColor: `${theme.colors.primary}25`,
        backgroundColor: `${theme.colors.primary}05`
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}15` }}
            >
              <Palette className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('profile.profileTheme', 'Profile Theme')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('profile.themeDescription', 'Colors and style of your profile')}
              </p>
            </div>
          </div>
          <Link
            to="/profile/edit"
            className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: theme.colors.primary }}
          >
            {t('profile.change', 'Change')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div
          className="rounded-xl p-4 border"
          style={{
            borderColor: `${theme.colors.primary}15`,
            background: `linear-gradient(135deg, ${theme.colors.primary}08 0%, ${theme.colors.secondary}08 100%)`
          }}
        >
          <div className="flex items-center gap-4">
            {favoriteGame?.image_url ? (
              <img
                src={favoriteGame.image_url}
                alt={favoriteGame.name}
                className="w-14 h-14 rounded-lg object-cover ring-2 flex-shrink-0"
                style={{ ringColor: `${theme.colors.primary}40` }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.colors.primary}20` }}
              >
                <Sparkles className="w-6 h-6" style={{ color: theme.colors.primary }} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {primaryGameName || t('profile.autoDetect', 'Auto-detect')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {favoriteGame
                  ? t('profile.selectedTheme', 'Selected theme')
                  : t('profile.basedOnActivity', 'Based on activity')}
              </p>

              <div className="flex items-center gap-2 mt-2.5">
                <div
                  className="w-6 h-6 rounded-md shadow-inner ring-1 ring-white/10"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded-md shadow-inner ring-1 ring-white/10"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden ml-1"
                  style={{
                    background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileThemeCard;
