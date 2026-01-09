import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Trophy,
  Calendar,
  Users,
  Sparkles,
  Filter,
  Search,
  Radio
} from 'lucide-react';
import { fetchTournaments } from '../../../services/api';
import { GameTheme } from '../../../utils/gameThemes';
import TiltedCard from '../../ui/TiltedCard';

interface Tournament {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  max_nb_players: number;
  header_url?: string;
  main_prize?: string;
  full_prize?: string;
  prize_currency?: string;
  registration_count?: number;
}

type StatusFilter = 'all' | 'ongoing' | 'upcoming' | 'completed';

interface GameHubTournamentsTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

const GameHubTournamentsTab: React.FC<GameHubTournamentsTabProps> = ({
  gameId,
  gameName,
  theme,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTournaments();
        const gameTournaments = (data || []).filter((t: any) => t.game_id === gameId);
        setTournaments(gameTournaments);
        setFilteredTournaments(gameTournaments);
      } catch (error) {
        console.error('Error loading tournaments:', error);
        setTournaments([]);
        setFilteredTournaments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, [gameId]);

  useEffect(() => {
    let filtered = [...tournaments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(query));
    }

    setFilteredTournaments(filtered);
  }, [statusFilter, searchQuery, tournaments]);

  const statusFilters: { id: StatusFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'tournamentFilters.all' },
    { id: 'ongoing', labelKey: 'tournamentFilters.ongoing' },
    { id: 'upcoming', labelKey: 'tournamentFilters.upcoming' },
    { id: 'completed', labelKey: 'tournamentFilters.completed' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return {
          bg: 'bg-success-500/20',
          text: 'text-success-400',
          icon: Radio,
        };
      case 'upcoming':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          icon: Calendar,
        };
      case 'completed':
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          icon: Trophy,
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          icon: Trophy,
        };
    }
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 flex-1 bg-gray-200 dark:bg-dark-300 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-dark-300 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('tournamentFilters.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${statusFilter === filter.id
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300'
                }
              `}
              style={statusFilter === filter.id ? {
                backgroundColor: `${theme.colors.primary}20`,
                color: theme.colors.primary,
              } : undefined}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {filteredTournaments.length === 0 ? (
        <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('tournamentList.noTournamentsAvailable')}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {statusFilter !== 'all'
              ? t('tournamentList.noTournamentsStatus', { status: t(`tournamentList.status${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`) })
              : t('gameHub.noTournamentsAvailable')
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => {
            const statusBadge = getStatusBadge(tournament.status);
            const StatusIcon = statusBadge.icon;
            const tiltConfig = getTiltConfig(tournament.status);

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
                <div className="group relative bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm dark:shadow-none">
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={tournament.header_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={tournament.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(to top, ${theme.colors.primary}80, transparent)` }}
                    />

                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusBadge.bg} ${statusBadge.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {t(`tournamentCard.${tournament.status}`)}
                    </div>

                    {tournament.full_prize && (
                      <div
                        className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5"
                        style={{ backgroundColor: theme.colors.primary, color: theme.colors.text }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {tournament.full_prize} {tournament.prize_currency || 'FCFA'}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                      {tournament.title}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(tournament.start_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{tournament.registration_count || 0}/{tournament.max_nb_players || '?'}</span>
                      </div>
                    </div>

                    <button
                      className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor: `${theme.colors.primary}20`,
                        color: theme.colors.primary,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.primary;
                        e.currentTarget.style.color = theme.colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.colors.primary}20`;
                        e.currentTarget.style.color = theme.colors.primary;
                      }}
                    >
                      {t('gameHub.viewTournament')}
                    </button>
                  </div>
                </div>
              </TiltedCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GameHubTournamentsTab;
