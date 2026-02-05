import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Gamepad2,
  Trophy,
  Target,
  Loader,
  Sword,
  Crosshair,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchValorantRankedStats, fetchValorantMatchHistory, fetchFortniteStats } from '../services/api';
import { getGameTheme } from '../utils/gameThemes';
import { usePlayerPrimaryGame, calculatePlayerLevel, calculateXpFromActivity } from '../hooks/usePlayerPrimaryGame';
import toast from 'react-hot-toast';

import GamingStatsHeroBanner from '../components/gaming/GamingStatsHeroBanner';
import GamingStatsSidebar from '../components/gaming/GamingStatsSidebar';
import GamingStatsOverview from '../components/gaming/GamingStatsOverview';
import GameTabHeader from '../components/gaming/GameTabHeader';
import GameRankingCard from '../components/gaming/GameRankingCard';
import RiotAccountCard from '../components/gaming/RiotAccountCard';
import ValorantAccountCard from '../components/gaming/ValorantAccountCard';
import TournamentStatsCard from '../components/gaming/TournamentStatsCard';
import ConnectedAccountsSummary from '../components/gaming/ConnectedAccountsSummary';
import ValorantMatchHistoryCard from '../components/gaming/ValorantMatchHistoryCard';
import AimTrainerGame from '../components/games/AimTrainerGame';
import ReactionTimeGame from '../components/games/ReactionTimeGame';
import SteamProfileCard from '../components/gaming/SteamProfileCard';
import SteamBansCard from '../components/gaming/SteamBansCard';
import SteamGamesCard from '../components/gaming/SteamGamesCard';
import SteamLevelCard from '../components/gaming/SteamLevelCard';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';
import ShareOptionsModal from '../components/ui/ShareOptionsModal';
import RiotMatchHistoryCard from '../components/gaming/RiotMatchHistoryCard';
import RiotPerformanceTips from '../components/gaming/RiotPerformanceTips';
import ValorantPerformanceTips from '../components/gaming/ValorantPerformanceTips';
import FortniteAccountCard from '../components/gaming/FortniteAccountCard';
import FortniteMatchHistoryCard from '../components/gaming/FortniteMatchHistoryCard';
import FortnitePerformanceTips from '../components/gaming/FortnitePerformanceTips';
import ChatListModal from '../components/chat/ChatListModal';
import ChatModal from '../components/chat/ChatModal';
import ChannelModal from '../components/chat/ChannelModal';
import OnboardingWalkthrough from '../components/onboarding/OnboardingWalkthrough';
import { ValorantRankedData, ValorantMatch } from '../types';

