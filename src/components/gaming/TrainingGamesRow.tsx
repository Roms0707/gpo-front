import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, Clock, Play } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface TrainingGamesRowProps {
  aimTrainerBestScore: number;
  reactionTimeBestScore: number;
  theme: GameTheme;
  onPlayAimTrainer: () => void;
  onPlayReactionTime: () => void;
}

const TrainingGamesRow: React.FC<TrainingGamesRowProps> = ({
  aimTrainerBestScore,
  reactionTimeBestScore,
  theme,
  onPlayAimTrainer,
  onPlayReactionTime,
}) => {
  const { t } = useTranslation();

  const games = [
    {
      icon: Target,
      name: t('gaming.aimTrainer'),
      bestLabel: t('gaming.bestScore'),
      bestValue: aimTrainerBestScore > 0 ? aimTrainerBestScore.toLocaleString() : '--',
      color: theme.colors.primary,
      onPlay: onPlayAimTrainer,
    },
    {
      icon: Clock,
      name: t('gaming.reactionTime'),
      bestLabel: t('gaming.bestTime'),
      bestValue: reactionTimeBestScore > 0 ? `${reactionTimeBestScore}ms` : '--',
      color: theme.colors.secondary,
      onPlay: onPlayReactionTime,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {games.map((game, index) => {
        const Icon = game.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.08 }}
            className="rounded-xl p-4 relative overflow-hidden group cursor-pointer"
            onClick={game.onPlay}
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.85)',
              border: `1px solid ${game.color}20`,
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${game.color}10 0%, transparent 60%)`,
              }}
            />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${game.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: game.color }} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{game.name}</h4>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-bold" style={{ color: game.color }}>
                      {game.bestValue}
                    </span>
                    <span className="text-[10px] text-gray-500">{game.bestLabel}</span>
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${game.color}25`,
                  border: `1px solid ${game.color}40`,
                }}
              >
                <Play className="w-3.5 h-3.5" style={{ color: game.color }} />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TrainingGamesRow;
