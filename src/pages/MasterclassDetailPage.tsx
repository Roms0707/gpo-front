import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, Film, AlertTriangle, Sparkles, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useGalaxyRubrics } from '../hooks/useGalaxyRubrics';
import { fetchRubricContents } from '../services/galaxyContentService';
import { GalaxyContentItem } from '../types/galaxy';
import MasterclassEpisodeCard from '../components/masterclasses/MasterclassEpisodeCard';
import ContentBadge from '../components/ui/ContentBadge';
import { getBadgesForContent, getBadgesForRubric } from '../services/badgeService';

const MasterclassDetailPage: React.FC = () => {
  const { rubricId } = useParams<{ rubricId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { masterclasses, isLoading: isLoadingRubrics, configId } = useGalaxyRubrics();

  const [contents, setContents] = useState<GalaxyContentItem[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rubric = useMemo(
    () => masterclasses.find(r => r.rubric_id === rubricId),
    [masterclasses, rubricId]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [rubricId]);

  useEffect(() => {
    if (!rubricId || !configId) return;

    const load = async () => {
      try {
        setIsLoadingContents(true);
        setError(null);
        const items = await fetchRubricContents(configId, rubricId);
        setContents(items);
      } catch (err) {
        console.error('Error loading masterclass contents:', err);
        setError(t('masterclasses.loadError'));
      } finally {
        setIsLoadingContents(false);
      }
    };

    load();
  }, [rubricId, configId, t]);

  const isLoading = isLoadingRubrics || isLoadingContents;

  if (isLoading) {
    return (
      <div className={`min-h-screen pt-28 pb-24 ${isDark ? 'bg-dark-200' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader className="w-10 h-10 text-primary-500 animate-spin mb-4" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            {t('masterclasses.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !rubric) {
    return (
      <div className={`min-h-screen pt-28 pb-24 ${isDark ? 'bg-dark-200' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-20">
            <AlertTriangle className="w-16 h-16 text-error-400 mx-auto mb-4" />
            <h1 className={`font-heading font-bold text-2xl mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('masterclasses.notFound')}
            </h1>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {error || t('masterclasses.notFoundDesc')}
            </p>
            <Link
              to="/masterclasses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('masterclasses.backToMasterclasses')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-0 pb-24 relative ${isDark ? 'bg-dark-200' : 'bg-gray-50'}`}>
      {isDark && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top center, rgba(255,121,0,0.04) 0%, transparent 60%)',
          }}
        />
      )}

      <div className="relative w-full min-h-[450px] md:min-h-[500px] lg:min-h-[550px] overflow-hidden">
        {rubric.thumbnail_url ? (
          <img
            src={rubric.thumbnail_url}
            alt={rubric.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-500/30 via-dark-300 to-dark-400" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end min-h-[450px] md:min-h-[500px] lg:min-h-[550px] pb-10 pt-28">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate('/masterclasses')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200 text-sm border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('masterclasses.backToMasterclasses')}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-300 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                {t('masterclasses.featured')}
              </span>
              {rubricId && getBadgesForRubric(rubricId).map((badge) => (
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

            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2 text-sm text-gray-300">
                <Film className="w-4 h-4 text-primary-400" />
                {t('masterclasses.episodeCount', { count: contents.length })}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className={`font-heading font-bold text-xl md:text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('masterclasses.episodes')}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('masterclasses.episodesDesc', { count: contents.length })}
          </p>
        </motion.div>

        <div className="space-y-5">
          {contents.map((item, index) => (
            <motion.div
              key={item.content_id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * (index + 1) }}
            >
              <MasterclassEpisodeCard
                item={item}
                index={index}
                rubricId={rubricId!}
                configId={configId}
                badges={getBadgesForContent(item.content_id)}
              />
            </motion.div>
          ))}
        </div>

        {contents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 flex items-center justify-center"
          >
            <Link
              to="/masterclasses"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isDark
                  ? 'bg-dark-100 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('masterclasses.explorMore')}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MasterclassDetailPage;
