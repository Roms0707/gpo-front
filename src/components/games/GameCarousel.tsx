import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fetchGames } from '../../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
  slug: string;
}

const GameCarousel: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  // Number of games to show at once
  const gamesPerView = isMobile ? 3 : 4;
  
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

  const handleGameClick = (game: Game) => {
    if (game.slug) {
      navigate(`/hub/${game.slug}`);
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
      {/* Navigation Arrows - Hidden on mobile */}
      {showNavigation && (
        <>
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-700 rounded-full p-2 shadow-lg transition-all duration-200"
            aria-label={t('gaming.previousGames')}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-700 rounded-full p-2 shadow-lg transition-all duration-200"
            aria-label={t('gaming.nextGames')}
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </>
      )}
      
      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="overflow-hidden mx-1 md:mx-8"
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
              className="flex-shrink-0 px-0.5 md:px-2 text-center"
              style={{ width: `${100 / gamesPerView}%` }}
            >
              <div
                className="group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:ring-2 hover:ring-primary-400/50 rounded-lg overflow-hidden"
                onClick={() => handleGameClick(game)}
                title={`${game.name} - ${game.publisher}`}
              >
                <div className="relative w-16 h-16 mx-auto rounded-lg overflow-hidden bg-gray-200 dark:bg-dark-300">
                  <img
                    src={game.image_url || 'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white text-xs font-medium bg-primary-600/80 px-1.5 py-0.5 rounded">
                      {t('gaming.viewHub')}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <h3 className="font-medium text-sm truncate transition-colors duration-200 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
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
      
      {/* Power Bar Pagination */}
      {showNavigation && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-0.5 bg-dark-300/50 dark:bg-dark-300/80 p-1 rounded-sm"
            style={{
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)'
            }}
          >
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative h-2 transition-all duration-300 ${
                  currentIndex === index
                    ? 'w-6 bg-primary-500'
                    : 'w-4 bg-dark-200 dark:bg-dark-100 hover:bg-dark-100 dark:hover:bg-dark-50'
                }`}
                style={{
                  clipPath: 'polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)',
                  boxShadow: currentIndex === index
                    ? '0 0 8px rgba(255, 121, 0, 0.6), 0 0 12px rgba(255, 121, 0, 0.3)'
                    : 'none'
                }}
                aria-label={t('gaming.goToSlide', { number: index + 1 })}
              >
                {currentIndex === index && (
                  <span
                    className="absolute inset-0 bg-primary-400 animate-pulse"
                    style={{
                      clipPath: 'polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)',
                      opacity: 0.4
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCarousel;