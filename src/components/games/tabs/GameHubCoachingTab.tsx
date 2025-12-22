import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Link2,
  Lock,
  Sparkles,
  BarChart3,
  ChevronRight,
  Target,
  Zap,
  History,
  X,
  RefreshCw,
  Settings,
  Edit3,
  User
} from 'lucide-react';
import { GameTheme } from '../../../utils/gameThemes';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import AICoachChat from '../../coaching/AICoachChat';
import CoachingSessionsSidebar from '../../coaching/CoachingSessionsSidebar';
import PerformanceContextCard from '../../coaching/PerformanceContextCard';
import ManualGameProfileSetup from '../../coaching/ManualGameProfileSetup';
import TournamentWLStatsCard from '../../coaching/TournamentWLStatsCard';
import CoachingQuestPanel from '../../coaching/CoachingQuestPanel';
import { useAICoachingSession } from '../../../hooks/useAICoachingSession';
import { useLoLCoachingAnalysis } from '../../../hooks/useLoLCoachingAnalysis';

interface GameHubCoachingTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

interface ManualProfile {
  id: string;
  self_reported_rank: string | null;
  external_stats_url: string | null;
  external_stats_platform: string | null;
  main_characters: string[];
  playstyle_notes: string | null;
  hours_played_estimate: number | null;
}

const API_SUPPORTED_GAMES = [
  'League of Legends',
  'LoL',
  'Valorant',
  'Fortnite'
];

