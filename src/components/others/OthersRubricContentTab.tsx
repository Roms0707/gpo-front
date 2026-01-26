import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Video, RefreshCw } from 'lucide-react';
import { GameContent } from '../../types';
import { GameTheme } from '../../utils/gameThemes';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAllContentForRubric } from '../../services/othersService';
import { groupVideosByTitle, VideoGroup } from '../../utils/videoGrouping';
import RubricVideoGroup from './RubricVideoGroup';
import LoadingSpinner from '../ui/LoadingSpinner';
import AuthRequiredOverlay from '../auth/AuthRequiredOverlay';

interface OthersRubricContentTabProps {
  gameId: string;
  rubricId: string;
  rubricName: string;
  theme: GameTheme;
}

const OthersRubricContentTab: React.FC<OthersRubricContentTabProps> = ({
  gameId,
  rubricId,
  rubricName,
  theme,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [videos, setVideos] = useState<GameContent[]>([]);
  const [videoGroups, setVideoGroups] = useState<VideoGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const content = await fetchAllContentForRubric(gameId, rubricId);
        setVideos(content);
        const groups = groupVideosByTitle(content);
        setVideoGroups(groups);
      } catch (err) {
        console.error('Error loading rubric content:', err);
        setError(t('othersHub.errorLoadingContent'));
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [gameId, rubricId, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" text={t('othersHub.loadingContent')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${theme.colors.primary}20` }}
        >
          <RefreshCw className="w-8 h-8" style={{ color: theme.colors.primary }} />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${theme.colors.primary}20` }}
        >
          <Video className="w-8 h-8" style={{ color: theme.colors.primary }} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('othersHub.noContent')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          {t('othersHub.noContentDescription', { rubricName })}
        </p>
      </div>
    );
  }

  const content = (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${theme.colors.primary}20` }}
        >
          <Video className="w-5 h-5" style={{ color: theme.colors.primary }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {rubricName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('othersHub.totalVideos', { count: videos.length })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {videoGroups.map((group, index) => (
          <RubricVideoGroup
            key={group.seriesName || `ungrouped-${index}`}
            seriesName={group.seriesName}
            videos={group.videos}
            theme={theme}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  );

  if (!user) {
    return (
      <AuthRequiredOverlay
        theme={theme}
        title={t('auth.contentLocked.title', 'Unlock Content')}
        description={t('auth.contentLocked.description', 'Login to access exclusive videos and content')}
      >
        {content}
      </AuthRequiredOverlay>
    );
  }

  return content;
};

export default OthersRubricContentTab;
