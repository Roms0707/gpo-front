import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Film, BookOpen, Loader, AlertTriangle, RotateCcw, CheckCircle2, Lock } from 'lucide-react';
import { GalaxyRubric, GalaxyContentItem } from '../../types/galaxy';
import { GameTheme } from '../../utils/gameThemes';
import { fetchRubricContents, formatGalaxyDuration, resolveVideoUrl } from '../../services/galaxyContentService';
import MasterclassVideoPlayer from '../masterclasses/MasterclassVideoPlayer';
import GrindProgressRing from './GrindProgressRing';
import ContentBadge from '../ui/ContentBadge';
import { getBadgesForContent, getPrimaryBadge } from '../../services/badgeService';
import { useAuth } from '../../contexts/AuthContext';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { fetchQuizForRubric } from '../../services/grindZoneQuizService';
import { fetchUserSubmission } from '../../services/grindZoneQuizSubmissionService';
import type { GrindZoneQuiz, GrindZoneQuizSubmission } from '../../types/grindZoneQuiz';
import QuizPlayerModal from '../grindZoneQuiz/QuizPlayerModal';

interface GrindPlaylistDetailProps {
  rubric: GalaxyRubric;
  configId: string;
  theme: GameTheme;
  onClose: () => void;
  gameImageUrl?: string;
  gameName?: string;
}