const GameHubCoachingTab: React.FC<GameHubCoachingTabProps> = ({
  gameId,
  gameName,
  theme,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionName, setConnectionName] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualProfile, setManualProfile] = useState<ManualProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [hasManualProfile, setHasManualProfile] = useState(false);

  const hasApiSupport = API_SUPPORTED_GAMES.some(
    g => gameName.toLowerCase().includes(g.toLowerCase())
  );

  const {
    sessionId,
    messages,
    videoRecommendations,
    isSending,
    sessions,
    sendMessage,
    loadSession,
    startNewSession
  } = useAICoachingSession(gameId, gameName);

  const {
    context: performanceContext,
    isLoading: isContextLoading,
    refresh: refreshContext
  } = useLoLCoachingAnalysis(gameId);

  useEffect(() => {
    const checkConnectionAndProfile = async () => {
      if (!user) {
        setIsConnected(false);
        setHasManualProfile(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const [accountsResult, profileResult] = await Promise.all([
          supabase
            .from('game_publisher_id_for_users')
            .select(`
              id,
              value,
              is_validated,
              game_id,
              game_publisher_ids (
                games (
                  id,
                  name
                )
              )
            `)
            .eq('user_id', user.id)
            .eq('game_id', gameId),
          supabase
            .from('user_game_manual_profiles')
            .select('*')
            .eq('user_id', user.id)
            .eq('game_id', gameId)
            .maybeSingle()
        ]);

        if (accountsResult.error) throw accountsResult.error;

        const validAccount = accountsResult.data?.find(a => a.is_validated);
        if (validAccount) {
          setIsConnected(true);
          setConnectionName(validAccount.value);
        } else {
          setIsConnected(false);
        }

        if (profileResult.data) {
          setManualProfile(profileResult.data);
          setHasManualProfile(true);
        } else {
          setManualProfile(null);
          setHasManualProfile(false);
        }
      } catch (error) {
        console.error('Error checking gaming account connection:', error);
        setIsConnected(false);
        setHasManualProfile(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnectionAndProfile();
  }, [user, gameId]);

  const previewInsights = [
    { label: t('gameHub.coaching.winRate'), value: '67%', trend: '+5%' },
    { label: t('gameHub.coaching.avgKDA'), value: '3.2', trend: '+0.4' },
    { label: t('gameHub.coaching.gamesPlayed'), value: '142', trend: null },
  ];

  const handleVideoClick = (contentId: string) => {
    navigate(`/video/${contentId}`);
  };

  const handleRefreshAccount = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshContext();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-200/50 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-dark-300 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleProfileSaved = async () => {
    setShowProfileSetup(false);
    const { data } = await supabase
      .from('user_game_manual_profiles')
      .select('*')
      .eq('user_id', user?.id)
      .eq('game_id', gameId)
      .maybeSingle();
    if (data) {
      setManualProfile(data);
      setHasManualProfile(true);
    }
  };

  const canUseCoaching = isConnected || hasManualProfile;

  if (!user) {
    return (
      <div className="relative bg-dark-200/50 border border-gray-800 rounded-xl overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(circle at center, ${theme.colors.primary}, transparent 70%)`,
          }}
        />

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <Lock className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">{t('gameHub.coaching.loginRequired')}</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {t('coaching.unlockAICoaching')}
              </h3>
              <p className="text-gray-400 mb-6 max-w-lg">
                {t('coaching.unlockDesc', { gameName })}
              </p>

              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.text,
                }}
              >
                <Link2 className="w-5 h-5" />
                {t('gameHub.coaching.loginToConnect')}
              </button>
            </div>

            <div className="flex-shrink-0 w-full lg:w-80">
              <div className="bg-dark-300/50 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  {t('gameHub.coaching.previewInsights')}
                </p>
                <div className="space-y-3 opacity-60 blur-[2px]">
                  {previewInsights.map((insight, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{insight.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{insight.value}</span>
                        {insight.trend && (
                          <span className="text-xs text-success-400">{insight.trend}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canUseCoaching) {
    if (showProfileSetup) {
      return (
        <ManualGameProfileSetup
          gameId={gameId}
          gameName={gameName}
          theme={theme}
          existingProfile={manualProfile}
          onProfileSaved={handleProfileSaved}
          onCancel={() => setShowProfileSetup(false)}
        />
      );
    }

    return (
      <div className="relative bg-dark-200/50 border border-gray-800 rounded-xl overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(circle at center, ${theme.colors.primary}, transparent 70%)`,
          }}
        />

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <Brain className="w-5 h-5" style={{ color: theme.colors.primary }} />
                <span className="text-sm text-gray-400">{t('coaching.setupRequired')}</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {t('coaching.getStarted')}
              </h3>
              <p className="text-gray-400 mb-6 max-w-lg">
                {t('coaching.getStartedDesc', { gameName })}
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Brain className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  {t('coaching.feature.aiAnalysis')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <BarChart3 className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  {t('coaching.feature.personalizedTips')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  {t('coaching.feature.practiceQuests')}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.text,
                  }}
                >
                  <Settings className="w-5 h-5" />
                  {t('coaching.setupProfile')}
                </button>
                {hasApiSupport && (
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border border-gray-700 text-white hover:bg-dark-300 transition-all duration-300"
                  >
                    <Link2 className="w-5 h-5" />
                    {t('gameHub.coaching.connectAccount')}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 w-full lg:w-80">
              <div className="bg-dark-300/50 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  {t('gameHub.coaching.previewInsights')}
                </p>
                <div className="space-y-3 opacity-60 blur-[2px]">
                  {previewInsights.map((insight, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{insight.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{insight.value}</span>
                        {insight.trend && (
                          <span className="text-xs text-success-400">{insight.trend}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isConnected && connectionName ? (
            <div className="flex items-center gap-3 p-3 bg-success-500/10 border border-success-500/30 rounded-xl">
              <div className="p-2 rounded-full bg-success-500/20">
                <Link2 className="w-4 h-4 text-success-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-success-400">
                  {t('gameHub.coaching.connectedAs')}
                </p>
                <p className="text-white font-bold text-sm">{connectionName}</p>
              </div>
            </div>
          ) : hasManualProfile && manualProfile ? (
            <div className="flex items-center gap-3 p-3 bg-dark-300/50 border border-gray-700 rounded-xl">
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: `${theme.colors.primary}20` }}
              >
                <User className="w-4 h-4" style={{ color: theme.colors.primary }} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {t('coaching.manualProfile')}
                </p>
                <p className="text-white font-bold text-sm">
                  {manualProfile.self_reported_rank || t('coaching.profileSet')}
                </p>
              </div>
              <button
                onClick={() => setShowProfileSetup(true)}
                className="p-1.5 rounded-lg hover:bg-dark-300 transition-colors"
                title={t('coaching.editProfile')}
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={handleRefreshAccount}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-dark-300 disabled:opacity-50"
              style={{ color: theme.colors.primary }}
              title={t('gameHub.coaching.refreshAccount')}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('gameHub.coaching.refreshAccount')}</span>
            </button>
          )}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-dark-300"
            style={{ color: theme.colors.primary }}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">{t('coaching.sessionHistory')}</span>
          </button>
          {isConnected && (
            <button
              onClick={() => navigate('/profile/gaming-stats')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                color: theme.colors.primary,
              }}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('gameHub.coaching.viewDetailedStats')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showProfileSetup && (
        <ManualGameProfileSetup
          gameId={gameId}
          gameName={gameName}
          theme={theme}
          existingProfile={manualProfile}
          onProfileSaved={handleProfileSaved}
          onCancel={() => setShowProfileSetup(false)}
        />
      )}

      {!showProfileSetup && (
        <div className="flex gap-4 h-[600px]">
          {showSidebar && (
            <div className="w-72 flex-shrink-0 relative">
              <button
                onClick={() => setShowSidebar(false)}
                className="absolute -right-2 -top-2 z-10 p-1 bg-dark-300 rounded-full border border-gray-700 lg:hidden"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <CoachingSessionsSidebar
                sessions={sessions}
                currentSessionId={sessionId}
                theme={theme}
                onSessionClick={(id) => {
                  loadSession(id);
                  if (window.innerWidth < 1024) setShowSidebar(false);
                }}
                onNewSession={() => {
                  startNewSession();
                  if (window.innerWidth < 1024) setShowSidebar(false);
                }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <AICoachChat
              gameId={gameId}
              gameName={gameName}
              theme={theme}
              sessionId={sessionId}
              messages={messages}
              isLoading={isSending}
              videoRecommendations={videoRecommendations}
              onSendMessage={sendMessage}
              onVideoClick={handleVideoClick}
            />
          </div>

          <div className="w-72 flex-shrink-0 hidden xl:block space-y-4 overflow-y-auto">
            {isConnected && performanceContext?.stats && (
              <PerformanceContextCard
                stats={performanceContext.stats}
                riotId={performanceContext.riotId}
                theme={theme}
                onRefresh={refreshContext}
                isRefreshing={isContextLoading}
              />
            )}

            <TournamentWLStatsCard
              gameId={gameId}
              gameName={gameName}
              theme={theme}
            />

            <CoachingQuestPanel
              gameId={gameId}
              gameName={gameName}
              theme={theme}
            />

            {hasManualProfile && manualProfile?.external_stats_url && (
              <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-white text-sm mb-2">{t('coaching.externalStats')}</h3>
                <a
                  href={manualProfile.external_stats_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                  style={{ color: theme.colors.primary }}
                >
                  <Link2 className="w-4 h-4" />
                  {t('coaching.viewOnPlatform', { platform: manualProfile.external_stats_platform || 'Stats Site' })}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHubCoachingTab;
