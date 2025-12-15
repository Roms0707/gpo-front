import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchHeroCarouselData } from '../../services/api';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { HeroSlide } from './HeroSlide';
import { APP_CONFIG } from '../../constants';

interface SlideData {
  id: string;
  videoUrl: string;
  title: string;
  typewriterPhrases?: string[];
  logoUrl?: string;
  gameName?: string;
  ctaText: string;
  ctaLink?: string;
  isDefault: boolean;
}

interface HeroCarouselProps {
  onScrollToTournaments: () => void;
}

const DEFAULT_VIDEO_URL = 'https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4';

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  onScrollToTournaments,
}) => {
  const { t } = useTranslation();
  const { brandName, primaryColor } = useAppConfig();
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const loadCarouselData = async () => {
      try {
        setIsLoading(true);
        const { homeTrailer, featuredTrailers } = await fetchHeroCarouselData();

        const carouselSlides: SlideData[] = [];

        const phraseKey1 = homeTrailer?.typewriter_phrase_1 || 'heroCarousel.home.phrase1';
        const phraseKey2 = homeTrailer?.typewriter_phrase_2 || 'heroCarousel.home.phrase2';
        const phrase1 = t(phraseKey1, { brandName });
        const phrase2 = t(phraseKey2, { brandName });

        const homeSlide: SlideData = {
          id: homeTrailer?.id || 'home',
          videoUrl: homeTrailer?.video_url || DEFAULT_VIDEO_URL,
          title: phrase1,
          typewriterPhrases: [phrase1, phrase2],
          ctaText: t('heroCarousel.exploreTournaments'),
          isDefault: true,
        };
        carouselSlides.push(homeSlide);

        featuredTrailers.forEach((trailer: any) => {
          if (trailer.tournament_id) {
            const tournamentId = trailer.tournament?.id || trailer.tournament_id;
            carouselSlides.push({
              id: trailer.id,
              videoUrl: trailer.video_url,
              title: trailer.title || trailer.tournament?.title || '',
              gameName: trailer.game?.name,
              ctaText: t('heroCarousel.registerNow'),
              ctaLink: `/tournament/${tournamentId}`,
              isDefault: false,
            });
          }
        });

        setSlides(carouselSlides);
      } catch (error) {
        console.error('Error loading carousel data:', error);
        const fallbackPhrase1 = t('heroCarousel.home.phrase1', { brandName });
        const fallbackPhrase2 = t('heroCarousel.home.phrase2', { brandName });
        setSlides([{
          id: 'fallback',
          videoUrl: DEFAULT_VIDEO_URL,
          title: fallbackPhrase1,
          typewriterPhrases: [fallbackPhrase1, fallbackPhrase2],
          ctaText: t('heroCarousel.exploreTournaments'),
          isDefault: true,
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCarouselData();
  }, [t, brandName]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
      slideInterval.current = null;
    }

    if (slides.length > 1 && !isPaused) {
      slideInterval.current = setInterval(() => {
        goToNextSlide();
      }, APP_CONFIG.SLIDESHOW_INTERVAL);
    }

    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [slides.length, isPaused, goToNextSlide]);

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

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (isLoading) {
    return (
      <div className="relative min-h-[55vh] sm:min-h-[65vh] md:min-h-[75vh] lg:min-h-[80vh] bg-dark-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center px-4">
          <div className="w-32 sm:w-48 h-6 sm:h-8 bg-dark-300 rounded mb-3 sm:mb-4"></div>
          <div className="w-64 sm:w-96 h-8 sm:h-12 bg-dark-300 rounded mb-3 sm:mb-4"></div>
          <div className="w-48 sm:w-64 h-5 sm:h-6 bg-dark-300 rounded mb-6 sm:mb-8"></div>
          <div className="w-32 sm:w-40 h-10 sm:h-12 bg-dark-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[55vh] sm:min-h-[65vh] md:min-h-[75vh] lg:min-h-[80vh] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * (100 / slides.length)}%)`,
          width: `${slides.length * 100}%`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="relative min-h-[55vh] sm:min-h-[65vh] md:min-h-[75vh] lg:min-h-[80vh] flex-shrink-0"
            style={{ width: `${100 / slides.length}%` }}
          >
            <HeroSlide
              videoUrl={slide.videoUrl}
              title={slide.title}
              typewriterPhrases={slide.typewriterPhrases}
              logoUrl={slide.logoUrl}
              gameName={slide.gameName}
              ctaText={slide.ctaText}
              ctaLink={slide.ctaLink}
              isDefault={slide.isDefault}
              isActive={currentSlide === index}
              onScrollToTournaments={onScrollToTournaments}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex items-center space-x-0.5 sm:space-x-1">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="p-1.5 sm:p-2 cursor-pointer group focus:outline-none"
              aria-label={t('heroCarousel.goToSlide', { number: index + 1 })}
            >
              <span
                className={`block transition-all duration-300 ${
                  currentSlide === index
                    ? 'w-6 sm:w-8 md:w-10 h-2 sm:h-2.5 skew-x-[-12deg]'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 rotate-45 group-hover:scale-125'
                }`}
                style={{
                  backgroundColor: currentSlide === index ? primaryColor : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: currentSlide === index ? `0 0 12px ${primaryColor}80` : 'none',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
