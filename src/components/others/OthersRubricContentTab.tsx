import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Search, BookOpen } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { useAuth } from '../../contexts/AuthContext';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { fetchRubricContents } from '../../services/galaxyContentService';
import { GalaxyContentItem } from '../../types/galaxy';
import AuthRequiredOverlay from '../auth/AuthRequiredOverlay';
import GalaxyVideoCard from '../games/GalaxyVideoCard';

interface OthersRubricContentTabProps {
  gameId: string;
  rubricId: string;
  rubricName: string;
  theme: GameTheme;
}

const OthersRubricContentTab: React.FC<OthersRubricContentTabProps> = ({
  rubricId,
  rubricName,
  theme,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { configId } = useAppConfig();
  const [videos, setVideos] = useState<GalaxyContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!configId) return;

    let cancelled = false;
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const contents = await fetchRubricContents(configId, rubricId);
        if (!cancelled) setVideos(contents);
      } catch (err) {
        console.error('Error loading rubric content:', err);
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadContent();
    return () => { cancelled = true; };
  }, [configId, rubricId]);

  useEffect(() => {
    setSearchQuery('');
  }, [rubricId]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const query = searchQuery.toLowerCase();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  const renderContent = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('othersHub.searchVideos', 'Search videos...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
          />
        </div>

        {videos.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <BookOpen className="w-4 h-4" />
            <span>
              {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-40 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-dark-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <Play className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery
              ? t('gameHub.noSearchResults', 'No matching videos found')
              : t('othersHub.noContent')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery
              ? t('gameHub.tryDifferentSearch', 'Try a different search term')
              : t('othersHub.noContentDescription', { rubricName })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <GalaxyVideoCard
              key={video.content_id}
              video={video}
              rubricId={rubricId}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (!user) {
    return (
      <AuthRequiredOverlay
        theme={theme}
        title={t('auth.contentLocked.title', 'Unlock Content')}
        description={t('auth.contentLocked.description', 'Login to access exclusive videos and content')}
      >
        {renderContent()}
      </AuthRequiredOverlay>
    );
  }

  return renderContent();
};

export default OthersRubricContentTab;
