import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle } from 'lucide-react';
import { User } from '../../types';
import { GameTheme } from '../../utils/gameThemes';

interface ProfileSetupWidgetProps {
  user: User | null;
  theme: GameTheme;
  onStartSetup: () => void;
}

const ProfileSetupWidget: React.FC<ProfileSetupWidgetProps> = ({ user, theme, onStartSetup }) => {
  const { t } = useTranslation();

  const steps = useMemo(() => {
    return [
      { label: t('profile.setupStepAvatar', 'Profile Picture'), done: !!user?.avatar_url },
      { label: t('profile.setupStepBio', 'Bio'), done: !!user?.bio },
      { label: t('profile.setupStepBanner', 'Banner'), done: !!user?.banner_url },
    ];
  }, [user, t]);

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (allDone) {
    return (
      <div
        className="rounded-2xl p-5 border"
        style={{
          backgroundColor: `${theme.colors.primary}08`,
          borderColor: `${theme.colors.primary}20`
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <CheckCircle className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {t('profile.setupComplete', 'Profile Complete')}
            </h3>
            <p className="text-sm text-gray-400">
              {t('profile.setupCompleteDesc', 'Your profile is all set up!')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary}12 0%, ${theme.colors.secondary}08 100%)`,
        borderColor: `${theme.colors.primary}25`
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.colors.primary}20` }}
        >
          <Sparkles className="w-5 h-5" style={{ color: theme.colors.primary }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white mb-1">
            {t('profile.setupTitle', 'Configure Your Profile')}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {t('profile.setupDescription', 'Add friends, customize your profile and describe yourself.')}
          </p>

          <p className="text-sm text-gray-300 mb-2">
            <span className="font-semibold" style={{ color: theme.colors.primary }}>{completedCount}</span>
            {' '}{t('profile.setupProgress', 'steps out of {{total}} completed', { total: steps.length })}
          </p>

          <div className="flex gap-1 mb-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: step.done ? theme.colors.primary : 'rgba(255,255,255,0.1)'
                }}
              />
            ))}
          </div>

          <button
            onClick={onStartSetup}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              boxShadow: `0 4px 15px ${theme.colors.primary}40`
            }}
          >
            {completedCount > 0
              ? t('profile.setupContinue', 'Continue')
              : t('profile.setupStart', 'Get Started')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupWidget;
