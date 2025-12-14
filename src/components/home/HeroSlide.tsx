import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { DecryptedPhrases } from '../ui/DecryptedPhrases';
import { GameThemedButton } from '../ui/GameThemedButton';

const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)/.test(url);
};

const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/v\/)([^?\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getYouTubeEmbedUrl = (videoId: string): string => {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    showinfo: '0',
    modestbranding: '1',
    rel: '0',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

interface HeroSlideProps {
  videoUrl: string;
  title: string;
  typewriterPhrases?: string[];
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
  typewriterPhrases,
  logoUrl,
  gameName,
  ctaText,
  ctaLink,
  isDefault = false,
  isActive,
  onScrollToTournaments,
}) => {
  const { primaryColor } = useAppConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isYouTubeLoaded, setIsYouTubeLoaded] = useState(false);

  const isYouTube = isYouTubeUrl(videoUrl);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(videoUrl) : null;
  const youtubeEmbedUrl = youtubeVideoId ? getYouTubeEmbedUrl(youtubeVideoId) : null;

  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      videoRef.current.playbackRate = 0.8;
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isYouTube]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleYouTubeLoad = () => {
    setIsYouTubeLoaded(true);
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    if (isDefault && onScrollToTournaments) {
      e.preventDefault();
      onScrollToTournaments();
    }
  };

  return (
    <div className="relative w-full h-full flex-shrink-0">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-dark-100"
        style={{
          backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
        }}
      />

      {isYouTube && youtubeEmbedUrl ? (
        <div className="absolute inset-0 z-[1] overflow-hidden">
          <iframe
            src={youtubeEmbedUrl}
            title="Background video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleYouTubeLoad}
            className={`absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-1000 ${
              isYouTubeLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ border: 'none' }}
          />
        </div>
      ) : (
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
      )}

      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 40%, ${primaryColor}30 100%)`,
        }}
      />

      <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
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

            <h2 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-8 leading-tight drop-shadow-lg min-h-[1.2em]">
              {isDefault && typewriterPhrases && typewriterPhrases.length > 0 ? (
                <DecryptedPhrases
                  phrases={typewriterPhrases}
                  speed={40}
                  maxIterations={5}
                  pauseDuration={2500}
                  className="text-white"
                  encryptedColor={primaryColor}
                  isActive={isActive}
                />
              ) : (
                title
              )}
            </h2>

            {ctaLink && !isDefault && (
              <div className="flex justify-center pointer-events-auto">
                <Link to={ctaLink}>
                  <GameThemedButton
                    gameName={gameName}
                    onClick={handleCtaClick}
                  >
                    {ctaText}
                  </GameThemedButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
