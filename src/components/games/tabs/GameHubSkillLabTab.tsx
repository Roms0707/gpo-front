import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Zap, TrendingUp, Crosshair, Timer, Trophy, Gamepad2 } from 'lucide-react';
import { GameTheme } from '../../../utils/gameThemes';
import { APP_CONFIG } from '../../../constants';
import { useAuth } from '../../../contexts/AuthContext';
import AimTrainerGame from '../AimTrainerGame';
import ReactionTimeGame from '../ReactionTimeGame';
import AuthRequiredOverlay from '../../auth/AuthRequiredOverlay';

type SkillGameTab = 'aim-trainer' | 'reaction-time';

interface GameHubSkillLabTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

const GameHubSkillLabTab: React.FC<GameHubSkillLabTabProps> = ({
  gameId,
  gameName,
  theme,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const hasAimTrainer = APP_CONFIG.AIM_TRAINER_GAME_IDS.includes(gameId);
  const hasReactionGame = APP_CONFIG.REACTION_TIME_ONLY_GAME_IDS.includes(gameId) || hasAimTrainer;

  const availableTabs: { id: SkillGameTab; labelKey: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [];

  if (hasAimTrainer) {
    availableTabs.push({
      id: 'aim-trainer',
      labelKey: 'gameHub.skillLab.aimTrainer.title',
      icon: Target,
    });
  }

  if (hasReactionGame) {
    availableTabs.push({
      id: 'reaction-time',
      labelKey: 'gameHub.skillLab.reactionTime.title',
      icon: Zap,
    });
  }

  const [activeTab, setActiveTab] = useState<SkillGameTab>(availableTabs[0]?.id || 'aim-trainer');
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tabId: SkillGameTab) => {
    setActiveTab(tabId);
    setTimeout(() => {
      gameContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  if (availableTabs.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${theme.colors.primary}10` }}
        >
          <Gamepad2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('gameHub.skillLab.noGamesAvailable')}</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          {t('gameHub.skillLab.noGamesAvailableDesc', { gameName })}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <div
            className="px-4 py-2 rounded-full text-sm flex items-center gap-2 opacity-50"
            style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
          >
            <Target className="w-4 h-4" />
            {t('gameHub.skillLab.comingSoon')}
          </div>
          <div
            className="px-4 py-2 rounded-full text-sm flex items-center gap-2 opacity-50"
            style={{ backgroundColor: `${theme.colors.secondary}20`, color: theme.colors.secondary }}
          >
            <Zap className="w-4 h-4" />
            {t('gameHub.skillLab.comingSoon')}
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('gameHub.skillLab.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {t('gameHub.skillLab.subtitle')}
        </p>
      </div>

      {availableTabs.length > 1 && (
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-100 dark:bg-dark-300/50 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            {availableTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              const tabColor = tab.id === 'aim-trainer' ? theme.colors.primary : theme.colors.secondary;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive ? 'shadow-lg' : 'hover:bg-gray-200 dark:hover:bg-dark-300/50'}
                  `}
                  style={isActive ? {
                    backgroundColor: tabColor,
                    color: theme.colors.text,
                    boxShadow: `0 4px 20px ${tabColor}40`,
                  } : {
                    color: 'rgb(107, 114, 128)',
                  }}
                >
                  <TabIcon className="w-4 h-4" />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div ref={gameContainerRef} className="relative">
        {activeTab === 'aim-trainer' && hasAimTrainer && (
          <AimTrainerGame gameName={gameName} />
        )}
        {activeTab === 'reaction-time' && hasReactionGame && (
          <ReactionTimeGame gameName={gameName} gameId={gameId} />
        )}
      </div>

      <div className="bg-gray-50 dark:bg-dark-200/30 border border-gray-200 dark:border-gray-800/50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: theme.colors.primary }} />
          {t('gameHub.skillLab.whyTrain')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-300/50">
              <Crosshair className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{t('gameHub.skillLab.benefit1Title')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('gameHub.skillLab.benefit1Desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-300/50">
              <Timer className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{t('gameHub.skillLab.benefit2Title')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('gameHub.skillLab.benefit2Desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-300/50">
              <Trophy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{t('gameHub.skillLab.benefit3Title')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('gameHub.skillLab.benefit3Desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <AuthRequiredOverlay
        theme={theme}
        title={t('auth.skillLabLocked.title', 'Unlock Skills Lab')}
        description={t('auth.skillLabLocked.description', 'Login to train your aim and reaction time with personalized tracking')}
      >
        {content}
      </AuthRequiredOverlay>
    );
  }

  return content;
};

export default GameHubSkillLabTab;
