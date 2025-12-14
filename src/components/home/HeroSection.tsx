import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { HeroCarousel } from './HeroCarousel';
import { UnifiedStatsBar } from './UnifiedStatsBar';

interface HeroSectionProps {
  activeTournamentsCount: number;
  gamesCount: number;
  liveTournamentsCount: number;
  isMobile: boolean;
  onScrollToTournaments: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeTournamentsCount,
  gamesCount,
  liveTournamentsCount,
  onScrollToTournaments,
}) => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-black">
      <HeroCarousel onScrollToTournaments={onScrollToTournaments} />

      <div className="absolute bottom-0 left-0 right-0 z-20 pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <UnifiedStatsBar
              activeTournamentsCount={activeTournamentsCount}
              gamesCount={gamesCount}
              liveTournamentsCount={liveTournamentsCount}
              onScrollToTournaments={onScrollToTournaments}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
        <button
          onClick={onScrollToTournaments}
          className="text-white/60 hover:text-white transition-colors p-2 animate-bounce"
          aria-label={t('home.scrollToTournaments')}
        >
          <ChevronDown className="h-8 w-8" />
        </button>
      </div>
    </section>
  );
};
