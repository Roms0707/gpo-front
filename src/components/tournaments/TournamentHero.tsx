import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Trophy, ArrowLeft, Loader, Video } from 'lucide-react';
import { Tournament, TournamentPrize } from '../../types';
import { supabase } from '../../lib/supabase';
import { calculateTournamentStatus } from '../../utils/tournamentUtils';
import { formatPrizePoolDisplay, getFirstPlacePrizeDisplay } from '../../utils/prizePoolUtils';

interface TournamentHeroProps {
  tournament: Tournament;
  currentParticipants: number;
  isLoadingParticipants: boolean;
  prizes?: TournamentPrize[];
}

const TournamentHero: React.FC<TournamentHeroProps> = ({
  tournament,
  currentParticipants,
  isLoadingParticipants,
  prizes = []
}) => {
  const { t, i18n } = useTranslation();
  const [gameLogoUrl, setGameLogoUrl] = useState<string | null>(null);
  
  // Load game logo
  useEffect(() => {
    const loadGameLogo = async () => {
      if (!tournament?.game_id) return;
      
      try {
        const { data, error } = await supabase
          .from('games')
          .select('image_url, name')
          .eq('id', tournament.game_id)
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
  }, [tournament?.game_id]);

  // Get live status - only show as live if tournament is ongoing AND Twitch stream is live
  const tournamentStatus = calculateTournamentStatus(tournament);
  const isStreamLive = tournamentStatus === 'ongoing' && tournament.is_twitch_live;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return t('tournamentHero.dateToConfirm');
      }
      const currentLanguage = i18n.language || 'en';
      const locale = currentLanguage.startsWith('fr') ? fr : enUS;
      const formatStr = currentLanguage.startsWith('fr') ? 'dd MMMM yyyy à HH:mm' : 'dd MMMM yyyy \'at\' HH:mm';
      return format(date, formatStr, { locale });
    } catch (error) {
      return t('tournamentHero.dateToConfirm');
    }
  };

  const getStatusBadge = () => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);

    if (now > endDate) {
      return <span className="badge badge-completed">{t('tournamentHero.completed')}</span>;
    } else if (now >= startDate && now <= endDate) {
      return <span className="badge badge-live">{t('tournamentHero.ongoing')}</span>;
    } else {
      return <span className="badge badge-upcoming">{t('tournamentHero.upcoming')}</span>;
    }
  };

  // Check if this is a team tournament
  const isTeamTournament = tournament?.mode?.toLowerCase().includes('team');

  // Get the appropriate label for participants based on tournament type
  const getParticipantLabel = () => {
    return isTeamTournament ? t('tournamentHero.teamsRegistered') : t('tournamentHero.participants');
  };

  const prizeDisplay = formatPrizePoolDisplay(
    tournament.full_prize || null,
    tournament.main_prize || null,
    prizes,
    true
  );

  const firstPlaceInfo = getFirstPlacePrizeDisplay(prizes, true);

  return (
    <div 
      className="relative h-96 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${tournament.header_url || tournament.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'})`,
        backgroundPosition: 'center 30%'
      }}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-white hover:text-white mb-6 bg-dark-300/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('tournamentHero.backToTournaments')}
          </Link>
          
          <div className="max-w-3xl backdrop-blur-sm bg-dark-300/60 p-6 rounded-xl">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusBadge()}
              <span className="text-white text-sm">
                {tournament.mode} • {tournament.format}
              </span>
              
              {/* Live Stream Indicator */}
              {tournament.twitch_url && (
                isStreamLive ? (
                  <a 
                    href={tournament.twitch_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1 rounded-full bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                    aria-label={t('tournamentHero.watchLiveStream')}
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" aria-hidden="true"></span>
                    LIVE
                    <Video className="h-3 w-3 ml-1" aria-hidden="true" />
                  </a>
                ) : null
              )}
            </div>
            
            <div className="flex items-center mb-4">
              {gameLogoUrl && (
                <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 bg-dark-200/80 flex-shrink-0">
                  <img 
                    src={gameLogoUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                    aria-hidden="true"
                  />
                </div>
              )}
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-white">
                {tournament.title}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-white bg-dark-300/70 px-3 py-1.5 rounded-lg">
                <Calendar className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>{formatDate(tournament.startDate)}</span>
              </div>
              
              <div className="flex items-center text-white bg-dark-300/70 px-3 py-1.5 rounded-lg">
                <Users className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>
                  {isLoadingParticipants ? (
                    <Loader className="h-4 w-4 animate-spin inline" aria-hidden="true" />
                  ) : (
                    `${currentParticipants} ${getParticipantLabel()}`
                  )}
                </span>
              </div>
              
              {!firstPlaceInfo.isEmpty && (
                <div className="flex flex-col items-start text-warning-300 bg-dark-300/70 px-3 py-1.5 rounded-lg">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" aria-hidden="true" />
                    <span className="font-bold">{t('tournamentHero.firstPlace', { prize: firstPlaceInfo.displayText })}</span>
                  </div>
                  {prizeDisplay.showBreakdown && prizeDisplay.displayText !== firstPlaceInfo.displayText && (
                    <span className="text-xs text-warning-200 ml-7 mt-0.5">
                      {t('tournamentHero.prizePoolTotal', { total: prizeDisplay.displayText })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentHero;