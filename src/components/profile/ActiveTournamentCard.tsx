import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Swords,
  Clock,
  ArrowRight,
  Radio,
  Trophy,
  Calendar,
  Users
} from 'lucide-react';
import { GameTheme, getCardClipPath } from '../../utils/gameThemes';

interface ActiveTournament {
  id: string;
  tournament_id: string;
  status: string;
  tournament?: {
    id: string;
    title: string;
    header_url?: string;
    image?: string;
    games?: {
      name: string;
      image_url?: string;
    };
    status?: string;
    startDate?: string;
    current_round?: number;
    total_rounds?: number;
  };
  current_match?: {
    id: string;
    opponent_name?: string;
    opponent_avatar?: string;
    round_number?: number;
    scheduled_time?: string;
  };
}

interface ActiveTournamentCardProps {
  activeTournament: ActiveTournament | null;
  upcomingTournament?: ActiveTournament | null;
  theme: GameTheme;
}

const ActiveTournamentCard: React.FC<ActiveTournamentCardProps> = ({
  activeTournament,
  upcomingTournament,
  theme
}) => {
  const { t } = useTranslation();

  if (activeTournament?.tournament?.status === 'ongoing' || activeTournament?.current_match) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          clipPath: getCardClipPath(theme.shape),
          background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.secondary}10)`
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: activeTournament.tournament?.header_url
              ? `url(${activeTournament.tournament.header_url})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/60" />

        <div className="relative z-10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                {t('profile.liveMatch', 'Live Match')}
              </span>
            </div>
            {activeTournament.current_match?.round_number && (
              <span className="text-xs text-gray-400">
                Round {activeTournament.current_match.round_number}
              </span>
            )}
          </div>

          <h3 className="font-bold text-xl text-white mb-3">
            {activeTournament.tournament?.title}
          </h3>

          {activeTournament.current_match && (
            <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-center">
                <span className="text-sm text-gray-400">{t('profile.you', 'You')}</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <Swords className="w-6 h-6 text-gray-500" />
              </div>
              <div className="text-center">
                <span className="text-sm text-white font-medium">
                  {activeTournament.current_match.opponent_name || t('profile.opponent', 'Opponent')}
                </span>
              </div>
            </div>
          )}

          <Link
            to={`/tournaments/${activeTournament.tournament_id}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.text,
              boxShadow: `0 4px 20px ${theme.colors.primary}50`
            }}
          >
            <span>{t('profile.goToMatch', 'Go to Match')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (upcomingTournament) {
    const startDate = upcomingTournament.tournament?.startDate
      ? new Date(upcomingTournament.tournament.startDate)
      : null;
    const timeUntil = startDate ? getTimeUntil(startDate) : null;

    return (
      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{
          borderColor: `${theme.colors.primary}30`,
          background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.secondary}05)`
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" style={{ color: theme.colors.primary }} />
            <span className="text-sm font-medium text-gray-400">
              {t('profile.upcomingTournament', 'Upcoming Tournament')}
            </span>
          </div>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
            {upcomingTournament.tournament?.title}
          </h3>

          {timeUntil && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('profile.startsIn', 'Starts in')} {timeUntil}
              </span>
            </div>
          )}

          <Link
            to={`/tournaments/${upcomingTournament.tournament_id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium border transition-all hover:bg-gray-100 dark:hover:bg-dark-300"
            style={{
              borderColor: `${theme.colors.primary}40`,
              color: theme.colors.primary
            }}
          >
            <span>{t('profile.viewTournament', 'View Tournament')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-dashed p-6 text-center"
      style={{
        borderColor: `${theme.colors.primary}30`
      }}
    >
      <div
        className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${theme.colors.primary}15` }}
      >
        <Trophy className="w-7 h-7" style={{ color: theme.colors.primary }} />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
        {t('profile.noActiveTournaments', 'No Active Tournaments')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('profile.joinTournamentPrompt', 'Join a tournament to see it here')}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: `${theme.colors.primary}15`,
          color: theme.colors.primary
        }}
      >
        <Users className="w-4 h-4" />
        {t('profile.browseTournaments', 'Browse Tournaments')}
      </Link>
    </div>
  );
};

const getTimeUntil = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return 'Starting soon';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default ActiveTournamentCard;
