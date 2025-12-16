import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, MapPin, Trophy, Clock, UserPlus, CalendarCheck, Video, LifeBuoy, MessageSquare, XCircle, Info } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { Tournament, User } from '../../types';
import { formatDate } from '../../utils/formatters';
import { getTwitchLiveStatusFromTournament } from '../../services/api';
import CreateTicketModal from '../support/CreateTicketModal';
import ChannelModal from '../chat/ChannelModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { supabase } from '../../lib/supabase';
import { DiscordVerificationStatus } from './DiscordVerificationStatus';

interface TournamentSidebarProps {
  tournament: Tournament;
  user: User | null;
  registrationStatus: { registered: boolean; status: string | null };
  currentParticipants: number;
  maxParticipants: number | null;
  backupSlots?: number;
  currentBackups?: number;
  isLoadingParticipants: boolean;
  teamIdFromUrl: string | null;
  userTeamId: string | null;
  isTeamCaptain: boolean;
  currentTeamSize: number;
  maxTeamSize: number | null;
  isLoadingTeamInfo: boolean;
  onRegister: () => void;
  onTeamInvite: () => void;
  onCancelRegistration: () => void;
  isCancelling: boolean;
  canRegister: () => boolean;
  getRegistrationStatus: () => string;
  isTournamentStartedOrFinished: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TournamentSidebar: React.FC<TournamentSidebarProps> = ({
  tournament,
  user,
  registrationStatus,
  currentParticipants,
  maxParticipants,
  backupSlots = 0,
  currentBackups = 0,
  isLoadingParticipants,
  teamIdFromUrl,
  userTeamId,
  isTeamCaptain,
  currentTeamSize,
  maxTeamSize,
  isLoadingTeamInfo,
  onRegister,
  onTeamInvite,
  onCancelRegistration,
  isCancelling,
  canRegister,
  getRegistrationStatus,
  isTournamentStartedOrFinished
}) => {
  const { t } = useTranslation();
  console.log('Debug: isTournamentStartedOrFinished() result =', isTournamentStartedOrFinished());
  console.log('Debug: registrationStatus.registered =', registrationStatus.registered);
  console.log('Debug: registrationStatus.status =', registrationStatus.status);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [registrationOpened, setRegistrationOpened] = useState(false);
  const [tournamentCountdown, setTournamentCountdown] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isTournamentCountdownActive, setIsTournamentCountdownActive] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTeamChatModal, setShowTeamChatModal] = useState(false);
  const [teamChatChannelId, setTeamChatChannelId] = useState<string | null>(null);
  const [teamChatChannelName, setTeamChatChannelName] = useState<string>('');
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const isTeamTournament = tournament?.mode?.toLowerCase().includes('team');

  // Calculate time left until registration opens
  useEffect(() => {
    if (!tournament?.registrationStartDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const registrationStart = new Date(tournament.registrationStartDate!).getTime();
      const difference = registrationStart - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setRegistrationOpened(false);
      } else {
        // Registration has opened!
        if (!registrationOpened) {
          setRegistrationOpened(true);
        }
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [tournament?.registrationStartDate, registrationOpened]);

  // Calculate time left until tournament starts
  useEffect(() => {
    if (!tournament?.startDate) return;

    const calculateTournamentCountdown = () => {
      const now = new Date().getTime();
      const tournamentStart = new Date(tournament.startDate).getTime();
      const difference = tournamentStart - now;

      if (difference > 0 && difference < 7 * 24 * 60 * 60 * 1000) { // Only show countdown if less than 7 days
        setIsTournamentCountdownActive(true);
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTournamentCountdown({ days, hours, minutes, seconds });
      } else if (difference <= 0) {
        // Tournament has started
        setIsTournamentCountdownActive(false);
        setTournamentCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        // More than 7 days until tournament
        setIsTournamentCountdownActive(false);
      }
    };

    calculateTournamentCountdown();
    const timer = setInterval(calculateTournamentCountdown, 1000);

    return () => clearInterval(timer);
  }, [tournament?.startDate]);

  // Get live status from tournament data (updated by Edge function)
  const isStreamLive = getTwitchLiveStatusFromTournament(tournament);

  // Load team chat channel info
  useEffect(() => {
    const loadTeamChatChannel = async () => {
      if (!userTeamId) return;
      
      try {
        const { data, error } = await supabase
          .from('teams')
          .select(`
            chat_channel_id,
            channels:chat_channel_id (
              name,
              description
            )
          `)
          .eq('id', userTeamId)
          .single();
        
        if (error) {
          console.error('Error loading team chat channel:', error);
          return;
        }
        
        if (data?.chat_channel_id) {
          setTeamChatChannelId(data.chat_channel_id);
          setTeamChatChannelName(data.channels?.name || 'Team Chat');
        }
      } catch (error) {
        console.error('Error loading team chat channel:', error);
      }
    };
    
    loadTeamChatChannel();
  }, [userTeamId]);

  const getStatusColor = (status: string) => {
    const openStatus = t('tournamentPage.registrationStatus.open');
    const closedStatus = t('tournamentPage.registrationStatus.closed');
    const openingSoonStatus = t('tournamentPage.registrationStatus.openingSoon');

    switch (status) {
      case openStatus:
        return 'bg-success-100 text-success-800 border-success-200';
      case closedStatus:
        return 'bg-error-100 text-error-800 border-error-200';
      case openingSoonStatus:
        return 'bg-warning-100 text-warning-800 border-warning-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const registrationStatusText = getRegistrationStatus();
  const isCountdownActive = registrationStatusText === t('tournamentPage.registrationStatus.openingSoon') && tournament?.registrationStartDate;

  // Check if user can register (including team invitation scenarios)
  const canUserRegister = () => {
    if (!tournament) return false;
    
    const regStatus = getRegistrationStatus();
    if (regStatus !== t('tournamentPage.registrationStatus.open')) return false;
    
    if (user && registrationStatus.registered) return false;
    
    // Check if tournament is full (only if max participants is specified)
    if (maxParticipants && currentParticipants >= maxParticipants) return false;
    
    // For team tournaments with team invitation, allow registration even without user
    if (isTeamTournament && teamIdFromUrl) {
      return true;
    }
    
    // For regular registration, user must be logged in
    if (!user) return false;
    
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

  // Handle cancel registration with custom confirmation
  const handleCancelRegistration = () => {
    setShowCancelConfirmation(true);
  };

  // Confirm cancellation and execute the actual cancellation
  const confirmCancellation = () => {
    setShowCancelConfirmation(false);
    onCancelRegistration();
  };

  // Get appropriate message for non-authenticated users
  const getUnauthenticatedMessage = () => {
    if (isTeamTournament && teamIdFromUrl) {
      return t('tournamentPage.sidebar.signInToJoinTeam');
    }
    return t('tournamentPage.sidebar.signInToRegister');
  };

  // Get the appropriate label for participants based on tournament type
  const getParticipantLabel = () => {
    return isTeamTournament ? t('tournamentPage.sidebar.teamsRegistered') : t('tournamentPage.participants');
  };

  return (
    <div className="space-y-6">
      {/* Registration Card */}
      <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden shadow-lg relative border border-gray-200 dark:border-gray-800">
        <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg sm:text-xl text-gray-900 dark:text-white">
              {t('tournamentPage.sidebar.registration')}
            </h2>
          </div>
        </div>
        
        <div className="p-4 sm:p-5 md:p-6">
          {/* Tournament Countdown - Show when tournament is about to start */}
          {isTournamentCountdownActive && (
            <div className="text-center mb-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 dark:from-primary-500/20 dark:to-secondary-500/20 border border-primary-500/20 dark:border-primary-500/30 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-gray-900 dark:text-primary-300 font-medium mb-3">
                    {t('tournamentPage.sidebar.tournamentStartsIn')}
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-dark-100/80 dark:bg-dark-200/80 rounded-lg p-2 countdown-number border border-primary-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-primary-400 dark:text-white">{tournamentCountdown.days}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('tournamentPage.sidebar.days')}</div>
                    </div>
                    <div className="bg-dark-100/80 dark:bg-dark-200/80 rounded-lg p-2 countdown-number border border-primary-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-primary-400 dark:text-white">{tournamentCountdown.hours}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('tournamentPage.sidebar.hours')}</div>
                    </div>
                    <div className="bg-dark-100/80 dark:bg-dark-200/80 rounded-lg p-2 countdown-number border border-primary-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-primary-400 dark:text-white">{tournamentCountdown.minutes}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('tournamentPage.sidebar.min')}</div>
                    </div>
                    <div className="bg-dark-100/80 dark:bg-dark-200/80 rounded-lg p-2 border border-primary-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-primary-400 dark:text-white animate-pulse">{tournamentCountdown.seconds}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('tournamentPage.sidebar.sec')}</div>
                    </div>
                  </div>
                </div>
                </div>
            </div>
          )}
          {/* Tournament Status */}
          <div className="text-center mb-6">
            {isCountdownActive ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-warning-500/10 to-error-500/10 dark:from-warning-500/20 dark:to-error-500/20 border border-warning-500/30 dark:border-warning-500/40 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-orange-300 font-medium mb-3">
                    {t('tournamentPage.sidebar.registrationOpensIn')}
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-dark-100/80 dark:bg-dark-200/80 rounded-lg p-2 countdown-number border border-warning-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-warning-400 dark:text-white">{timeLeft.days}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('tournamentPage.sidebar.days')}</div>
                    </div>
                    <div className="bg-dark-100/80 dark:bg-dark-200/80 rounded-lg p-2 countdown-number border border-warning-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-warning-400 dark:text-white">{timeLeft.hours}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('tournamentPage.sidebar.hours')}</div>
                    </div>
                    <div className="bg-dark-100/80 dark:bg-dark-200/80 rounded-lg p-2 countdown-number border border-warning-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-warning-400 dark:text-white">{timeLeft.minutes}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('tournamentPage.sidebar.min')}</div>
                    </div>
                    <div className="bg-dark-100/80 dark:bg-dark-200/80 rounded-lg p-2 border border-warning-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-warning-400 dark:text-white animate-pulse">{timeLeft.seconds}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('tournamentPage.sidebar.sec')}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(registrationStatusText)}`}>
                {registrationStatusText}
              </span>
            )}
          </div>

          {/* Registration Details - Updated with registration dates */}
          <div className="space-y-4 mb-6">
            {/* Registration Start Date */}
            {tournament.registrationStartDate && (
              <div className="flex items-center space-x-3">
                <CalendarCheck className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('tournamentPage.sidebar.registrationStart')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(tournament.registrationStartDate)}</p>
                </div>
              </div>
            )}

            {/* Registration End Date */}
            {tournament.registrationEndDate && (
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('tournamentPage.sidebar.registrationEnd')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(tournament.registrationEndDate)}</p>
                </div>
              </div>
            )}

            {/* Participants Count - Updated to use max_nb_players and include pending and backup */}
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{getParticipantLabel()}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isLoadingParticipants ? (
                    <span className="animate-pulse">{t('tournamentPage.sidebar.loading')}</span>
                  ) : (
                    <span>
                      {`${currentParticipants}${maxParticipants ? `/${maxParticipants}` : ''}`}
                      {backupSlots > 0 && (
                        <span className="block text-xs text-blue-500 mt-1">
                          {t('tournamentPage.sidebar.waitlist')}: {currentBackups}/{backupSlots}
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Live Stream Status */}
            {tournament.twitch_url && (
              <div className="flex items-center space-x-3">
                <Video className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('tournamentPage.sidebar.stream')}</p>
                  <div className="flex items-center">
                    {isStreamLive ? (
                      <a 
                        href={tournament.twitch_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-red-500 hover:text-red-400 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                        {t('tournamentPage.sidebar.live')}
                      </a>
                    ) : (
                      <a
                        href={tournament.twitch_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-600 hover:text-accent-500 transition-colors"
                      >
                        {t('tournamentPage.sidebar.viewChannel')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registration Status Info */}
          {backupSlots > 0 && !registrationStatus.registered && (
            <div className="mb-4 p-3 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-accent-600 dark:text-accent-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-accent-800 dark:text-accent-200">
                  <p className="font-medium">{t('tournamentPage.sidebar.availablePlaces')}</p>
                  <p className="mt-1">{t('tournamentPage.sidebar.waitlistInfo', { count: backupSlots })}</p>
                </div>
              </div>
            </div>
          )}

          {/* Discord Verification Status */}
          {user && tournament?.discord_url && registrationStatus.registered && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t('discord.sidebar.title')}
              </h4>
              <DiscordVerificationStatus
                userId={user.id}
                tournamentId={tournament.id}
              />
            </div>
          )}

          {/* Registration Section */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            {registrationStatus.registered ? (
              <div className="text-center">
                <div className="p-4 bg-success-500/20 border border-success-500/30 rounded-lg mb-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-success-700 dark:text-success-300 font-medium">{t('tournamentPage.sidebar.youAreRegistered')}</p>
                    {registrationStatus.status && (
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={registrationStatus.status} showTooltip={true} />
                      </div>
                    )}
                  </div>
                  {registrationStatus.status === 'backup' && (
                    <div className="mt-3 p-2 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded text-xs text-accent-800 dark:text-accent-200">
                      <Info className="h-3 w-3 inline mr-1" />
                      {t('tournamentPage.sidebar.onWaitlist')}
                    </div>
                  )}
                </div>
                
                {/* Team Information for Team Tournaments */}
                {isTeamTournament && userTeamId && (
                  <>
                    <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('tournamentPage.sidebar.yourTeam')}</span>
                        {isTeamCaptain && (
                          <span className="text-xs bg-accent-600 text-white px-2 py-1 rounded">
                            {t('tournamentPage.sidebar.captain')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{t('tournamentPage.sidebar.team')}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {isLoadingTeamInfo ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            `${currentTeamSize}${maxTeamSize ? `/${maxTeamSize}` : ''} ${t('tournamentPage.sidebar.members')}`
                          )}
                        </span>
                      </div>
                      
                      {/* Team Chat Button */}
                      {teamChatChannelId && (
                        <button
                          onClick={() => setShowTeamChatModal(true)}
                          className="w-full mt-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {t('tournamentPage.sidebar.teamChat')}
                        </button>
                      )}

                      {isTeamCaptain && (
                        <button
                          onClick={onTeamInvite}
                          className="w-full mt-3 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          {t('tournamentPage.sidebar.invitePlayers')}
                        </button>
                      )}
                    </div>
                  </>
                )}
                
                {/* Cancel Registration Button - Only show if tournament hasn't started */}
                {!isTournamentStartedOrFinished() && (
                  <button
                    onClick={handleCancelRegistration}
                    disabled={isCancelling}
                    className="w-full mt-3 bg-error-600 hover:bg-error-700 disabled:bg-error-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
                  >
                    {isCancelling ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        {t('tournamentPage.sidebar.cancelling')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('tournamentPage.sidebar.cancelRegistration')}
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                {canUserRegister() ? (
                  <button
                    onClick={onRegister}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                      registrationOpened 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 animate-pulse-glow animate-pop-in' 
                        : 'bg-primary-600 hover:bg-primary-700'
                    } text-white`}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {teamIdFromUrl ? t('tournamentPage.sidebar.joinTeam') : t('tournamentPage.sidebar.register')}
                    {registrationOpened && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    )}
                  </button>
                ) : (
                  <div className="p-4 bg-gray-500/20 border border-gray-500/30 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {!user
                        ? getUnauthenticatedMessage()
                        : registrationStatusText === t('tournamentPage.registrationStatus.closed')
                          ? t('tournamentPage.sidebar.registrationsClosed')
                          : isCountdownActive
                            ? t('tournamentPage.sidebar.prepareForOpening')
                            : t('tournamentPage.sidebar.registrationNotAvailable')
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Support Button */}
            <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>{t('tournamentPage.sidebar.contactSupport')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Support Modal */}
      <CreateTicketModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        tournamentId={tournament?.id}
        tournamentName={tournament?.title}
      />
      
      {/* Team Chat Modal */}
      {teamChatChannelId && (
        <ChannelModal
          isOpen={showTeamChatModal}
          onClose={() => setShowTeamChatModal(false)}
          channelId={teamChatChannelId}
          channelName={teamChatChannelName}
        />
      )}
      
      {/* Cancel Registration Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onConfirm={confirmCancellation}
        title={t('tournamentPage.sidebar.cancelRegistrationTitle')}
        message={t('tournamentPage.sidebar.cancelRegistrationMessage')}
        confirmText={t('tournamentPage.sidebar.yesCancelButton')}
        cancelText={t('tournamentPage.sidebar.noKeepButton')}
        type="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default TournamentSidebar;