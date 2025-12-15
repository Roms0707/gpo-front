import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Zap, Crosshair, Timer, TrendingUp, Trophy, ExternalLink, Gamepad2 } from 'lucide-react';
import { GameTheme } from '../../../utils/gameThemes';
import { APP_CONFIG } from '../../../constants';

interface SkillGame {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  url: string;
  features: string[];
  color: string;
}

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

  const hasAimTrainer = APP_CONFIG.AIM_TRAINER_GAME_IDS.includes(gameId);
  const hasReactionGame = APP_CONFIG.REACTION_TIME_ONLY_GAME_IDS.includes(gameId) || hasAimTrainer;

  const availableGames: SkillGame[] = [];

  if (hasAimTrainer) {
    availableGames.push({
      id: 'aim-trainer',
      titleKey: 'gameHub.skillLab.aimTrainer.title',
      descriptionKey: 'gameHub.skillLab.aimTrainer.description',
      icon: Target,
      url: '/aim-trainer-game/index.html',
      features: [
        'gameHub.skillLab.aimTrainer.feature1',
        'gameHub.skillLab.aimTrainer.feature2',
        'gameHub.skillLab.aimTrainer.feature3',
      ],
      color: theme.colors.primary,
    });
  }

  if (hasReactionGame) {
    availableGames.push({
      id: 'reaction-time',
      titleKey: 'gameHub.skillLab.reactionTime.title',
      descriptionKey: 'gameHub.skillLab.reactionTime.description',
      icon: Zap,
      url: '/reaction-time-game/index.html',
      features: [
        'gameHub.skillLab.reactionTime.feature1',
        'gameHub.skillLab.reactionTime.feature2',
        'gameHub.skillLab.reactionTime.feature3',
      ],
      color: theme.colors.secondary,
    });
  }

  const handlePlayGame = (url: string) => {
    window.open(url, '_blank');
  };

  if (availableGames.length === 0) {
    return (
      <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-12 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${theme.colors.primary}10` }}
        >
          <Gamepad2 className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{t('gameHub.skillLab.noGamesAvailable')}</h3>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
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

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{t('gameHub.skillLab.title')}</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {t('gameHub.skillLab.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availableGames.map((game) => {
          const GameIcon = game.icon;

          return (
            <div
              key={game.id}
              className="group relative bg-dark-200/50 border border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 hover:border-gray-700 hover:shadow-2xl"
            >
              <div
                className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10"
                style={{
                  background: `radial-gradient(circle at top right, ${game.color}, transparent 70%)`,
                }}
              />

              <div className="relative p-6 sm:p-8">
                <div className="flex items-start gap-5">
                  <div
                    className="p-4 rounded-xl transition-transform group-hover:scale-110 flex-shrink-0"
                    style={{ backgroundColor: `${game.color}20` }}
                  >
                    <GameIcon className="w-10 h-10" style={{ color: game.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white mb-2">{t(game.titleKey)}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {t(game.descriptionKey)}
                    </p>

                    <div className="space-y-2 mb-6">
                      {game.features.map((featureKey, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: game.color }}
                          />
                          {t(featureKey)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePlayGame(game.url)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: game.color,
                    color: theme.colors.text,
                  }}
                >
                  <Gamepad2 className="w-5 h-5" />
                  {t('gameHub.skillLab.playNow')}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-dark-200/30 border border-gray-800/50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: theme.colors.primary }} />
          {t('gameHub.skillLab.whyTrain')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-300/50">
              <Crosshair className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">{t('gameHub.skillLab.benefit1Title')}</p>
              <p className="text-xs text-gray-400">{t('gameHub.skillLab.benefit1Desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-300/50">
              <Timer className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">{t('gameHub.skillLab.benefit2Title')}</p>
              <p className="text-xs text-gray-400">{t('gameHub.skillLab.benefit2Desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-300/50">
              <Trophy className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">{t('gameHub.skillLab.benefit3Title')}</p>
              <p className="text-xs text-gray-400">{t('gameHub.skillLab.benefit3Desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHubSkillLabTab;