const GrindPlaylistDetail: React.FC<GrindPlaylistDetailProps> = ({
  rubric,
  configId,
  theme,
  onClose,
  gameImageUrl,
  gameName,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { projectConfigUuid } = useAppConfig();
  const { guardAction, isKliento } = useSubscriptionGuard();

  const [videos, setVideos] = useState<GalaxyContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [watchedVideoIds, setWatchedVideoIds] = useState<Set<string>>(new Set());

  const [quizData, setQuizData] = useState<GrindZoneQuiz | null>(null);
  const [quizSubmission, setQuizSubmission] = useState<GrindZoneQuizSubmission | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  const loadVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchRubricContents(configId, rubric.rubric_id);
      setVideos(data);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [configId, rubric.rubric_id]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const activeVideo = videos.find(v => v.content_id === activeVideoId) || null;

  const handleSelectVideo = useCallback(async (contentId: string) => {
    if (contentId === activeVideoId && activeVideoUrl) return;

    setActiveVideoId(contentId);
    setActiveVideoUrl(null);
    setIsResolvingUrl(true);
    setResolveError(null);

    try {
      const resolved = await resolveVideoUrl(configId, rubric.rubric_id, contentId);
      if (resolved.delivery_url) {
        setActiveVideoUrl(resolved.delivery_url);
      } else {
        setResolveError(t('grindZone.videoUnavailable', 'Video unavailable'));
      }
    } catch {
      setResolveError(t('grindZone.videoLoadFailed', 'Failed to load video'));
    } finally {
      setIsResolvingUrl(false);
    }
  }, [configId, rubric.rubric_id, activeVideoId, activeVideoUrl, t]);

  const handleVideoEnded = useCallback(() => {
    if (!activeVideoId || videos.length === 0) return;
    setWatchedVideoIds(prev => {
      const next = new Set(prev);
      next.add(activeVideoId);
      return next;
    });
    const currentIndex = videos.findIndex(v => v.content_id === activeVideoId);
    if (currentIndex < videos.length - 1) {
      const nextVideo = videos[currentIndex + 1];
      handleSelectVideo(nextVideo.content_id);
    }
  }, [activeVideoId, videos, handleSelectVideo]);

  useEffect(() => {
    if (!activeVideoId || !sidebarRef.current) return;
    const activeEl = sidebarRef.current.querySelector(`[data-video-id="${activeVideoId}"]`);
    activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeVideoId]);

  useEffect(() => {
    if (!isLoading && videos.length > 0 && !activeVideoId) {
      handleSelectVideo(videos[0].content_id);
    }
  }, [isLoading, videos, activeVideoId, handleSelectVideo]);

  const loadQuizData = useCallback(async () => {
    if (!projectConfigUuid) return;
    setIsLoadingQuiz(true);
    try {
      const quiz = await fetchQuizForRubric(projectConfigUuid, rubric.rubric_id, rubric.game_id);
      setQuizData(quiz);
      if (quiz && user?.id) {
        const sub = await fetchUserSubmission(user.id, quiz.id);
        setQuizSubmission(sub);
      } else {
        setQuizSubmission(null);
      }
    } catch {
      setQuizData(null);
      setQuizSubmission(null);
    } finally {
      setIsLoadingQuiz(false);
    }
  }, [projectConfigUuid, rubric.rubric_id, user?.id]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  const allVideosWatched = videos.length > 0 && watchedVideoIds.size >= videos.length;
  const videoWatchProgress = videos.length > 0
    ? Math.round((watchedVideoIds.size / videos.length) * 100)
    : 0;

  const quizProgress = (() => {
    if (!quizSubmission) return 0;
    if (quizSubmission.is_completed) return 100;
    if (!quizSubmission.answers?.length || !quizSubmission.total_questions) return 0;
    return Math.round((quizSubmission.answers.length / quizSubmission.total_questions) * 100);
  })();

  const handleOpenQuiz = useCallback(async () => {
    if (!user || !allVideosWatched) return;
    if (isKliento) {
      const result = await guardAction(() => true);
      if (!result) return;
    }
    setQuizModalOpen(true);
  }, [user, allVideosWatched, isKliento, guardAction]);

  const handleQuizCompleted = useCallback((_score: number, _total: number) => {
    loadQuizData();
  }, [loadQuizData]);

  const handleQuizModalClose = useCallback(() => {
    setQuizModalOpen(false);
    loadQuizData();
  }, [loadQuizData]);

  return (
    <div className="bg-gray-950 rounded-xl overflow-hidden border border-gray-800/50 shadow-2xl">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 bg-gray-900/50">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('common.back', 'Back')}</span>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">{rubric.name}</h2>
        </div>
        {rubric.content_count != null && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
            <Film className="w-3 h-3" />
            {rubric.content_count} videos
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <div className="relative">
            {activeVideoUrl ? (
              <MasterclassVideoPlayer
                videoUrl={activeVideoUrl}
                thumbnailUrl={activeVideo?.thumbnail_url || undefined}
                onEnded={handleVideoEnded}
              />
            ) : isResolvingUrl ? (
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <Loader className="w-8 h-8 text-gray-500 animate-spin" />
              </div>
            ) : resolveError ? (
              <div className="aspect-video bg-gray-900 flex flex-col items-center justify-center gap-3">
                <AlertTriangle className="w-10 h-10 text-amber-400/80" />
                <p className="text-gray-400 text-sm">{resolveError}</p>
                <button
                  onClick={() => activeVideoId && handleSelectVideo(activeVideoId)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('common.retry', 'Retry')}
                </button>
              </div>
            ) : (
              <div className="relative aspect-video bg-gray-900 overflow-hidden">
                {rubric.thumbnail_url && (
                  <img
                    src={rubric.thumbnail_url}
                    alt={rubric.name}
                    className="w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/50 to-gray-950/30" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm"
                    style={{ backgroundColor: `${theme.colors.primary}20`, boxShadow: `0 0 40px ${theme.colors.primary}15` }}
                  >
                    <Play className="w-7 h-7 ml-0.5" style={{ color: theme.colors.primary }} />
                  </div>
                  <p className="text-sm text-gray-500">{t('grindZone.selectVideo', 'Select a video to start')}</p>
                </div>
              </div>
            )}
          </div>

          {activeVideo && (
            <div className="px-4 py-3 border-t border-gray-800/30">
              <h3 className="text-base font-semibold text-white">{activeVideo.title}</h3>
              {activeVideo.description && (
                <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">{activeVideo.description}</p>
              )}
              {activeVideo.theme_label && (
                <span
                  className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
                >
                  {activeVideo.theme_label}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800/50 flex flex-col max-h-[calc(56.25vw+100px)] lg:max-h-none">
          <div className="px-4 py-3 border-b border-gray-800/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {gameImageUrl && (
                  <img
                    src={gameImageUrl}
                    alt={gameName || ''}
                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                  />
                )}
                {gameName || 'Playlist'}
              </span>
              <span className="text-xs text-gray-600">{videos.length} videos</span>
            </div>
          </div>

          <div
            ref={sidebarRef}
            className="flex-1 overflow-y-auto scrollbar-hide lg:max-h-[calc(56.25vw*0.65-96px)]"
            style={{ minHeight: '180px' }}
          >
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-800/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {videos.map((video, idx) => {
                  const isActive = video.content_id === activeVideoId;
                  const isWatched = watchedVideoIds.has(video.content_id);
                  return (
                    <button
                      key={video.content_id}
                      data-video-id={video.content_id}
                      onClick={() => handleSelectVideo(video.content_id)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 text-left group ${
                        isActive
                          ? 'border-l-2'
                          : 'hover:bg-white/[0.04] border-l-2 border-transparent'
                      }`}
                      style={isActive ? {
                        backgroundColor: `${theme.colors.primary}10`,
                        borderLeftColor: theme.colors.primary,
                      } : undefined}
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={isActive
                          ? { backgroundColor: theme.colors.primary, color: '#fff' }
                          : isWatched
                            ? { backgroundColor: 'rgba(16,185,129,0.2)', color: '#10B981' }
                            : { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }
                        }
                      >
                        {isActive ? (
                          <Play className="w-2.5 h-2.5 ml-px" fill="currentColor" />
                        ) : isWatched ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          video.position ?? idx + 1
                        )}
                      </span>

                      {video.thumbnail_url && (
                        <div className="relative flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-gray-800">
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          {!isActive && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-xs font-medium line-clamp-1 ${
                            isActive ? 'text-white' : 'text-gray-300 group-hover:text-gray-200'
                          }`}>
                            {video.title}
                          </h4>
                          {(() => {
                            const badge = getPrimaryBadge(getBadgesForContent(video.content_id));
                            return badge ? <ContentBadge type={badge} size="sm" className="flex-shrink-0" /> : null;
                          })()}
                        </div>
                        {video.duration != null && (
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            {formatGalaxyDuration(video.duration)}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 p-3 border-t border-gray-800/30">
            {isLoadingQuiz ? (
              <div className="rounded-xl p-3.5 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.secondary}05)` }}
              >
                <Loader className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            ) : !quizData ? (
              <div
                className="rounded-xl p-3.5 flex items-center gap-3 cursor-default"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}12, ${theme.colors.secondary}08)`,
                  border: `1px solid ${theme.colors.primary}25`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}18` }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {t('grindZone.quiz.testKnowledge', 'Testez vos connaissances')}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t('grindZone.quiz.comingSoon', 'Quiz bientot disponible')}
                  </p>
                </div>
                <GrindProgressRing
                  progress={0}
                  size={36}
                  strokeWidth={3}
                  color={theme.colors.primary}
                  bgColor={`${theme.colors.primary}15`}
                  showLabel={false}
                />
              </div>
            ) : !user ? (
              <div
                className="rounded-xl p-3.5 flex items-center gap-3 cursor-default opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.secondary}05)`,
                  border: `1px solid ${theme.colors.primary}15`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}12` }}
                >
                  <Lock className="w-5 h-5" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {quizData.title}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t('grindZone.quiz.loginRequired', 'Connectez-vous pour repondre au quiz')}
                  </p>
                </div>
              </div>
            ) : !allVideosWatched ? (
              <div
                className="rounded-xl p-3.5 flex items-center gap-3 cursor-not-allowed opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.secondary}05)`,
                  border: `1px solid ${theme.colors.primary}15`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}12` }}
                >
                  <Lock className="w-5 h-5" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {quizData.title}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t('grindZone.quiz.locked')}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {t('grindZone.quiz.videosWatched', {
                      watched: watchedVideoIds.size,
                      total: videos.length,
                    })}
                  </p>
                </div>
                <GrindProgressRing
                  progress={videoWatchProgress}
                  size={36}
                  strokeWidth={3}
                  color={theme.colors.primary}
                  bgColor={`${theme.colors.primary}15`}
                  showLabel={false}
                />
              </div>
            ) : quizSubmission?.is_completed ? (
              <button
                onClick={handleOpenQuiz}
                className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, #10B98118, #05966912)`,
                  border: `1px solid #10B98130`,
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white">
                    {quizData.title}
                  </p>
                  <p className="text-[11px] text-emerald-400">
                    {t('grindZone.quiz.score', { score: quizSubmission.score, total: quizSubmission.total_questions })}
                  </p>
                </div>
                <GrindProgressRing
                  progress={100}
                  size={36}
                  strokeWidth={3}
                  color="#10B981"
                  bgColor="#10B98120"
                  showLabel={false}
                />
              </button>
            ) : quizSubmission && !quizSubmission.is_completed && (quizSubmission.answers?.length ?? 0) > 0 ? (
              <button
                onClick={handleOpenQuiz}
                className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.secondary}10)`,
                  border: `1px solid ${theme.colors.primary}30`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white">
                    {quizData.title}
                  </p>
                  <p className="text-[11px]" style={{ color: theme.colors.primary }}>
                    {t('grindZone.quiz.resumeQuiz', 'Reprendre le Quiz')}
                  </p>
                </div>
                <GrindProgressRing
                  progress={quizProgress}
                  size={36}
                  strokeWidth={3}
                  color={theme.colors.primary}
                  bgColor={`${theme.colors.primary}15`}
                  showLabel={false}
                />
              </button>
            ) : (
              <button
                onClick={handleOpenQuiz}
                className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}12, ${theme.colors.secondary}08)`,
                  border: `1px solid ${theme.colors.primary}25`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}18` }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white">
                    {quizData.title}
                  </p>
                  <p className="text-[11px]" style={{ color: theme.colors.primary }}>
                    {t('grindZone.quiz.takeQuiz')}
                  </p>
                </div>
                <GrindProgressRing
                  progress={0}
                  size={36}
                  strokeWidth={3}
                  color={theme.colors.primary}
                  bgColor={`${theme.colors.primary}15`}
                  showLabel={false}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {quizData && user && (
        <QuizPlayerModal
          isOpen={quizModalOpen}
          onClose={handleQuizModalClose}
          quizId={quizData.id}
          userId={user.id}
          theme={theme}
          onCompleted={handleQuizCompleted}
        />
      )}
    </div>
  );
};

export default GrindPlaylistDetail;
