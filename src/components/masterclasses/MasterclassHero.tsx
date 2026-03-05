import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Film, Sparkles } from 'lucide-react';
import { GalaxyRubric } from '../../types/galaxy';
import { useTranslation } from 'react-i18next';
import ContentBadge from '../ui/ContentBadge';
import { BadgeType } from '../../services/badgeService';

interface MasterclassHeroProps {
  rubric: GalaxyRubric;
  badges?: BadgeType[];
}

const MasterclassHero: React.FC<MasterclassHeroProps> = ({ rubric, badges = [] }) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full min-h-[420px] md:min-h-[480px] lg:min-h-[520px] overflow-hidden rounded-2xl lg:rounded-3xl">
      {rubric.thumbnail_url ? (
        <img
          src={rubric.thumbnail_url}
          alt={rubric.name}
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-500/30 via-dark-300 to-dark-400" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      <div className="absolute inset-0 rounded-2xl lg:rounded-3xl border border-white/5 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent hero-shimmer" />

      <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-10 lg:p-14 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {t('masterclasses.featured')}
          </span>
          {badges.map((badge) => (
            <ContentBadge key={badge} type={badge} size="md" />
          ))}
        </div>

        <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-4 leading-tight">
          {rubric.name}
        </h1>

        {rubric.description && (
          <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 line-clamp-3">
            {rubric.description}
          </p>
        )}

        <div className="flex items-center gap-4 mb-6">
          {rubric.content_count != null && (
            <span className="flex items-center gap-1.5 text-sm text-gray-300">
              <Film className="w-4 h-4 text-primary-400" />
              {t('masterclasses.episodeCount', { count: rubric.content_count })}
            </span>
          )}
        </div>

        <Link
          to={`/masterclasses/${rubric.rubric_id}`}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 active:scale-95 w-fit"
        >
          <Play className="w-5 h-5" fill="currentColor" />
          {t('masterclasses.watchSeries')}
        </Link>
      </div>

      <style>{`
        .hero-shimmer {
          animation: shimmerSlide 4s ease-in-out infinite;
        }
        @keyframes shimmerSlide {
          0%, 100% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 1; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default MasterclassHero;
