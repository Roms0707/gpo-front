import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Check, Clock } from 'lucide-react';
import { PlaylistVideo } from '../../types/playlist';
import { GameTheme } from '../../utils/gameThemes';

interface PlaylistVideoItemProps {
  playlistVideo: PlaylistVideo;
  theme: GameTheme;
  isCurrentlyWatching?: boolean;
}

const PlaylistVideoItem: React.FC<PlaylistVideoItemProps> = ({
  playlistVideo,
  theme,
  isCurrentlyWatching = false
}) => {
  const navigate = useNavigate();
  const video = playlistVideo.video;
  const progress = playlistVideo.progress;

  if (!video) return null;

  const isCompleted = progress?.is_completed || false;
  const hasProgress = progress && progress.watch_time_seconds > 0 && !isCompleted;
  const progressPercent = progress && progress.duration_seconds > 0
    ? Math.min((progress.watch_time_seconds / progress.duration_seconds) * 100, 100)
    : 0;

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatResumeTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    navigate(`/video/${video.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isCurrentlyWatching
          ? 'bg-gray-100 dark:bg-dark-300 ring-2'
          : 'hover:bg-gray-50 dark:hover:bg-dark-300/50'
      }`}
      style={{
        ringColor: isCurrentlyWatching ? theme.colors.primary : undefined
      }}
    >
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        {isCompleted ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Check className="w-4 h-4 text-white" />
          </div>
        ) : isCurrentlyWatching ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center animate-pulse"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Play className="w-3 h-3 text-white fill-white ml-0.5" />
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {playlistVideo.position}
          </span>
        )}
      </div>

      <div className="relative flex-shrink-0 w-24 h-14 rounded-md overflow-hidden bg-gray-200 dark:bg-dark-400">
        <img
          src={video.playlist_image_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=300'}
          alt={video.title}
          className="w-full h-full object-cover"
        />

        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: theme.colors.primary
              }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium truncate transition-colors ${
          isCompleted
            ? 'text-gray-500 dark:text-gray-400'
            : 'text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200'
        }`}>
          {video.title}
        </h4>

        <div className="flex items-center gap-2 mt-1">
          {video.duration && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(video.duration)}
            </span>
          )}

          {hasProgress && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                color: theme.colors.primary
              }}
            >
              Resume at {formatResumeTime(progress.watch_time_seconds)}
            </span>
          )}
        </div>
      </div>

      {isCompleted && (
        <div className="flex-shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">Watched</span>
        </div>
      )}
    </div>
  );
};

export default PlaylistVideoItem;
