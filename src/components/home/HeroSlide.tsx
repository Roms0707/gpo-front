import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Play } from 'lucide-react';

interface HeroSlideProps {
  videoUrl: string;
  title: string;
  description?: string;
  logoUrl?: string;
  gameName?: string;
  ctaText: string;
  ctaLink?: string;
  isDefault?: boolean;
  isActive: boolean;
  onScrollToTournaments?: () => void;
}

export const HeroSlide: React.FC<HeroSlideProps> = ({
  videoUrl,
  title,
  description,
  logoUrl,
  gameName,
  ctaText,
  ctaLink,
  isDefault = false,
  isActive,
  onScrollToTournaments,
}) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    if (isDefault && onScrollToTournaments) {
      e.preventDefault();
      onScrollToTournaments();
    }
  };

  const CtaButton = () => (
    <button
      onClick={handleCtaClick}
      className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
      style={{
        backgroundColor: primaryColor,
        boxShadow: `0 4px 14px ${primaryColor}40`,
      }}
    >
      <Play className="w-5 h-5 mr-2 fill-current" />
      {ctaText}
    </button>
  );

  return (
    <div className="relative w-full h-full flex-shrink-0">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-dark-100"
        style={{
          backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
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
        <source src={videoUrl} type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 40%, ${primaryColor}30 100%)`,
        }}
      />

      <div className="absolute inset-0 z-[3] flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            {logoUrl && (
              <div className="mb-6 flex justify-center">
                <img
                  src={logoUrl}
                  alt={title}
                  className="h-16 md:h-24 w-auto object-contain drop-shadow-2xl"
                />
              </div>
            )}

            {gameName && !isDefault && (
              <div className="mb-4">
                <span
                  className="inline-block px-4 py-1.5 text-sm font-medium rounded-full"
                  style={{
                    backgroundColor: `${primaryColor}30`,
                    color: primaryColor,
                    border: `1px solid ${primaryColor}50`,
                  }}
                >
                  {gameName}
                </span>
              </div>
            )}

            <h2 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 leading-tight drop-shadow-lg">
              {title}
            </h2>

            {description && (
              <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
                {description}
              </p>
            )}

            <div className="flex justify-center">
              {ctaLink && !isDefault ? (
                <Link to={ctaLink}>
                  <CtaButton />
                </Link>
              ) : (
                <CtaButton />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
