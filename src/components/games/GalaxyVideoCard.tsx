import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { GalaxyContentItem } from '../../types/galaxy';
import { formatGalaxyDuration } from '../../services/galaxyContentService';
import { GameTheme } from '../../utils/gameThemes';
import { ContentBadgeStack } from '../ui/ContentBadge';
import { BadgeType } from '../../services/badgeService';

interface GalaxyVideoCardProps {
  video: GalaxyContentItem;
  rubricId: string;
  theme: GameTheme;
  rubricName?: string;
  showRubricLabel?: boolean;
  badges?: BadgeType[];
}

const GalaxyVideoCard: React.FC<GalaxyVideoCardProps> = ({
  video,
  rubricId,
  theme,
  rubricName,
  showRubricLabel = false,
  badges = [],
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/video/${rubricId}/${video.content_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden mb-2 bg-gray-200 dark:bg-dark-400">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className="w-full h-40 flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}15` }}
          >
            <Play className="w-8 h-8" style={{ color: theme.colors.primary }} />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div
            className="p-3 rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-300"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>

        {video.duration != null && video.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatGalaxyDuration(video.duration)}
          </div>
        )}

        {showRubricLabel && rubricName && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: `${theme.colors.primary}CC`, color: '#fff' }}
          >
            {rubricName}
          </div>
        )}

        {badges.length > 0 && (
          <div className={`absolute top-2 ${showRubricLabel && rubricName ? 'right-2' : 'right-2'}`}>
            <ContentBadgeStack badges={badges} size="sm" />
          </div>
        )}
      </div>

      <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-opacity-80 transition-colors">
        {video.title}
      </h4>
    </div>
  );
};

export default GalaxyVideoCard;
