import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Calendar, Users, ChevronRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fetchTournaments } from '../../services/api';
import { getGameTheme } from '../../utils/gameThemes';

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

interface GameHubFeaturedTournamentsProps {
  gameId: string;
  gameName: string;
}

const GameHubFeaturedTournaments: React.FC<GameHubFeaturedTournamentsProps> = ({
  gameId,
  gameName
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const theme = getGameTheme(gameName);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTournaments();
        const gameTournaments = (data || [])
          .filter((t: any) => t.game_id === gameId)
          .slice(0, 6);
        setTournaments(gameTournaments);
      } catch (error) {
        console.error('Error loading tournaments:', error);
        setTournaments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, [gameId]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-dark-300 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-dark-300 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  if (tournaments.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Trophy className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('gameHub.featuredTournaments')}</h2>
        </div>
        <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('gameHub.noTournamentsAvailable')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Trophy className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('gameHub.featuredTournaments')}</h2>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          {t('gameHub.viewAllTournaments')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
            className="group relative bg-dark-200/50 border border-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-gray-700 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={tournament.header_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=600'}
                alt={tournament.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${theme.colors.primary}80, transparent)`,
                }}
              />

              {tournament.full_prize && (
                <div
                  className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.text,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {tournament.full_prize} {tournament.prize_currency || 'FCFA'}
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
                {tournament.title}
              </h3>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(tournament.start_date), 'MMM d')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{tournament.registration_count || 0}/{tournament.max_nb_players || '?'}</span>
                </div>
              </div>

              <button
                className="mt-4 w-full py-2 rounded-lg text-sm font-medium transition-all duration-200"
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
        ))}
      </div>
    </section>
  );
};

export default GameHubFeaturedTournaments;
