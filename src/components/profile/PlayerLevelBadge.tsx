import React from 'react';
import { Star, Zap } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { calculatePlayerLevel } from '../../hooks/usePlayerPrimaryGame';

interface PlayerLevelBadgeProps {
  xp: number;
  theme: GameTheme;
  compact?: boolean;
}

const PlayerLevelBadge: React.FC<PlayerLevelBadgeProps> = ({ xp, theme, compact = false }) => {
  const { level, title, nextLevelXp, progress } = calculatePlayerLevel(xp);

  const getRarityGradient = (levelNum: number): string => {
    if (levelNum >= 7) return 'from-amber-400 via-yellow-300 to-amber-500';
    if (levelNum >= 6) return 'from-cyan-400 via-blue-400 to-cyan-500';
    if (levelNum >= 5) return 'from-emerald-400 via-teal-400 to-emerald-500';
    if (levelNum >= 4) return 'from-yellow-500 via-amber-400 to-yellow-600';
    if (levelNum >= 3) return 'from-gray-300 via-gray-200 to-gray-400';
    if (levelNum >= 2) return 'from-amber-700 via-amber-600 to-amber-800';
    return 'from-gray-500 via-gray-400 to-gray-600';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${getRarityGradient(level)} shadow-lg`}
          style={{
            boxShadow: `0 0 12px ${theme.colors.primary}40`
          }}
        >
          <span className="text-white font-bold text-sm">{level}</span>
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="rounded-xl p-4 border"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.secondary}10)`,
          borderColor: `${theme.colors.primary}30`
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className={`relative flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${getRarityGradient(level)} shadow-xl`}
            style={{
              boxShadow: `0 0 20px ${theme.colors.primary}50`
            }}
          >
            <div className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm" />
            <div className="relative flex flex-col items-center">
              <Star className="w-4 h-4 text-white/80 mb-0.5" />
              <span className="text-white font-bold text-xl">{level}</span>
            </div>
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3
                className="font-bold text-lg"
                style={{ color: theme.colors.primary }}
              >
                {title}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {xp.toLocaleString()} XP
              </span>
            </div>

            <div className="relative h-3 bg-gray-200 dark:bg-dark-300 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full animate-pulse opacity-50"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Level {level}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {nextLevelXp > xp ? `${(nextLevelXp - xp).toLocaleString()} XP to next level` : 'Max Level'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerLevelBadge;
