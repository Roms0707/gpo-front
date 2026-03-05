import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { GameTheme } from '../../../utils/gameThemes';
import { GalaxyRubric } from '../../../types/galaxy';
import { useGalaxyRubrics } from '../../../hooks/useGalaxyRubrics';
import { useGrindZoneQuiz } from '../../../hooks/useGrindZoneQuiz';
import { useAuth } from '../../../contexts/AuthContext';
import { useAppConfig } from '../../../contexts/AppConfigContext';
import GrindPlaylistCard from '../../grindzone/GrindPlaylistCard';
import GrindPlaylistDetail from '../../grindzone/GrindPlaylistDetail';
import type { CardQuizStatus } from '../../grindzone/GrindPlaylistCard';

interface GameHubGrindZoneTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
  gameImageUrl?: string;
}

function useItemsPerPage() {
  const getCount = () => {
    const w = window.innerWidth;
    if (w < 640) return 2;
    if (w < 1024) return 3;
    if (w < 1280) return 4;
    return 5;
  };
  const [count, setCount] = useState(getCount);
  useEffect(() => {
    const onResize = () => setCount(getCount());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return count;
}

const GameHubGrindZoneTab: React.FC<GameHubGrindZoneTabProps> = ({ gameId, gameName, theme, gameImageUrl }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { projectConfigUuid } = useAppConfig();
  const { grindZoneForGame, isLoading, configId } = useGalaxyRubrics();

  const [selectedRubric, setSelectedRubric] = useState<GalaxyRubric | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = useItemsPerPage();

  const rubrics = useMemo(() => grindZoneForGame(gameId), [grindZoneForGame, gameId]);

  const rubricIds = useMemo(() => rubrics.map(r => r.rubric_id), [rubrics]);
  const { quizStatusMap } = useGrindZoneQuiz(projectConfigUuid, rubricIds, user?.id ?? null);

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

  const filtered = useMemo(() => {
    if (!search.trim()) return rubrics;
    const q = search.toLowerCase();
    return rubrics.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  }, [rubrics, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(0);
  }, [search, gameId, itemsPerPage]);

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  const goToPrev = useCallback(() => {
    setCurrentPage(p => Math.max(0, p - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentPage(p => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-0 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" style={{ aspectRatio: '390 / 520' }} />
          ))}
        </div>
      </div>
    );
  }

  if (selectedRubric) {
    return (
      <div>
        <div
          className="relative rounded-t-xl overflow-hidden"
          style={{ height: '140px' }}
        >
          {selectedRubric.thumbnail_url && (
            <img
              src={selectedRubric.thumbnail_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}25, ${theme.colors.secondary}15)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
        </div>
        <div className="-mt-10">
          <GrindPlaylistDetail
            rubric={selectedRubric}
            configId={configId}
            theme={theme}
            onClose={() => setSelectedRubric(null)}
            gameImageUrl={gameImageUrl}
            gameName={gameName}
          />
        </div>
      </div>
    );
  }

  const showNav = totalPages > 1;

  return (
    <div className="space-y-8">
      <div
        className="relative rounded-xl overflow-hidden p-6"
        style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}15)` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
          >
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('grindZone.title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{gameName}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
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

      {filtered.length > 0 ? (
        <div className="relative group/slider">
          {showNav && (
            <button
              onClick={goToPrev}
              disabled={currentPage === 0}
              className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-dark-200/90 backdrop-blur-sm shadow-lg transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover/slider:opacity-100"
              style={{ '--tw-shadow-color': `${theme.colors.primary}15` } as React.CSSProperties}
            >
              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {Array.from({ length: totalPages }).map((_, pageIdx) => {
                const start = pageIdx * itemsPerPage;
                const pageItems = filtered.slice(start, start + itemsPerPage);
                return (
                  <div
                    key={pageIdx}
                    className="flex gap-3 flex-shrink-0"
                    style={{ width: '100%' }}
                  >
                    {pageItems.map(r => (
                      <div key={r.rubric_id} style={{ width: `calc(${100 / itemsPerPage}% - ${((itemsPerPage - 1) * 12) / itemsPerPage}px)` }} className="flex-shrink-0">
                        <GrindPlaylistCard
                          rubric={r}
                          theme={theme}
                          configId={configId}
                          quizStatus={getCardQuizStatus(r.rubric_id)}
                          onClick={() => setSelectedRubric(r)}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {showNav && (
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-dark-200/90 backdrop-blur-sm shadow-lg transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover/slider:opacity-100"
              style={{ '--tw-shadow-color': `${theme.colors.primary}15` } as React.CSSProperties}
            >
              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          {showNav && (
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentPage ? '24px' : '8px',
                    height: '8px',
                    backgroundColor: i === currentPage ? theme.colors.primary : undefined,
                  }}
                >
                  {i !== currentPage && (
                    <span className="block w-full h-full rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Flame className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">{t('grindZone.empty.noPlaylists')}</p>
        </div>
      )}
    </div>
  );
};

export default GameHubGrindZoneTab;
