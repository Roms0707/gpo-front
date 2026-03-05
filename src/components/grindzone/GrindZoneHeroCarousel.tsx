import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { FeaturedGrindSlide } from '../../types/grindZone';
import { APP_CONFIG } from '../../constants';

interface GrindZoneHeroCarouselProps {
  slides: FeaturedGrindSlide[];
  onSelectSlide: (slide: FeaturedGrindSlide) => void;
}

const SlideVideo: React.FC<{ src: string; isActive: boolean }> = ({ src, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = 0.85;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      onLoadedData={() => setLoaded(true)}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

const slideAnimationStyles = `
  @keyframes heroSlideIn {
    from { opacity: 0; transform: scale(0.92) translateY(12px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const GrindZoneHeroCarousel: React.FC<GrindZoneHeroCarouselProps> = ({
  slides,
  onSelectSlide,
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || slides.length === 0) return;
    setIsTransitioning(true);
    const newIndex = ((index % slides.length) + slides.length) % slides.length;
    setCurrentIndex(newIndex);
    setAnimKey(prev => prev + 1);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [slides.length, isTransitioning]);

  const goNext = useCallback(() => goToSlide(currentIndex + 1), [currentIndex, goToSlide]);
  const goPrev = useCallback(() => goToSlide(currentIndex - 1), [currentIndex, goToSlide]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length > 1 && !isPaused) {
      intervalRef.current = setInterval(goNext, APP_CONFIG.SLIDESHOW_INTERVAL);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [slides.length, isPaused, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-gray-950 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{slideAnimationStyles}</style>
      <div className="relative" style={{ height: 'clamp(620px, 80vh, 820px)' }}>
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              className="absolute inset-0 transition-all duration-[700ms] ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'scale(1)' : 'scale(1.08)',
                zIndex: isActive ? 1 : 0,
              }}
            >
              {slide.trailer_url ? (
                <SlideVideo src={slide.trailer_url} isActive={isActive} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950" />
              )}

              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950 to-transparent" />
            </div>
          );
        })}

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-24 md:pt-28 pb-10">
          <div key={animKey} className="flex flex-col items-center">
            <div
              className="relative group/cover"
              style={{ animation: 'heroSlideIn 600ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
            >
              {currentSlide.is_new && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm shadow-lg whitespace-nowrap">
                    {t('grindZone.hero.new')}
                  </span>
                </div>
              )}

              <div
                className="relative rounded-lg overflow-hidden shadow-2xl transition-transform duration-500 group-hover/cover:scale-[1.03]"
                style={{
                  width: 'clamp(180px, 22vw, 280px)',
                  aspectRatio: '390 / 520',
                }}
              >
                <img
                  src={currentSlide.cover_image_url}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 ring-1 ring-white/10 rounded-lg" />
              </div>

              <div className="absolute -inset-4 rounded-2xl opacity-0 group-hover/cover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)',
                }}
              />
            </div>

            <p
              className="mt-3 text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-[0.2em]"
              style={{ animation: 'heroFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both' }}
            >
              {currentSlide.game_name}
            </p>

            <button
              onClick={() => onSelectSlide(currentSlide)}
              className="mt-3 group inline-flex items-center gap-2.5 px-7 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/40 text-white font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ animation: 'heroFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both' }}
            >
              <Play className="w-4 h-4 fill-current" />
              {t('grindZone.hero.watch')}
            </button>

            {slides.length > 1 && (
              <div
                className="mt-4 flex items-center gap-2"
                style={{ animation: 'heroFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both' }}
              >
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentIndex
                        ? 'w-7 h-2 bg-white'
                        : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-[55%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 hover:scale-110"
            aria-label={t('common.previous')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-[55%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 hover:scale-110"
            aria-label={t('common.next')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </section>
  );
};

export default GrindZoneHeroCarousel;
