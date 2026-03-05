import React from 'react';
import { Shield, Award, Crown, Gem, Diamond } from 'lucide-react';
import { getGrindLevel, getGrindLevelProgress, GrindLevel } from '../../types/grindZone';

interface GrindLevelBadgeProps {
  playlistsCompleted: number;
  compact?: boolean;
  showProgress?: boolean;
  className?: string;
}

const LEVEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  award: Award,
  crown: Crown,
  gem: Gem,
  diamond: Diamond,
};

function getLevelIcon(level: GrindLevel) {
  return LEVEL_ICONS[level.icon] || Shield;
}

const GrindLevelBadge: React.FC<GrindLevelBadgeProps> = ({
  playlistsCompleted,
  compact = false,
  showProgress = false,
  className = '',
}) => {
  const level = getGrindLevel(playlistsCompleted);
  const { next, progress, remaining } = getGrindLevelProgress(playlistsCompleted);
  const Icon = getLevelIcon(level);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold text-white ${className}`}
        style={{ background: `linear-gradient(135deg, ${level.gradient[0]}, ${level.gradient[1]})` }}
      >
        <Icon className="w-3 h-3" />
        <span>{level.name}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shadow-md"
          style={{ background: `linear-gradient(135deg, ${level.gradient[0]}, ${level.gradient[1]})` }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{level.name}</p>
          {next && showProgress && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {remaining} more to {next.name}
            </p>
          )}
        </div>
      </div>
      {showProgress && next && (
        <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${level.gradient[0]}, ${level.gradient[1]})`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GrindLevelBadge;
