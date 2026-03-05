import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Lock, CheckCircle2 } from 'lucide-react';
import { GrindVideo } from '../../types/grindZone';
import { GameTheme } from '../../utils/gameThemes';

interface GrindVideoItemProps {
  video: GrindVideo;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
  theme: GameTheme;
  onPlay?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const GrindVideoItem: React.FC<GrindVideoItemProps> = ({
  video,
  isCompleted,
  isLocked,
  isCurrent,
  theme,
  onPlay,
}) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={isLocked ? undefined : onPlay}
      disabled={isLocked}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left
        ${isLocked
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-300/30'
        }
        ${isCurrent ? 'bg-gray-50 dark:bg-dark-300/20 ring-1' : ''}
      `}
      style={isCurrent ? { borderColor: `${theme.colors.primary}40` } : undefined}
      title={isLocked ? t('grindZone.video.unlockPrevious') : undefined}
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : isLocked ? (
          <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        ) : (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {video.position}
          </span>
        )}
      </div>

      <div className="relative flex-shrink-0 w-20 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-dark-400">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className={`w-full h-full object-cover ${isLocked ? 'grayscale' : ''}`}
        />
        {!isLocked && !isCompleted && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4 text-white" />
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Lock className="w-3 h-3 text-white/70" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium line-clamp-1 ${
          isCompleted ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
        }`}>
          {video.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {formatDuration(video.duration_seconds)}
        </p>
      </div>

      {isCurrent && !isCompleted && (
        <div
          className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Play className="w-3 h-3" />
        </div>
      )}
    </button>
  );
};

export default GrindVideoItem;
