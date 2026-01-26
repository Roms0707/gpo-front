import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Trophy, ArrowLeft, Loader, Video, Clock, CheckCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { Tournament, TournamentPrize } from '../../types';
import { supabase } from '../../lib/supabase';
import { calculateTournamentStatus } from '../../utils/tournamentUtils';
import { formatPrizePoolDisplay, getFirstPlacePrizeDisplay } from '../../utils/prizePoolUtils';
import { getUserTimezoneAbbreviation } from '../../utils/timezoneUtils';
import { getGameTheme, getCardClipPath, GameTheme } from '../../utils/gameThemes';

interface TournamentHeroProps {
  tournament: Tournament;
  currentParticipants: number;
  isLoadingParticipants: boolean;
  prizes?: TournamentPrize[];
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TournamentHero = forwardRef<HTMLDivElement, TournamentHeroProps>(({
  tournament,
  currentParticipants,
  isLoadingParticipants,
  prizes = []
}, ref) => {
  const { t, i18n } = useTranslation();
  const [gameLogoUrl, setGameLogoUrl] = useState<string | null>(null);
  const [gameName, setGameName] = useState<string>('');
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const tournamentStatus = calculateTournamentStatus(tournament);
  const isStreamLive = tournamentStatus === 'ongoing' && tournament.is_twitch_live;
  const isCompleted = tournamentStatus === 'completed';

  const gameTheme = useMemo(() => getGameTheme(gameName || tournament.game), [gameName, tournament.game]);

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

        if (data) {
          if (data.image_url) setGameLogoUrl(data.image_url);
          if (data.name) setGameName(data.name);
        }
      } catch (error) {
        console.error('Error loading game logo:', error);
      }
    };

