import React from 'react';
import { HeroCarousel } from './HeroCarousel';
import { UnifiedStatsBar } from './UnifiedStatsBar';

interface HeroSectionProps {
  activeTournamentsCount: number;
  gamesCount: number;
  liveTournamentsCount: number;
  isMobile: boolean;
  onViewTournaments: () => void;
  onBrowseGames: () => void;
  onWatchLive: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeTournamentsCount,
  gamesCount,
  liveTournamentsCount,
  onViewTournaments,
  onBrowseGames,
  onWatchLive,
}) => {
  return (
    <section className="relative overflow-hidden bg-black">
      <HeroCarousel onScrollToTournaments={onViewTournaments} />

      <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 sm:pb-12 md:pb-16 lg:pb-20">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="max-w-[95%] sm:max-w-xl md:max-w-2xl mx-auto">
            <UnifiedStatsBar
              activeTournamentsCount={activeTournamentsCount}
              gamesCount={gamesCount}
              liveTournamentsCount={liveTournamentsCount}
              onViewTournaments={onViewTournaments}
              onBrowseGames={onBrowseGames}
              onWatchLive={onWatchLive}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
