import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Target, Zap, ChevronRight, ChevronLeft, Clock, Eye } from 'lucide-react';
import { getGameTheme } from '../../utils/gameThemes';
import { fetchGameContent } from '../../services/api';
import { APP_CONFIG } from '../../constants';

interface GameContent {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  content_url: string;
  playlist_image_url?: string;
  duration?: number;
}

interface GameHubTrainingSectionProps {
  gameId: string;
  gameName: string;
}

const GameHubTrainingSection: React.FC<GameHubTrainingSectionProps> = ({
  gameId,
  gameName
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<GameContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const theme = getGameTheme(gameName);

  const hasAimTrainer = APP_CONFIG.AIM_TRAINER_GAME_IDS.includes(gameId);
  const hasReactionGame = APP_CONFIG.REACTION_TIME_ONLY_GAME_IDS.includes(gameId) || hasAimTrainer;

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        const result = await fetchGameContent(gameId, { contentType: 'video', limit: 12 });
        setVideos(result.data || []);
      } catch (error) {
        console.error('Error loading training content:', error);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [gameId]);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [videos]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 w-48 bg-dark-300 rounded animate-pulse"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-72 h-48 bg-dark-300 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Play className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('gameHub.training')}</h2>
        </div>
      </div>

      {(hasAimTrainer || hasReactionGame) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {hasAimTrainer && (
            <div
              onClick={() => window.open('/aim-trainer-game/index.html', '_blank')}
              className="group relative bg-dark-200/50 border border-gray-800 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-gray-700 hover:shadow-xl overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
                style={{
                  background: `radial-gradient(circle at top right, ${theme.colors.primary}, transparent 70%)`,
                }}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className="p-3 rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <Target className="w-8 h-8" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{t('gameHub.aimTrainer')}</h3>
                  <p className="text-sm text-gray-400">{t('gameHub.aimTrainerDesc')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          )}

          {hasReactionGame && (
            <div
              onClick={() => window.open('/reaction-time-game/index.html', '_blank')}
              className="group relative bg-dark-200/50 border border-gray-800 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-gray-700 hover:shadow-xl overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
                style={{
                  background: `radial-gradient(circle at top right, ${theme.colors.secondary}, transparent 70%)`,
                }}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className="p-3 rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${theme.colors.secondary}20` }}
                >
                  <Zap className="w-8 h-8" style={{ color: theme.colors.secondary }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{t('gameHub.reactionTime')}</h3>
                  <p className="text-sm text-gray-400">{t('gameHub.reactionTimeDesc')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          )}
        </div>
      )}

      {videos.length > 0 && (
        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-dark-200/90 backdrop-blur-sm border border-gray-700 text-white hover:bg-dark-300 transition-all -translate-x-4"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-dark-200/90 backdrop-blur-sm border border-gray-700 text-white hover:bg-dark-300 transition-all translate-x-4"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => navigate(`/video/${video.id}`)}
                className="flex-shrink-0 w-72 group cursor-pointer"
              >
                <div className="relative rounded-xl overflow-hidden mb-3">
                  <img
                    src={video.playlist_image_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=600'}
                    alt={video.title}
                    className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div
                      className="p-3 rounded-full"
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

                <h4 className="font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                  {video.title}
                </h4>
                {video.description && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-1">{video.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length === 0 && !hasAimTrainer && !hasReactionGame && (
        <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-8 text-center">
          <Play className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('gameHub.noTrainingContent')}</p>
        </div>
      )}
    </section>
  );
};

export default GameHubTrainingSection;
