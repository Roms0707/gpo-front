import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Search, Loader2, BookOpen } from 'lucide-react';
import { GameTheme } from '../../../utils/gameThemes';
import { useAuth } from '../../../contexts/AuthContext';
import { useGalaxyRubrics } from '../../../hooks/useGalaxyRubrics';
import { fetchRubricContents } from '../../../services/galaxyContentService';
import { GalaxyContentItem } from '../../../types/galaxy';
import AuthRequiredOverlay from '../../auth/AuthRequiredOverlay';
import GalaxyVideoCard from '../GalaxyVideoCard';
import { getBadgesForContent, computeBadgeCounts, BadgeType } from '../../../services/badgeService';
import BadgeFilterBar from '../../ui/BadgeFilterBar';

interface GameHubTrainingTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

interface RubricVideo extends GalaxyContentItem {
  _rubricId: string;
  _rubricName: string;
}

const GameHubTrainingTab: React.FC<GameHubTrainingTabProps> = ({
  gameId,
  gameName,
  theme,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tipsForGame, isLoading: isLoadingRubrics, error: rubricsError, configId } = useGalaxyRubrics();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const [allVideos, setAllVideos] = useState<RubricVideo[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<Set<BadgeType>>(new Set());

  const rubrics = useMemo(() => tipsForGame(gameId), [tipsForGame, gameId]);

  useEffect(() => {
    setSelectedRubricId(null);
    setSearchQuery('');
    setAllVideos([]);
    setSelectedBadges(new Set());
  }, [gameId]);

  useEffect(() => {
    if (!configId || rubrics.length === 0) return;

    let cancelled = false;
    const loadAllContents = async () => {
      setContentsLoading(true);
      try {
        const results = await Promise.allSettled(
          rubrics.map(async (rubric) => {
            const contents = await fetchRubricContents(configId, rubric.rubric_id);
            return contents.map((item) => ({
              ...item,
              _rubricId: rubric.rubric_id,
              _rubricName: rubric.name,
            }));
          })
        );

        if (cancelled) return;

        const videos: RubricVideo[] = [];
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            videos.push(...result.value);
          }
        });

        setAllVideos(videos);
      } catch (err) {
        console.error('Error loading all rubric contents:', err);
      } finally {
        if (!cancelled) setContentsLoading(false);
      }
    };

    loadAllContents();
    return () => { cancelled = true; };
  }, [configId, rubrics]);

  const filteredVideos = useMemo(() => {
    let result = allVideos;

    if (selectedRubricId) {
      result = result.filter((v) => v._rubricId === selectedRubricId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query)
      );
    }

    if (selectedBadges.size > 0) {
      result = result.filter((v) => {
        const badges = getBadgesForContent(v.content_id);
        return badges.some((b) => selectedBadges.has(b));
      });
    }

    return result;
  }, [allVideos, selectedRubricId, searchQuery, selectedBadges]);

  const badgeCounts = useMemo(() => {
    let base = allVideos;
    if (selectedRubricId) {
      base = base.filter((v) => v._rubricId === selectedRubricId);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      base = base.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query)
      );
    }
    return computeBadgeCounts(base, (v) => getBadgesForContent(v.content_id));
  }, [allVideos, selectedRubricId, searchQuery]);

  const handleToggleBadge = useCallback((badge: BadgeType) => {
    setSelectedBadges((prev) => {
      const next = new Set(prev);
      if (next.has(badge)) {
        next.delete(badge);
      } else {
        next.add(badge);
      }
      return next;
    });
  }, []);

  const showRubricTabs = rubrics.length > 1;

  const renderContent = () => (
    <div id="walkthrough-gamehub-training" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('gameHub.searchVideos', 'Search videos...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
          />
        </div>

        {allVideos.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <BookOpen className="w-4 h-4" />
            <span>
              {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
            </span>
          </div>
        )}
      </div>

      <BadgeFilterBar
        selectedBadges={selectedBadges}
        onToggleBadge={handleToggleBadge}
        badgeCounts={badgeCounts}
      />

      {showRubricTabs && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setSelectedRubricId(null)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
              ${!selectedRubricId
                ? 'text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-300/50'
              }
            `}
            style={!selectedRubricId ? {
              backgroundColor: theme.colors.primary,
              color: theme.colors.text,
            } : undefined}
          >
            {t('gameHub.training.allSections', 'All')}
          </button>
          {rubrics.map((rubric) => {
            const isActive = selectedRubricId === rubric.rubric_id;
            return (
              <button
                key={rubric.rubric_id}
                onClick={() => setSelectedRubricId(rubric.rubric_id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-300/50'
                  }
                `}
                style={isActive ? {
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.text,
                } : undefined}
              >
                {rubric.name}
              </button>
            );
          })}
        </div>
      )}

      {contentsLoading ? (
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
              : t('gameHub.noTrainingContent', 'No training content available')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery
              ? t('gameHub.tryDifferentSearch', 'Try a different search term')
              : t('gameHub.noTrainingContentDesc', 'Training videos for this game will appear here once available.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <GalaxyVideoCard
              key={`${video._rubricId}-${video.content_id}`}
              video={video}
              rubricId={video._rubricId}
              theme={theme}
              rubricName={video._rubricName}
              showRubricLabel={!selectedRubricId && showRubricTabs}
              badges={getBadgesForContent(video.content_id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (isLoadingRubrics) {
    return (
      <div className="space-y-6">
        <div className="h-10 max-w-md bg-gray-200 dark:bg-dark-300 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-40 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-dark-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (rubricsError) {
    return (
      <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
        <Play className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('gameHub.errorLoadingContent', 'Error loading content')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
          {rubricsError}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequiredOverlay
        theme={theme}
        title={t('auth.trainingLocked.title', 'Unlock Training Content')}
        description={t('auth.trainingLocked.description', 'Login to access video tutorials and track your progress')}
      >
        {renderContent()}
      </AuthRequiredOverlay>
    );
  }

  return renderContent();
};

export default GameHubTrainingTab;
