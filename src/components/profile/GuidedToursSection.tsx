import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Map, Home, Gamepad2, Trophy, BarChart3, Check, RefreshCw, RotateCcw } from 'lucide-react';
import { useOnboardingWalkthrough, OnboardingProgress } from '../../hooks/useOnboardingWalkthrough';
import { OnboardingPage } from '../../constants/onboardingSteps';

const GOLD_COLOR = '#C8AA6E';

interface TourItem {
  page: OnboardingPage;
  labelKey: string;
  icon: React.ElementType;
  path: string;
}

const TOUR_ITEMS: TourItem[] = [
  { page: 'home', labelKey: 'onboarding.guidedTours.home', icon: Home, path: '/' },
  { page: 'gameHub', labelKey: 'onboarding.guidedTours.gameHub', icon: Gamepad2, path: '/hub' },
  { page: 'tournament', labelKey: 'onboarding.guidedTours.tournament', icon: Trophy, path: '/' },
  { page: 'gamingStats', labelKey: 'onboarding.guidedTours.gamingStats', icon: BarChart3, path: '/profile/gaming-stats' },
];

const GuidedToursSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onboardingProgress, resetPageProgress, resetAllProgress } = useOnboardingWalkthrough('home');

  const handleReplayTour = async (page: OnboardingPage, path: string) => {
    await resetPageProgress(page);
    navigate(path);
  };

  const handleResetAll = async () => {
    await resetAllProgress();
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${GOLD_COLOR}20` }}
          >
            <Map className="h-5 w-5" style={{ color: GOLD_COLOR }} />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
              {t('onboarding.guidedTours.title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {t('onboarding.guidedTours.description')}
            </p>
          </div>
        </div>

        <button
          onClick={handleResetAll}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
          style={{
            color: GOLD_COLOR,
            border: `1px solid ${GOLD_COLOR}40`,
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${GOLD_COLOR}10`;
            e.currentTarget.style.borderColor = GOLD_COLOR;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = `${GOLD_COLOR}40`;
          }}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">{t('onboarding.guidedTours.resetAll')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TOUR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isCompleted = onboardingProgress[item.page];

          return (
            <div
              key={item.page}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: isCompleted ? 'rgb(34 197 94 / 0.1)' : `${GOLD_COLOR}10`,
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isCompleted ? 'rgb(34 197 94)' : GOLD_COLOR }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t(item.labelKey)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isCompleted
                      ? t('onboarding.guidedTours.completed')
                      : t('onboarding.guidedTours.notStarted')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isCompleted && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                <button
                  onClick={() => handleReplayTour(item.page, item.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: `${GOLD_COLOR}15`,
                    color: GOLD_COLOR,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${GOLD_COLOR}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${GOLD_COLOR}15`;
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('onboarding.guidedTours.replayTour')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GuidedToursSection;
