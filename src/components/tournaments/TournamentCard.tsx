import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Trophy, Video, Clock, User, UsersRound } from 'lucide-react';
import { Tournament } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { checkTournamentRegistration } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { calculateTournamentStatus } from '../../utils/tournamentUtils';
import { getFirstPlacePrizeDisplay } from '../../utils/prizePoolUtils';
import { getGameTheme, getCardClipPath, getCardBorderRadius } from '../../utils/gameThemes';

interface TournamentCardProps {
  tournament: Tournament & {
    calculatedStatus?: 'ongoing' | 'upcoming' | 'completed';
    registrationStatus?: 'open' | 'closed' | 'not_started';
    is_twitch_live?: boolean;
    twitch_last_checked?: string;
    prizes?: any[];
  };
}

const formatCountdown = (targetDate: string): string => {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return '';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isRegistered, setIsRegistered] = useState(false);
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  const [gameData, setGameData] = useState<{ logoUrl: string | null; artworkUrl: string | null }>({ logoUrl: null, artworkUrl: null });
  const [countdown, setCountdown] = useState<string>('');

  const {
    id,
    title,
    game,
    startDate,
    header_url,
    calculatedStatus,
    max_nb_players,
    mode,
    game_id,
    twitch_url,
  } = tournament;

  const isTeamTournament = mode?.toLowerCase().includes('team');
  const gameTheme = useMemo(() => getGameTheme(game), [game]);
  const cardClipPath = useMemo(() => getCardClipPath(gameTheme.shape), [gameTheme.shape]);
  const cardBorderRadius = useMemo(() => getCardBorderRadius(gameTheme.shape), [gameTheme.shape]);

  const tournamentStatus = calculateTournamentStatus(tournament);
  const isStreamLive = tournamentStatus === 'ongoing' && tournament.is_twitch_live;

  useEffect(() => {
    const loadGameData = async () => {
      if (!game_id) return;

      try {
        const { data, error } = await supabase
          .from('games')
          .select('image_url, igdb_artwork_url, twitch_cover_url')
          .eq('id', game_id)
          .single();

        if (error) return;

        if (data) {
          setGameData({
            logoUrl: data.image_url || null,
            artworkUrl: data.igdb_artwork_url || data.twitch_cover_url || null,
          });
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };

    loadGameData();
  }, [game_id]);

  useEffect(() => {
    const loadParticipantsData = async () => {
      if (!id) return;

      try {
        setIsLoadingParticipants(true);

        if (isTeamTournament) {
          const { data, error } = await supabase.rpc('execute_sql', {
            query: `
              SELECT COUNT(DISTINCT CASE WHEN status IN ('pending', 'approved', 'validated') THEN team_id END) as approved_count
              FROM tournament_registrations
              WHERE tournament_id = '${id}'
              AND team_id IS NOT NULL
            `
          });

          if (!error && data && data.length > 0) {
            setParticipantsCount(parseInt(data[0].approved_count) || 0);
          }
        } else {
          const { count, error } = await supabase
            .from('tournament_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', id)
            .in('status', ['pending', 'approved', 'validated']);

          if (!error) {
            setParticipantsCount(count || 0);
          }
        }

        setMaxParticipants(max_nb_players || null);
      } catch (error) {
        console.error('Error loading participants data:', error);
      } finally {
        setIsLoadingParticipants(false);
      }
    };

    loadParticipantsData();
  }, [id, max_nb_players, isTeamTournament]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!user?.id || !id) return;

      try {
        const regStatus = await checkTournamentRegistration(id, user.id);
        setIsRegistered(regStatus.registered);
      } catch (error) {
        setIsRegistered(false);
      }
    };

    checkRegistration();
  }, [user?.id, id]);

  useEffect(() => {
    if (calculatedStatus === 'upcoming' && startDate) {
      const updateCountdown = () => {
        setCountdown(formatCountdown(startDate));
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [calculatedStatus, startDate]);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnauthenticatedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login', { state: { from: `/tournaments/${id}` } });
  };

  const firstPlaceInfo = getFirstPlacePrizeDisplay(tournament.prizes || [], false);

  const backgroundImage = header_url || gameData.artworkUrl;
  const hasCustomBackground = !!header_url || !!gameData.artworkUrl;

  return (
    <Link
      to={`/tournaments/${id}`}
      className="block group"
      onClick={user ? handleClick : handleUnauthenticatedClick}
      aria-label={t('tournamentCard.ariaLabel', { title, game })}
    >
      <div
        className="esports-card relative overflow-hidden transition-all duration-300"
        style={{
          aspectRatio: '16 / 9',
          clipPath: cardClipPath !== 'none' ? cardClipPath : undefined,
          borderRadius: cardClipPath === 'none' ? cardBorderRadius : undefined,
        }}
      >
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            clipPath: cardClipPath !== 'none' ? cardClipPath : undefined,
            borderRadius: cardClipPath === 'none' ? cardBorderRadius : undefined,
            boxShadow: `inset 0 0 0 2px ${gameTheme.colors.border}40`,
          }}
        />

        <div
          className="absolute inset-[2px] overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]"
          style={{
            clipPath: cardClipPath !== 'none' ? cardClipPath : undefined,
            borderRadius: cardClipPath === 'none' ? `calc(${cardBorderRadius} - 2px)` : undefined,
          }}
        >
          {hasCustomBackground ? (
            <img
              src={backgroundImage!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${gameTheme.colors.secondary} 0%, ${gameTheme.colors.primary}40 50%, ${gameTheme.colors.secondary} 100%)`,
              }}
            >
              {gameData.logoUrl && (
                <img
                  src={gameData.logoUrl}
                  alt=""
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain opacity-30"
                  style={{
                    filter: `drop-shadow(0 0 20px ${gameTheme.colors.glow})`,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          )}

          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.2) 70%, transparent 100%)`,
            }}
          />

          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${gameTheme.colors.primary}10 0%, transparent 50%, ${gameTheme.colors.primary}10 100%)`,
              }}
            />
          </div>
        </div>

        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            clipPath: cardClipPath !== 'none' ? cardClipPath : undefined,
            borderRadius: cardClipPath === 'none' ? cardBorderRadius : undefined,
            boxShadow: `inset 0 0 0 2px ${gameTheme.colors.border}, 0 0 20px ${gameTheme.colors.glow}`,
          }}
        />

        <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between z-10">
          <div className="flex items-start justify-between">
            {gameData.logoUrl && (
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg backdrop-blur-sm"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: `1px solid ${gameTheme.colors.border}30`,
                }}
              >
                <img
                  src={gameData.logoUrl}
                  alt=""
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                  aria-hidden="true"
                />
                <span className="text-xs sm:text-sm font-medium text-white/90 hidden sm:block max-w-[100px] truncate">
                  {game}
                </span>
              </div>
            )}

            <div className="flex flex-col items-end gap-1.5">
              {calculatedStatus === 'ongoing' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  {t('tournamentCard.ongoing')}
                </div>
              )}
              {calculatedStatus === 'upcoming' && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${gameTheme.colors.primary}, ${gameTheme.colors.secondary})` }}
                >
                  {t('tournamentCard.upcoming')}
                </div>
              )}
              {calculatedStatus === 'completed' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-600 text-white text-xs font-bold shadow-lg">
                  {t('tournamentCard.completed')}
                </div>
              )}

              {twitch_url && isStreamLive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(twitch_url, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#9146FF] text-white text-xs font-medium hover:bg-[#7c3aed] transition-colors"
                  aria-label={t('tournamentCard.watchLiveStream')}
                >
                  <Video className="w-3 h-3" />
                  LIVE
                </button>
              )}

              {isTeamTournament && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-[10px] font-medium">
                  <UsersRound className="w-3 h-3" />
                  {t('tournamentCard.team')}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {calculatedStatus === 'upcoming' && countdown && (
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
                  style={{
                    background: `${gameTheme.colors.primary}20`,
                    border: `1px solid ${gameTheme.colors.border}40`,
                    color: gameTheme.colors.border,
                  }}
                >
                  <Clock className="w-3 h-3" />
                  <span>{t('tournamentCard.startsIn')} {countdown}</span>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-white line-clamp-2 drop-shadow-lg">
                {title}
              </h3>
              {!gameData.logoUrl && (
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5">{game}</p>
              )}
            </div>

            <div
              className="flex items-center justify-between py-2 px-3 -mx-3 sm:-mx-4 mt-2"
              style={{
                background: `linear-gradient(to right, ${gameTheme.colors.primary}30, transparent, ${gameTheme.colors.primary}30)`,
                borderTop: `1px solid ${gameTheme.colors.border}30`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-gray-200">
                  {isTeamTournament ? (
                    <UsersRound className="w-4 h-4" style={{ color: gameTheme.colors.border }} />
                  ) : (
                    <Users className="w-4 h-4" style={{ color: gameTheme.colors.border }} />
                  )}
                  <span className="text-xs sm:text-sm font-medium">
                    {isLoadingParticipants ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `${participantsCount}${maxParticipants ? `/${maxParticipants}` : ''}`
                    )}
                  </span>
                </div>

                {user && isRegistered && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40">
                    <User className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] sm:text-xs text-green-400 font-medium">
                      {t('tournamentCard.registered')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm sm:text-base font-bold text-yellow-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                  {firstPlaceInfo.displayText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
