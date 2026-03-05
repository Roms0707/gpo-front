import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Zap,
  Play,
  X,
  Trophy
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { APP_CONFIG } from '../../constants';
import AimTrainerGame from '../games/AimTrainerGame';
import ReactionTimeGame from '../games/ReactionTimeGame';

interface GrindZoneWarmupZoneProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

interface WarmupCard {
  id: 'aim' | 'reaction';
  title: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
}

const GrindZoneWarmupZone: React.FC<GrindZoneWarmupZoneProps> = ({
  gameId,
  gameName,
  theme,
}) => {
  const { t } = useTranslation();
  const [expandedGame, setExpandedGame] = useState<'aim' | 'reaction' | null>(null);

  const hasAimTrainer = APP_CONFIG.AIM_TRAINER_GAME_IDS.includes(gameId);
  const hasReactionTime = APP_CONFIG.REACTION_TIME_ONLY_GAME_IDS.includes(gameId) || hasAimTrainer;

  if (!hasAimTrainer && !hasReactionTime) return null;

  const cards: WarmupCard[] = [];

  if (hasAimTrainer) {
    cards.push({
      id: 'aim',
      title: t('gameHub.aimTrainer'),
      description: t('gameHub.aimTrainerDesc'),
      icon: Target,
      available: true,
    });
  }

  if (hasReactionTime) {
    cards.push({
      id: 'reaction',
      title: t('gameHub.reactionTime'),
      description: t('gameHub.reactionTimeDesc'),
      icon: Zap,
      available: true,
    });
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4" style={{ color: theme.colors.primary }} />
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          {t('grindZone.warmUp')}
        </h2>
      </div>

      {expandedGame ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-200/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {expandedGame === 'aim' ? (
                <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
              ) : (
                <Zap className="w-4 h-4" style={{ color: theme.colors.primary }} />
              )}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {expandedGame === 'aim' ? t('gameHub.aimTrainer') : t('gameHub.reactionTime')}
              </span>
            </div>
            <button
              onClick={() => setExpandedGame(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="p-4">
            {expandedGame === 'aim' ? (
              <AimTrainerGame gameName={gameName} />
            ) : (
              <ReactionTimeGame gameName={gameName} gameId={gameId} />
            )}
          </div>
        </div>
      ) : (
        <div className={`grid gap-3 ${cards.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {cards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setExpandedGame(card.id)}
                className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-200/30 hover:border-gray-300 dark:hover:border-gray-700 transition-all hover:shadow-md text-left"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.primary}25, ${theme.colors.secondary}15)` }}
                >
                  <Icon className="w-6 h-6" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{card.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{card.description}</p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <Play className="w-3.5 h-3.5 ml-0.5" style={{ color: theme.colors.primary }} fill="currentColor" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default GrindZoneWarmupZone;
