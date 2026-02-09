import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useConfigGames } from '../../hooks/useConfigGames';
import { ConfigGame } from '../../services/configGamesService';
import { Gamepad2, ChevronRight } from 'lucide-react';

const MobileGameGrid: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { games, isLoading } = useConfigGames();

  const handleGameClick = (game: ConfigGame) => {
    if (game.slug) {
      navigate(`/hub/${game.slug}`);
    }
  };

  const handleViewAll = () => {
    navigate('/hub');
  };

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-white">{t('home.gamesAvailable')}</h2>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex-shrink-0 animate-pulse">
                <div className="w-[52px] h-[52px] bg-dark-300 rounded-xl" />
                <div className="w-10 h-2 bg-dark-300 rounded mt-2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (games.length === 0) {
    return (
      <section className="py-4">
        <div className="container mx-auto px-4">
          <p className="text-sm text-gray-400 text-center">{t('gaming.noGamesAvailable')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-white">{t('home.gamesAvailable')}</h2>
          </div>
          <button
            onClick={handleViewAll}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-light transition-colors"
          >
            <span>{t('home.viewAll')}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => handleGameClick(game)}
              className="flex-shrink-0 flex flex-col items-center group"
            >
              <div className="relative w-[52px] h-[52px] rounded-xl overflow-hidden bg-dark-300 transition-all duration-200 group-hover:shadow-[0_0_16px_rgba(var(--color-primary-rgb),0.4)] group-active:scale-95">
                <img
                  src={game.image_url || 'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=200'}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>
              <span className="mt-1.5 text-[10px] text-gray-400 group-hover:text-white transition-colors max-w-[56px] truncate text-center">
                {game.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobileGameGrid;
