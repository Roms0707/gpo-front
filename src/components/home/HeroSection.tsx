import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { TypewriterText } from '../ui/TypewriterText';
import { HeroThemeCarousel } from './hero-cards';

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
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-black">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80)`,
        }}
      />

      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={handleVideoLoad}
        className={`absolute inset-0 z-[1] w-full h-full object-cover transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source
          src="https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4"
          type="video/mp4"
        />
      </video>

      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 40%, ${primaryColor}20 100%)`,
        }}
      />

      <div className="absolute inset-0 z-[3] hero-radial-glow" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="min-h-[4rem] sm:min-h-[4.5rem] md:min-h-[5.5rem] lg:min-h-[7rem] xl:min-h-[8rem] flex items-center justify-center mb-8">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white leading-tight">
              <TypewriterText
                phrases={heroPhases}
                typingSpeed={70}
                deletingSpeed={35}
                pauseDuration={2500}
                className="hero-typewriter-text"
                cursorClassName="text-primary-500"
              />
            </h1>
          </div>

          <HeroThemeCarousel
            activeTournamentsCount={activeTournamentsCount}
            gamesCount={gamesCount}
            liveTournamentsCount={liveTournamentsCount}
            isMobile={isMobile}
            onScrollToTournaments={onScrollToTournaments}
            primaryColor={primaryColor}
            t={t}
          />
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
