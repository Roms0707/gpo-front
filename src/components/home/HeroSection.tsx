import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { TypewriterText } from '../ui/TypewriterText';

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
            <div
              onClick={onScrollToTournaments}
              className={`hero-stat-card bg-black/40 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-primary-500/50 transition-all duration-300 ${
                isMobile ? 'cursor-pointer active:scale-95' : 'hover:transform hover:-translate-y-1'
              }`}
            >
              <div className="text-3xl sm:text-4xl font-bold text-primary-400 mb-2">
                {activeTournamentsCount}
              </div>
              <div className="text-sm sm:text-base text-gray-300">
                {t('home.activeTournaments', { count: activeTournamentsCount })}
              </div>
              {isMobile && (
                <div className="mt-3 text-xs text-gray-500 flex items-center justify-center">
                  <ChevronDown className="h-3 w-3 animate-bounce" />
                </div>
              )}
            </div>

            <div
              onClick={onScrollToTournaments}
              className={`hero-stat-card bg-black/40 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-primary-500/50 transition-all duration-300 ${
                isMobile ? 'cursor-pointer active:scale-95' : 'hover:transform hover:-translate-y-1'
              }`}
              style={{ animationDelay: '0.1s' }}
            >
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {gamesCount}
              </div>
              <div className="text-sm sm:text-base text-gray-300">
                {t('home.gamesAvailable')}
              </div>
              {isMobile && (
                <div className="mt-3 text-xs text-gray-500 flex items-center justify-center">
                  <ChevronDown className="h-3 w-3 animate-bounce" />
                </div>
              )}
            </div>

            <div
              onClick={onScrollToTournaments}
              className={`hero-stat-card bg-black/40 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-red-500/50 transition-all duration-300 ${
                isMobile ? 'cursor-pointer active:scale-95' : 'hover:transform hover:-translate-y-1'
              }`}
              style={{ animationDelay: '0.2s' }}
            >
              <div className="text-3xl sm:text-4xl font-bold text-red-500 mb-2 flex items-center justify-center">
                {liveTournamentsCount}
                {liveTournamentsCount > 0 && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full ml-2 animate-pulse" />
                )}
              </div>
              <div className="text-sm sm:text-base text-gray-300">
                {t('home.liveTournaments', { count: liveTournamentsCount })}
              </div>
              {isMobile && (
                <div className="mt-3 text-xs text-gray-500 flex items-center justify-center">
                  <ChevronDown className="h-3 w-3 animate-bounce" />
                </div>
              )}
            </div>
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
