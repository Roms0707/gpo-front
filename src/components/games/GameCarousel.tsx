import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchGames } from '../../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
}

interface GameCarouselProps {
  onGameSelect?: (gameId: string | null) => void;
  selectedGameId?: string | null;
}

const GameCarousel: React.FC<GameCarouselProps> = ({ onGameSelect, selectedGameId }) => {
  const { t } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  // Number of games to show at once
  const gamesPerView = isMobile ? 2 : 4;
  
  // Only show navigation if we have more games than can fit in view
  const showNavigation = games.length > gamesPerView;
  
  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGames();
        setGames(data);
      } catch (error) {
        console.error('Error loading games:', error);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, []);

  const handleGameClick = (gameId: string) => {
    // If the game is already selected, deselect it (toggle functionality)
    if (selectedGameId === gameId && onGameSelect) {
      onGameSelect(null);
    } else if (onGameSelect) {
      onGameSelect(gameId);
    }
  };
  
  // Calculate max index based on games length and games per view
  const maxIndex = Math.max(0, games.length - gamesPerView);
  
  // Slider navigation
  const goToNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const goToPrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };
  
  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // Minimum swipe distance
    
    if (diff > threshold) {
      // Swiped left, go next
      goToNext();
    } else if (diff < -threshold) {
      // Swiped right, go prev
      goToPrev();
    }
    
    // Reset values
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex items-center justify-center space-x-4 p-4">
          {[...Array(gamesPerView)].map((_, index) => (
            <div key={index} className="animate-pulse flex-shrink-0">
              <div className="w-16 h-16 bg-gray-300 dark:bg-dark-300 rounded-lg"></div>
              <div className="mt-2 h-4 bg-gray-300 dark:bg-dark-300 rounded w-16 mx-auto"></div>
              <div className="mt-1 h-3 bg-gray-300 dark:bg-dark-300 rounded w-12 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">{t('gaming.noGamesAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      {showNavigation && (
        <>
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-700 rounded-full p-2 shadow-lg transition-all duration-200"
            aria-label={t('gaming.previousGames')}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-700 rounded-full p-2 shadow-lg transition-all duration-200"
            aria-label={t('gaming.nextGames')}
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </>
      )}
      
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="overflow-hidden mx-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / gamesPerView)}%)`
          }}
        >
          {games.map((game) => (
            <div 
              key={game.id}
              className="flex-shrink-0 px-2 text-center"
              style={{ width: `${100 / gamesPerView}%` }}
            >
              <div
                className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedGameId === game.id 
                    ? 'ring-2 ring-primary-500 shadow-lg scale-105' 
                    : 'hover:ring-2 hover:ring-primary-400/50'
                } rounded-lg overflow-hidden`}
                onClick={() => handleGameClick(game.id)}
                title={`${game.name} - ${game.publisher}`}
              >
                {/* Game Logo */}
                <div className="relative w-16 h-16 mx-auto rounded-lg overflow-hidden bg-gray-200 dark:bg-dark-300">
                  <img 
                    src={game.image_url || 'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                    alt={game.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Selected indicator */}
                  {selectedGameId === game.id && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white dark:border-dark-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white text-xs font-medium bg-primary-600/80 px-1.5 py-0.5 rounded">
                      {selectedGameId === game.id ? t('gaming.selected') : t('gaming.select')}
                    </div>
                  </div>
                </div>
                
                {/* Game Info */}
                <div className="mt-2 text-center">
                  <h3 className={`font-medium text-sm truncate transition-colors duration-200 ${
                    selectedGameId === game.id 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
                  }`}>
                    {game.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {game.publisher}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots Indicator */}
      {showNavigation && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                currentIndex === index
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={t('gaming.goToSlide', { number: index + 1 })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GameCarousel;