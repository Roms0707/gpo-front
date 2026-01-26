import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchGames } from '../../services/api';
import { LayoutGrid } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
  slug: string;
}

interface TooltipState {
  visible: boolean;
  gameId: string | null;
  gameName: string;
  y: number;
}

const GameLibrarySidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    gameId: null,
    gameName: '',
    y: 0
  });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isOnHubPage = location.pathname.startsWith('/hub');
  const currentSlug = location.pathname.startsWith('/hub/')
    ? location.pathname.split('/hub/')[1]?.split('/')[0]
    : null;

  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGames();
        const sortedGames = (data || []).sort((a: Game, b: Game) => {
          if (a.slug === 'other-games') return 1;
          if (b.slug === 'other-games') return -1;
          return 0;
        });
        setGames(sortedGames);
      } catch (error) {
        console.error('Error loading games:', error);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, []);

  const handleMouseEnter = (game: Game, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    const relativeY = rect.top - (sidebarRect?.top || 0) + rect.height / 2;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setTooltip({
        visible: true,
        gameId: game.id,
        gameName: game.name,
        y: relativeY
      });
    }, 350);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleGameClick = (gameSlug: string) => {
    if (currentSlug === gameSlug) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(`/hub/${gameSlug}`);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      className="fixed inset-y-0 left-0 z-50 w-[72px] bg-white dark:bg-dark-100 border-r border-gray-200 dark:border-gray-800 flex flex-col"
    >
      <div className="flex flex-col items-center justify-center p-3 border-b border-gray-200 dark:border-gray-800 h-20 gap-1">
        <button
          id="walkthrough-game-hub"
          onClick={() => navigate('/hub')}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isOnHubPage
              ? 'bg-primary-500/20 text-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-dark-200'
          }`}
          title={t('gameHub.title')}
        >
          <LayoutGrid className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 relative">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="w-14 h-14 mx-auto bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {games.map((game) => {
              const isSelected = currentSlug === game.slug;

              return (
                <div
                  key={game.id}
                  className="relative"
                  onMouseEnter={(e) => handleMouseEnter(game, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                  )}

                  <div
                    onClick={() => handleGameClick(game.slug)}
                    className={`w-14 h-14 mx-auto rounded-xl cursor-pointer transition-all duration-200 overflow-hidden relative group ${
                      isSelected
                        ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20 scale-105'
                        : 'hover:scale-105 hover:shadow-lg hover:shadow-black/30'
                    }`}
                  >
                    <img
                      src={game.image_url || 'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />

                    <div className={`absolute inset-0 transition-opacity duration-200 ${
                      isSelected
                        ? 'bg-primary-500/10'
                        : 'bg-black/0 group-hover:bg-black/20'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tooltip.visible && (
          <div
            className="absolute left-full ml-3 px-3 py-2 bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl whitespace-nowrap z-50 animate-tooltip-fade-in"
            style={{
              top: tooltip.y,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white dark:bg-dark-200 border-l border-b border-gray-200 dark:border-gray-700 rotate-45" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{tooltip.gameName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLibrarySidebar;
