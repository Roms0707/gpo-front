import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Trophy, Gamepad2, Radio } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { TypewriterText } from '../ui/TypewriterText';
import { PixelStatCard } from '../ui/PixelStatCard';

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
  const { brandName, primaryColor } = useAppConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const heroPhases = [
    t('home.heroWelcome'),
    `${t('home.heroWelcomeBrand')} ${brandName}`,
    t('home.heroTagline'),
  ];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={handleVideoLoad}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        poster="https://images.pexels.com/photos/7915357/pexels-photo-7915357.jpeg?auto=compress&cs=tinysrgb&w=1920"
      >
        <source
          src="https://videos.pexels.com/video-files/7915357/7915357-uhd_2560_1440_30fps.mp4"
          type="video/mp4"
        />
      </video>

      <div
        className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-secondary-900/80"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 40%, ${primaryColor}15 100%)`,
        }}
      />

      <div className="absolute inset-0 hero-radial-glow" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-8 text-white leading-tight">
            <TypewriterText
              phrases={heroPhases}
              typingSpeed={70}
              deletingSpeed={35}
              pauseDuration={2500}
              className="hero-typewriter-text"
              cursorClassName="text-primary-500"
            />
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 md:mt-12 max-w-3xl mx-auto">
            <PixelStatCard
              value={activeTournamentsCount}
              label={t('home.activeTournaments', { count: activeTournamentsCount })}
              color="#00E5FF"
              hoverIcon={<Trophy className="w-5 h-5" />}
              isMobile={isMobile}
              onClick={onScrollToTournaments}
            />

            <PixelStatCard
              value={gamesCount}
              label={t('home.gamesAvailable')}
              color="#39FF14"
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

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block">
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
