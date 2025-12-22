import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionGuard } from '../hooks/useSubscriptionGuard';
import { Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { cancelTournamentRegistration } from '../services/api';
import TrainingGamesContainer from '../components/tournaments/TrainingGamesContainer';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '../constants';
import { DiscordConnectionRequired } from '../components/tournaments/DiscordConnectionRequired';
import { discordVerificationService } from '../services/discordVerificationService';
import { DiscordVerificationStatus as DiscordStatus } from '../types';
import { modalStateManager } from '../utils/modalStateManager';

// Components
import TournamentHero from '../components/tournaments/TournamentHero';
import TournamentTabs from '../components/tournaments/TournamentTabs';
import TournamentSidebar from '../components/tournaments/TournamentSidebar';
import TournamentBracket from '../components/tournaments/TournamentBracket';
import RegistrationModal from '../components/tournaments/RegistrationModal';
import TeamInvitePopup from '../components/tournaments/TeamInvitePopup';
import LookingForPeopleModal from '../components/tournaments/LookingForPeopleModal';
import DiscordInviteModal from '../components/tournaments/DiscordInviteModal';
import JoinTournamentModal from '../components/tournaments/JoinTournamentModal';
import QuickRegisterBar from '../components/tournaments/QuickRegisterBar';
import TeamManagementCard from '../components/tournaments/TeamManagementCard';

// Tabs
import HomeTab from '../components/tournaments/tabs/HomeTab';
import RewardsTab from '../components/tournaments/tabs/RewardsTab';
import ClassementTab from '../components/tournaments/tabs/ClassementTab';
import TrainingTab from '../components/tournaments/tabs/TrainingTab';
import RulesTab from '../components/tournaments/tabs/RulesTab';
import OnboardingWalkthrough from '../components/onboarding/OnboardingWalkthrough';

// Hooks
import { useTournamentData } from '../hooks/useTournamentData';
import { useTeamData } from '../hooks/useTeamData';
import { useTournamentRankings } from '../hooks/useTournamentRankings';
import { useGameContent } from '../hooks/useGameContent';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

const TournamentPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { checkAccess, isKliento } = useSubscriptionGuard();
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState('home');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showTeamInvitePopup, setShowTeamInvitePopup] = useState(false);
  const [showLfpModal, setShowLfpModal] = useState(false);
  const [showDiscordInviteModal, setShowDiscordInviteModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamIdFromUrl, setTeamIdFromUrl] = useState<string | null>(null);
  const [showJoinTournamentModal, setShowJoinTournamentModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus>({
    isConnected: false,
    isMember: false,
  });
  const [showDiscordBanner, setShowDiscordBanner] = useState(false);

  // Get query params for team invitation and tab selection
  const params = new URLSearchParams(location.search);
  const teamId = params.get('teamId');
  const tabParam = params.get('tab');
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle Discord OAuth return
  useEffect(() => {
    const fromDiscordOAuth = params.get('fromDiscordOAuth');
    const openModal = params.get('openModal');

    if (fromDiscordOAuth === 'true' && openModal === 'true') {
      console.log('[TournamentPage] Detected return from Discord OAuth');

      // Get saved modal state
      const savedState = modalStateManager.getAndClearModalState();

      if (savedState) {
        console.log('[TournamentPage] Restoring modal state:', savedState);

        // Restore team ID if it was saved
        if (savedState.teamId) {
          setTeamIdFromUrl(savedState.teamId);
        }

        // Show success message
        toast.success(t('discord.oauth.connectedSuccess'));

        // Open the registration modal after a short delay to allow state to update
        setTimeout(() => {
          setShowRegistrationModal(true);
        }, 100);
      } else {
        console.log('[TournamentPage] No saved modal state found, opening modal anyway');
        // Still open the modal even if no saved state
        toast.success(t('discord.oauth.connectedSuccess'));
        setTimeout(() => {
          setShowRegistrationModal(true);
        }, 100);
      }

      // Clean up URL parameters
      const newParams = new URLSearchParams(location.search);
      newParams.delete('fromDiscordOAuth');
      newParams.delete('openModal');

      // Update URL without reloading the page
      const newSearch = newParams.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      navigate(newUrl, { replace: true });
    }
  }, [location.search]);

  // Set active tab from URL parameter if present
  useEffect(() => {
    if (tabParam && ['home', 'rewards', 'bracket', 'classement', 'training', 'rules', 'lfp'].includes(tabParam)) {
      setActiveTab(tabParam);

      // If it's the LFP tab, also show the LFP modal
      if (tabParam === 'lfp') {
        setShowLfpModal(true);
      }
    }
  }, [tabParam]);
  
  useEffect(() => {
    if (teamId) {
      setTeamIdFromUrl(teamId);
    }
  }, [teamId]);
  
  // Load tournament data
  const {
    tournament,
    prizes,
    isLoading,
    registrationStatus,
    setRegistrationStatus,
    gameName,
    currentParticipants,
    maxParticipants,
    backupSlots,
    currentBackups,
    isLoadingParticipants,
    loadParticipantsCount
  } = useTournamentData(user);
  
  // Load team data
  const {
    userTeamId,
    userTeamName,
    currentTeamSize,
    maxTeamSize,
    isTeamCaptain,
    isLoadingTeamInfo,
    loadUserTeamInfo
  } = useTeamData(tournament, user, registrationStatus);
  
  // Load tournament rankings
  const {
    tournamentRankings,
    isLoadingRankings
  } = useTournamentRankings(activeTab, tournament);

  // Check Discord verification status
  useEffect(() => {
    const checkDiscordStatus = async () => {
      if (!user || !tournament?.id || !tournament?.discord_url || !registrationStatus.registered) {
        setShowDiscordBanner(false);
        return;
      }

      const status = await discordVerificationService.checkVerificationStatus(user.id, tournament.id);
      setDiscordStatus(status);

      // Show banner if Discord is required but user is not connected or not a member
      setShowDiscordBanner(
        tournament.discord_url && (!status.isConnected || !status.isMember)
      );
    };

    checkDiscordStatus();

    // Subscribe to real-time updates if Discord is required
    if (user && tournament?.id && tournament?.discord_url && registrationStatus.registered) {
      const unsubscribe = discordVerificationService.subscribeToVerificationUpdates(
        user.id,
        tournament.id,
        (newStatus) => {
          setDiscordStatus(newStatus);
          setShowDiscordBanner(!newStatus.isConnected || !newStatus.isMember);
        }
      );

      return unsubscribe;
    }
  }, [user, tournament?.id, tournament?.discord_url, registrationStatus.registered]);
  
  // Load game content
  const {
    gameContent,
    isLoadingContent
  } = useGameContent(activeTab, tournament?.game_id);
  
  // Handle team invitation flow when user logs in
  useEffect(() => {
    if (user && teamIdFromUrl && tournament) {
      // If user is already registered, show registration modal to handle team change
      if (registrationStatus.registered) {
        setShowRegistrationModal(true);
      } 
      // If user is not registered, show registration modal to register and join team
      else if (!registrationStatus.registered) {
        setShowRegistrationModal(true);
      }
    }
  }, [user, teamIdFromUrl, tournament, registrationStatus.registered]);
  
  // Check if tournament is started or finished
  const isTournamentStartedOrFinished = () => {
    if (!tournament) return false;
    
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    
    return now >= startDate; // Tournament has started or finished
  };

  // Determine tournament status for bracket display
  const getTournamentStatus = () => {
    if (!tournament) return 'upcoming';
    
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    if (now > endDate) {
      return 'completed';
    } else if (now >= startDate && now <= endDate) {
      return 'ongoing';
    } else {
      return 'upcoming';
    }
  };
  
  const getRegistrationStatus = () => {
    if (!tournament) return t('tournamentPage.registrationStatus.closed');
    
    const now = new Date();
    const regStartDate = tournament.registrationStartDate ? new Date(tournament.registrationStartDate) : null;
    const regEndDate = tournament.registrationEndDate ? new Date(tournament.registrationEndDate) : null;
    
    if (regStartDate && now < regStartDate) {
      return t('tournamentPage.registrationStatus.openingSoon');
    }
    
    if (regEndDate && now > regEndDate) {
      return t('tournamentPage.registrationStatus.closed');
    }
    
    if ((!regStartDate || now >= regStartDate) && (!regEndDate || now <= regEndDate)) {
      return t('tournamentPage.registrationStatus.open');
    }
    
    return t('tournamentPage.registrationStatus.closed');
  };
  
  const canRegister = () => {
    if (!tournament || !user) return false;
    
    const regStatus = getRegistrationStatus();
    if (regStatus !== t('tournamentPage.registrationStatus.open')) return false;
    
    if (registrationStatus.registered) return false;
    
    // Check if tournament is full (only if max participants is specified)
    if (maxParticipants && currentParticipants >= maxParticipants) return false;
    
    // Check country eligibility
    if (tournament.eligible_countries && user.country) {
      const eligibleCountries = tournament.eligible_countries.split(',').map(c => c.trim());
      if (!eligibleCountries.includes(user.country)) return false;
    }
    
    // Check age eligibility
    if (tournament.minimum_age && user.dateOfBirth) {
      const birthDate = new Date(user.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < tournament.minimum_age) return false;
    }
    
    return true;
  };
  
  // Check if tournament has started and user can join
  const canJoinTournament = () => {
    if (!tournament || !user || !registrationStatus.registered) return false;
    
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    // Tournament must be ongoing (started but not ended)
    return now >= startDate && now <= endDate;
  };
  
  const handleRegister = async () => {
    if (!user) {
      const currentUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${currentUrl}`);
      return;
    }

    if (isKliento) {
      const hasAccess = await checkAccess();
      if (!hasAccess) {
        return;
      }
    }

    if (registrationStatus.registered && teamIdFromUrl) {
      setShowRegistrationModal(true);
      return;
    }

    if (!canRegister()) {
      toast.error(t('tournamentPage.errors.cannotRegister'));
      return;
    }

    setShowRegistrationModal(true);
  };
  
  const handleRegistrationConfirm = async (newRegistrationStatus: { registered: boolean, status: string }) => {
    if (!tournament?.id || !user?.id) return;
    
    try {
      setIsRegistering(true);
      
      // Update local state with the new registration status
      setRegistrationStatus(newRegistrationStatus);
      toast.success(t('tournamentPage.success.registrationSuccess'));
      setShowRegistrationModal(false);
      
      // Reload participants count with tournament mode
      await loadParticipantsCount(tournament.id, tournament.mode);
      
      // Load team info if this is a team tournament
      if (tournament.mode?.toLowerCase().includes('team')) {
        await loadUserTeamInfo(tournament.id, user.id);
      }
      
      // Clear team ID from URL after successful registration
      if (teamIdFromUrl) {
        const newUrl = location.pathname;
        window.history.replaceState({}, '', newUrl);
        setTeamIdFromUrl(null);
      }
      
      // Show Discord invite modal if tournament has a Discord URL
      if (tournament.discord_url) {
        setShowDiscordInviteModal(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(t('tournamentPage.errors.registrationError'));
    } finally {
      setIsRegistering(false);
    }
  };
  
  const handleTeamInvite = () => {
    if (!userTeamId || !userTeamName || !tournament?.id) return;
    
    setShowTeamInvitePopup(true);
  };
  
  const handleLfpClick = () => {
    setShowLfpModal(true);
  };
  
  const handleCancelRegistration = async () => {
    if (!user?.id || !tournament?.id) return;
    
    // Check if tournament hasn't started yet
    if (isTournamentStartedOrFinished()) {
      toast.error(t('tournamentPage.errors.cancelOnlyBeforeStart'));
      return;
    }
    
    try {
      setIsCancelling(true);
      
      await cancelTournamentRegistration(tournament.id, user.id);
      
      // Update registration status
      setRegistrationStatus({ registered: false, status: null });
      
      // Reload participants count
      await loadParticipantsCount(tournament.id, tournament.mode);
      
      // Load team info if this is a team tournament
      if (tournament.mode?.toLowerCase().includes('team')) {
        await loadUserTeamInfo(tournament.id, user.id);
      }
      
      toast.success(t('tournamentPage.success.cancelSuccess'));
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast.error(t('tournamentPage.errors.cancelError'));
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Check if this is a team tournament
  const isTeamTournament = tournament?.mode?.toLowerCase().includes('team');

  // Define all possible tabs in order
  const allTabs = ['home', 'rewards', 'bracket', 'classement', 'rules', 'training', 'training-games', 'lfp'];

  // Swipe gesture handlers
  const handleSwipeLeft = () => {
    const currentIndex = allTabs.indexOf(activeTab);
    if (currentIndex < allTabs.length - 1) {
      const nextTab = allTabs[currentIndex + 1];
      // Only navigate to tabs that should be shown
      if (
        nextTab === 'training' && !user ||
        nextTab === 'training-games' && !shouldShowTrainingGames() ||
        nextTab === 'lfp' && !isTeamTournament
      ) {
        // Skip to the next valid tab
        const validNextTab = allTabs.slice(currentIndex + 2).find(tab => {
          if (tab === 'training') return !!user;
          if (tab === 'training-games') return shouldShowTrainingGames();
          if (tab === 'lfp') return isTeamTournament;
          return true;
        });
        if (validNextTab) setActiveTab(validNextTab);
      } else {
        setActiveTab(nextTab);
      }
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = allTabs.indexOf(activeTab);
    if (currentIndex > 0) {
      const prevTab = allTabs[currentIndex - 1];
      // Only navigate to tabs that should be shown
      if (
        prevTab === 'training' && !user ||
        prevTab === 'training-games' && !shouldShowTrainingGames() ||
        prevTab === 'lfp' && !isTeamTournament
      ) {
        // Skip to the previous valid tab
        const validPrevTab = allTabs.slice(0, currentIndex - 1).reverse().find(tab => {
          if (tab === 'training') return !!user;
          if (tab === 'training-games') return shouldShowTrainingGames();
          if (tab === 'lfp') return isTeamTournament;
          return true;
        });
        if (validPrevTab) setActiveTab(validPrevTab);
      } else {
        setActiveTab(prevTab);
      }
    }
  };

  const shouldShowTrainingGames = () => {
    if (!tournament?.game_id) return false;
    return APP_CONFIG.AIM_TRAINER_GAME_IDS.includes(tournament.game_id) ||
           APP_CONFIG.REACTION_TIME_ONLY_GAME_IDS.includes(tournament.game_id);
  };

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    minSwipeDistance: 50,
    enabled: activeTab !== 'bracket'
  });

  // Add touch event listeners
  useEffect(() => {
    const contentArea = document.getElementById('tournament-content-area');
    if (!contentArea) return;

    contentArea.addEventListener('touchstart', handleTouchStart);
    contentArea.addEventListener('touchmove', handleTouchMove);
    contentArea.addEventListener('touchend', handleTouchEnd);

    return () => {
      contentArea.removeEventListener('touchstart', handleTouchStart);
      contentArea.removeEventListener('touchmove', handleTouchMove);
      contentArea.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeTab, user, tournament?.game_id, isTeamTournament]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!tournament) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="bg-dark-100 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-heading font-bold mb-4">
            {t('tournamentPage.tournamentNotFound')}
          </h2>
          <p className="text-gray-400 mb-6">
            {t('tournamentPage.tournamentNotFoundDesc')}
          </p>
          <Link to="/" className="btn btn-primary">
            {t('tournamentPage.returnHome')}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Hero Section */}
      <TournamentHero
        ref={heroRef}
        tournament={tournament}
        currentParticipants={currentParticipants}
        isLoadingParticipants={isLoadingParticipants}
        prizes={prizes}
      />

      {/* Always Visible Quick Register Bar */}
      <QuickRegisterBar
        tournament={tournament}
        user={user}
        registrationStatus={registrationStatus}
        currentParticipants={currentParticipants}
        maxParticipants={maxParticipants}
        isLoadingParticipants={isLoadingParticipants}
        gameName={gameName}
        onRegister={handleRegister}
        canRegister={canRegister}
        getRegistrationStatus={getRegistrationStatus}
      />

      {/* Tabs Navigation */}
      <TournamentTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTeamTournament={isTeamTournament}
        userTeamId={userTeamId}
        isTeamCaptain={isTeamCaptain}
        tournamentGameId={tournament?.game_id}
      />

      {/* Discord Verification Banner */}
      {showDiscordBanner && (
        <div className="container mx-auto px-4 pt-6">
          <DiscordConnectionRequired variant="banner" />
        </div>
      )}

      <div id="tournament-content-area" className="container mx-auto px-4 py-12">
        {/* For bracket tab, use full width */}
        {activeTab === 'bracket' ? (
          <div className="w-full">
            {getTournamentStatus() === 'upcoming' ? (
              <div className="w-full bg-dark-100 rounded-xl p-8 text-center">
                <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-xl mb-2">{t('tournamentPage.bracketComingSoon')}</h3>
                <p className="text-gray-400">
                  {t('tournamentPage.bracketComingSoonDesc')}
                </p>
              </div>
            ) : (
              <TournamentBracket
                tournamentId={tournament?.id || ''}
                tournamentFormat={tournament?.format || ''}
                tournamentStatus={getTournamentStatus()}
                tournamentType={tournament?.mode || 'solo'}
                gameId={tournament?.game_id || null}
              />
            )}
          </div>
        ) : activeTab === 'lfp' ? (
          // Only show LFP modal for team tournaments
          isTeamTournament ? (
            <LookingForPeopleModal
              isOpen={true}
              onClose={() => setActiveTab('home')}
              tournamentId={tournament.id}
              userTeamId={userTeamId}
              isTeamCaptain={isTeamCaptain}
            />
          ) : (
            <div className="w-full bg-dark-100 rounded-xl p-8 text-center">
              <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-xl mb-2">{t('tournamentPage.featureNotAvailable')}</h3>
              <p className="text-gray-400">
                {t('tournamentPage.lfpNotAvailableDesc')}
              </p>
            </div>
          )
        ) : activeTab === 'rewards' ? (
          // Rewards Tab
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RewardsTab 
                tournament={tournament}
                prizes={prizes}
                gameName={gameName}
              />
            </div>
            
            {/* Sidebar for rewards tab */}
            <div className="space-y-6">
              <TournamentSidebar
                tournament={tournament}
                user={user}
                registrationStatus={registrationStatus}
                currentParticipants={currentParticipants}
                maxParticipants={maxParticipants}
                backupSlots={backupSlots}
                currentBackups={currentBackups}
                isLoadingParticipants={isLoadingParticipants}
                teamIdFromUrl={teamIdFromUrl}
                userTeamId={userTeamId}
                isTeamCaptain={isTeamCaptain}
                currentTeamSize={currentTeamSize}
                maxTeamSize={maxTeamSize}
                isLoadingTeamInfo={isLoadingTeamInfo}
                onRegister={handleRegister}
                onTeamInvite={handleTeamInvite}
                onCancelRegistration={handleCancelRegistration}
                isCancelling={isCancelling}
                canRegister={canRegister}
                getRegistrationStatus={getRegistrationStatus}
                isTournamentStartedOrFinished={isTournamentStartedOrFinished}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Home Tab - Streamlined Layout */}
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Tournament Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Team Management Card - Only for registered team tournament users */}
                  {isTeamTournament && userTeamId && registrationStatus.registered && (
                    <TeamManagementCard
                      userTeamId={userTeamId}
                      userTeamName={userTeamName || ''}
                      isTeamCaptain={isTeamCaptain}
                      currentTeamSize={currentTeamSize}
                      maxTeamSize={maxTeamSize}
                      isLoadingTeamInfo={isLoadingTeamInfo}
                      gameName={gameName}
                      onTeamInvite={handleTeamInvite}
                    />
                  )}

                  {/* Tournament Info */}
                  <HomeTab
                    tournament={tournament}
                    gameName={gameName}
                  />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <TournamentSidebar
                    tournament={tournament}
                    user={user}
                    registrationStatus={registrationStatus}
                    currentParticipants={currentParticipants}
                    maxParticipants={maxParticipants}
                    isLoadingParticipants={isLoadingParticipants}
                    teamIdFromUrl={teamIdFromUrl}
                    userTeamId={userTeamId}
                    isTeamCaptain={isTeamCaptain}
                    currentTeamSize={currentTeamSize}
                    maxTeamSize={maxTeamSize}
                    isLoadingTeamInfo={isLoadingTeamInfo}
                    onRegister={handleRegister}
                    onTeamInvite={handleTeamInvite}
                    onCancelRegistration={handleCancelRegistration}
                    isCancelling={isCancelling}
                    canRegister={canRegister}
                    getRegistrationStatus={getRegistrationStatus}
                    isTournamentStartedOrFinished={isTournamentStartedOrFinished}
                  />
                </div>
              </div>
            )}
            
            {/* Other tabs */}
            {activeTab === 'classement' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ClassementTab 
                    tournament={tournament}
                    tournamentRankings={tournamentRankings}
                    isLoadingRankings={isLoadingRankings}
                    gameName={gameName}
                  />
                </div>
                
                {/* Sidebar for non-home tabs */}
                <div className="space-y-6">
                  <TournamentSidebar
                    tournament={tournament}
                    user={user}
                    registrationStatus={registrationStatus}
                    currentParticipants={currentParticipants}
                    maxParticipants={maxParticipants}
                    isLoadingParticipants={isLoadingParticipants}
                    teamIdFromUrl={teamIdFromUrl}
                    userTeamId={userTeamId}
                    isTeamCaptain={isTeamCaptain}
                    currentTeamSize={currentTeamSize}
                    maxTeamSize={maxTeamSize}
                    isLoadingTeamInfo={isLoadingTeamInfo}
                    onRegister={handleRegister}
                    onTeamInvite={handleTeamInvite}
                    onCancelRegistration={handleCancelRegistration}
                    isCancelling={isCancelling}
                    canRegister={canRegister}
                    getRegistrationStatus={getRegistrationStatus}
                    isTournamentStartedOrFinished={isTournamentStartedOrFinished}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'training' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <TrainingTab 
                    tournament={tournament}
                    gameName={gameName}
                  />
                </div>
                
                {/* Sidebar for non-home tabs */}
                <div className="space-y-6">
                  <TournamentSidebar
                    tournament={tournament}
                    user={user}
                    registrationStatus={registrationStatus}
                    currentParticipants={currentParticipants}
                    maxParticipants={maxParticipants}
                    isLoadingParticipants={isLoadingParticipants}
                    teamIdFromUrl={teamIdFromUrl}
                    userTeamId={userTeamId}
                    isTeamCaptain={isTeamCaptain}
                    currentTeamSize={currentTeamSize}
                    maxTeamSize={maxTeamSize}
                    isLoadingTeamInfo={isLoadingTeamInfo}
                    onRegister={handleRegister}
                    onTeamInvite={handleTeamInvite}
                    onCancelRegistration={handleCancelRegistration}
                    isCancelling={isCancelling}
                    canRegister={canRegister}
                    getRegistrationStatus={getRegistrationStatus}
                    isTournamentStartedOrFinished={isTournamentStartedOrFinished}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'rules' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <RulesTab 
                    tournament={tournament}
                    gameName={gameName}
                  />
                </div>
                
                {/* Sidebar for non-home tabs */}
                <div className="space-y-6">
                  <TournamentSidebar
                    tournament={tournament}
                    user={user}
                    registrationStatus={registrationStatus}
                    currentParticipants={currentParticipants}
                    maxParticipants={maxParticipants}
                    isLoadingParticipants={isLoadingParticipants}
                    teamIdFromUrl={teamIdFromUrl}
                    userTeamId={userTeamId}
                    isTeamCaptain={isTeamCaptain}
                    currentTeamSize={currentTeamSize}
                    maxTeamSize={maxTeamSize}
                    isLoadingTeamInfo={isLoadingTeamInfo}
                    onRegister={handleRegister}
                    onTeamInvite={handleTeamInvite}
                    onCancelRegistration={handleCancelRegistration}
                    isCancelling={isCancelling}
                    canRegister={canRegister}
                    getRegistrationStatus={getRegistrationStatus}
                    isTournamentStartedOrFinished={isTournamentStartedOrFinished}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'training-games' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                    <h2 className="font-heading font-bold text-2xl mb-6 flex items-center text-gray-900 dark:text-white">
                      <Target className="h-6 w-6 text-primary-500 mr-2" />
                      {t('tournamentTabs.trainingGames')} - {gameName || tournament?.game}
                    </h2>
                    <TrainingGamesContainer
                      gameName={gameName || tournament?.game || 'Game'}
                      gameId={tournament?.game_id || ''}
                    />
                  </div>
                </div>

                {/* Sidebar for training games tab */}
                <div className="space-y-6">
                  <TournamentSidebar
                    tournament={tournament}
                    user={user}
                    registrationStatus={registrationStatus}
                    currentParticipants={currentParticipants}
                    maxParticipants={maxParticipants}
                    isLoadingParticipants={isLoadingParticipants}
                    teamIdFromUrl={teamIdFromUrl}
                    userTeamId={userTeamId}
                    isTeamCaptain={isTeamCaptain}
                    currentTeamSize={currentTeamSize}
                    maxTeamSize={maxTeamSize}
                    isLoadingTeamInfo={isLoadingTeamInfo}
                    onRegister={handleRegister}
                    onTeamInvite={handleTeamInvite}
                    onCancelRegistration={handleCancelRegistration}
                    isCancelling={isCancelling}
                    canRegister={canRegister}
                    getRegistrationStatus={getRegistrationStatus}
                    isTournamentStartedOrFinished={isTournamentStartedOrFinished}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Registration Modal */}
      <RegistrationModal
        tournament={tournament}
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onConfirm={handleRegistrationConfirm}
        isLoading={isRegistering}
        teamId={teamIdFromUrl}
        registrationStatus={registrationStatus}
        userTeamId={userTeamId}
      />
      
      {/* Team Invite Popup */}
      <TeamInvitePopup
        isOpen={showTeamInvitePopup}
        onClose={() => setShowTeamInvitePopup(false)}
        teamId={userTeamId || ''}
        teamName={userTeamName || ''}
        tournamentId={tournament?.id || ''}
        tournamentName={tournament?.title || ''}
      />
      
      {/* Looking For People Modal */}
      {isTeamTournament && (
        <LookingForPeopleModal
          isOpen={showLfpModal}
          onClose={() => {
            setShowLfpModal(false);
            // Update URL to remove tab=lfp parameter
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('tab');
            window.history.replaceState({}, '', newUrl.toString());
            setActiveTab('home');
          }}
          tournamentId={tournament?.id || ''}
          userTeamId={userTeamId}
          isTeamCaptain={isTeamCaptain}
        />
      )}
      
      {/* Discord Invite Modal */}
      <DiscordInviteModal
        isOpen={showDiscordInviteModal}
        onClose={() => setShowDiscordInviteModal(false)}
        discordUrl={tournament?.discord_url}
        tournamentTitle={tournament?.title || ''}
      />
      
      {/* Join Tournament Modal */}
      {user && (
        <JoinTournamentModal
          isOpen={showJoinTournamentModal}
          onClose={() => setShowJoinTournamentModal(false)}
          tournament={tournament}
          user={user}
        />
      )}

      {/* Onboarding Walkthrough */}
      <OnboardingWalkthrough pageName="tournament" />
    </div>
  );
};

export default TournamentPage;