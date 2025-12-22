import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Clock, UserPlus, CalendarCheck, LifeBuoy, XCircle, Info } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { Tournament, User } from '../../types';
import { formatDate } from '../../utils/formatters';
import CreateTicketModal from '../support/CreateTicketModal';
import ConfirmationModal from '../ui/ConfirmationModal';
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
  isTournamentStartedOrFinished: () => boolean;
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
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const isTeamTournament = tournament?.mode?.toLowerCase().includes('team');

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
        <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
            {t('tournamentPage.sidebar.registration')}
          </h2>
        </div>

        <div className="p-4">
          {/* Registration Status Badge */}
          <div className="text-center mb-4">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(registrationStatusText)}`}>
              {registrationStatusText}
            </span>
          </div>

          {/* Registration Dates */}
          <div className="space-y-3 mb-4">
            {tournament.registrationStartDate && (
              <div className="flex items-center space-x-3">
                <CalendarCheck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('tournamentPage.sidebar.registrationStart')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{formatDate(tournament.registrationStartDate)}</p>
                </div>
              </div>
            )}

            {tournament.registrationEndDate && (
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('tournamentPage.sidebar.registrationEnd')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{formatDate(tournament.registrationEndDate)}</p>
                </div>
              </div>
            )}

            {/* Participants Count */}
            <div className="flex items-center space-x-3">
              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getParticipantLabel()}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {isLoadingParticipants ? (
                    <span className="animate-pulse">{t('tournamentPage.sidebar.loading')}</span>
                  ) : (
                    <>
                      {`${currentParticipants}${maxParticipants ? `/${maxParticipants}` : ''}`}
                      {backupSlots > 0 && (
                        <span className="text-xs text-blue-500 ml-2">
                          (+{currentBackups} {t('tournamentPage.sidebar.waitlist').toLowerCase()})
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Discord Verification Status */}
          {user && tournament?.discord_url && registrationStatus.registered && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg">
              <DiscordVerificationStatus
                userId={user.id}
                tournamentId={tournament.id}
              />
            </div>
          )}

          {/* Registration Section */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
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
                    className="w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {teamIdFromUrl ? t('tournamentPage.sidebar.joinTeam') : t('tournamentPage.sidebar.register')}
                  </button>
                ) : (
                  <div className="p-3 bg-gray-500/20 border border-gray-500/30 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {!user
                        ? getUnauthenticatedMessage()
                        : registrationStatusText === t('tournamentPage.registrationStatus.closed')
                          ? t('tournamentPage.sidebar.registrationsClosed')
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