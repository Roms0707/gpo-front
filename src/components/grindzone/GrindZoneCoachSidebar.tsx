import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  BarChart3,
  X,
  History,
  Settings,
  Lock
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AICoachChat from '../coaching/AICoachChat';
import CoachingSessionsSidebar from '../coaching/CoachingSessionsSidebar';
import PerformanceContextCard from '../coaching/PerformanceContextCard';
import TournamentWLStatsCard from '../coaching/TournamentWLStatsCard';
import ManualGameProfileSetup from '../coaching/ManualGameProfileSetup';
import { useAICoachingSession } from '../../hooks/useAICoachingSession';
import { useLoLCoachingAnalysis } from '../../hooks/useLoLCoachingAnalysis';
import { useGameCoachingConfig, getLocalizedPrompts } from '../../hooks/useGameCoachingConfig';
import i18n from '../../locales/i18n';

type SidebarTab = 'chat' | 'stats';

const API_SUPPORTED_GAMES = ['League of Legends', 'LoL', 'Valorant', 'Fortnite'];

interface GrindZoneCoachSidebarProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
  contextPlaylistName?: string | null;
  pendingPrompt?: string | null;
  onPromptConsumed?: () => void;
  onClose?: () => void;
  className?: string;
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

const GrindZoneCoachSidebar: React.FC<GrindZoneCoachSidebarProps> = ({
  gameId,
  gameName,
  theme,
  contextPlaylistName,
  pendingPrompt,
  onPromptConsumed,
  onClose,
  className = '',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<SidebarTab>('chat');
  const [showSessions, setShowSessions] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasManualProfile, setHasManualProfile] = useState(false);
  const [manualProfile, setManualProfile] = useState<ManualProfile | null>(null);
  const [connectionChecked, setConnectionChecked] = useState(false);

  const {
    sessionId,
    messages,
    videoRecommendations,
    isSending,
    error: coachingError,
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

  const { config: coachingConfig } = useGameCoachingConfig(gameId, gameName);

  const basePrompts = getLocalizedPrompts(coachingConfig?.quick_prompts, i18n.language);
  const grindPrompts = contextPlaylistName
    ? [`Help me understand ${contextPlaylistName}`, ...basePrompts]
    : basePrompts;

  React.useEffect(() => {
    const checkConnection = async () => {
      if (!user) {
        setConnectionChecked(true);
        return;
      }
      try {
        const [accountsResult, profileResult] = await Promise.all([
          supabase
            .from('game_publisher_id_for_users')
            .select('id, is_validated')
            .eq('user_id', user.id)
            .eq('game_id', gameId),
          supabase
            .from('user_game_manual_profiles')
            .select('*')
            .eq('user_id', user.id)
            .eq('game_id', gameId)
            .maybeSingle()
        ]);

        if (!accountsResult.error) {
          setIsConnected(!!accountsResult.data?.find(a => a.is_validated));
        }
        if (profileResult.data) {
          setManualProfile(profileResult.data);
          setHasManualProfile(true);
        }
      } catch {
        // silent
      } finally {
        setConnectionChecked(true);
      }
    };
    checkConnection();
  }, [user, gameId]);

  const handleVideoClick = (contentId: string) => {
    navigate(`/video/${contentId}`);
  };

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

  const tabs: { key: SidebarTab; icon: React.ElementType; label: string }[] = [
    { key: 'chat', icon: Brain, label: t('coaching.aiCoach') },
    { key: 'stats', icon: BarChart3, label: 'Stats' },
  ];

  if (!user || (!connectionChecked)) {
    return (
      <div className={`flex flex-col bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${theme.colors.primary}15` }}
          >
            <Lock className="w-6 h-6" style={{ color: theme.colors.primary }} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t('coaching.aiCoach')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {user ? t('coaching.setupRequired') : t('coaching.unlockAICoaching')}
          </p>
          <button
            onClick={() => user ? setShowProfileSetup(true) : navigate('/login')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.text }}
          >
            {user ? t('coaching.setupProfile') : t('gameHub.coaching.loginToConnect')}
          </button>
        </div>
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <div className={`flex flex-col bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden ${className}`}>
        <ManualGameProfileSetup
          gameId={gameId}
          gameName={gameName}
          theme={theme}
          existingProfile={manualProfile}
          onProfileSaved={handleProfileSaved}
          onCancel={() => setShowProfileSetup(false)}
        />
      </div>
    );
  }

  if (!canUseCoaching) {
    return (
      <div className={`flex flex-col bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${theme.colors.primary}15` }}
          >
            <Brain className="w-6 h-6" style={{ color: theme.colors.primary }} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t('coaching.getStarted')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('coaching.getStartedDesc', { gameName })}
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => setShowProfileSetup(true)}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.text }}
            >
              <Settings className="w-4 h-4" />
              {t('coaching.setupProfile')}
            </button>
            {API_SUPPORTED_GAMES.some(g => gameName.toLowerCase().includes(g.toLowerCase())) && (
              <button
                onClick={() => navigate('/profile/edit')}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
              >
                {t('gameHub.coaching.connectAccount')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors relative ${
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={isActive ? { color: theme.colors.primary } : undefined} />
              <span className="hidden xl:inline">{tab.label}</span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              )}
            </button>
          );
        })}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors xl:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {showSessions ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('coaching.sessionHistory')}</span>
                  <button
                    onClick={() => setShowSessions(false)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: theme.colors.primary }}
                  >
                    {t('common.back')}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CoachingSessionsSidebar
                    sessions={sessions}
                    currentSessionId={sessionId}
                    theme={theme}
                    onSessionClick={(id) => {
                      loadSession(id);
                      setShowSessions(false);
                    }}
                    onNewSession={() => {
                      startNewSession();
                      setShowSessions(false);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-end px-2 py-1 border-b border-gray-100 dark:border-gray-800/50 flex-shrink-0">
                  <button
                    onClick={() => setShowSessions(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <History className="w-3 h-3" />
                    {t('coaching.sessionHistory')}
                  </button>
                </div>
                <div className="flex-1 min-h-0">
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
                    quickPrompts={grindPrompts}
                    initialPrompt={pendingPrompt}
                    onPromptConsumed={onPromptConsumed}
                    error={coachingError}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="h-full overflow-y-auto p-3 space-y-3">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default GrindZoneCoachSidebar;
