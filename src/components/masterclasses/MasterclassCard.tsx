import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Film, Sparkles } from 'lucide-react';
import { GalaxyRubric } from '../../types/galaxy';
import { useTranslation } from 'react-i18next';
import { ContentBadgeStack } from '../ui/ContentBadge';
import { BadgeType } from '../../services/badgeService';

interface MasterclassCardProps {
  rubric: GalaxyRubric;
  isNew?: boolean;
  badges?: BadgeType[];
}

const MasterclassCard: React.FC<MasterclassCardProps> = ({ rubric, isNew, badges = [] }) => {
  const { t } = useTranslation();

  return (
    <Link
      to={`/masterclasses/${rubric.rubric_id}`}
      className="group relative block rounded-2xl overflow-hidden aspect-[16/10] bg-dark-300 transition-all duration-500 hover:scale-[1.03]"
    >
      {rubric.thumbnail_url ? (
        <img
          src={rubric.thumbnail_url}
          alt={rubric.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-500/20 to-dark-400 flex items-center justify-center">
          <Play className="w-16 h-16 text-primary-500/40" />
        </div>
      )}

      {(isNew || badges.length > 0) && (
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
          {isNew && !badges.includes('new') && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-lg shadow-primary-500/30">
              <Sparkles className="w-3 h-3" />
              {t('masterclasses.new')}
            </span>
          )}
          {badges.length > 0 && (
            <ContentBadgeStack badges={badges} size="sm" />
          )}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />

      <div className="absolute inset-0 rounded-2xl border border-white/5 group-hover:border-primary-500/30 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(255,121,0,0.1)]" />

      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        <h3 className="font-heading font-bold text-lg text-white mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors duration-300">
          {rubric.name}
        </h3>

        {rubric.description && (
          <p className="text-gray-300 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
            {rubric.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {rubric.content_count != null && (
              <span className="flex items-center gap-1.5 text-xs text-gray-300">
                <Film className="w-3.5 h-3.5 text-primary-400" />
                {t('masterclasses.episodeCount', { count: rubric.content_count })}
              </span>
            )}
          </div>

          <div className="w-9 h-9 rounded-full bg-primary-500/20 backdrop-blur-sm flex items-center justify-center border border-primary-500/30 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-primary-500/40">
            <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MasterclassCard;