    loadGameLogo();
  }, [tournament?.game_id]);

  useEffect(() => {
    if (tournamentStatus !== 'upcoming') return;

    const calculateCountdown = () => {
      const now = new Date();
      const startDate = new Date(tournament.startDate);

      if (now >= startDate) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = differenceInDays(startDate, now);
      const hours = differenceInHours(startDate, now) % 24;
      const minutes = differenceInMinutes(startDate, now) % 60;
      const seconds = differenceInSeconds(startDate, now) % 60;

      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [tournament.startDate, tournamentStatus]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return t('tournamentHero.dateToConfirm');
      }
      const currentLanguage = i18n.language || 'en';
      const locale = currentLanguage.startsWith('fr') ? fr : enUS;
      const formatStr = currentLanguage.startsWith('fr') ? 'dd MMMM yyyy à HH:mm' : 'dd MMMM yyyy \'at\' HH:mm';
      const formattedDate = format(date, formatStr, { locale });
      const timezone = getUserTimezoneAbbreviation();
      return timezone ? `${formattedDate} ${timezone}` : formattedDate;
    } catch (error) {
      return t('tournamentHero.dateToConfirm');
    }
  };

  const getStatusIndicator = () => {
    if (isCompleted) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600/80 text-gray-300">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold uppercase tracking-wide">{t('tournamentHero.completed')}</span>
        </div>
      );
    }

    if (tournamentStatus === 'ongoing') {
      return (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ backgroundColor: `${gameTheme.colors.primary}cc` }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: gameTheme.colors.text }}
          />
          <span className="font-bold uppercase tracking-wide" style={{ color: gameTheme.colors.text }}>
            {t('tournamentHero.ongoing')}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/80 text-white">
        <Clock className="h-5 w-5" />
        <span className="font-semibold uppercase tracking-wide">{t('tournamentHero.upcoming')}</span>
      </div>
    );
  };

  const isTeamTournament = tournament?.mode?.toLowerCase().includes('team');
  const maxParticipants = tournament.maxParticipants || tournament.max_nb_players || 0;
  const participantPercentage = maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;
  const isNearlyFull = participantPercentage >= 90;

  const getParticipantLabel = () => {
    return isTeamTournament ? t('tournamentHero.teamsRegistered') : t('tournamentHero.participants');
  };

  const getCapacityMessage = () => {
    if (isCompleted) return null;
    if (maxParticipants === 0) return null;

    const spotsLeft = maxParticipants - currentParticipants;

    if (spotsLeft <= 0) {
      return <span className="text-red-400 text-sm font-medium">{t('tournamentHero.registrationClosed')}</span>;
    }

    if (isNearlyFull) {
      return <span className="text-amber-400 text-sm font-medium">{t('tournamentHero.closingSoon', { spots: spotsLeft })}</span>;
    }

    return <span className="text-green-400 text-sm font-medium">{t('tournamentHero.spotsAvailable', { spots: spotsLeft })}</span>;
  };

  const prizeDisplay = formatPrizePoolDisplay(
    tournament.full_prize || null,
    tournament.main_prize || null,
    prizes,
    true
  );

  const firstPlaceInfo = getFirstPlacePrizeDisplay(prizes, true);

  const getGradientOverlay = (theme: GameTheme) => {
    if (isCompleted) {
      return 'linear-gradient(135deg, rgba(31, 41, 55, 0.85) 0%, rgba(17, 24, 39, 0.95) 100%)';
    }
    return `linear-gradient(135deg, ${theme.colors.primary}40 0%, rgba(0, 0, 0, 0.8) 50%, ${theme.colors.secondary}30 100%)`;
  };

  const clipPath = getCardClipPath(gameTheme.shape);

  return (
    <div
      id="walkthrough-tournament-hero"
      ref={ref}
      className={`relative min-h-[500px] md:min-h-[540px] bg-cover bg-center ${isCompleted ? 'grayscale-[30%]' : ''}`}
      style={{
        backgroundImage: `${getGradientOverlay(gameTheme)}, url(${tournament.header_url || tournament.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'})`,
        backgroundPosition: 'center 30%'
      }}
    >
      {!isCompleted && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, ${gameTheme.colors.glow} 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 50%, ${gameTheme.colors.glow} 0%, transparent 50%)`
          }}
        />
      )}

      <div className="absolute inset-0">
        <div className="container mx-auto px-4 h-full flex flex-col justify-center pt-36 sm:pt-24 pb-8">
          <Link
            to="/"
            className="inline-flex items-center text-white hover:text-white mb-6 w-fit bg-dark-300/70 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all hover:bg-dark-300/90"
            style={{
              borderLeft: isCompleted ? '2px solid #6b7280' : `2px solid ${gameTheme.colors.primary}`
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('tournamentHero.backToTournaments')}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            <div
              className="lg:col-span-3 backdrop-blur-md bg-dark-300/50 p-6 lg:p-8 relative"
              style={{
                clipPath: clipPath !== 'none' ? clipPath : undefined,
                borderRadius: clipPath === 'none' ? '16px' : undefined,
                border: isCompleted ? '1px solid rgba(107, 114, 128, 0.3)' : `1px solid ${gameTheme.colors.primary}40`
              }}
            >
              {!isCompleted && (
                <div
                  className="absolute top-0 left-0 w-24 h-24 opacity-20"
                  style={{
                    background: `radial-gradient(circle at top left, ${gameTheme.colors.primary} 0%, transparent 70%)`
                  }}
                />
              )}

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {getStatusIndicator()}

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-200/80 text-white/80 text-sm">
                    <span>{tournament.mode}</span>
                    <span className="w-1 h-1 rounded-full bg-white/50" />
                    <span>{tournament.format}</span>
                  </div>

                  {tournament.twitch_url && isStreamLive && (
                    <a
                      href={tournament.twitch_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                      aria-label={t('tournamentHero.watchLiveStream')}
                    >
                      <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" aria-hidden="true" />
                      LIVE
                      <Video className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
                    </a>
                  )}
                </div>

                <div className="flex items-start gap-4 mb-5">
                  {gameLogoUrl && (
                    <div
                      className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden flex-shrink-0 ring-2 shadow-lg"
                      style={{
                        ringColor: isCompleted ? '#6b7280' : gameTheme.colors.primary,
                        boxShadow: isCompleted ? 'none' : `0 4px 20px ${gameTheme.colors.glow}`
                      }}
                    >
                      <img
                        src={gameLogoUrl}
                        alt=""
                        className={`w-full h-full object-cover ${isCompleted ? 'opacity-70' : ''}`}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div>
                    <h1
                      className={`font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-2 ${isCompleted ? 'opacity-80' : ''}`}
                      style={{
                        textShadow: isCompleted ? 'none' : `0 2px 20px ${gameTheme.colors.glow}`
                      }}
                    >
                      {tournament.title}
                    </h1>
                    {gameName && (
                      <p className="text-white/60 text-sm font-medium">{gameName}</p>
                    )}
                  </div>
                </div>

                {!firstPlaceInfo.isEmpty && (
                  <div
                    className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl mb-5 ${isCompleted ? 'bg-gray-700/50' : 'bg-gradient-to-r'}`}
                    style={!isCompleted ? {
                      backgroundImage: `linear-gradient(135deg, ${gameTheme.colors.primary}30, ${gameTheme.colors.secondary}20)`
                    } : undefined}
                  >
                    <div
                      className={`p-2 rounded-lg ${isCompleted ? 'bg-gray-600' : ''}`}
                      style={!isCompleted ? { backgroundColor: `${gameTheme.colors.primary}40` } : undefined}
                    >
                      <Trophy className={`h-6 w-6 ${isCompleted ? 'text-gray-400' : 'text-amber-400'}`} />
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${isCompleted ? 'text-gray-300' : 'text-amber-400'}`}>
                        {t('tournamentHero.firstPlace', { prize: firstPlaceInfo.displayText })}
                      </p>
                      {prizeDisplay.showBreakdown && prizeDisplay.displayText !== firstPlaceInfo.displayText && (
                        <p className="text-sm text-white/60">
                          {t('tournamentHero.prizePoolTotal', { total: prizeDisplay.displayText })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-white/80">
                  <Calendar className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">
                    {isCompleted
                      ? t('tournamentHero.endedOn', { date: formatDate(tournament.endDate) })
                      : tournamentStatus === 'ongoing'
                        ? t('tournamentHero.startedOn', { date: formatDate(tournament.startDate) })
                        : formatDate(tournament.startDate)
                    }
                  </span>
                </div>

                {(tournament.discord_url || tournament.streamLink) && (
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/10">
                    {tournament.discord_url && (
                      <a
                        href={tournament.discord_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5865F2]/90 hover:bg-[#5865F2] text-white transition-all duration-200 hover:scale-105"
                        style={{
                          boxShadow: '0 4px 15px rgba(88, 101, 242, 0.3)'
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">Discord</span>
                        <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {tournament.streamLink && !isStreamLive && (
                      <a
                        href={tournament.streamLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#9146FF]/90 hover:bg-[#9146FF] text-white transition-all duration-200 hover:scale-105"
                        style={{
                          boxShadow: '0 4px 15px rgba(145, 70, 255, 0.3)'
                        }}
                      >
                        <Video className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('tournamentPage.stream')}</span>
                        <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className="lg:col-span-2 backdrop-blur-md bg-dark-300/50 p-6 relative flex flex-col justify-between"
              style={{
                clipPath: clipPath !== 'none' ? clipPath : undefined,
                borderRadius: clipPath === 'none' ? '16px' : undefined,
                border: isCompleted ? '1px solid rgba(107, 114, 128, 0.3)' : `1px solid ${gameTheme.colors.primary}40`
              }}
            >
              {!isCompleted && (
                <div
                  className="absolute bottom-0 right-0 w-32 h-32 opacity-20"
                  style={{
                    background: `radial-gradient(circle at bottom right, ${gameTheme.colors.primary} 0%, transparent 70%)`
                  }}
                />
              )}

              <div className="relative z-10">
                {tournamentStatus === 'upcoming' && (
                  <div className="mb-6">
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-3 font-medium">
                      {t('tournamentHero.startsIn')}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: countdown.days, label: t('tournamentHero.days') },
                        { value: countdown.hours, label: t('tournamentHero.hours') },
                        { value: countdown.minutes, label: t('tournamentHero.minutes') },
                        { value: countdown.seconds, label: t('tournamentHero.seconds') }
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="text-center p-3 rounded-lg bg-dark-200/80"
                          style={{
                            border: `1px solid ${gameTheme.colors.primary}30`
                          }}
                        >
                          <div
                            className="text-2xl lg:text-3xl font-bold font-mono"
                            style={{ color: gameTheme.colors.primary }}
                          >
                            {String(item.value).padStart(2, '0')}
                          </div>
                          <div className="text-xs text-white/50 uppercase tracking-wide mt-1">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-white/80">
                      <Users className="h-5 w-5" aria-hidden="true" />
                      <span className="text-sm font-medium">
                        {isLoadingParticipants ? (
                          <Loader className="h-4 w-4 animate-spin inline" aria-hidden="true" />
                        ) : (
                          <>
                            {currentParticipants}
                            {maxParticipants > 0 && ` / ${maxParticipants}`}
                            {' '}{getParticipantLabel()}
                          </>
                        )}
                      </span>
                    </div>
                    {getCapacityMessage()}
                  </div>

                  {maxParticipants > 0 && (
                    <div className="h-2 bg-dark-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(participantPercentage, 100)}%`,
                          backgroundColor: isCompleted
                            ? '#6b7280'
                            : isNearlyFull
                              ? '#f59e0b'
                              : gameTheme.colors.primary,
                          boxShadow: isCompleted
                            ? 'none'
                            : `0 0 10px ${isNearlyFull ? 'rgba(245, 158, 11, 0.5)' : gameTheme.colors.glow}`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {tournamentStatus === 'ongoing' && tournament.twitch_url && (
                <div className="relative z-10 mt-4">
                  <a
                    href={tournament.twitch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: isStreamLive ? '#9146FF' : 'rgba(145, 70, 255, 0.3)',
                      color: 'white'
                    }}
                  >
                    <Video className="h-5 w-5" />
                    {isStreamLive ? t('tournamentHero.watchLive') : t('tournamentHero.watchOnTwitch')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TournamentHero.displayName = 'TournamentHero';

export default TournamentHero;
