import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Zap } from 'lucide-react';
import AimTrainerGame from '../games/AimTrainerGame';
import ReactionTimeGame from '../games/ReactionTimeGame';
import { APP_CONFIG } from '../../constants';

interface TrainingGamesContainerProps {
  gameName: string;
  gameId: string;
}

type GameType = 'aim-trainer' | 'reaction-time';

const TrainingGamesContainer: React.FC<TrainingGamesContainerProps> = ({ gameName, gameId }) => {
  const { t } = useTranslation();

  const showBothGames = APP_CONFIG.AIM_TRAINER_GAME_IDS.includes(gameId);
  const showReactionTimeOnly = APP_CONFIG.REACTION_TIME_ONLY_GAME_IDS.includes(gameId);

  const getInitialGame = (): GameType => {
    if (showReactionTimeOnly) {
      return 'reaction-time';
    }
    if (showBothGames) {
      return Math.random() < 0.5 ? 'aim-trainer' : 'reaction-time';
    }
    return 'aim-trainer';
  };

  const [activeGame, setActiveGame] = useState<GameType>(getInitialGame);

  if (!showBothGames && !showReactionTimeOnly) {
    return null;
  }

  return (
    <div>
      {showBothGames && (
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveGame('aim-trainer')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeGame === 'aim-trainer'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Target className="h-5 w-5" />
            {t('gaming.aimTrainer')}
          </button>
          <button
            onClick={() => setActiveGame('reaction-time')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeGame === 'reaction-time'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Zap className="h-5 w-5" />
            {t('gaming.reactionTime')}
          </button>
        </div>
      )}

      {activeGame === 'aim-trainer' && showBothGames && (
        <AimTrainerGame gameName={gameName} />
      )}

      {activeGame === 'reaction-time' && (
        <ReactionTimeGame gameName={gameName} gameId={gameId} />
      )}
    </div>
  );
};

export default TrainingGamesContainer;
