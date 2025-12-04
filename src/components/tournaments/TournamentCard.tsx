import { Suspense } from 'react';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, Trophy, Video, Gift } from 'lucide-react';
import { Tournament } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { checkTournamentRegistration } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { calculateTournamentStatus } from '../../utils/tournamentUtils';
import { formatPrizePoolDisplay, segregatePrizesByType, getFirstPlacePrizeDisplay } from '../../utils/prizePoolUtils';

interface TournamentCardProps {
  tournament: Tournament & {
    calculatedStatus?: 'ongoing' | 'upcoming' | 'completed';
    registrationStatus?: 'open' | 'closed' | 'not_started';
    is_twitch_live?: boolean;
    twitch_last_checked?: string;
    prizes?: any[];
  };
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [backupSlots, setBackupSlots] = useState<number>(0);
  const [backupCount, setBackupCount] = useState<number>(0);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  const [gameLogoUrl, setGameLogoUrl] = useState<string | null>(null);
  
  const {
    id,
    title,
    game,
    startDate,
    endDate,
    cashPrize,
    status,
    header_url,
    main_prize,
    calculatedStatus,
    registrationStatus,
    max_nb_players,
    mode,
    game_id,
    twitch_url,
    is_twitch_live,
    backup
  } = tournament;

  // Check if this is a team tournament
  const isTeamTournament = mode?.toLowerCase().includes('team');

  // Load game logo
  useEffect(() => {
    const loadGameLogo = async () => {
      if (!game_id) return;
      
      try {
        const { data, error } = await supabase
          .from('games')
          .select('image_url')
          .eq('id', game_id)
          .single();
        
        if (error) {
          console.error('Error loading game logo:', error);
          return;
        }
        
        if (data && data.image_url) {
          setGameLogoUrl(data.image_url);
        }
      } catch (error) {
        console.error('Error loading game logo:', error);
      }
    };
    
    loadGameLogo();
  }, [game_id]);

  // Get live status - only show as live if tournament is ongoing AND Twitch stream is live
  const tournamentStatus = calculateTournamentStatus(tournament);
  const isStreamLive = tournamentStatus === 'ongoing' && tournament.is_twitch_live;

  // Load participants count (pending + approved) and max participants with backup support
  useEffect(() => {
    const loadParticipantsData = async () => {
      if (!id) return;

      try {
        setIsLoadingParticipants(true);

        if (isTeamTournament) {
          // For team tournaments, count unique teams by status
          const { data, error } = await supabase.rpc('execute_sql', {
            query: `
              SELECT
                COUNT(DISTINCT CASE WHEN status IN ('pending', 'approved', 'validated') THEN team_id END) as approved_count,
                COUNT(DISTINCT CASE WHEN status = 'backup' THEN team_id END) as backup_count
              FROM tournament_registrations
              WHERE tournament_id = '${id}'
              AND team_id IS NOT NULL
            `
          });

          if (error) {
            console.error('Error loading team participants count:', error);
            setParticipantsCount(0);
            setBackupCount(0);
          } else {
            const approvedCount = data && data.length > 0 ? parseInt(data[0].approved_count) || 0 : 0;
            const backupCnt = data && data.length > 0 ? parseInt(data[0].backup_count) || 0 : 0;
            setParticipantsCount(approvedCount);
            setBackupCount(backupCnt);
          }
        } else {
          // For solo tournaments, count individual registrations by status
          const { count: approvedCount, error: approvedError } = await supabase
            .from('tournament_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', id)
            .in('status', ['pending', 'approved', 'validated']);

          const { count: backupCnt, error: backupError } = await supabase
            .from('tournament_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', id)
            .eq('status', 'backup');

          if (approvedError || backupError) {
            console.error('Error loading participants count:', approvedError || backupError);
            setParticipantsCount(0);
            setBackupCount(0);
          } else {
            setParticipantsCount(approvedCount || 0);
            setBackupCount(backupCnt || 0);
          }
        }

        // Set max participants and backup slots from fields
        setMaxParticipants(max_nb_players || null);
        setBackupSlots(backup || 0);

      } catch (error) {
        console.error('Error loading participants data:', error);
        setParticipantsCount(0);
        setBackupCount(0);
        setMaxParticipants(null);
        setBackupSlots(0);
      } finally {
        setIsLoadingParticipants(false);
      }
    };

    loadParticipantsData();
  }, [id, max_nb_players, backup, mode, isTeamTournament]);

  // Check if user is registered for this tournament
  useEffect(() => {
    const checkRegistration = async () => {
      if (!user?.id || !id) return;
      
      try {
        setIsCheckingRegistration(true);
        const regStatus = await checkTournamentRegistration(id, user.id);
        setIsRegistered(regStatus.registered);
      } catch (error) {
        console.error('Error checking registration status:', error);
        setIsRegistered(false);
      } finally {
        setIsCheckingRegistration(false);
      }
    };
    
    checkRegistration();
  }, [user?.id, id]);

  // Handle click to scroll to top
  const handleClick = () => {
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle click for non-authenticated users
  const handleUnauthenticatedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login', { state: { from: `/tournaments/${id}` } });
  };

