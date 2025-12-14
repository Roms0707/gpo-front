import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Trophy, Gamepad2, Radio } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { PixelStatCard } from '../ui/PixelStatCard';
import { HeroCarousel } from './HeroCarousel';

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
  isMobile,
  onScrollToTournaments,
}) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();

  return (
    <section className="relative overflow-hidden bg-black">
      <HeroCarousel onScrollToTournaments={onScrollToTournaments} />

      <div className="absolute bottom-0 left-0 right-0 z-20 pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <PixelStatCard
              value={activeTournamentsCount}
              label={t('home.activeTournaments', { count: activeTournamentsCount })}
              color="#6B7280"
              numberColor={primaryColor}
              hoverIcon={<Trophy className="w-5 h-5" />}
              isMobile={isMobile}
              onClick={onScrollToTournaments}
            />

            <PixelStatCard
              value={gamesCount}
              label={t('home.gamesAvailable')}
              color="#6B7280"
              numberColor={primaryColor}
              hoverIcon={<Gamepad2 className="w-5 h-5" />}
              isMobile={isMobile}
              onClick={onScrollToTournaments}
              animationDelay="0.1s"
            />

            <PixelStatCard
              value={liveTournamentsCount}
              label={t('home.liveTournaments', { count: liveTournamentsCount })}
              color="#EF4444"
              hoverIcon={<Radio className="w-5 h-5" />}
              showPulse={liveTournamentsCount > 0}
              isMobile={isMobile}
              onClick={onScrollToTournaments}
              animationDelay="0.2s"
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
