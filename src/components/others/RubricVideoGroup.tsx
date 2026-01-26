import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { GameContent } from '../../types';
import { GameTheme } from '../../utils/gameThemes';
import VideoCard from '../ui/VideoCard';

interface RubricVideoGroupProps {
  seriesName: string;
  videos: GameContent[];
  theme: GameTheme;
  defaultExpanded?: boolean;
}

const RubricVideoGroup: React.FC<RubricVideoGroupProps> = ({
  seriesName,
  videos,
  theme,
  defaultExpanded = true,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isUngrouped = !seriesName;
  const displayName = isUngrouped ? t('othersHub.moreVideos') : seriesName;

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors mb-3"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Play className="w-4 h-4" style={{ color: theme.colors.primary }} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {displayName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('othersHub.videoCount', { count: videos.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: `${theme.colors.primary}20`,
              color: theme.colors.primary,
            }}
          >
            {videos.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-4 border-l-2" style={{ borderColor: `${theme.colors.primary}30` }}>
          {videos.map((video) => (
            <VideoCard key={video.id} content={video} showMetadata={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RubricVideoGroup;
