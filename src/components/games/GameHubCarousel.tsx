import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Trophy, Users, Gamepad2 } from 'lucide-react';
import { fetchGames } from '../../services/api';
import { getGameTheme } from '../../utils/gameThemes';
import { APP_CONFIG } from '../../constants';

interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
  twitch_cover_url?: string;
  trailer_url?: string;
}

interface GameStats {
  tournaments: number;
  players: number;
}

interface GameHubCarouselProps {
  selectedGameId?: string | null;
  onGameSelect: (gameId: string) => void;
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

  const handleGameClick = (gameId: string) => {
    onGameSelect(gameId);
    navigate(`/hub/${gameId}`);
  };

  const getGameCover = (game: Game): string => {
    return game.twitch_cover_url || game.image_url ||
      'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
  };

  if (isLoading) {
    return (
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px] bg-dark-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-64 h-80 bg-dark-300 rounded-2xl mb-4"></div>
          <div className="w-48 h-6 bg-dark-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="relative h-[400px] bg-dark-100 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{t('gameHub.noGamesAvailable')}</p>
        </div>
      </div>
    );
  }

  const currentGame = games[currentIndex];
  const theme = getGameTheme(currentGame?.name);

  return (
    <div
      ref={containerRef}
      className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, transparent 50%, ${theme.colors.secondary}10 100%)`,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-dark-100/50 to-transparent z-10" />

      <div className="relative h-full flex items-center justify-center z-20">
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
                onClick={() => isActive ? handleGameClick(game.id) : goToSlide(index)}
              >
                <div
                  className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
                    isActive ? 'shadow-2xl ring-2' : 'shadow-lg'
                  }`}
                  style={{
                    width: isActive ? '280px' : '200px',
                    height: isActive ? '380px' : '280px',
                    ringColor: isActive ? gameTheme.colors.primary : 'transparent',
                    boxShadow: isActive
                      ? `0 25px 50px -12px ${gameTheme.colors.glow}, 0 0 30px ${gameTheme.colors.glow}`
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
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-xl md:text-2xl font-bold mb-1 drop-shadow-lg">
                        {game.name}
                      </h3>
                      <p className="text-sm text-white/80 mb-3">{game.publisher}</p>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-4 h-4" style={{ color: gameTheme.colors.secondary }} />
                          <span>{stats.tournaments || 0} {t('gameHub.tournaments')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" style={{ color: gameTheme.colors.secondary }} />
                          <span>{stats.players || 0} {t('gameHub.players')}</span>
                        </div>
                      </div>

                      <button
                        className="mt-4 w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: gameTheme.colors.primary,
                          color: gameTheme.colors.text,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGameClick(game.id);
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

      <button
        onClick={goToPrevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-dark-200/80 backdrop-blur-sm border border-gray-700 text-white hover:bg-dark-300 transition-all duration-200 hover:scale-110"
        aria-label={t('gameHub.previousGame')}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={goToNextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-dark-200/80 backdrop-blur-sm border border-gray-700 text-white hover:bg-dark-300 transition-all duration-200 hover:scale-110"
        aria-label={t('gameHub.nextGame')}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {games.map((game, index) => {
          const gameTheme = getGameTheme(game.name);
          const isActive = index === currentIndex;

          return (
            <button
              key={game.id}
              onClick={() => goToSlide(index)}
              className="relative p-1 group focus:outline-none"
              aria-label={`${t('gameHub.goToGame')} ${game.name}`}
            >
              <div
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  isActive ? 'scale-110' : 'opacity-60 group-hover:opacity-100'
                }`}
                style={{
                  borderColor: isActive ? gameTheme.colors.primary : 'transparent',
                  boxShadow: isActive ? `0 0 12px ${gameTheme.colors.glow}` : 'none',
                }}
              >
                <img
                  src={getGameCover(game)}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              </div>
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
      `}</style>
    </div>
  );
};

export default GameHubCarousel;
