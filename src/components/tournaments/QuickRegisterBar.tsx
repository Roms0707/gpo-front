import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Users, CheckCircle, Clock, UserPlus, AlertCircle, Loader } from 'lucide-react';
import { Tournament, User } from '../../types';
import { getGameTheme } from '../../utils/gameThemes';

interface QuickRegisterBarProps {
  tournament: Tournament;
  user: User | null;
  registrationStatus: { registered: boolean; status: string | null };
  currentParticipants: number;
  maxParticipants: number | null;
  isLoadingParticipants: boolean;
  gameName: string;
  onRegister: () => void;
  canRegister: () => boolean;
  getRegistrationStatus: () => string;
  heroRef: React.RefObject<HTMLDivElement>;
}

const QuickRegisterBar: React.FC<QuickRegisterBarProps> = ({
  tournament,
  user,
  registrationStatus,
  currentParticipants,
  maxParticipants,
  isLoadingParticipants,
  gameName,
  onRegister,
  canRegister,
  getRegistrationStatus,
  heroRef
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const gameTheme = getGameTheme(gameName || tournament?.game);
  const isTeamTournament = tournament?.mode?.toLowerCase().includes('team');
  const registrationStatusText = getRegistrationStatus();

  const isOpen = registrationStatusText === t('tournamentPage.registrationStatus.open');
  const isClosed = registrationStatusText === t('tournamentPage.registrationStatus.closed');
  const isOpeningSoon = registrationStatusText === t('tournamentPage.registrationStatus.openingSoon');

  const isFull = maxParticipants ? currentParticipants >= maxParticipants : false;
  const participantPercentage = maxParticipants ? (currentParticipants / maxParticipants) * 100 : 0;
  const isNearlyFull = participantPercentage >= 80;

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;

      const heroBottom = heroRef.current.getBoundingClientRect().bottom;
      const shouldBeSticky = heroBottom < 100;

      setIsSticky(shouldBeSticky);

      if (shouldBeSticky && !isVisible) {
        setTimeout(() => setIsVisible(true), 50);
      } else if (!shouldBeSticky) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroRef, isVisible]);

  const getStatusBadge = () => {
    if (registrationStatus.registered) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-500/20 border border-success-500/30">
          <CheckCircle className="h-4 w-4 text-success-400" />
          <span className="text-sm font-medium text-success-300">
            {t('tournamentPage.registrationStatus.registered')}
          </span>
        </div>
      );
    }

    if (isOpen) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-500/20 border border-success-500/30">
          <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
          <span className="text-sm font-medium text-success-300">
            {t('tournamentPage.registrationStatus.open')}
          </span>
        </div>
      );
    }

    if (isOpeningSoon) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning-500/20 border border-warning-500/30">
          <Clock className="h-4 w-4 text-warning-400" />
          <span className="text-sm font-medium text-warning-300">
            {t('tournamentPage.registrationStatus.openingSoon')}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-500/20 border border-gray-500/30">
        <AlertCircle className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">
          {t('tournamentPage.registrationStatus.closed')}
        </span>
      </div>
    );
  };

  const getRegisterButton = () => {
    if (registrationStatus.registered) {
      return (
        <div className="flex items-center gap-2 text-success-400">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium hidden sm:inline">
            {t('tournamentPage.registrationStatus.confirmedRegistration')}
          </span>
        </div>
      );
    }

    if (!user) {
      return (
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${gameTheme.colors.primary}, ${gameTheme.colors.secondary})`,
            boxShadow: `0 0 20px ${gameTheme.colors.glow}`
          }}
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('tournamentPage.signIn')}</span>
        </Link>
      );
    }

    if (isFull) {
      return (
        <button
          onClick={onRegister}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-warning-600/80 hover:bg-warning-600 text-white transition-all duration-300"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">{t('tournamentPage.joinWaitlist')}</span>
        </button>
      );
    }

    if (canRegister()) {
      return (
        <button
          onClick={onRegister}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-medium text-white transition-all duration-300 transform hover:scale-105 animate-pulse-glow"
          style={{
            background: `linear-gradient(135deg, ${gameTheme.colors.primary}, ${gameTheme.colors.secondary})`,
            boxShadow: `0 0 25px ${gameTheme.colors.glow}`
          }}
        >
          <UserPlus className="h-4 w-4" />
          <span>{t('tournamentPage.registerNowButton')}</span>
        </button>
      );
    }

    return (
      <div className="text-sm text-gray-400">
        {isClosed
          ? t('tournamentPage.registrationsClosed')
          : t('tournamentPage.registrationNotAvailable')
        }
      </div>
    );
  };

  if (!isSticky) return null;

  return (
    <div
      ref={barRef}
      className={`fixed top-20 left-0 right-0 z-40 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className="backdrop-blur-xl border-b"
        style={{
          background: `linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, ${gameTheme.colors.primary}10 50%, rgba(17, 24, 39, 0.95) 100%)`,
          borderColor: `${gameTheme.colors.primary}30`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {getStatusBadge()}

              <div className="hidden md:flex items-center gap-3 text-gray-300">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  {isLoadingParticipants ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">
                      {currentParticipants}
                      {maxParticipants && `/${maxParticipants}`}
                      {' '}
                      {isTeamTournament ? t('tournamentPage.teams') : t('tournamentPage.participants')}
                    </span>
                  )}
                </div>

                {maxParticipants && maxParticipants > 0 && (
                  <div className="w-24 h-2 bg-dark-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(participantPercentage, 100)}%`,
                        backgroundColor: isNearlyFull
                          ? '#f59e0b'
                          : gameTheme.colors.primary,
                        boxShadow: `0 0 8px ${isNearlyFull ? 'rgba(245, 158, 11, 0.5)' : gameTheme.colors.glow}`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {getRegisterButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickRegisterBar;
