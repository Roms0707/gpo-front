import React, { useState, useCallback } from 'react';
import { Play, Clock, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import VideoPlaceholder from './VideoPlaceholder';
import MasterclassVideoPlayer from './MasterclassVideoPlayer';
import { GalaxyContentItem } from '../../types/galaxy';
import { resolveVideoUrl, formatGalaxyDuration } from '../../services/galaxyContentService';
import ContentBadge from '../ui/ContentBadge';
import { BadgeType } from '../../services/badgeService';

interface MasterclassEpisodeCardProps {
  item: GalaxyContentItem;
  index: number;
  rubricId: string;
  configId: string;
  badges?: BadgeType[];
}

const MasterclassEpisodeCard: React.FC<MasterclassEpisodeCardProps> = ({
  item,
  index,
  rubricId,
  configId,
  badges = [],
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  const episodeNum = (item.position ?? index + 1).toString().padStart(2, '0');

  const handleToggle = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsExpanded(true);

    if (!videoUrl && !isLoadingVideo) {
      setIsLoadingVideo(true);
      try {
        const resolved = await resolveVideoUrl(configId, rubricId, item.content_id);
        setVideoUrl(resolved.delivery_url || null);
      } catch (err) {
        console.error('Error resolving video URL:', err);
      } finally {
        setIsLoadingVideo(false);
      }
    }
  }, [isExpanded, videoUrl, isLoadingVideo, configId, rubricId, item.content_id]);

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-500 ${
        isDark
          ? 'bg-dark-100/80 border border-gray-800/50 hover:border-gray-700/80'
          : 'bg-white border border-gray-200 hover:border-gray-300'
      } ${isExpanded ? (isDark ? 'border-primary-500/20' : 'border-primary-500/30') : ''}`}
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-80 lg:w-96 flex-shrink-0">
          <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden">
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-dark-300' : 'bg-gray-200'}`}>
                <Play className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30" />

            <div className="absolute top-4 left-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-bold text-lg">{episodeNum}</span>
              </div>
            </div>

            <button
              onClick={handleToggle}
              className="absolute inset-0 flex items-center justify-center group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-all duration-300 group-hover:bg-primary-500/80 group-hover:border-primary-500/50 group-hover:scale-110">
                <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
              </div>
            </button>

            {badges.length > 0 && (
              <div className="absolute top-4 right-4">
                {badges.slice(0, 1).map((badge) => (
                  <ContentBadge key={badge} type={badge} size="sm" />
                ))}
              </div>
            )}

            {item.duration != null && (
              <div className="absolute bottom-3 right-3">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  {formatGalaxyDuration(item.duration)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-primary-400' : 'text-primary-500'
                }`}>
                  {t('masterclasses.episode')} {item.position ?? index + 1}
                </span>
                <h3 className={`font-heading font-bold text-lg mt-1 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.title}
                </h3>
              </div>
            </div>

            {item.description && (
              <p className={`text-sm leading-relaxed ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {item.description}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            {item.duration != null && (
              <div className={`flex items-center gap-2 text-sm ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <Clock className="w-4 h-4" />
                {formatGalaxyDuration(item.duration)}
              </div>
            )}

            <button
              onClick={handleToggle}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ml-auto ${
                isExpanded
                  ? isDark
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'bg-primary-50 text-primary-600 border border-primary-200'
                  : isDark
                  ? 'bg-dark-200 text-gray-300 hover:text-white hover:bg-dark-300 border border-gray-700/50'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {isExpanded ? (
                <>
                  {t('masterclasses.hidePlayer')}
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  {t('masterclasses.watchEpisode')}
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`px-5 pb-5 md:px-6 md:pb-6 transition-all duration-500 ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`}>
          {isLoadingVideo ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-dark-300 border border-gray-700/50 flex items-center justify-center gap-3">
              <Loader className="w-6 h-6 text-primary-400 animate-spin" />
              <span className="text-gray-400 text-sm">{t('masterclasses.loadingVideo')}</span>
            </div>
          ) : videoUrl ? (
            <MasterclassVideoPlayer
              videoUrl={videoUrl}
              thumbnailUrl={item.thumbnail_url || undefined}
            />
          ) : (
            <VideoPlaceholder isExpanded={isExpanded} />
          )}
        </div>
      )}
    </div>
  );
};

export default MasterclassEpisodeCard;
