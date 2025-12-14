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
        const { defaultTrailer, featuredTrailers } = await fetchHeroCarouselData();

        const carouselSlides: SlideData[] = [];

        const phrase1 = defaultTrailer?.typewriter_phrase_1 || 'Welcome To the Arena';
        const phrase2 = (defaultTrailer?.typewriter_phrase_2 || 'Welcome to {brandName}').replace('{brandName}', brandName);

        const defaultSlide: SlideData = {
          id: defaultTrailer?.id || 'default',
          videoUrl: defaultTrailer?.video_url || DEFAULT_VIDEO_URL,
          title: phrase1,
          typewriterPhrases: [phrase1, phrase2],
          ctaText: t('heroCarousel.exploreTournaments'),
          isDefault: true,
        };
        carouselSlides.push(defaultSlide);

        featuredTrailers.forEach((trailer: any) => {
          if (trailer.tournament) {
            carouselSlides.push({
              id: trailer.id,
              videoUrl: trailer.video_url,
              title: trailer.tournament.title,
              logoUrl: trailer.tournament.header_url,
              gameName: trailer.game?.name,
              ctaText: t('heroCarousel.registerNow'),
              ctaLink: `/tournament/${trailer.tournament.id}`,
              isDefault: false,
            });
          }
        });

        setSlides(carouselSlides);
      } catch (error) {
        console.error('Error loading carousel data:', error);
        const fallbackPhrase1 = 'Welcome To the Arena';
        const fallbackPhrase2 = `Welcome to ${brandName}`;
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
      <div className="relative min-h-[70vh] md:min-h-[80vh] bg-dark-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-48 h-8 bg-dark-300 rounded mb-4"></div>
          <div className="w-96 h-12 bg-dark-300 rounded mb-4"></div>
          <div className="w-64 h-6 bg-dark-300 rounded mb-8"></div>
          <div className="w-40 h-12 bg-dark-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[70vh] md:min-h-[80vh] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
          width: `${slides.length * 100}%`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="relative min-h-[70vh] md:min-h-[80vh]"
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
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                currentSlide === index
                  ? 'w-8 h-2 skew-x-[-12deg]'
                  : 'w-2 h-2 rotate-45 hover:scale-110'
              }`}
              style={{
                backgroundColor: currentSlide === index ? primaryColor : 'rgba(255, 255, 255, 0.4)',
                boxShadow: currentSlide === index ? `0 0 10px ${primaryColor}60` : 'none',
              }}
              aria-label={t('heroCarousel.goToSlide', { number: index + 1 })}
            />
          ))}
        </div>
      )}
    </div>
  );
};
