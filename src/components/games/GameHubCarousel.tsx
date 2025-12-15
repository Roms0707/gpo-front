import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Gamepad2 } from 'lucide-react';
import { fetchGames } from '../../services/api';
import { getGameTheme } from '../../utils/gameThemes';
import { APP_CONFIG } from '../../constants';

interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
  slug: string;
  twitch_cover_url?: string;
  igdb_artwork_url?: string;
  trailer_url?: string;
}

interface GameStats {
  tournaments: number;
  players: number;
}

interface GameHubCarouselProps {
  selectedGameId?: string | null;
  onGameSelect: (gameSlug: string) => void;
}

const GameHubCarousel: React.FC<GameHubCarouselProps> = ({
  selectedGameId,
  onGameSelect
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStats] = useState<Record<string, GameStats>>({});
  const slideInterval = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGames();
        setGames(data || []);

        if (selectedGameId && data) {
          const selectedIndex = data.findIndex((g: Game) => g.id === selectedGameId);
          if (selectedIndex >= 0) {
            setCurrentIndex(selectedIndex);
          }
        }
      } catch (error) {
        console.error('Error loading games:', error);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, [selectedGameId]);

  const goToSlide = useCallback((index: number) => {
    const newIndex = ((index % games.length) + games.length) % games.length;
    setCurrentIndex(newIndex);
  }, [games.length]);

  const goToNextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const goToPrevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
      slideInterval.current = null;
    }

    if (games.length > 1 && !isPaused) {
      slideInterval.current = setInterval(() => {
        goToNextSlide();
      }, APP_CONFIG.SLIDESHOW_INTERVAL);
    }

    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [games.length, isPaused, goToNextSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevSlide, goToNextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold) {
      goToNextSlide();
    } else if (diff < -threshold) {
      goToPrevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleGameClick = (gameSlug: string) => {
    onGameSelect(gameSlug);
    navigate(`/hub/${gameSlug}`);
  };

  const getGameCover = (game: Game): string => {
    return game.twitch_cover_url || game.image_url ||
      'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
  };

  const getGameBackground = (game: Game): string => {
    return game.igdb_artwork_url || game.twitch_cover_url || game.image_url ||
      'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
  };

  const hasWideArtwork = (game: Game): boolean => {
    return !!game.igdb_artwork_url;
  };

  if (isLoading) {
    return (
      <div className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] xl:min-h-[70vh] 2xl:min-h-[75vh] bg-dark-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-48 h-64 bg-dark-300 rounded-xl mb-4"></div>
          <div className="w-36 h-5 bg-dark-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] xl:min-h-[70vh] 2xl:min-h-[75vh] bg-dark-100 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('gameHub.noGamesAvailable')}</p>
        </div>
      </div>
    );
  }

  const currentGame = games[currentIndex];
  const theme = getGameTheme(currentGame?.name);
  const currentGameBackground = currentGame ? getGameBackground(currentGame) : '';
  const isWideBackground = currentGame ? hasWideArtwork(currentGame) : false;

  return (
    <div
      ref={containerRef}
      className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[65vh] xl:min-h-[70vh] 2xl:min-h-[75vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          backgroundImage: `url(${currentGameBackground})`,
          backgroundSize: isWideBackground ? 'cover' : 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: isWideBackground ? 0.35 : 0.22,
          filter: isWideBackground ? 'blur(2px)' : 'blur(1px)',
          transform: isWideBackground ? 'scale(1.02)' : 'none',
        }}
      />

      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}20 0%, transparent 50%, ${theme.colors.secondary}15 100%)`,
        }}
      />

      <div
        className="absolute inset-0 z-10"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 40%, ${theme.colors.primary}30 100%)`,
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center z-20" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <div className="flex items-center gap-4 md:gap-8 lg:gap-12 px-4">
          {games.map((game, index) => {
            const offset = index - currentIndex;
            const isActive = index === currentIndex;
            const isVisible = Math.abs(offset) <= 2;
            const gameTheme = getGameTheme(game.name);
            const stats = gameStats[game.id] || { tournaments: 0, players: 0 };

            if (!isVisible) return null;

            return (
              <div
                key={game.id}
                className="transition-all duration-500 ease-out cursor-pointer flex-shrink-0"
                style={{
                  transform: `translateX(${offset * -50}%) scale(${isActive ? 1 : 0.75}) translateZ(${isActive ? 0 : -100}px)`,
                  opacity: isActive ? 1 : 0.5,
                  zIndex: isActive ? 30 : 20 - Math.abs(offset),
                  filter: isActive ? 'none' : 'blur(2px)',
                }}
                onClick={() => isActive ? handleGameClick(game.slug) : goToSlide(index)}
              >
                <div
                  className={`relative rounded-xl overflow-hidden transition-all duration-500 ${
                    isActive ? 'shadow-2xl ring-2' : 'shadow-lg'
                  }`}
                  style={{
                    width: isActive ? '200px' : '140px',
                    height: isActive ? '280px' : '200px',
                    ringColor: isActive ? gameTheme.colors.primary : 'transparent',
                    boxShadow: isActive
                      ? `0 20px 40px -12px ${gameTheme.colors.glow}, 0 0 25px ${gameTheme.colors.glow}`
                      : undefined,
                  }}
                >
                  <img
                    src={getGameCover(game)}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />

                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to top, ${gameTheme.colors.primary}CC 0%, transparent 60%)`,
                    }}
                  />

                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="text-base md:text-lg font-bold mb-0.5 drop-shadow-lg truncate">
                        {game.name}
                      </h3>
                      <p className="text-xs text-white/80 mb-2 truncate">{game.publisher}</p>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" style={{ color: gameTheme.colors.secondary }} />
                          <span>{stats.tournaments || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" style={{ color: gameTheme.colors.secondary }} />
                          <span>{stats.players || 0}</span>
                        </div>
                      </div>

                      <button
                        className="mt-2.5 w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: gameTheme.colors.primary,
                          color: gameTheme.colors.text,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGameClick(game.slug);
                        }}
                      >
                        {t('gameHub.exploreGame')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center">
        {games.map((game, index) => {
          const gameTheme = getGameTheme(game.name);
          const isActive = index === currentIndex;
          const distanceFromActive = Math.abs(index - currentIndex);
          const isLeftOfActive = index < currentIndex;
          const isRightOfActive = index > currentIndex;

          const clusterMargin = isActive
            ? 'mx-3'
            : isLeftOfActive
              ? 'mr-1 ml-0.5'
              : isRightOfActive
                ? 'ml-1 mr-0.5'
                : 'mx-1';

          const diamondScale = isActive ? 1 : distanceFromActive === 1 ? 0.75 : 0.6;

          return (
            <button
              key={game.id}
              onClick={() => goToSlide(index)}
              className={`group focus:outline-none p-1.5 ${clusterMargin} transition-all duration-300 relative`}
              aria-label={`${t('gameHub.goToGame')} ${game.name}`}
              style={{
                '--glow-color': gameTheme.colors.glow,
                '--glow-color-40': `${gameTheme.colors.glow}66`,
                '--glow-color-20': `${gameTheme.colors.glow}33`,
                '--primary-color': gameTheme.colors.primary,
              } as React.CSSProperties}
            >
              <div
                className={`transition-all duration-300 ${isActive ? 'diamond-pulse' : ''}`}
                style={{
                  width: isActive ? '14px' : '10px',
                  height: isActive ? '14px' : '10px',
                  transform: `rotate(45deg) scale(${diamondScale})`,
                  backgroundColor: isActive ? gameTheme.colors.primary : 'transparent',
                  border: isActive ? 'none' : '2px solid rgba(156, 163, 175, 0.6)',
                  boxShadow: isActive
                    ? `0 0 12px ${gameTheme.colors.glow}, 0 0 20px ${gameTheme.colors.glow}66`
                    : 'none',
                }}
              />
              {!isActive && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    width: '10px',
                    height: '10px',
                    transform: `translate(-50%, -50%) rotate(45deg) scale(${diamondScale})`,
                    backgroundColor: `${gameTheme.colors.primary}40`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {games.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-300/50 z-30">
          <div
            className="h-full transition-all"
            style={{
              backgroundColor: theme.colors.primary,
              animation: `progress ${APP_CONFIG.SLIDESHOW_INTERVAL}ms linear infinite`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }

        @keyframes diamondPulse {
          0%, 100% {
            box-shadow: 0 0 12px var(--glow-color), 0 0 20px var(--glow-color-40);
            transform: rotate(45deg) scale(1);
          }
          50% {
            box-shadow: 0 0 20px var(--glow-color), 0 0 35px var(--glow-color-40), 0 0 50px var(--glow-color-20);
            transform: rotate(45deg) scale(1.15);
          }
        }

        .diamond-pulse {
          animation: diamondPulse 1.8s ease-in-out infinite;
          background-color: var(--primary-color) !important;
        }
      `}</style>
    </div>
  );
};

export default GameHubCarousel;
