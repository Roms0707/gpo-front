import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchGames } from '../../services/api';
import { Gamepad2, X, LayoutGrid } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
}

interface GameLibrarySidebarProps {
  selectedGameId: string | null;
  onGameSelect: (gameId: string | null) => void;
  filteredTournamentsCount: number;
}

interface TooltipState {
  visible: boolean;
  gameId: string | null;
  gameName: string;
  y: number;
}

const GameLibrarySidebar: React.FC<GameLibrarySidebarProps> = ({
  selectedGameId,
  onGameSelect,
  filteredTournamentsCount
}) => {
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

  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGames();
        setGames(data || []);
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

  const handleGameClick = (gameId: string) => {
    if (selectedGameId === gameId) {
      onGameSelect(null);
    } else {
      onGameSelect(gameId);

      setTimeout(() => {
        const tournamentsSection = document.getElementById('tournaments');
        if (tournamentsSection) {
          const headerOffset = 80;
          const elementPosition = tournamentsSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const handleClearFilter = () => {
    onGameSelect(null);
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
      className="fixed inset-y-0 left-0 z-50 w-[72px] bg-dark-100 border-r border-gray-800 flex flex-col"
    >
      <div className="flex flex-col items-center justify-center p-3 border-b border-gray-800 h-20 gap-1">
        <button
          onClick={() => navigate('/hub')}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isOnHubPage
              ? 'bg-primary-500/20 text-primary-500'
              : 'text-gray-400 hover:text-primary-500 hover:bg-dark-200'
          }`}
          title={t('gameHub.title')}
        >
          <LayoutGrid className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 relative">
        {selectedGameId && (
          <div
            className="w-14 h-14 mx-auto mb-3 bg-primary-600/20 border border-primary-600/30 rounded-xl hover:bg-primary-600/30 transition-all duration-200 cursor-pointer flex items-center justify-center group"
            onClick={handleClearFilter}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const sidebarRect = sidebarRef.current?.getBoundingClientRect();
              const relativeY = rect.top - (sidebarRect?.top || 0) + rect.height / 2;

              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = setTimeout(() => {
                setTooltip({
                  visible: true,
                  gameId: 'clear',
                  gameName: t('home.clearFilter'),
                  y: relativeY
                });
              }, 350);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <X className="h-5 w-5 text-primary-400 group-hover:text-primary-300 transition-colors" />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="w-14 h-14 mx-auto bg-dark-300 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {games.map((game) => {
              const isSelected = selectedGameId === game.id;

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
                    onClick={() => handleGameClick(game.id)}
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
            className="absolute left-full ml-3 px-3 py-2 bg-dark-200 border border-gray-700 rounded-lg shadow-xl whitespace-nowrap z-50 animate-tooltip-fade-in"
            style={{
              top: tooltip.y,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-dark-200 border-l border-b border-gray-700 rotate-45" />
            <span className="text-sm font-medium text-white">{tooltip.gameName}</span>
          </div>
        )}
      </div>

      {selectedGameId && (
        <div className="p-2 border-t border-gray-800 bg-dark-200/50">
          <div className="text-center">
            <span className="text-xs text-gray-400">{filteredTournamentsCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLibrarySidebar;
