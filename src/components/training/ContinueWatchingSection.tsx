import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { ContinueWatchingVideo } from '../../types/playlist';
import { GameTheme } from '../../utils/gameThemes';

interface ContinueWatchingSectionProps {
  videos: ContinueWatchingVideo[];
  theme: GameTheme;
}

const ContinueWatchingSection: React.FC<ContinueWatchingSectionProps> = ({
  videos,
  theme
}) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (videos.length === 0) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRemainingTime = (watchTime: number, duration: number): string => {
    const remaining = Math.max(0, duration - watchTime);
    const mins = Math.floor(remaining / 60);
    if (mins < 1) return 'Less than 1 min left';
    if (mins === 1) return '1 min left';
    return `${mins} min left`;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleVideoClick = (contentId: string) => {
    navigate(`/video/${contentId}`);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Continue Watching
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({videos.length})
          </span>
        </div>

        {videos.length > 3 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-400 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((video) => {
          const progressPercent = video.duration_seconds > 0
            ? (video.watch_time_seconds / video.duration_seconds) * 100
            : 0;

          return (
            <div
              key={video.content_id}
              onClick={() => handleVideoClick(video.content_id)}
              className="flex-shrink-0 w-72 bg-white dark:bg-dark-200 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 cursor-pointer group transition-all duration-200 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="relative aspect-video">
                <img
                  src={video.playlist_image_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=600'}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: theme.colors.primary
                    }}
                  />
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume</span>
                  </div>
                </div>

                {video.duration && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(video.duration)}
                  </div>
                )}
              </div>

              <div className="p-3">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                  {video.title}
                </h3>

                <div className="flex items-center justify-between">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${theme.colors.primary}15`,
                      color: theme.colors.primary
                    }}
                  >
                    {formatTime(video.watch_time_seconds)} watched
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatRemainingTime(video.watch_time_seconds, video.duration_seconds)}
                  </span>
                </div>

                {video.playlist_name && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                    From: {video.playlist_name}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatchingSection;
