import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Link2,
  TrendingUp,
  Target,
  Zap,
  Shield,
  ChevronRight,
  Lock,
  Sparkles,
  BarChart3,
  Crosshair,
  Sword,
  Trophy
} from 'lucide-react';
import { getGameTheme } from '../../utils/gameThemes';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface GameHubCoachingSectionProps {
  gameId: string;
  gameName: string;
}

interface ConnectedAccount {
  id: string;
  value: string;
  is_validated: boolean;
  game_id: string;
}

const SUPPORTED_COACHING_GAMES = [
  'League of Legends',
  'LoL',
  'Valorant',
  'Fortnite'
];

const GameHubCoachingSection: React.FC<GameHubCoachingSectionProps> = ({
  gameId,
  gameName
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionName, setConnectionName] = useState<string | null>(null);

  const theme = getGameTheme(gameName);

  const isCoachingSupported = SUPPORTED_COACHING_GAMES.some(
    g => gameName.toLowerCase().includes(g.toLowerCase())
  );

  useEffect(() => {
    const checkConnection = async () => {
      if (!user) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const { data: accounts, error } = await supabase
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
          .eq('game_id', gameId);

        if (error) throw error;

        const validAccount = accounts?.find(a => a.is_validated);
        if (validAccount) {
          setIsConnected(true);
          setConnectionName(validAccount.value);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error checking gaming account connection:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [user, gameId]);

  const coachingTips = [
    {
      icon: Target,
      title: t('gameHub.coaching.tip1Title'),
      description: t('gameHub.coaching.tip1Desc'),
    },
    {
      icon: TrendingUp,
      title: t('gameHub.coaching.tip2Title'),
      description: t('gameHub.coaching.tip2Desc'),
    },
    {
      icon: Shield,
      title: t('gameHub.coaching.tip3Title'),
      description: t('gameHub.coaching.tip3Desc'),
    },
  ];

  const previewInsights = [
    { label: t('gameHub.coaching.winRate'), value: '67%', trend: '+5%' },
    { label: t('gameHub.coaching.avgKDA'), value: '3.2', trend: '+0.4' },
    { label: t('gameHub.coaching.gamesPlayed'), value: '142', trend: null },
  ];

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 w-48 bg-dark-300 rounded animate-pulse"></div>
        <div className="bg-dark-200/50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-dark-300 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!isCoachingSupported) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Brain className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('gameHub.aiCoaching')}</h2>
        </div>

        <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-8 text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Sparkles className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{t('gameHub.coaching.comingSoon')}</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {t('gameHub.coaching.comingSoonDesc', { gameName })}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <div
              className="px-4 py-2 rounded-full text-sm flex items-center gap-2"
              style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
            >
              <Target className="w-4 h-4" />
              {t('gameHub.aimTrainer')}
            </div>
            <div
              className="px-4 py-2 rounded-full text-sm flex items-center gap-2"
              style={{ backgroundColor: `${theme.colors.secondary}20`, color: theme.colors.secondary }}
            >
              <Zap className="w-4 h-4" />
              {t('gameHub.reactionTime')}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Brain className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('gameHub.aiCoaching')}</h2>
        </div>

        {isConnected && (
          <button
            onClick={() => navigate('/profile/gaming-stats')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('gameHub.viewFullStats')}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {!user ? (
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
                  {t('gameHub.coaching.unlockTitle')}
                </h3>
                <p className="text-gray-400 mb-6 max-w-lg">
                  {t('gameHub.coaching.unlockDesc', { gameName })}
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
      ) : !isConnected ? (
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
                  <span className="text-sm text-gray-400">{t('gameHub.coaching.connectionRequired')}</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  {t('gameHub.coaching.connectToUnlock')}
                </h3>
                <p className="text-gray-400 mb-6 max-w-lg">
                  {t('gameHub.coaching.connectDesc', { gameName })}
                </p>

                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <BarChart3 className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    {t('gameHub.coaching.feature1')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <TrendingUp className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    {t('gameHub.coaching.feature2')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Trophy className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    {t('gameHub.coaching.feature3')}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/profile/edit')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.text,
                  }}
                >
                  <Link2 className="w-5 h-5" />
                  {t('gameHub.coaching.connectAccount')}
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
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-success-500/10 border border-success-500/30 rounded-xl">
            <div className="p-2 rounded-full bg-success-500/20">
              <Link2 className="w-5 h-5 text-success-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-success-400">
                {t('gameHub.coaching.connectedAs')}
              </p>
              <p className="text-white font-bold">{connectionName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coachingTips.map((tip, index) => {
              const TipIcon = tip.icon;
              return (
                <div
                  key={index}
                  className="group bg-dark-200/50 border border-gray-800 rounded-xl p-5 transition-all duration-300 hover:border-gray-700 hover:shadow-lg"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${theme.colors.primary}20` }}
                  >
                    <TipIcon className="w-5 h-5" style={{ color: theme.colors.primary }} />
                  </div>
                  <h4 className="font-bold text-white mb-2">{tip.title}</h4>
                  <p className="text-sm text-gray-400">{tip.description}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/profile/gaming-stats')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]"
            style={{
              backgroundColor: `${theme.colors.primary}20`,
              color: theme.colors.primary,
              border: `1px solid ${theme.colors.primary}40`,
            }}
          >
            <BarChart3 className="w-5 h-5" />
            {t('gameHub.coaching.viewDetailedStats')}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
};

export default GameHubCoachingSection;
