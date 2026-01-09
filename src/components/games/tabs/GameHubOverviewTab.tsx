import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Trophy,
  Play,
  Crown,
  ChevronRight,
  Calendar,
  Users,
  Sparkles,
  Clock,
  Newspaper,
  ExternalLink,
  User,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { fetchTournaments, fetchGameContent, fetchLeaderboardByGameId } from '../../../services/api';
import { GameTheme } from '../../../utils/gameThemes';
import { GameHubTabId } from '../GameHubTabs';
import { getLatestNews, EsportsNewsItem } from '../../../data/mockEsportsNews';
import TiltedCard from '../../ui/TiltedCard';

interface Tournament {
  id: string;
  title: string;
  start_date: string;
  status: string;
  max_nb_players: number;
  header_url?: string;
  full_prize?: string;
  prize_currency?: string;
  registration_count?: number;
}

interface GameContent {
  id: string;
  title: string;
  playlist_image_url?: string;
  duration?: number;
}

interface PlayerRanking {
  id: string;
  elo_rating: number;
  wins: number;
  losses: number;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

interface GameHubOverviewTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
  onNavigateToTab: (tab: GameHubTabId) => void;
}

type TournamentFilter = 'all' | 'live' | 'upcoming';

const GameHubOverviewTab: React.FC<GameHubOverviewTabProps> = ({
  gameId,
  gameName,
  theme,
  onNavigateToTab,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentFilter, setTournamentFilter] = useState<TournamentFilter>('upcoming');
  const [videos, setVideos] = useState<GameContent[]>([]);
  const [players, setPlayers] = useState<PlayerRanking[]>([]);
  const [news] = useState<EsportsNewsItem[]>(getLatestNews(3));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [tournamentsData, contentData, leaderboardData] = await Promise.all([
          fetchTournaments(),
          fetchGameContent(gameId, { contentType: 'video', limit: 3 }),
          fetchLeaderboardByGameId(gameId),
        ]);

        const gameTournaments = (tournamentsData || [])
          .filter((t: any) => t.game_id === gameId);
        setAllTournaments(gameTournaments);
        setVideos((contentData?.data || []).slice(0, 3));
        setPlayers((leaderboardData?.players || []).slice(0, 3));
      } catch (error) {
        console.error('Error loading overview data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [gameId]);

  useEffect(() => {
    let filtered = allTournaments;

    if (tournamentFilter === 'upcoming') {
      filtered = allTournaments.filter(t => t.status === 'upcoming');
    } else if (tournamentFilter === 'live') {
      filtered = allTournaments.filter(t => t.status === 'ongoing');
    }

    setTournaments(filtered.slice(0, 3));
  }, [allTournaments, tournamentFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return {
          label: t('tournamentCard.live'),
          icon: Radio,
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/30'
        };
      case 'upcoming':
        return {
          label: t('tournamentCard.upcoming'),
          icon: Calendar,
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/30'
        };
      case 'completed':
        return {
          label: t('tournamentCard.completed'),
          icon: CheckCircle2,
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-500/30'
        };
      default:
        return {
          label: status,
          icon: Calendar,
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-500/30'
        };
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', color: '#000' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #CD7F32, #8B4513)', color: '#FFF' };
    return { background: theme.colors.primary, color: theme.colors.text };
  };

  const getTiltConfig = (status: string) => {
    switch (status) {
      case 'ongoing':
        return {
          maxTilt: 5,
          scale: 1.025,
          shineIntensity: 0.15,
          glowIntensity: 1,
          glowColor: `${theme.colors.primary}66`
        };
      case 'upcoming':
        return {
          maxTilt: 4,
          scale: 1.02,
          shineIntensity: 0.12,
          glowIntensity: 0.5,
          glowColor: `${theme.colors.primary}4D`
        };
      case 'completed':
        return {
          maxTilt: 2,
          scale: 1.01,
          shineIntensity: 0.08,
          glowIntensity: 0,
          glowColor: 'transparent'
        };
      default:
        return {
          maxTilt: 3,
          scale: 1.015,
          shineIntensity: 0.1,
          glowIntensity: 0.3,
          glowColor: `${theme.colors.primary}40`
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-dark-300 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-40 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <Trophy className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('gameHub.tabs.tournaments')}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-300/50 rounded-lg p-1">
              {(['all', 'live', 'upcoming'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTournamentFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    tournamentFilter === filter
                      ? 'text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-400/50'
                  }`}
                  style={tournamentFilter === filter ? {
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.text
                  } : undefined}
                >
                  {filter === 'all' && t('tournamentFilters.all')}
                  {filter === 'live' && t('tournamentCard.live')}
                  {filter === 'upcoming' && t('tournamentFilters.upcoming')}
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigateToTab('tournaments')}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('gameHub.viewAll')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">{t('gameHub.noTournamentsAvailable')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tournaments.map((tournament) => {
              const tiltConfig = getTiltConfig(tournament.status);
              const statusBadge = getStatusBadge(tournament.status);
              const StatusIcon = statusBadge.icon;
              return (
                <TiltedCard
                  key={tournament.id}
                  maxTilt={tiltConfig.maxTilt}
                  scale={tiltConfig.scale}
                  shineIntensity={tiltConfig.shineIntensity}
                  glowIntensity={tiltConfig.glowIntensity}
                  glowColor={tiltConfig.glowColor}
                  transitionDuration={250}
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                >
                  <div className="group bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm dark:shadow-none">
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src={tournament.header_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=600'}
                        alt={tournament.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.colors.primary}80, transparent)` }} />
                      <div
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border ${statusBadge.bgColor} ${statusBadge.textColor} ${statusBadge.borderColor}`}
                      >
                        <StatusIcon className={`w-3 h-3 ${tournament.status === 'ongoing' ? 'animate-pulse' : ''}`} />
                        {statusBadge.label}
                      </div>
                      {tournament.full_prize && (
                        <div
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                          style={{ backgroundColor: theme.colors.primary, color: theme.colors.text }}
                        >
                          <Sparkles className="w-3 h-3" />
                          {tournament.full_prize}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 mb-2">{tournament.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(tournament.start_date), 'MMM d')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{tournament.registration_count || 0}/{tournament.max_nb_players || '?'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltedCard>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <Play className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('gameHub.tabs.training')}</h2>
          </div>
          <button
            onClick={() => onNavigateToTab('training')}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t('gameHub.viewAll')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
            <Play className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">{t('gameHub.noTrainingContent')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => navigate(`/video/${video.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative rounded-xl overflow-hidden mb-2">
                  <img
                    src={video.playlist_image_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=600'}
                    alt={video.title}
                    className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-2 rounded-full" style={{ backgroundColor: theme.colors.primary }}>
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                  {video.title}
                </h4>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <Crown className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('gameHub.tabs.leaderboard')}</h2>
          </div>
          <button
            onClick={() => onNavigateToTab('leaderboard')}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t('gameHub.viewAll')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {players.length === 0 ? (
          <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
            <Crown className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">{t('gameHub.noLeaderboardData')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none">
            <div className="space-y-2">
              {players.map((player, index) => {
                const rank = index + 1;
                const winRate = player.wins + player.losses > 0
                  ? Math.round((player.wins / (player.wins + player.losses)) * 100)
                  : 0;

                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-dark-300/30 hover:bg-gray-100 dark:hover:bg-dark-300/50 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={getRankBadgeStyle(rank)}
                    >
                      {rank}
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-400">
                      {player.user?.avatar_url ? (
                        <img src={player.user.avatar_url} alt={player.user?.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{player.user?.username || t('common.anonymous')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{player.wins}W - {player.losses}L ({winRate}%)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: theme.colors.primary }}>{player.elo_rating}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ELO</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <Newspaper className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('gameHub.latestNews')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {news.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm dark:shadow-none"
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-dark-100 to-transparent" />
                <div
                  className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium capitalize"
                  style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
                >
                  {item.category}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{item.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{item.source}</span>
                  <span>{format(new Date(item.date), 'MMM d')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GameHubOverviewTab;
