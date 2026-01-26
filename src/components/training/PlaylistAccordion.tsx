import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaylistWithVideos } from '../../types/playlist';
import { GameTheme } from '../../utils/gameThemes';
import PlaylistVideoItem from './PlaylistVideoItem';

interface PlaylistAccordionProps {
  playlist: PlaylistWithVideos;
  theme: GameTheme;
  isExpanded: boolean;
  onToggle: () => void;
  currentlyWatchingVideoId?: string;
}

const PlaylistAccordion: React.FC<PlaylistAccordionProps> = ({
  playlist,
  theme,
  isExpanded,
  onToggle,
  currentlyWatchingVideoId
}) => {
  const videoCount = playlist.videos.length;
  const completedCount = playlist.videos.filter(v => v.progress?.is_completed).length;
  const progressPercent = videoCount > 0 ? (completedCount / videoCount) * 100 : 0;
  const isFullyCompleted = completedCount === videoCount && videoCount > 0;

  const totalDuration = playlist.videos.reduce((acc, v) => {
    return acc + (v.video?.duration || 0);
  }, 0);

  const formatTotalDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  return (
    <div className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-dark-300/30"
      >
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>

        <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-dark-400">
          <img
            src={playlist.thumbnail_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=300'}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}40` }}
          >
            <Play className="w-6 h-6 text-white fill-white drop-shadow-lg" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {playlist.name}
            </h3>
            {isFullyCompleted && (
              <CheckCircle2
                className="w-5 h-5 flex-shrink-0"
                style={{ color: theme.colors.primary }}
              />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{videoCount} videos</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTotalDuration(totalDuration)}
            </span>
          </div>

          {playlist.description && !isExpanded && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
              {playlist.description}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {completedCount}/{videoCount}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              completed
            </div>
          </div>

          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-gray-200 dark:text-dark-400"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 1.256} 125.6`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {playlist.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 pl-10">
                  {playlist.description}
                </p>
              )}

              <div className="space-y-1 pl-6">
                {playlist.videos.map((playlistVideo) => (
                  <PlaylistVideoItem
                    key={playlistVideo.id}
                    playlistVideo={playlistVideo}
                    theme={theme}
                    isCurrentlyWatching={playlistVideo.video?.id === currentlyWatchingVideoId}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaylistAccordion;
