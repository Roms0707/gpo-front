import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Clock, Eye, Loader2, Search } from 'lucide-react';
import { fetchGameContent } from '../../../services/api';
import { GameTheme } from '../../../utils/gameThemes';

interface GameContent {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  content_url: string;
  playlist_image_url?: string;
  duration?: number;
  view_count?: number;
}

interface GameHubTrainingTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

const VIDEOS_PER_PAGE = 12;

const GameHubTrainingTab: React.FC<GameHubTrainingTabProps> = ({
  gameId,
  gameName,
  theme,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<GameContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadVideos = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await fetchGameContent(gameId, {
        contentType: 'video',
        limit: VIDEOS_PER_PAGE,
        offset: pageNum * VIDEOS_PER_PAGE,
      });

      const newVideos = result?.data || [];

      if (reset) {
        setVideos(newVideos);
      } else {
        setVideos((prev) => [...prev, ...newVideos]);
      }

      setHasMore(newVideos.length === VIDEOS_PER_PAGE);
    } catch (error) {
      console.error('Error loading videos:', error);
      if (reset) setVideos([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [gameId]);

  useEffect(() => {
    setPage(0);
    setVideos([]);
    setHasMore(true);
    loadVideos(0, true);
  }, [gameId, loadVideos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage((prev) => {
            const nextPage = prev + 1;
            loadVideos(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadVideos]);

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 max-w-md bg-dark-300 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-40 bg-dark-300 rounded-xl animate-pulse" />
              <div className="h-4 bg-dark-300 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-dark-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="walkthrough-gamehub-training" className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('gameHub.searchVideos')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-dark-200 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
        />
      </div>

      {filteredVideos.length === 0 && !isLoadingMore ? (
        <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-12 text-center">
          <Play className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-white mb-2">{t('gameHub.noTrainingContent')}</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {t('gameHub.noTrainingContentDesc')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => navigate(`/video/${video.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative rounded-xl overflow-hidden mb-3 bg-dark-300">
                  <img
                    src={video.playlist_image_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=600'}
                    alt={video.title}
                    className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div
                      className="p-3 rounded-full transition-transform group-hover:scale-110"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>

                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                <h4 className="font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors mb-1">
                  {video.title}
                </h4>

                {video.description && (
                  <p className="text-sm text-gray-400 line-clamp-1">{video.description}</p>
                )}

                {video.view_count !== undefined && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>{video.view_count.toLocaleString()} {t('gameHub.views')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && !searchQuery && (
            <div ref={loaderRef} className="flex justify-center py-8">
              {isLoadingMore && (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: theme.colors.primary }} />
                  <span>{t('common.loading')}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GameHubTrainingTab;
