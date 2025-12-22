import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Trophy, Target, TrendingUp, User, Users, Award, Star, Shield, CheckCircle, XCircle, Loader, Share2, MessageSquare, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserProfile, fetchValorantRankedStats, fetchValorantMatchHistory } from '../services/api';
import toast from 'react-hot-toast';

// Import new components
import GamingStatsOverview from '../components/gaming/GamingStatsOverview';
import GameRankingCard from '../components/gaming/GameRankingCard';
import RiotAccountCard from '../components/gaming/RiotAccountCard';
import ValorantAccountCard from '../components/gaming/ValorantAccountCard';
import ConnectedAccountsSummary from '../components/gaming/ConnectedAccountsSummary';
import TournamentStatsCard from '../components/gaming/TournamentStatsCard';
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
import { ValorantRankedData, ValorantMatch } from '../types';
import FortniteAccountCard from '../components/gaming/FortniteAccountCard';
import FortniteMatchHistoryCard from '../components/gaming/FortniteMatchHistoryCard';
import FortnitePerformanceTips from '../components/gaming/FortnitePerformanceTips';
import { fetchFortniteStats } from '../services/api';
import { useParams } from 'react-router-dom';
import { APP_CONFIG } from '../constants';
import ChatListModal from '../components/chat/ChatListModal';
import ChatModal from '../components/chat/ChatModal';
import ChannelModal from '../components/chat/ChannelModal';
import OnboardingWalkthrough from '../components/onboarding/OnboardingWalkthrough';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'league-of-legends' | 'valorant' | 'fortnite' | 'steam' | 'aim-trainer' | 'reaction-time'>('overview');
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile/gaming-stats');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadUserProfile = async () => {
      // Determine target user ID - either from URL params or current user
      const targetUserId = paramUserId || user?.id;
      if (!targetUserId) return;
      
      // Determine if we're displaying own stats or another user's stats
      const isOwnStats = !paramUserId || paramUserId === user?.id;
      setDisplayingOwnStats(isOwnStats);
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Call the new aggregated Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-user-profile-aggregated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            user_id: targetUserId
          })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch user profile');
        }
        
        const data = result.data;
        setUserProfile(data);
        
        // Check if the loaded profile has any gaming statistics
        const hasStats = !!(
          (data?.game_rankings && data.game_rankings.length > 0) ||
          (data?.gaming_accounts && data.gaming_accounts.length > 0) ||
          (data?.aim_trainer_scores && data.aim_trainer_scores.length > 0) ||
          (data?.tournament_stats && data.tournament_stats.total > 0)
        );
        setHasAnyGamingStats(hasStats);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError(t('gaming.errorLoadingStatistics'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [user?.id, paramUserId]);

  // Load Steam data when Steam tab is selected
  useEffect(() => {
    if (activeTab === 'steam' && !steamData && userProfile?.gaming_accounts) {
      loadSteamData();
    }
  }, [activeTab, userProfile?.gaming_accounts]);

  // Load League of Legends data when LoL tab is selected
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

  // Load Valorant data when Valorant tab is selected
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

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  const loadSteamData = async () => {
    if (!userProfile?.gaming_accounts) return;

    // Find Steam account
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

      // Call the Steam profile Edge Function
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
    } catch (error) {
      console.error('Error loading Steam data:', error);
      setSteamError(t('gaming.errorLoadingStatistics'));
    } finally {
      setIsLoadingSteam(false);
    }
  };

  const loadRiotMatchHistory = async () => {
    if (!userProfile?.gaming_accounts) return;

    // Find Riot account
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

      // Call the Riot match history Edge Function
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
        setRiotMatchError(result.error || 'Erreur lors du chargement de l\'historique');
        toast.error(t('gaming.cannotLoadMatchHistory'));
      }
    } catch (error) {
      console.error('Error loading Riot match history:', error);
      setRiotMatchError(t('gaming.errorLoadingHistory'));
      toast.error(t('gaming.errorLoadingHistory'));
    } finally {
      setIsLoadingRiotMatches(false);
    }
  };

  const loadValorantData = async (puuid: string, region: string) => {
    if (!userProfile?.gaming_accounts) return;

    try {
      setIsLoadingValorantData(true);
      setValorantError(null);

      // Fetch ranked stats
      const rankedResponse = await fetchValorantRankedStats(puuid, region);
      if (rankedResponse.success && rankedResponse.rankedData) {
        setValorantRankedData(rankedResponse.rankedData);
      } else {
        setValorantError(rankedResponse.error || t('gaming.errorLoadingValorantData'));
      }

      // Fetch match history
      const matchHistoryResponse = await fetchValorantMatchHistory(puuid, region, 10);
      if (matchHistoryResponse.success && matchHistoryResponse.matches) {
        setValorantMatchHistory(matchHistoryResponse.matches);
      } else {
        setValorantError(matchHistoryResponse.error || t('gaming.errorLoadingValorantData'));
      }

      toast.success(t('gaming.valorantDataLoaded'));
    } catch (error) {
      console.error('Error loading Valorant data:', error);
      setValorantError(t('gaming.errorLoadingValorantData'));
      toast.error(t('gaming.errorLoadingValorantData'));
    } finally {
      setIsLoadingValorantData(false);
    }
  };

  // Determine if user has a validated Valorant account
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

  // Determine if user has a Fortnite account
  const fortniteAccount = userProfile?.gaming_accounts?.find((account: any) =>
    account.game_publisher_ids?.games?.name === 'Fortnite' ||
    account.game_publisher_ids?.games?.name?.toLowerCase().includes('fortnite')
  );

  // Check if user has Fortnite Epic ID
  const hasFortniteEpicId = Boolean(user?.fortnite_epic_id);

  const loadFortniteStats = async (playerIdentifier: string, platform: string) => {
    try {
      setIsLoadingFortniteStats(true);
      setFortniteError(null);

      const stats = await fetchFortniteStats(playerIdentifier, platform);
      setFortniteStats(stats);
      toast.success(t('gaming.fortniteStatsLoaded'));
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors du chargement des statistiques';
      if (errorMessage.includes('coming soon')) {
        setError(null);
      } else {
        console.error('Error loading Fortnite stats:', error);
        setError(`Erreur lors du chargement des statistiques Fortnite:\n\n${errorMessage}`);
      }
      console.log('Fortnite stats not available:', error?.message || error);
      // Don't throw error for "coming soon" messages - just log and continue
      setFortniteStats(null);
      toast.error(t('gaming.errorLoadingFortniteStats'));
    } finally {
      setIsLoadingFortniteStats(false);
    }
  };

  // Calculate personal stats from aim trainer scores
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
    
    // Calculate improvement (compare last 5 games vs previous 5 games)
    let improvement = 0;
    if (totalGames >= 10) {
      const recent5 = scores.slice(0, 5);
      const previous5 = scores.slice(5, 10);
      const recentAvg = recent5.reduce((sum: number, score: number) => sum + score, 0) / 5;
      const previousAvg = previous5.reduce((sum: number, score: number) => sum + score, 0) / 5;
      improvement = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
    }
    
    return {
      totalGames,
      averageScore,
      bestScore,
      totalScore,
      improvement
    };
  };

  // Generate stats summary for sharing
  const generateStatsShareMessage = () => {
    let message = `${t('gaming.myGameStats')}\n\n`;
    
    // Tournament stats
    if (userProfile?.tournament_stats) {
      const stats = userProfile.tournament_stats;
      message += `${t('gaming.tournaments')}\n`;
      message += `• ${t('gaming.total')}: ${stats.total}\n`;
      message += `• ${t('gaming.ongoing')}: ${stats.ongoing}\n`;
      message += `• ${t('gaming.completed')}: ${stats.completed}\n\n`;
    }
    
    // Game rankings
    if (userProfile?.game_rankings && userProfile.game_rankings.length > 0) {
      message += `${t('gaming.myBestRankings')}\n`;
      userProfile.game_rankings.slice(0, 3).forEach((ranking: any) => {
        message += `• ${t('gaming.rankElo', { game: ranking.game_name, rank: ranking.rank, elo: ranking.elo_rating })}\n`;
      });
      message += `\n`;
    }
    
    // Aim trainer stats
    if (calculatedAimTrainerStats.totalGames > 0) {
      message += `🎯 ${t('gaming.aimTrainer')}:\n`;
      message += `• ${t('gaming.bestScoreLabel', { score: calculatedAimTrainerStats.bestScore.toLocaleString() })}\n`;
      message += `• ${t('gaming.averageScoreLabel', { score: calculatedAimTrainerStats.averageScore.toLocaleString() })}\n`;
      message += `• ${t('gaming.gamesPlayedLabel', { count: calculatedAimTrainerStats.totalGames })}\n`;
      if (calculatedAimTrainerStats.improvement !== 0) {
        message += `• ${t('gaming.progressionLabel', { percent: calculatedAimTrainerStats.improvement > 0 ? '+' : '' + calculatedAimTrainerStats.improvement })}\n`;
      }
      message += `\n`;
    }
    
    message += t('gaming.viewMyCompleteStats');
    
    return message;
  };

  // Handle share with friend
  const handleShareStats = (targetType: 'friend' | 'community') => {
    const statsMessage = generateStatsShareMessage();
    setShareMessageContent(statsMessage);
    setShareTargetType(targetType);
    setShowShareChatListModal(true);
  };

  // Handle contact selection for sharing (friend or channel)
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

  const calculatedAimTrainerStats = calculatePersonalStats();

  // Calculate personal stats from aim trainer scores

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('gaming.loadingYourStats')}</p>
        </div>
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
            
            <div className="bg-white dark:bg-dark-100 rounded-xl p-8 border border-gray-200 dark:border-gray-800">
              <AlertTriangle className="h-16 w-16 text-error-500 mx-auto mb-4" />
              <h1 className="font-heading font-bold text-2xl mb-4 text-gray-900 dark:text-white">{t('gaming.error')}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary"
              >
                {t('gaming.retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if user has no gaming stats
  if (!hasAnyGamingStats) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('gaming.backToProfile')}
            </Link>
            
            <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="font-heading font-bold text-2xl flex items-center text-gray-900 dark:text-white">
                      <Gamepad2 className="h-6 w-6 text-primary-500 mr-2" />
                      {t('gaming.myGamingStatsTitle')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('gaming.viewPerformanceAndRankings')}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="text-center py-12">
                  <Gamepad2 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="font-medium text-xl mb-2 text-gray-900 dark:text-white">{t('gaming.noStatisticsAvailable')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t('gaming.toViewYourStats')}
                  </p>
                  <div className="space-y-3 mb-6 max-w-md mx-auto">
                    <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg text-left">
                      <div className="flex items-center mb-2">
                        <Gamepad2 className="h-5 w-5 text-primary-500 mr-2" />
                        <span className="font-medium text-gray-900 dark:text-white">{t('gaming.connectYourGamingAccounts')}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('gaming.linkAccountsDescription')}
                      </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg text-left">
                      <div className="flex items-center mb-2">
                        <Trophy className="h-5 w-5 text-warning-500 mr-2" />
                        <span className="font-medium text-gray-900 dark:text-white">{t('gaming.participateInTournaments')}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('gaming.joinTournamentsDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      to="/profile/edit"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      {t('gaming.connectMyGamingAccounts')}
                    </Link>
                    <Link
                      to="/"
                      className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      {t('gaming.viewTournaments')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('gaming.backToProfile')}
          </Link>
          
          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-heading font-bold text-2xl flex items-center text-gray-900 dark:text-white">
                    <Gamepad2 className="h-6 w-6 text-primary-500 mr-2" />
                    {t('gaming.myGamingStats')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">{t('gaming.viewPerformanceAndRankings')}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('gaming.share')}
                  </button>
                  
                  <button
                    onClick={() => setShowPlayerProfileModal(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t('gaming.viewMyPublicProfile')}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Tabs Navigation */}
            <div id="walkthrough-stats-tabs" className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-shrink-0 py-3 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'overview' 
                    ? 'text-primary-500 border-b-2 border-primary-500' 
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('gaming.overview')}
              </button>
              
              {userProfile?.game_rankings && userProfile.game_rankings.length > 0 && (
                <button
                  onClick={() => setActiveTab('rankings')}
                  className={`flex-shrink-0 py-3 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'rankings' 
                      ? 'text-primary-500 border-b-2 border-primary-500' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {t('gaming.rankingsByGame')}
                </button>
              )}
              
              {userProfile?.gaming_accounts?.some((account: any) => 
                account.game_publisher_ids?.games?.name === 'League of Legends' &&
                account.is_validated && 
                account.validation_data
              ) && (
                <button
                  onClick={() => setActiveTab('league-of-legends')}
                  className={`flex-shrink-0 py-3 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'league-of-legends' 
                      ? 'text-primary-500 border-b-2 border-primary-500' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {t('gaming.leagueOfLegendsAccount')}
                </button>
              )}
              
              {userProfile?.gaming_accounts?.some((account: any) =>
                account.game_publisher_ids?.games?.name === 'Valorant' &&
                account.is_validated &&
                account.validation_data
              ) && (
                <button
                  onClick={() => setActiveTab('valorant')}
                  className={`flex-shrink-0 py-3 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'valorant' 
                      ? 'text-primary-500 border-b-2 border-primary-500' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {t('gaming.valorantAccount')}
                </button>
              )}
              
              {fortniteAccount && (
                <button
                  onClick={() => setActiveTab('fortnite')}
                  className={`flex-shrink-0 py-3 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'fortnite' 
                      ? 'text-primary-500 border-b-2 border-primary-500' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {t('gaming.fortniteAccount')}
                </button>
              )}
              
              {userProfile?.gaming_accounts?.some((account: any) => 
                account.game_publisher_ids?.games?.name?.toLowerCase().includes('steam') ||
                account.game_publisher_ids?.label?.toLowerCase().includes('steam')
              ) && (
                <button
                  onClick={() => setActiveTab('steam')}
                  className={`flex-shrink-0 py-3 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'steam' 
                      ? 'text-primary-500 border-b-2 border-primary-500' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {t('gaming.steamAccount')}
                </button>
              )}
              
              <button
                id="walkthrough-tab-aim-trainer"
                onClick={() => setActiveTab('aim-trainer')}
                className={`flex-shrink-0 py-3 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'aim-trainer'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('gaming.aimTrainer')}
              </button>

              <button
                onClick={() => setActiveTab('reaction-time')}
                className={`flex-shrink-0 py-3 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'reaction-time'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('gaming.reactionTime')}
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Gaming Stats Overview */}
                  <div id="walkthrough-stats-overview">
                    <GamingStatsOverview
                      personalStats={calculatedAimTrainerStats}
                      gameRankings={userProfile?.game_rankings || []}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tournament Stats */}
                    <TournamentStatsCard
                      tournamentStats={userProfile?.tournament_stats || { total: 0, upcoming: 0, ongoing: 0, completed: 0 }}
                    />

                    {/* Connected Accounts Summary */}
                    <div id="walkthrough-stats-accounts">
                      <ConnectedAccountsSummary
                        totalAccounts={userProfile?.gaming_accounts?.length || 0}
                        validatedAccounts={userProfile?.gaming_accounts?.filter((account: any) => account.is_validated).length || 0}
                        gameAccounts={userProfile?.gaming_accounts || []}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Rankings Tab */}
              {activeTab === 'rankings' && userProfile?.game_rankings && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                      {displayingOwnStats ? t('gaming.myRankingsByGame') : t('gaming.playerRankingsByGame', { username: userProfile?.username || t('gaming.unknownPlayer') })}
                    </h2>
                    {userProfile.game_rankings.length > 3 && (
                      <button
                        onClick={() => setShowAllGames(!showAllGames)}
                        className="text-primary-500 hover:text-primary-400 text-sm transition-colors"
                      >
                        {showAllGames ? t('gaming.viewLess') : t('gaming.viewAllCount', { count: userProfile.game_rankings.length })}
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userProfile.game_rankings
                      .slice(0, showAllGames ? undefined : 6)
                      .map((ranking: any, index: number) => (
                        <GameRankingCard
                          key={index}
                          ranking={{
                            ...ranking,
                            // Ensure game_name is correctly mapped, assuming it might be nested under 'games'
                            // This handles cases where the API might return { game_id: '...', games: { name: '...' } }
                            game_name: ranking.game_name || ranking.games?.name || t('gaming.unknownGame')
                          }}
                          onClick={() => {
                            // Handle click to view more details
                            console.log('View ranking details for:', ranking.game_name);
                          }}
                        />
                      ))}
                  </div>
                </div>
              )}
              
              {/* Riot Games Tab */}
              {/* League of Legends Tab */}
              {activeTab === 'league-of-legends' && userProfile?.gaming_accounts && (
                <>
                  {userProfile.gaming_accounts.some((account: any) =>
                    account.game_publisher_ids?.games?.name === 'League of Legends' &&
                    account.is_validated &&
                    account.validation_data
                  ) ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                          {t('gaming.leagueOfLegendsStats')}
                        </h2>
                        {riotMatchHistory.length > 0 && displayingOwnStats && (
                          <button
                            onClick={loadRiotMatchHistory}
                            disabled={isLoadingRiotMatches}
                            className="flex items-center text-primary-500 hover:text-primary-400 transition-colors text-sm"
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingRiotMatches ? 'animate-spin' : ''}`} />
                            {t('gaming.refresh')}
                          </button>
                        )}
                      </div>

                      {/* League of Legends Account Cards */}
                      <div className="grid grid-cols-1 gap-6">
                        {userProfile.gaming_accounts
                          ?.filter((account: any) =>
                            account.game_publisher_ids?.games?.name === 'League of Legends' &&
                            account.is_validated &&
                            account.validation_data
                          )
                          .map((account: any, index: number) => (
                            <RiotAccountCard
                              key={index}
                              account={account}
                              onLoadMatchHistory={displayingOwnStats ? loadRiotMatchHistory : undefined}
                              isLoadingMatches={isLoadingRiotMatches}
                            />
                          ))}
                      </div>

                      {/* Match History and Performance Tips for LoL */}
                      {riotMatchHistory.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <RiotMatchHistoryCard
                            matches={riotMatchHistory}
                            isLoading={isLoadingRiotMatches}
                            onLoadMore={displayingOwnStats ? () => {
                              toast.info(t('gaming.featureComingSoon'));
                            } : undefined}
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
                      
                      {/* Error State */}
                      {riotMatchError && (
                        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg">
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                            <span>{riotMatchError}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Swords className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {displayingOwnStats
                          ? t('gaming.noValidatedLoLAccountFound')
                          : t('gaming.playerNoLeagueAccount', { username: userProfile?.username || t('gaming.unknownPlayer') })
                        }
                      </p>
                      {displayingOwnStats && (
                        <Link
                          to="/profile/edit"
                          className="mt-2 inline-block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          {t('gaming.linkYourLoLAccount')}
                        </Link>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Valorant Tab */}
              {activeTab === 'valorant' && userProfile?.gaming_accounts && (
                <>
                  {userProfile.gaming_accounts.some((account: any) =>
                    account.game_publisher_ids?.games?.name === 'Valorant' &&
                    account.is_validated &&
                    account.validation_data
                  ) ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                          {t('gaming.valorantStats')}
                        </h2>
                        {valorantMatchHistory.length > 0 && displayingOwnStats && (
                          <button
                            onClick={() => {
                              if (valorantAccount) {
                                loadValorantData(valorantAccount.validation_data.puuid, valorantAccount.validation_data.region);
                              }
                            }}
                            disabled={isLoadingValorantData}
                            className="flex items-center text-primary-500 hover:text-primary-400 transition-colors text-sm"
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingValorantData ? 'animate-spin' : ''}`} />
                            {t('gaming.refresh')}
                          </button>
                        )}
                      </div>

                      {/* Valorant Account Cards */}
                      <div className="grid grid-cols-1 gap-6">
                        {userProfile.gaming_accounts
                          ?.filter((account: any) =>
                            account.game_publisher_ids?.games?.name === 'Valorant' &&
                            account.is_validated &&
                            account.validation_data
                          )
                          .map((account: any, index: number) => (
                            <ValorantAccountCard
                              key={index}
                              account={account}
                              onLoadMatchHistory={displayingOwnStats ? (puuid: string, region: string) => loadValorantData(puuid, region) : undefined}
                              isLoadingMatches={isLoadingValorantData}
                            />
                          ))}
                      </div>

                      {/* Match History and Performance Tips for Valorant */}
                      {valorantMatchHistory.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <ValorantMatchHistoryCard
                            matches={valorantMatchHistory}
                            isLoading={isLoadingValorantData}
                            onLoadMore={displayingOwnStats ? () => toast.info('Fonctionnalité à venir') : undefined}
                            hasMore={false}
                          />
                          <ValorantPerformanceTips
                            matches={valorantMatchHistory}
                            rankedData={valorantRankedData}
                          />
                        </div>
                      )}

                      {/* Valorant Error State */}
                      {valorantError && (
                        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg">
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                            <span>{valorantError}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Swords className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {displayingOwnStats
                          ? t('gaming.noValidatedValorantAccountFound')
                          : t('gaming.playerNoValorantAccount', { username: userProfile?.username || t('gaming.unknownPlayer') })
                        }
                      </p>
                      {displayingOwnStats && (
                        <Link
                          to="/profile/edit"
                          className="mt-2 inline-block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          {t('gaming.linkYourValorantAccount')}
                        </Link>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Fortnite Tab */}
              {activeTab === 'fortnite' && fortniteAccount && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                      {t('gaming.fortniteStats')}
                    </h2>
                    {fortniteStats && displayingOwnStats && (
                      <button
                        onClick={() => loadFortniteStats(
                          hasFortniteEpicId ? user?.fortnite_epic_id || '' : fortniteAccount?.username || '',
                          'epic'
                        )}
                        disabled={isLoadingFortniteStats}
                        className="flex items-center text-primary-500 hover:text-primary-400 transition-colors text-sm"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingFortniteStats ? 'animate-spin' : ''}`} />
                        Actualiser
                      </button>
                    )}
                  </div>
                  
                  {calculatedAimTrainerStats?.comingSoon && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800">{t('gaming.fortniteStatsComingSoon')}</p>
                    </div>
                  )}
                  
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                        <span>{fortniteError}</span>
                      </div>
                    </div>
                  )}
                  
                  {!fortniteStats && !fortniteError && !isLoadingFortniteStats && (
                    <div className="text-center py-8 bg-gray-100 dark:bg-dark-200 rounded-lg">
                      <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {displayingOwnStats
                          ? t('gaming.clickLoadStats')
                          : t('gaming.noFortniteStatsForPlayer')
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Steam Tab */}
              {activeTab === 'steam' && (
                <div className="space-y-6">
                  <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                    {t('gaming.steamProfile')}
                  </h2>
                  
                  {isLoadingSteam ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-primary-500 mr-3" />
                      <span className="text-gray-600 dark:text-gray-400">{t('gaming.loadingSteamData')}</span>
                    </div>
                  ) : steamError ? (
                    <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                        <span>{steamError}</span>
                      </div>
                    </div>
                  ) : steamData ? (
                    <div className="space-y-6">
                      {/* Steam Profile */}
                      {steamData.profile && (
                        <SteamProfileCard profile={steamData.profile} />
                      )}
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Steam Level */}
                        {steamData.level !== undefined && steamData.profile && (
                          <SteamLevelCard 
                            level={steamData.level} 
                            profile={steamData.profile}
                          />
                        )}
                        
                        {/* Steam Bans */}
                        {steamData.bans && (
                          <SteamBansCard bans={steamData.bans} />
                        )}
                      </div>
                      
                      {/* Steam Games */}
                      {steamData.games && (
                        <SteamGamesCard games={steamData.games} />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        {displayingOwnStats
                          ? t('gaming.noSteamDataAvailable')
                          : t('gaming.playerNoSteamAccount', { username: userProfile?.username || t('gaming.unknownPlayer') })
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Aim Trainer Tab */}
              {activeTab === 'aim-trainer' && (
                <div id="walkthrough-stats-aim-trainer" className="space-y-6">
                  <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                    {t('gaming.aimTraining')}
                  </h2>
                  <AimTrainerGame gameName="Aim Trainer" />
                </div>
              )}

              {/* Reaction Time Tab */}
              {activeTab === 'reaction-time' && (
                <div className="space-y-6">
                  <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                    {t('gaming.reactionTimeTest')}
                  </h2>
                  <ReactionTimeGame
                    gameName="Reaction Time Test"
                    gameId="e4b0a5a8-c325-4925-8e9c-83d53dcb771c"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Share Options Modal */}
      {displayingOwnStats && (
        <ShareOptionsModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShareWithFriend={() => handleShareStats('friend')}
          onShareToCommunity={() => handleShareStats('community')}
          onViewPublicProfile={() => setShowPlayerProfileModal(true)}
        />
      )}
      
      {/* Player Profile Modal */}
      {displayingOwnStats && (
        <PlayerProfileModal
          isOpen={showPlayerProfileModal}
          onClose={() => setShowPlayerProfileModal(false)}
          userId={user?.id || null}
        />
      )}
      
      {/* Share Chat List Modal */}
      <ChatListModal
        isOpen={showShareChatListModal}
        onClose={() => setShowShareChatListModal(false)}
        initialMessageContent={shareMessageContent}
        onContactSelectForShare={handleContactSelectForShare}
        shareTargetType={shareTargetType}
      />
      
      {/* Share Chat Modal */}
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
      
      {/* Share Channel Modal */}
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

      {/* Onboarding Walkthrough */}
      <OnboardingWalkthrough pageName="gamingStats" />
    </div>
  );
};

export default GamingStatsPage;