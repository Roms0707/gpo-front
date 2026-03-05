import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Flame,
  Search,
  Brain,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useConfigGames } from '../hooks/useConfigGames';
import { useGalaxyRubrics } from '../hooks/useGalaxyRubrics';
import { useGrindZoneQuiz } from '../hooks/useGrindZoneQuiz';
import { useAuth } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import { getGameTheme } from '../utils/gameThemes';
import { GalaxyRubric } from '../types/galaxy';
import { FeaturedGrindSlide } from '../types/grindZone';
import GrindPlaylistCard from '../components/grindzone/GrindPlaylistCard';
import GrindPlaylistDetail from '../components/grindzone/GrindPlaylistDetail';
import GrindZoneHeroCarousel from '../components/grindzone/GrindZoneHeroCarousel';
import GrindZoneTrainingPanel from '../components/grindzone/GrindZoneTrainingPanel';
import { getBadgesForRubric, computeBadgeCounts, BadgeType } from '../services/badgeService';
import BadgeFilterBar from '../components/ui/BadgeFilterBar';
import type { CardQuizStatus } from '../components/grindzone/GrindPlaylistCard';

const GrindZonePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { projectConfigUuid } = useAppConfig();
  const { games } = useConfigGames();
  const { grindZoneForGame, gameHasGrindZoneContent, isLoading, configId } = useGalaxyRubrics();

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedRubric, setSelectedRubric] = useState<GalaxyRubric | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<Set<BadgeType>>(new Set());
  const [showPanel, setShowPanel] = useState(false);
  const backdropVideoRef = useRef<HTMLVideoElement>(null);

  const gamesWithContent = useMemo(
    () => isLoading ? games : games.filter(g => gameHasGrindZoneContent(g.id)),
    [games, gameHasGrindZoneContent, isLoading]
  );

  const selectedGame = useMemo(
    () => gamesWithContent.find(g => g.id === selectedGameId) || gamesWithContent[0] || null,
    [gamesWithContent, selectedGameId]
  );

  const theme = useMemo(
    () => selectedGame ? getGameTheme(selectedGame.slug || selectedGame.name) : getGameTheme(null),
    [selectedGame]
  );

  const rubrics = useMemo(
    () => selectedGame ? grindZoneForGame(selectedGame.id) : [],
    [grindZoneForGame, selectedGame]
  );

  const rubricIds = useMemo(() => rubrics.map(r => r.rubric_id), [rubrics]);
  const { quizStatusMap } = useGrindZoneQuiz(projectConfigUuid, rubricIds, user?.id ?? null, selectedGame?.id);

  const getCardQuizStatus = useCallback((rubricId: string): CardQuizStatus | undefined => {
    const qs = quizStatusMap.get(rubricId);
    if (!qs || qs.status === 'no_quiz') return undefined;
    return {
      hasQuiz: true,
      completed: qs.status === 'completed',
      score: qs.submission?.score,
      total: qs.submission?.total_questions,
    };
  }, [quizStatusMap]);

  useEffect(() => {
    if (gamesWithContent.length > 0 && (!selectedGameId || !gamesWithContent.find(g => g.id === selectedGameId))) {
      setSelectedGameId(gamesWithContent[0].id);
    }
  }, [gamesWithContent, selectedGameId]);

  useEffect(() => {
    setSelectedRubric(null);
    setSearch('');
    setSelectedBadges(new Set());
  }, [selectedGameId]);

  useEffect(() => {
    if (backdropVideoRef.current) {
      backdropVideoRef.current.playbackRate = 0.85;
    }
  }, [selectedRubric]);

  const filtered = useMemo(() => {
    let items = rubrics;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    if (selectedBadges.size > 0) {
      items = items.filter(r => {
        const badges = getBadgesForRubric(r.rubric_id);
        return badges.some(b => selectedBadges.has(b));
      });
    }
    return items;
  }, [rubrics, search, selectedBadges]);

  const badgeCounts = useMemo(() => {
    let items = rubrics;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    return computeBadgeCounts(items, (r) => getBadgesForRubric(r.rubric_id));
  }, [rubrics, search]);

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

  const featuredSlides: FeaturedGrindSlide[] = useMemo(() => {
    return rubrics.slice(0, 5).map(r => {
      const matchedGame = games.find(g => g.id === r.game_id);
      return {
        id: r.rubric_id,
        playlist_id: r.rubric_id,
        title: r.name,
        subtitle: r.description || '',
        category: r.content_category,
        game_name: matchedGame?.name || '',
        cover_image_url: r.thumbnail_url || '',
        trailer_url: matchedGame?.trailer_url,
        is_new: false,
      };
    });
  }, [rubrics, games]);

  const handleFeaturedSlideSelect = () => {
    const el = document.getElementById('grind-content');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-100">
      {selectedRubric ? (
        <div className="relative w-full overflow-hidden" style={{ height: '340px' }}>
          {selectedGame?.trailer_url ? (
            <video
              ref={backdropVideoRef}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={selectedGame.trailer_url} type="video/mp4" />
            </video>
          ) : selectedRubric.thumbnail_url ? (
            <img
              src={selectedRubric.thumbnail_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}30 0%, ${theme.colors.secondary}20 50%, ${theme.colors.primary}10 100%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-50 dark:from-dark-100 to-transparent" />
        </div>
      ) : (
        <GrindZoneHeroCarousel
          slides={featuredSlides}
          onSelectSlide={handleFeaturedSlideSelect}
        />
      )}

      {selectedGame && !selectedRubric && (
        <button
          onClick={() => setShowPanel(true)}
          className="relative z-10 w-full group cursor-pointer border-t border-b transition-all duration-300"
          style={{
            borderColor: `${theme.colors.primary}20`,
            background: `linear-gradient(90deg, ${theme.colors.primary}08 0%, ${theme.colors.primary}15 50%, ${theme.colors.primary}08 100%)`,
          }}
        >
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${theme.colors.primary}15`,
                  boxShadow: `0 0 12px ${theme.colors.primary}20`,
                }}
              >
                <Brain className="w-5 h-5" style={{ color: theme.colors.primary }} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('grindZone.myTraining')}
                  </span>
                  <Zap className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {t('grindZone.trainingBannerSubtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold hidden sm:inline"
                style={{ color: theme.colors.primary }}
              >
                {t('actions.open')}
              </span>
              <ChevronRight
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: theme.colors.primary }}
              />
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
            style={{ backgroundColor: theme.colors.primary }}
          />
        </button>
      )}

      <div id="grind-content" className={`relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 ${selectedRubric ? '-mt-24 pb-8' : 'py-8'}`}>
        {!selectedRubric && (
          <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/90 dark:bg-dark-100/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 mb-8">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              {gamesWithContent.map(game => {
                const gt = getGameTheme(game.slug || game.name);
                const isActive = selectedGame?.id === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive ? 'text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300/50'
                    }`}
                    style={isActive ? { backgroundColor: gt.colors.primary } : undefined}
                  >
                    {game.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedRubric ? (
          <GrindPlaylistDetail
            rubric={selectedRubric}
            configId={configId}
            theme={theme}
            onClose={() => setSelectedRubric(null)}
            gameImageUrl={selectedGame?.image_url}
            gameName={selectedGame?.name}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('grindZone.title')}
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('common.search')}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-200 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors"
                  style={{ '--tw-ring-color': `${theme.colors.primary}40` } as React.CSSProperties}
                />
              </div>
            </div>

            <BadgeFilterBar
              selectedBadges={selectedBadges}
              onToggleBadge={handleToggleBadge}
              badgeCounts={badgeCounts}
              className="mb-6"
            />

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div key={i} className="bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" style={{ aspectRatio: '390 / 520' }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-10">
                {filtered.map(r => (
                  <GrindPlaylistCard
                    key={r.rubric_id}
                    rubric={r}
                    theme={theme}
                    configId={configId}
                    quizStatus={getCardQuizStatus(r.rubric_id)}
                    onClick={() => setSelectedRubric(r)}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Flame className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">{t('grindZone.empty.noPlaylists')}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedGame && (
        <GrindZoneTrainingPanel
          isOpen={showPanel}
          onClose={() => setShowPanel(false)}
          gameId={selectedGame.id}
          gameName={selectedGame.name}
          theme={theme}
          rubrics={rubrics}
          quizStatusMap={quizStatusMap}
          contextPlaylistName={selectedRubric?.name}
          onSelectRubric={setSelectedRubric}
        />
      )}
    </div>
  );
};

export default GrindZonePage;
