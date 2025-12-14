import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Gamepad2, Radio } from 'lucide-react';
import { RetroPixelStatCard } from './RetroPixelStatCard';
import { ArcadePixelStatCard } from './ArcadePixelStatCard';
import { MagicBentStatCard } from './MagicBentStatCard';

interface HeroThemeCarouselProps {
  activeTournamentsCount: number;
  gamesCount: number;
  liveTournamentsCount: number;
  isMobile: boolean;
  onScrollToTournaments: () => void;
  primaryColor: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

type ThemeType = 'retro' | 'arcade' | 'magic';

interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
}

const themes: ThemeConfig[] = [
  { id: 'retro', name: 'Retro Pixel', description: '8-bit nostalgia' },
  { id: 'arcade', name: 'Arcade Pixel', description: 'Neon cabinet' },
  { id: 'magic', name: 'Magic Bent', description: 'Ethereal mystique' },
];

export const HeroThemeCarousel: React.FC<HeroThemeCarouselProps> = ({
  activeTournamentsCount,
  gamesCount,
  liveTournamentsCount,
  isMobile,
  onScrollToTournaments,
  primaryColor,
  t,
}) => {
  const [currentTheme, setCurrentTheme] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const goToTheme = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentTheme(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const goToNext = useCallback(() => {
    const nextIndex = (currentTheme + 1) % themes.length;
    goToTheme(nextIndex);
  }, [currentTheme, goToTheme]);

  const goToPrev = useCallback(() => {
    const prevIndex = (currentTheme - 1 + themes.length) % themes.length;
    goToTheme(prevIndex);
  }, [currentTheme, goToTheme]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      goToNext();
    }, 10000);

    return () => clearInterval(interval);
  }, [isPaused, goToNext]);

  const cardProps = {
    isMobile,
    onClick: onScrollToTournaments,
  };

  const renderCards = (theme: ThemeType): ReactNode => {
    const CardComponent = {
      retro: RetroPixelStatCard,
      arcade: ArcadePixelStatCard,
      magic: MagicBentStatCard,
    }[theme];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
        <CardComponent
          value={activeTournamentsCount}
          label={t('home.activeTournaments', { count: activeTournamentsCount })}
          color="#6B7280"
          numberColor={primaryColor}
          hoverIcon={<Trophy className="w-5 h-5" />}
          {...cardProps}
        />
        <CardComponent
          value={gamesCount}
          label={t('home.gamesAvailable')}
          color="#6B7280"
          numberColor={primaryColor}
          hoverIcon={<Gamepad2 className="w-5 h-5" />}
          animationDelay="0.1s"
          {...cardProps}
        />
        <CardComponent
          value={liveTournamentsCount}
          label={t('home.liveTournaments', { count: liveTournamentsCount })}
          color="#EF4444"
          hoverIcon={<Radio className="w-5 h-5" />}
          showPulse={liveTournamentsCount > 0}
          animationDelay="0.2s"
          {...cardProps}
        />
      </div>
    );
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-600 ease-in-out"
          style={{
            transform: `translateX(-${currentTheme * 100}%)`,
            transitionDuration: '600ms',
          }}
        >
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="w-full flex-shrink-0 px-4"
            >
              {renderCards(theme.id)}
            </div>
          ))}
        </div>
      </div>

      {!isMobile && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/50 transition-all duration-200 z-10"
            aria-label="Previous theme"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/50 transition-all duration-200 z-10"
            aria-label="Next theme"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="flex items-center justify-center mt-6 gap-3">
        {themes.map((theme, index) => (
          <button
            key={theme.id}
            onClick={() => goToTheme(index)}
            className={`
              group relative flex items-center gap-2 px-3 py-1.5 rounded-full
              transition-all duration-300 ease-out
              ${currentTheme === index
                ? 'bg-white/15 backdrop-blur-sm'
                : 'bg-transparent hover:bg-white/5'
              }
            `}
            aria-label={`Switch to ${theme.name} theme`}
          >
            <span
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${currentTheme === index
                  ? 'scale-100'
                  : 'scale-75 opacity-50 group-hover:opacity-75'
                }
              `}
              style={{
                backgroundColor: currentTheme === index ? primaryColor : 'rgba(255,255,255,0.5)',
                boxShadow: currentTheme === index ? `0 0 10px ${primaryColor}` : 'none',
              }}
            />
            <span
              className={`
                text-xs font-medium tracking-wide uppercase transition-all duration-300
                ${currentTheme === index
                  ? 'text-white'
                  : 'text-white/40 group-hover:text-white/60'
                }
              `}
            >
              {theme.name}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-center mt-2">
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden w-48">
          <div
            className="h-full rounded-full transition-all ease-linear"
            style={{
              backgroundColor: primaryColor,
              width: isPaused ? '0%' : '100%',
              transitionDuration: isPaused ? '0ms' : '10000ms',
              animation: isPaused ? 'none' : undefined,
            }}
            key={currentTheme}
          />
        </div>
      </div>
    </div>
  );
};
