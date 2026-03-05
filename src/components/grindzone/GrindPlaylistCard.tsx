import React, { useState, useRef, useCallback } from 'react';
import { Play, Film, CheckCircle2, BookOpen } from 'lucide-react';
import { GalaxyRubric, GalaxyContentItem } from '../../types/galaxy';
import { GameTheme } from '../../utils/gameThemes';
import { fetchRubricContents } from '../../services/galaxyContentService';
import ContentBadge from '../ui/ContentBadge';
import { getBadgesForRubric, getPrimaryBadge } from '../../services/badgeService';

export interface CardQuizStatus {
  hasQuiz: boolean;
  completed: boolean;
  score?: number;
  total?: number;
}

interface GrindPlaylistCardProps {
  rubric: GalaxyRubric;
  theme: GameTheme;
  configId?: string;
  compact?: boolean;
  quizStatus?: CardQuizStatus;
  onClick?: () => void;
}

const MAX_PREVIEW_ITEMS = 5;

const GrindPlaylistCard: React.FC<GrindPlaylistCardProps> = ({
  rubric,
  theme,
  configId,
  compact = false,
  quizStatus,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const [contents, setContents] = useState<GalaxyContentItem[] | null>(null);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if (compact || fetchedRef.current || !configId) return;
    hoverTimeout.current = setTimeout(async () => {
      setIsLoadingContents(true);
      try {
        const items = await fetchRubricContents(configId, rubric.rubric_id);
        setContents(items);
        fetchedRef.current = true;
      } catch {
        // silent
      } finally {
        setIsLoadingContents(false);
      }
    }, 250);
  }, [compact, configId, rubric.rubric_id]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  }, []);

  const rubricBadges = getBadgesForRubric(rubric.rubric_id);
  const primaryBadge = getPrimaryBadge(rubricBadges);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="group relative flex-shrink-0 w-56 rounded-xl overflow-hidden bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg text-left"
      >
        <div className="relative overflow-hidden" style={{ aspectRatio: '390 / 520' }}>
          {rubric.thumbnail_url ? (
            <img
              src={rubric.thumbnail_url}
              alt={rubric.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}20)` }}
            >
              <Play className="w-10 h-10" style={{ color: theme.colors.primary }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {primaryBadge && (
            <div className="absolute top-2 right-2">
              <ContentBadge type={primaryBadge} size="sm" />
            </div>
          )}
          {quizStatus?.completed && (
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                <span className="text-[9px] font-bold text-white">{quizStatus.score}/{quizStatus.total}</span>
              </div>
            </div>
          )}
          {quizStatus?.hasQuiz && !quizStatus.completed && (
            <div className="absolute top-2 left-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}90` }}>
                <BookOpen className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2">
            <h4 className="text-sm font-semibold text-white line-clamp-1">{rubric.name}</h4>
            {rubric.content_count != null && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-300 flex items-center gap-0.5">
                  <Play className="w-2.5 h-2.5" />
                  {rubric.content_count} videos
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }

  const previewItems = contents?.slice(0, MAX_PREVIEW_ITEMS) || [];
  const remainingCount = contents ? Math.max(0, contents.length - MAX_PREVIEW_ITEMS) : 0;

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl hover:scale-[1.02] text-left"
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '390 / 520' }}>
        {rubric.thumbnail_url ? (
          <img
            src={rubric.thumbnail_url}
            alt={rubric.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}20)` }}
          >
            <Play className="w-12 h-12" style={{ color: `${theme.colors.primary}60` }} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {primaryBadge && (
          <div className="absolute top-3 right-3 z-10">
            <ContentBadge type={primaryBadge} size="md" />
          </div>
        )}

        {quizStatus?.completed && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white">{quizStatus.score}/{quizStatus.total}</span>
            </div>
          </div>
        )}
        {quizStatus?.hasQuiz && !quizStatus.completed && (
          <div className="absolute top-3 left-3 z-10">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}90` }}>
              <BookOpen className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight">{rubric.name}</h3>
          {rubric.content_count != null && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Film className="w-3 h-3 text-gray-300" />
              <span className="text-[11px] text-gray-300">{rubric.content_count} videos</span>
            </div>
          )}
        </div>

        <div
          className={`absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col justify-center transition-opacity duration-300 ${
            hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex-1 flex flex-col justify-center px-4 pb-12">
            {isLoadingContents ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
                    <div
                      className="h-3 rounded bg-white/10 animate-pulse flex-1"
                      style={{ maxWidth: `${55 + i * 10}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : previewItems.length > 0 ? (
              <div className="space-y-0.5">
                {previewItems.map((item, idx) => (
                  <div
                    key={item.content_id}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{
                      opacity: hovered ? 1 : 0,
                      transform: hovered ? 'translateY(0)' : 'translateY(6px)',
                      transition: `opacity 300ms ${idx * 60}ms, transform 300ms ${idx * 60}ms, background-color 150ms`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${theme.colors.primary}50` }}
                    >
                      <Play className="w-2.5 h-2.5 text-white ml-px" fill="currentColor" />
                    </div>
                    <span className="text-[11px] text-white/90 line-clamp-1 leading-tight">{item.title}</span>
                  </div>
                ))}
                {remainingCount > 0 && (
                  <p
                    className="text-[10px] text-white/40 pl-9 mt-1"
                    style={{
                      opacity: hovered ? 1 : 0,
                      transition: `opacity 300ms ${previewItems.length * 60}ms`,
                    }}
                  >
                    +{remainingCount} more
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}30` }}
                >
                  <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                </div>
                <span className="text-xs font-medium text-white/70 text-center line-clamp-2 px-2">
                  {rubric.name}
                </span>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div
              className="w-full py-2 rounded-lg text-center text-[11px] font-semibold text-white/90 tracking-wide uppercase"
              style={{ backgroundColor: theme.colors.primary }}
            >
              View Playlist
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default GrindPlaylistCard;