type TabType = 'overview' | 'rankings' | 'league-of-legends' | 'valorant' | 'fortnite' | 'steam' | 'aim-trainer' | 'reaction-time';

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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAllGames, setShowAllGames] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlayerProfileModal, setShowPlayerProfileModal] = useState(false);
  const [steamData, setSteamData] = useState<any>(null);
  const [isLoadingSteam, setIsLoadingSteam] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);
  const [riotMatchHistory, setRiotMatchHistory] = useState<any[]>([]);
  const [isLoadingRiotMatches, setIsLoadingRiotMatches] = useState(false);
  const [riotMatchError, setRiotMatchError] = useState<string | null>(null);
  const [valorantRankedData, setValorantRankedData] = useState<ValorantRankedData | null>(null);
  const [valorantMatchHistory, setValorantMatchHistory] = useState<ValorantMatch[]>([]);
  const [isLoadingValorantData, setIsLoadingValorantData] = useState(false);
  const [valorantError, setValorantError] = useState<string | null>(null);
  const [fortniteStats, setFortniteStats] = useState<any>(null);
  const [isLoadingFortniteStats, setIsLoadingFortniteStats] = useState(false);
  const [fortniteError, setFortniteError] = useState<string | null>(null);
  const [showShareChatListModal, setShowShareChatListModal] = useState(false);
  const [shareMessageContent, setShareMessageContent] = useState('');
  const [displayingOwnStats, setDisplayingOwnStats] = useState(true);
  const [showShareChatModal, setShowShareChatModal] = useState(false);
  const [selectedShareFriend, setSelectedShareFriend] = useState<ShareFriend | null>(null);
  const [showShareChannelModal, setShowShareChannelModal] = useState(false);
  const [selectedShareChannel, setSelectedShareChannel] = useState<ShareChannel | null>(null);
  const [shareTargetType, setShareTargetType] = useState<'friend' | 'community'>('friend');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { theme, primaryGame } = usePlayerPrimaryGame({
    playerRankings: userProfile?.game_rankings || [],
    registrations: userProfile?.registrations || [],
    gamingAccounts: userProfile?.gaming_accounts || [],
    favoriteGameId: user?.favorite_game_id,
    favoriteGameName: userProfile?.favorite_game?.name
  });

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

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-user-profile-aggregated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ user_id: targetUserId })
        });

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

  useEffect(() => {
    if (activeTab === 'steam' && !steamData && userProfile?.gaming_accounts) {
      loadSteamData();
    }
  }, [activeTab, userProfile?.gaming_accounts, steamData]);

  useEffect(() => {
    if (activeTab === 'league-of-legends' && !riotMatchHistory.length && userProfile?.gaming_accounts) {
      const lolAccount = userProfile.gaming_accounts.find((account: any) =>
        account.game_publisher_ids?.games?.name === 'League of Legends' &&
        account.is_validated &&
        account.validation_data?.puuid
      );

      if (lolAccount) {
        loadRiotMatchHistory();
      }
    }
  }, [activeTab, userProfile?.gaming_accounts, riotMatchHistory.length]);

  useEffect(() => {
    if (activeTab === 'valorant' && !valorantRankedData && !valorantMatchHistory.length && userProfile?.gaming_accounts) {
      const valorantAccount = userProfile.gaming_accounts.find((account: any) =>
        account.game_publisher_ids?.games?.name === 'Valorant' &&
        account.is_validated &&
        account.validation_data?.puuid
      );

      if (valorantAccount) {
        loadValorantData(valorantAccount.validation_data.puuid, valorantAccount.validation_data.region);
      }
    }
  }, [activeTab, userProfile?.gaming_accounts, valorantRankedData, valorantMatchHistory.length]);

  if (!user) return null;

  const loadSteamData = async () => {
    if (!userProfile?.gaming_accounts) return;

    const steamAccount = userProfile.gaming_accounts.find((account: any) =>
      account.game_publisher_ids?.games?.name?.toLowerCase().includes('steam') ||
      account.game_publisher_ids?.label?.toLowerCase().includes('steam')
    );

    if (!steamAccount || !steamAccount.value) {
      setSteamError(t('gaming.noSteamAccountConfigured'));
      return;
    }

    try {
      setIsLoadingSteam(true);
      setSteamError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-steam-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          steamId64: steamAccount.value,
          includeBans: true,
          includeGames: true,
          includeLevel: true
        })
      });

      const result = await response.json();

      if (result.success) {
        setSteamData(result);
      } else {
        setSteamError(result.error || t('gaming.errorLoadingStatistics'));
      }
    } catch (err) {
      console.error('Error loading Steam data:', err);
      setSteamError(t('gaming.errorLoadingStatistics'));
    } finally {
      setIsLoadingSteam(false);
    }
  };

  const loadRiotMatchHistory = async () => {
    if (!userProfile?.gaming_accounts) return;

    const riotAccount = userProfile.gaming_accounts.find((account: any) =>
      account.game_publisher_ids?.games?.name === 'League of Legends' &&
      account.is_validated &&
      account.validation_data?.puuid
    );

    if (!riotAccount) {
      setRiotMatchError(t('gaming.noValidatedLoLAccountFound'));
      return;
    }

    try {
      setIsLoadingRiotMatches(true);
      setRiotMatchError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-riot-match-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          puuid: riotAccount.validation_data.puuid,
          region: riotAccount.validation_data.region || 'euw1',
          count: 10,
          start: 0
        })
      });

      const result = await response.json();

      if (result.success && result.matches) {
        setRiotMatchHistory(result.matches);
        toast.success(t('gaming.matchHistoryLoaded'));
      } else {
        setRiotMatchError(result.error || t('gaming.cannotLoadMatchHistory'));
        toast.error(t('gaming.cannotLoadMatchHistory'));
      }
    } catch (err) {
      console.error('Error loading Riot match history:', err);
      setRiotMatchError(t('gaming.errorLoadingHistory'));
      toast.error(t('gaming.errorLoadingHistory'));
    } finally {
      setIsLoadingRiotMatches(false);
    }
  };

  const loadValorantData = async (puuid: string, region: string) => {
    try {
      setIsLoadingValorantData(true);
      setValorantError(null);

      const rankedResponse = await fetchValorantRankedStats(puuid, region);
      if (rankedResponse.success && rankedResponse.rankedData) {
        setValorantRankedData(rankedResponse.rankedData);
      } else {
        setValorantError(rankedResponse.error || t('gaming.errorLoadingValorantData'));
      }

      const matchHistoryResponse = await fetchValorantMatchHistory(puuid, region, 10);
      if (matchHistoryResponse.success && matchHistoryResponse.matches) {
        setValorantMatchHistory(matchHistoryResponse.matches);
      }

      toast.success(t('gaming.valorantDataLoaded'));
    } catch (err) {
      console.error('Error loading Valorant data:', err);
      setValorantError(t('gaming.errorLoadingValorantData'));
      toast.error(t('gaming.errorLoadingValorantData'));
    } finally {
      setIsLoadingValorantData(false);
    }
  };

  const loadFortniteStats = async (playerIdentifier: string, platform: string) => {
    try {
      setIsLoadingFortniteStats(true);
      setFortniteError(null);

      const stats = await fetchFortniteStats(playerIdentifier, platform);
      setFortniteStats(stats);
      toast.success(t('gaming.fortniteStatsLoaded'));
    } catch (err: any) {
      console.error('Error loading Fortnite stats:', err);
      setFortniteStats(null);
      toast.error(t('gaming.errorLoadingFortniteStats'));
    } finally {
      setIsLoadingFortniteStats(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const targetUserId = paramUserId || user?.id;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-user-profile-aggregated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: targetUserId })
      });

      const result = await response.json();
      if (result.success) {
        setUserProfile(result.data);
        toast.success(t('gaming.dataRefreshed'));
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      toast.error(t('gaming.errorRefreshing'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const lolAccount = userProfile?.gaming_accounts?.find((account: any) =>
    account.game_publisher_ids?.games?.name === 'League of Legends' &&
    account.is_validated &&
    account.validation_data?.puuid
  );

  const valorantAccount = userProfile?.gaming_accounts?.find((account: any) =>
    account.game_publisher_ids?.games?.name === 'Valorant' &&
    account.is_validated &&
    account.validation_data?.puuid
  );

  const fortniteAccount = userProfile?.gaming_accounts?.find((account: any) =>
    account.game_publisher_ids?.games?.name === 'Fortnite' ||
    account.game_publisher_ids?.games?.name?.toLowerCase().includes('fortnite')
  );

  const hasFortniteEpicId = Boolean(user?.fortnite_epic_id);

  const calculatePersonalStats = () => {
    if (!userProfile?.aim_trainer_scores || userProfile.aim_trainer_scores.length === 0) {
      return {
        totalGames: 0,
        averageScore: 0,
        bestScore: 0,
        totalScore: 0,
        improvement: 0
      };
    }

    const scores = userProfile.aim_trainer_scores.map((entry: any) => entry.score);
    const totalGames = scores.length;
    const totalScore = scores.reduce((sum: number, score: number) => sum + score, 0);
    const averageScore = Math.round(totalScore / totalGames);
    const bestScore = Math.max(...scores);

    let improvement = 0;
    if (totalGames >= 10) {
      const recent5 = scores.slice(0, 5);
      const previous5 = scores.slice(5, 10);
      const recentAvg = recent5.reduce((sum: number, score: number) => sum + score, 0) / 5;
      const previousAvg = previous5.reduce((sum: number, score: number) => sum + score, 0) / 5;
      improvement = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
    }

    return { totalGames, averageScore, bestScore, totalScore, improvement };
  };

  const calculatedAimTrainerStats = calculatePersonalStats();

  const recentScores = userProfile?.aim_trainer_scores?.slice(0, 20).map((s: any) => s.score) || [];

  const xp = calculateXpFromActivity(
    userProfile?.tournament_stats?.total || 0,
    userProfile?.tournament_stats?.completed || 0,
    userProfile?.gaming_accounts?.filter((a: any) => a.is_validated).length || 0,
    Boolean(user?.bio && user?.country),
    0
  );

  const playerLevel = calculatePlayerLevel(xp);

  const winRate = userProfile?.tournament_stats?.total > 0
    ? Math.round((userProfile.tournament_stats.completed / userProfile.tournament_stats.total) * 100)
    : 0;

  const generateStatsShareMessage = () => {
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

    if (calculatedAimTrainerStats.totalGames > 0) {
      message += `${t('gaming.aimTrainer')}:\n`;
      message += `- ${t('gaming.bestScoreLabel', { score: calculatedAimTrainerStats.bestScore.toLocaleString() })}\n`;
      message += `- ${t('gaming.gamesPlayedLabel', { count: calculatedAimTrainerStats.totalGames })}\n`;
    }

    message += t('gaming.viewMyCompleteStats');

    return message;
  };

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
      setSelectedShareFriend({
        id: contactId,
        name: contactName,
        avatar: contactAvatarOrDescription
      });
      setShowShareChatModal(true);
    } else if (contactType === 'channel') {
      setSelectedShareChannel({
        id: contactId,
        name: contactName,
        description: contactAvatarOrDescription || undefined
      });
      setShowShareChannelModal(true);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; condition: boolean; validated?: boolean }[] = [
    { id: 'overview', label: t('gaming.overview'), icon: Gamepad2, condition: true },
    { id: 'rankings', label: t('gaming.rankingsByGame'), icon: Trophy, condition: Boolean(userProfile?.game_rankings?.length) },
    { id: 'league-of-legends', label: 'League of Legends', icon: Sword, condition: Boolean(lolAccount), validated: lolAccount?.is_validated },
    { id: 'valorant', label: 'Valorant', icon: Crosshair, condition: Boolean(valorantAccount), validated: valorantAccount?.is_validated },
    { id: 'fortnite', label: 'Fortnite', icon: Target, condition: Boolean(fortniteAccount) },
    { id: 'steam', label: 'Steam', icon: Gamepad2, condition: Boolean(userProfile?.gaming_accounts?.some((a: any) => a.game_publisher_ids?.games?.name?.toLowerCase().includes('steam') || a.game_publisher_ids?.label?.toLowerCase().includes('steam'))) },
    { id: 'aim-trainer', label: t('gaming.aimTrainer'), icon: Target, condition: true },
    { id: 'reaction-time', label: t('gaming.reactionTime'), icon: Target, condition: true }
  ];

  const visibleTabs = tabs.filter(tab => tab.condition);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
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
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
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
      </div>
    );
  }

  if (!hasAnyGamingStats) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('gaming.backToProfile')}
            </Link>

            <GamingStatsHeroBanner
              user={user}
              theme={theme}
              primaryGameName={primaryGame}
              xp={xp}
              stats={{
                gamesPlayed: 0,
                bestScore: 0,
                winRate: 0,
                connectedAccounts: 0
              }}
              onShareClick={() => setShowShareModal(true)}
              onPreviewClick={() => setShowPlayerProfileModal(true)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-dark-100 rounded-xl p-8 border border-gray-800"
            >
              <div className="text-center py-8">
                <Gamepad2 className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                <h3 className="font-heading font-medium text-xl mb-2 text-white">{t('gaming.noStatisticsAvailable')}</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {t('gaming.toViewYourStats')}
                </p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('gaming.backToProfile')}
          </Link>

          <GamingStatsHeroBanner
            user={user}
            theme={theme}
            primaryGameName={primaryGame}
            xp={xp}
            stats={{
              gamesPlayed: calculatedAimTrainerStats.totalGames,
              bestScore: calculatedAimTrainerStats.bestScore,
              winRate,
              connectedAccounts: userProfile?.gaming_accounts?.length || 0
            }}
            onShareClick={() => setShowShareModal(true)}
            onPreviewClick={() => setShowPlayerProfileModal(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                id="walkthrough-stats-tabs"
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
              >
                {visibleTabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      onClick={() => setActiveTab(tab.id)}
                      id={tab.id === 'aim-trainer' ? 'walkthrough-tab-aim-trainer' : undefined}
                      data-tab={tab.id}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'scale-105' : 'hover:scale-[1.02]'
                      }`}
                      style={{
                        backgroundColor: isActive ? `${theme.colors.primary}30` : 'rgba(255,255,255,0.05)',
                        color: isActive ? theme.colors.primary : 'rgba(255,255,255,0.7)',
                        border: isActive ? `1px solid ${theme.colors.primary}50` : '1px solid transparent',
                        boxShadow: isActive ? `0 0 15px ${theme.colors.primary}20` : 'none'
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="whitespace-nowrap">{tab.label}</span>
                      {tab.validated !== undefined && (
                        <span className={`w-2 h-2 rounded-full ${tab.validated ? 'bg-success-500' : 'bg-gray-500'}`} />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div id="walkthrough-stats-overview">
                        <GamingStatsOverview
                          personalStats={calculatedAimTrainerStats}
                          gameRankings={userProfile?.game_rankings || []}
                          theme={theme}
                          recentScores={recentScores}
                          winRate={winRate}
                          playerLevel={playerLevel}
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <TournamentStatsCard
                          tournamentStats={userProfile?.tournament_stats || { total: 0, upcoming: 0, ongoing: 0, completed: 0 }}
                        />
                        <div id="walkthrough-stats-accounts">
                          <ConnectedAccountsSummary
                            totalAccounts={userProfile?.gaming_accounts?.length || 0}
                            validatedAccounts={userProfile?.gaming_accounts?.filter((a: any) => a.is_validated).length || 0}
                            gameAccounts={userProfile?.gaming_accounts || []}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'rankings' && userProfile?.game_rankings && (
                    <div className="space-y-6">
                      <GameTabHeader
                        title={displayingOwnStats ? t('gaming.myRankingsByGame') : t('gaming.playerRankingsByGame', { username: userProfile?.username || t('gaming.unknownPlayer') })}
                        theme={theme}
                        icon={Trophy}
                        showRefresh={false}
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {userProfile.game_rankings
                          .slice(0, showAllGames ? undefined : 6)
                          .map((ranking: any, index: number) => (
                            <GameRankingCard
                              key={index}
                              ranking={{
                                ...ranking,
                                game_name: ranking.game_name || ranking.games?.name || t('gaming.unknownGame')
                              }}
                              onClick={() => console.log('View ranking details for:', ranking.game_name)}
                            />
                          ))}
                      </div>

                      {userProfile.game_rankings.length > 6 && (
                        <button
                          onClick={() => setShowAllGames(!showAllGames)}
                          className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                          style={{
                            backgroundColor: `${theme.colors.primary}15`,
                            color: theme.colors.primary,
                            border: `1px solid ${theme.colors.primary}30`
                          }}
                        >
                          {showAllGames ? t('gaming.viewLess') : t('gaming.viewAllCount', { count: userProfile.game_rankings.length })}
                        </button>
                      )}
                    </div>
                  )}

                  {activeTab === 'league-of-legends' && (
                    <div className="space-y-6">
                      <GameTabHeader
                        title={t('gaming.leagueOfLegendsStats')}
                        theme={getGameTheme('League of Legends')}
                        icon={Sword}
                        isValidated={lolAccount?.is_validated}
                        onRefresh={displayingOwnStats ? loadRiotMatchHistory : undefined}
                        isRefreshing={isLoadingRiotMatches}
                      />

                      {lolAccount ? (
                        <>
                          <RiotAccountCard
                            account={lolAccount}
                            onLoadMatchHistory={displayingOwnStats ? loadRiotMatchHistory : undefined}
                            isLoadingMatches={isLoadingRiotMatches}
                          />

                          {riotMatchHistory.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <RiotMatchHistoryCard
                                matches={riotMatchHistory}
                                isLoading={isLoadingRiotMatches}
                                onLoadMore={displayingOwnStats ? () => toast.info(t('gaming.featureComingSoon')) : undefined}
                                hasMore={false}
                              />
                              <div id="walkthrough-stats-performance">
                                <RiotPerformanceTips
                                  matches={riotMatchHistory}
                                  rankedStats={lolAccount?.validation_data?.rankedStats}
                                />
                              </div>
                            </div>
                          )}

                          {riotMatchError && (
                            <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg flex items-center">
                              <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                              <span>{riotMatchError}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Sword className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">{t('gaming.noValidatedLoLAccountFound')}</p>
                          {displayingOwnStats && (
                            <Link
                              to="/profile/settings#gaming-accounts"
                              className="mt-4 inline-block px-4 py-2 rounded-lg text-sm"
                              style={{ backgroundColor: theme.colors.primary, color: theme.colors.text }}
                            >
                              {t('gaming.linkYourLoLAccount')}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'valorant' && (
                    <div className="space-y-6">
                      <GameTabHeader
                        title={t('gaming.valorantStats')}
                        theme={getGameTheme('Valorant')}
                        icon={Crosshair}
                        isValidated={valorantAccount?.is_validated}
                        onRefresh={displayingOwnStats && valorantAccount ? () => loadValorantData(valorantAccount.validation_data.puuid, valorantAccount.validation_data.region) : undefined}
                        isRefreshing={isLoadingValorantData}
                      />

                      {valorantAccount ? (
                        <>
                          <ValorantAccountCard
                            account={valorantAccount}
                            onLoadMatchHistory={displayingOwnStats ? (puuid: string, region: string) => loadValorantData(puuid, region) : undefined}
                            isLoadingMatches={isLoadingValorantData}
                          />

                          {valorantMatchHistory.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <ValorantMatchHistoryCard
                                matches={valorantMatchHistory}
                                isLoading={isLoadingValorantData}
                                onLoadMore={displayingOwnStats ? () => toast.info(t('gaming.featureComingSoon')) : undefined}
                                hasMore={false}
                              />
                              <ValorantPerformanceTips
                                matches={valorantMatchHistory}
                                rankedData={valorantRankedData}
                              />
                            </div>
                          )}

                          {valorantError && (
                            <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg flex items-center">
                              <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                              <span>{valorantError}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Crosshair className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">{t('gaming.noValidatedValorantAccountFound')}</p>
                          {displayingOwnStats && (
                            <Link
                              to="/profile/settings#gaming-accounts"
                              className="mt-4 inline-block px-4 py-2 rounded-lg text-sm"
                              style={{ backgroundColor: theme.colors.primary, color: theme.colors.text }}
                            >
                              {t('gaming.linkYourValorantAccount')}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'fortnite' && fortniteAccount && (
                    <div className="space-y-6">
                      <GameTabHeader
                        title={t('gaming.fortniteStats')}
                        theme={getGameTheme('Fortnite')}
                        icon={Target}
                        onRefresh={displayingOwnStats ? () => loadFortniteStats(hasFortniteEpicId ? user?.fortnite_epic_id || '' : fortniteAccount?.username || '', 'epic') : undefined}
                        isRefreshing={isLoadingFortniteStats}
                      />

                      <FortniteAccountCard
                        account={{
                          username: hasFortniteEpicId ? user?.fortnite_epic_id || '' : fortniteAccount?.username || '',
                          platform: 'epic',
                          isValidated: hasFortniteEpicId ? user?.is_fortnite_validated || false : fortniteAccount?.isValidated || false,
                          validationData: hasFortniteEpicId ? user?.fortnite_validation_data : fortniteAccount?.validationData
                        }}
                        onLoadStats={displayingOwnStats ? loadFortniteStats : async () => {}}
                        isLoadingStats={isLoadingFortniteStats}
                        statsData={fortniteStats}
                      />

                      {fortniteStats && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <FortniteMatchHistoryCard
                            matchHistory={fortniteStats?.matches || []}
                            isLoading={isLoadingFortniteStats}
                          />
                          <FortnitePerformanceTips
                            stats={fortniteStats?.stats?.all?.overall}
                          />
                        </div>
                      )}

                      {fortniteError && (
                        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg flex items-center">
                          <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                          <span>{fortniteError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'steam' && (
                    <div className="space-y-6">
                      <GameTabHeader
                        title={t('gaming.steamProfile')}
                        theme={theme}
                        icon={Gamepad2}
                        onRefresh={displayingOwnStats ? loadSteamData : undefined}
                        isRefreshing={isLoadingSteam}
                      />

                      {isLoadingSteam ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader className="h-8 w-8 animate-spin mr-3" style={{ color: theme.colors.primary }} />
                          <span className="text-gray-400">{t('gaming.loadingSteamData')}</span>
                        </div>
                      ) : steamError ? (
                        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg flex items-center">
                          <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                          <span>{steamError}</span>
                        </div>
                      ) : steamData ? (
                        <div className="space-y-4">
                          {steamData.profile && <SteamProfileCard profile={steamData.profile} />}

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {steamData.level !== undefined && steamData.profile && (
                              <SteamLevelCard level={steamData.level} profile={steamData.profile} />
                            )}
                            {steamData.bans && <SteamBansCard bans={steamData.bans} />}
                          </div>

                          {steamData.games && <SteamGamesCard games={steamData.games} />}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">{t('gaming.noSteamDataAvailable')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'aim-trainer' && (
                    <div id="walkthrough-stats-aim-trainer" className="space-y-6">
                      <GameTabHeader
                        title={t('gaming.aimTraining')}
                        theme={theme}
                        icon={Target}
                        showRefresh={false}
                      />
                      <AimTrainerGame gameName="Aim Trainer" />
                    </div>
                  )}

                  {activeTab === 'reaction-time' && (
                    <div className="space-y-6">
                      <GameTabHeader
                        title={t('gaming.reactionTimeTest')}
                        theme={theme}
                        icon={Target}
                        showRefresh={false}
                      />
                      <ReactionTimeGame
                        gameName="Reaction Time Test"
                        gameId="e4b0a5a8-c325-4925-8e9c-83d53dcb771c"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="hidden lg:block">
              <GamingStatsSidebar
                theme={theme}
                tournamentStats={userProfile?.tournament_stats || { total: 0, upcoming: 0, ongoing: 0, completed: 0 }}
                gamingAccounts={userProfile?.gaming_accounts || []}
                winRate={winRate}
                aimTrainerBestScore={calculatedAimTrainerStats.bestScore}
                reactionTimeBestScore={0}
                onRefresh={handleRefresh}
                onShare={() => setShowShareModal(true)}
                isRefreshing={isRefreshing}
              />
            </div>
          </div>
        </div>
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
