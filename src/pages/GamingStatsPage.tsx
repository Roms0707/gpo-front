import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Gamepad2,
  Trophy,
  Loader,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGameTheme } from '../utils/gameThemes';
import { usePlayerPrimaryGame, calculatePlayerLevel, calculateXpFromActivity } from '../hooks/usePlayerPrimaryGame';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

import GamingStatsHeroBanner from '../components/gaming/GamingStatsHeroBanner';
import StatsHighlightsRow from '../components/gaming/StatsHighlightsRow';
import GameStatsCarousel, { GameActivity } from '../components/gaming/GameStatsCarousel';
import TrainingGamesRow from '../components/gaming/TrainingGamesRow';
import GameDetailPanel from '../components/gaming/GameDetailPanel';
import AimTrainerGame from '../components/games/AimTrainerGame';
import ReactionTimeGame from '../components/games/ReactionTimeGame';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';
import ShareOptionsModal from '../components/ui/ShareOptionsModal';
import ChatListModal from '../components/chat/ChatListModal';
import ChatModal from '../components/chat/ChatModal';
import ChannelModal from '../components/chat/ChannelModal';
import OnboardingWalkthrough from '../components/onboarding/OnboardingWalkthrough';

type ActiveView = 'dashboard' | 'game-detail' | 'aim-trainer' | 'reaction-time';

interface ShareFriend {
  id: string;
  name: string;
  avatar?: string | null;
}

interface ShareChannel {
  id: string;
  name: string;
  description?: string;
}

const GamingStatsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams<{ userId: string }>();

  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnyGamingStats, setHasAnyGamingStats] = useState(false);

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGameName, setSelectedGameName] = useState<string | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlayerProfileModal, setShowPlayerProfileModal] = useState(false);
  const [showShareChatListModal, setShowShareChatListModal] = useState(false);
  const [shareMessageContent, setShareMessageContent] = useState('');
  const [displayingOwnStats, setDisplayingOwnStats] = useState(true);
  const [showShareChatModal, setShowShareChatModal] = useState(false);
  const [selectedShareFriend, setSelectedShareFriend] = useState<ShareFriend | null>(null);
  const [showShareChannelModal, setShowShareChannelModal] = useState(false);
  const [selectedShareChannel, setSelectedShareChannel] = useState<ShareChannel | null>(null);
  const [shareTargetType, setShareTargetType] = useState<'friend' | 'community'>('friend');

  const { theme, primaryGame, gameActivities: rawGameActivities } = usePlayerPrimaryGame({
    playerRankings: userProfile?.game_rankings || [],
    registrations: userProfile?.registrations || [],
    gamingAccounts: userProfile?.gaming_accounts || [],
    favoriteGameId: user?.favorite_game_id,
    favoriteGameName: userProfile?.favorite_game?.name,
  });

  const [gameImages, setGameImages] = useState<Record<string, { image_url: string | null; twitch_cover_url: string | null }>>({});

  useEffect(() => {
    const gameIds = rawGameActivities.map((a) => a.gameId).filter(Boolean);
    if (gameIds.length === 0) return;

    let cancelled = false;
    const fetchGameImages = async () => {
      const { data } = await supabase
        .from('games')
        .select('id, image_url, twitch_cover_url')
        .in('id', gameIds);

      if (cancelled || !data) return;
      const map: Record<string, { image_url: string | null; twitch_cover_url: string | null }> = {};
      data.forEach((g: any) => {
        map[g.id] = { image_url: g.image_url, twitch_cover_url: g.twitch_cover_url };
      });
      setGameImages(map);
    };
    fetchGameImages();
    return () => { cancelled = true; };
  }, [rawGameActivities]);

  const gameActivities: GameActivity[] = useMemo(() => {
    return rawGameActivities.map((activity) => {
      const ranking = (userProfile?.game_rankings || []).find(
        (r: any) => (r.games?.id === activity.gameId) || (r.game_name === activity.gameName)
      );

      const imgs = gameImages[activity.gameId];

      return {
        gameId: activity.gameId,
        gameName: activity.gameName,
        imageUrl: imgs?.image_url || undefined,
        coverUrl: imgs?.twitch_cover_url || undefined,
        score: activity.score,
        tournamentCount: activity.tournamentCount,
        hasRanking: activity.hasRanking,
        isValidated: activity.isValidated,
        eloRating: ranking?.elo_rating,
        rank: ranking?.rank,
        wins: ranking?.wins,
        losses: ranking?.losses,
      };
    });
  }, [rawGameActivities, userProfile, gameImages]);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile/gaming-stats');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadUserProfile = async () => {
      const targetUserId = paramUserId || user?.id;
      if (!targetUserId) return;

      const isOwnStats = !paramUserId || paramUserId === user?.id;
      setDisplayingOwnStats(isOwnStats);

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-user-profile-aggregated`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ user_id: targetUserId }),
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch user profile');
        }

        setUserProfile(result.data);

        const hasStats = !!(
          (result.data?.game_rankings && result.data.game_rankings.length > 0) ||
          (result.data?.gaming_accounts && result.data.gaming_accounts.length > 0) ||
          (result.data?.aim_trainer_scores && result.data.aim_trainer_scores.length > 0) ||
          (result.data?.tournament_stats && result.data.tournament_stats.total > 0)
        );
        setHasAnyGamingStats(hasStats);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError(t('gaming.errorLoadingStatistics'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.id, paramUserId, t]);

  if (!user) return null;

  const aimTrainerScores = userProfile?.aim_trainer_scores || [];
  const aimBestScore =
    aimTrainerScores.length > 0
      ? Math.max(...aimTrainerScores.map((s: any) => s.score))
      : 0;

  const xp = calculateXpFromActivity(
    userProfile?.tournament_stats?.total || 0,
    userProfile?.tournament_stats?.completed || 0,
    userProfile?.gaming_accounts?.filter((a: any) => a.is_validated).length || 0,
    Boolean(user?.bio && user?.country),
    0
  );

  const playerLevel = calculatePlayerLevel(xp);

  const winRate =
    userProfile?.tournament_stats?.total > 0
      ? Math.round((userProfile.tournament_stats.completed / userProfile.tournament_stats.total) * 100)
      : 0;

  const bestElo = useMemo(() => {
    const rankings = userProfile?.game_rankings || [];
    if (rankings.length === 0) return 0;
    return Math.max(...rankings.map((r: any) => r.elo_rating || 0));
  }, [userProfile?.game_rankings]);

  const generateStatsShareMessage = useCallback(() => {
    let message = `${t('gaming.myGameStats')}\n\n`;

    if (userProfile?.tournament_stats) {
      const stats = userProfile.tournament_stats;
      message += `${t('gaming.tournaments')}\n`;
      message += `- ${t('gaming.total')}: ${stats.total}\n`;
      message += `- ${t('gaming.ongoing')}: ${stats.ongoing}\n`;
      message += `- ${t('gaming.completed')}: ${stats.completed}\n\n`;
    }

    if (userProfile?.game_rankings && userProfile.game_rankings.length > 0) {
      message += `${t('gaming.myBestRankings')}\n`;
      userProfile.game_rankings.slice(0, 3).forEach((ranking: any) => {
        message += `- ${t('gaming.rankElo', { game: ranking.game_name, rank: ranking.rank, elo: ranking.elo_rating })}\n`;
      });
      message += `\n`;
    }

    if (aimBestScore > 0) {
      message += `${t('gaming.aimTrainer')}:\n`;
      message += `- ${t('gaming.bestScoreLabel', { score: aimBestScore.toLocaleString() })}\n`;
    }

    message += t('gaming.viewMyCompleteStats');
    return message;
  }, [userProfile, aimBestScore, t]);

  const handleShareStats = (targetType: 'friend' | 'community') => {
    const statsMessage = generateStatsShareMessage();
    setShareMessageContent(statsMessage);
    setShareTargetType(targetType);
    setShowShareChatListModal(true);
  };

  const handleContactSelectForShare = (
    contactType: 'user' | 'channel',
    contactId: string,
    contactName: string,
    contactAvatarOrDescription?: string | null
  ) => {
    setShowShareChatListModal(false);

    if (contactType === 'user') {
      setSelectedShareFriend({ id: contactId, name: contactName, avatar: contactAvatarOrDescription });
      setShowShareChatModal(true);
    } else if (contactType === 'channel') {
      setSelectedShareChannel({ id: contactId, name: contactName, description: contactAvatarOrDescription || undefined });
      setShowShareChannelModal(true);
    }
  };

  const handleViewGameDetails = (gameId: string) => {
    const game = gameActivities.find((g) => g.gameId === gameId);
    if (game) {
      setSelectedGameId(gameId);
      setSelectedGameName(game.gameName);
      setActiveView('game-detail');
    }
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: theme.colors.primary }} />
          <p className="text-gray-400">{t('gaming.loadingYourStats')}</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 pt-8 text-center">
          <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('gaming.backToProfile')}
          </Link>
          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
            <AlertTriangle className="h-16 w-16 text-error-500 mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl mb-4 text-white">{t('gaming.error')}</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl font-medium transition-all"
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.text }}
            >
              {t('gaming.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAnyGamingStats) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <GamingStatsHeroBanner
          user={user}
          theme={theme}
          primaryGameName={primaryGame}
          xp={xp}
          stats={{ tournamentsPlayed: 0, winRate: 0, bestElo: 0 }}
          onShareClick={() => setShowShareModal(true)}
          onPreviewClick={() => setShowPlayerProfileModal(true)}
        />

        <div className="max-w-6xl mx-auto px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-100 rounded-xl p-8 border border-gray-800"
          >
            <div className="text-center py-8">
              <Gamepad2 className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.primary }} />
              <h3 className="font-heading font-medium text-xl mb-2 text-white">
                {t('gaming.noStatisticsAvailable')}
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">{t('gaming.toViewYourStats')}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/profile/settings#gaming-accounts"
                  className="px-6 py-3 rounded-xl font-medium transition-all inline-flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.primary, color: theme.colors.text }}
                >
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  {t('gaming.connectMyGamingAccounts')}
                </Link>
                <Link
                  to="/#tournaments"
                  className="px-6 py-3 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-all inline-flex items-center justify-center"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {t('gaming.viewTournaments')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {displayingOwnStats && (
          <ShareOptionsModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            onShareWithFriend={() => handleShareStats('friend')}
            onShareToCommunity={() => handleShareStats('community')}
            onViewPublicProfile={() => setShowPlayerProfileModal(true)}
          />
        )}
        {displayingOwnStats && (
          <PlayerProfileModal
            isOpen={showPlayerProfileModal}
            onClose={() => setShowPlayerProfileModal(false)}
            userId={user?.id || null}
          />
        )}
        <OnboardingWalkthrough pageName="gamingStats" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <GamingStatsHeroBanner
        user={user}
        theme={theme}
        primaryGameName={primaryGame}
        xp={xp}
        stats={{
          tournamentsPlayed: userProfile?.tournament_stats?.total || 0,
          winRate,
          bestElo,
        }}
        onShareClick={() => setShowShareModal(true)}
        onPreviewClick={() => setShowPlayerProfileModal(true)}
      />

      <div className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <StatsHighlightsRow
                tournamentsPlayed={userProfile?.tournament_stats?.total || 0}
                winRate={winRate}
                playerLevel={playerLevel}
                validatedAccounts={userProfile?.gaming_accounts?.filter((a: any) => a.is_validated).length || 0}
                totalAccounts={userProfile?.gaming_accounts?.length || 0}
                bestElo={bestElo}
                theme={theme}
              />

              <GameStatsCarousel
                gameActivities={gameActivities}
                selectedGameId={selectedGameId}
                onSelectGame={setSelectedGameId}
                onViewDetails={handleViewGameDetails}
                theme={theme}
              />

              <TrainingGamesRow
                aimTrainerBestScore={aimBestScore}
                reactionTimeBestScore={0}
                theme={theme}
                onPlayAimTrainer={() => setActiveView('aim-trainer')}
                onPlayReactionTime={() => setActiveView('reaction-time')}
              />
            </motion.div>
          )}

          {activeView === 'game-detail' && selectedGameName && selectedGameId && (
            <GameDetailPanel
              key={`detail-${selectedGameId}`}
              gameName={selectedGameName}
              gameId={selectedGameId}
              userProfile={userProfile}
              user={user}
              displayingOwnStats={displayingOwnStats}
              onBack={handleBackToDashboard}
            />
          )}

          {activeView === 'aim-trainer' && (
            <motion.div
              key="aim-trainer"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <motion.button
                whileHover={{ x: -4 }}
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('gaming.backToDashboard')}
              </motion.button>
              <AimTrainerGame gameName="Aim Trainer" />
            </motion.div>
          )}

          {activeView === 'reaction-time' && (
            <motion.div
              key="reaction-time"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <motion.button
                whileHover={{ x: -4 }}
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('gaming.backToDashboard')}
              </motion.button>
              <ReactionTimeGame
                gameName="Reaction Time Test"
                gameId="e4b0a5a8-c325-4925-8e9c-83d53dcb771c"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {displayingOwnStats && (
        <ShareOptionsModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShareWithFriend={() => handleShareStats('friend')}
          onShareToCommunity={() => handleShareStats('community')}
          onViewPublicProfile={() => setShowPlayerProfileModal(true)}
        />
      )}

      {displayingOwnStats && (
        <PlayerProfileModal
          isOpen={showPlayerProfileModal}
          onClose={() => setShowPlayerProfileModal(false)}
          userId={user?.id || null}
        />
      )}

      <ChatListModal
        isOpen={showShareChatListModal}
        onClose={() => setShowShareChatListModal(false)}
        initialMessageContent={shareMessageContent}
        onContactSelectForShare={handleContactSelectForShare}
        shareTargetType={shareTargetType}
      />

      {showShareChatModal && selectedShareFriend && (
        <ChatModal
          isOpen={showShareChatModal}
          onClose={() => {
            setShowShareChatModal(false);
            setSelectedShareFriend(null);
            setShareMessageContent('');
          }}
          recipientId={selectedShareFriend.id}
          recipientName={selectedShareFriend.name}
          recipientAvatar={selectedShareFriend.avatar}
          initialMessageContent={shareMessageContent}
        />
      )}

      {showShareChannelModal && selectedShareChannel && (
        <ChannelModal
          isOpen={showShareChannelModal}
          onClose={() => {
            setShowShareChannelModal(false);
            setSelectedShareChannel(null);
            setShareMessageContent('');
          }}
          channelId={selectedShareChannel.id}
          channelName={selectedShareChannel.name}
          channelDescription={selectedShareChannel.description}
          initialMessageContent={shareMessageContent}
        />
      )}

      <OnboardingWalkthrough pageName="gamingStats" />
    </div>
  );
};

export default GamingStatsPage;