  // Safely format date with validation
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return t('tournamentCard.dateToConfirm');
      }
      const currentLanguage = i18n.language || 'en';
      const locale = currentLanguage.startsWith('fr') ? fr : enUS;
      return format(date, 'dd MMM yyyy', { locale });
    } catch (error) {
      console.error('Error formatting date:', error);
      return t('tournamentCard.dateToConfirm');
    }
  };

  const formattedStartDate = formatDate(startDate);
  
  const getStatusBadge = () => {
    // Use calculated status if available, otherwise fall back to database status
    const currentStatus = calculatedStatus || status;

    switch (currentStatus) {
      case 'ongoing':
        return <span className="badge badge-live">{t('tournamentCard.ongoing')}</span>;
      case 'upcoming':
        return <span className="badge badge-upcoming">{t('tournamentCard.upcoming')}</span>;
      case 'completed':
        return <span className="badge badge-completed">{t('tournamentCard.completed')}</span>;
      default:
        return null;
    }
  };

  const prizeDisplay = formatPrizePoolDisplay(
    tournament.full_prize || null,
    tournament.main_prize || null,
    tournament.prizes || [],
    false
  );

  const firstPlaceInfo = getFirstPlacePrizeDisplay(tournament.prizes || [], false);
  const hasMixedPrizes = prizeDisplay.hasPhysicalPrizes && firstPlaceInfo.isMonetary;
  const segregated = segregatePrizesByType(tournament.prizes || []);

  const getRegistrationStatusText = () => {
    const currentStatus = calculatedStatus || status;

    if (currentStatus === 'ongoing') {
      return t('tournamentCard.live');
    }

    if (currentStatus === 'completed') {
      return t('tournamentCard.tournamentCompleted');
    }

    // If user is registered, show that first
    if (user && isRegistered) {
      return t('tournamentCard.youAreRegistered');
    }

    // For upcoming tournaments, check registration status
    if (registrationStatus === 'open') {
      return t('tournamentCard.registrationOpen');
    } else if (registrationStatus === 'not_started') {
      return t('tournamentCard.registrationOpeningSoon');
    } else {
      return t('tournamentCard.registrationClosed');
    }
  };

  // Get the appropriate label for participants based on tournament type
  const getParticipantLabel = () => {
    return isTeamTournament ? t('tournamentCard.teams') : t('tournamentCard.participants');
  };

  return (
    <Link
      to={`/tournaments/${id}`}
      className="block group"
      onClick={user ? handleClick : handleUnauthenticatedClick}
      aria-label={t('tournamentCard.ariaLabel', { title, game, date: formattedStartDate, status: getRegistrationStatusText() })}
    >
      <div className="card hover:translate-y-[-4px] transition-all duration-300">
        <div className="relative">
          <img
            src={header_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
            alt=""
            className="w-full h-36 sm:h-40 md:h-44 object-cover"
            aria-hidden="true"
          />
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end space-y-1.5 sm:space-y-2">
            {getStatusBadge()}
            
            {/* Live Stream Indicator */}
            {twitch_url && isStreamLive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(twitch_url, '_blank', 'noopener,noreferrer');
                }}
                className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-medium hover:bg-red-700 transition-colors"
                aria-label={t('tournamentCard.watchLiveStream')}
              >
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full mr-1 animate-pulse" aria-hidden="true"></span>
                LIVE
                <Video className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 sm:ml-1" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-300/95 via-dark-300/70 to-transparent p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center">
              {gameLogoUrl && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-md overflow-hidden mr-2 sm:mr-2.5 md:mr-3 bg-dark-200/80 flex-shrink-0 border border-gray-700/30">
                  <img
                    src={gameLogoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    aria-hidden="true"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-white line-clamp-1">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-200 truncate">{game}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-2">
            <div className="flex items-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 min-w-0">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{formattedStartDate}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" aria-hidden="true" />
              <span>
                {isLoadingParticipants ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>
                    {`${participantsCount}${maxParticipants ? `/${maxParticipants}` : ''}`}
                    {backupSlots > 0 && (
                      <span className="ml-1 text-blue-500 hidden sm:inline" title={t('tournamentCard.waitlist')}>
                        (+{backupCount}/{backupSlots})
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
          
          <div className="relative bg-gradient-to-r from-warning-500/5 via-warning-500/10 to-transparent p-2 sm:p-2.5 md:p-3 rounded-lg border-l-2 border-warning-500/50 group-hover:border-warning-500 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-gradient-to-r from-warning-500/20 to-warning-600/20 px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1 rounded-md border border-warning-500/30 flex-shrink-0">
                <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-warning-400" aria-hidden="true" />
                <span className="text-[9px] sm:text-[10px] font-bold text-warning-300 uppercase tracking-wide whitespace-nowrap">
                  {t('tournamentCard.firstPlace')}
                </span>
              </div>
              <span className="font-bold text-base sm:text-lg md:text-xl text-warning-300 group-hover:text-warning-200 transition-colors drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] truncate">
                {firstPlaceInfo.displayText}
              </span>
            </div>
            {hasMixedPrizes && (
              <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-[10px] sm:text-xs text-blue-400">
                <Gift className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>{t('tournamentCard.physicalRewards')}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-warning-500/0 via-warning-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary-600/10 to-secondary-600/10 px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <span className={`text-xs sm:text-sm truncate ${
              user && isRegistered ? 'text-success-400 font-medium' : 'text-gray-300'
            }`}>
              {isCheckingRegistration ? t('tournamentCard.checking') : getRegistrationStatusText()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;