import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface PixelStatCardProps {
  value: number;
  label: string;
  color: string;
  hoverIcon: ReactNode;
  showPulse?: boolean;
  isMobile: boolean;
  onClick: () => void;
  animationDelay?: string;
}

export const PixelStatCard: React.FC<PixelStatCardProps> = ({
  value,
  label,
  color,
  hoverIcon,
  showPulse = false,
  isMobile,
  onClick,
  animationDelay = '0s',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pixel-stat-card relative cursor-pointer group"
      style={{ animationDelay }}
    >
      <div
        className={`
          relative overflow-hidden
          bg-black/60 backdrop-blur-md
          p-5 sm:p-6
          transition-all duration-200
          ${isMobile ? 'active:scale-95' : ''}
        `}
        style={{
          boxShadow: isHovered
            ? `0 0 20px ${color}40, inset 0 0 30px ${color}10`
            : `0 0 10px ${color}20`,
          border: `3px solid ${color}`,
          imageRendering: 'pixelated',
        }}
      >
        <div
          className="pixel-border-corner pixel-border-tl"
          style={{ backgroundColor: color }}
        />
        <div
          className="pixel-border-corner pixel-border-tr"
          style={{ backgroundColor: color }}
        />
        <div
          className="pixel-border-corner pixel-border-bl"
          style={{ backgroundColor: color }}
        />
        <div
          className="pixel-border-corner pixel-border-br"
          style={{ backgroundColor: color }}
        />

        <div
          className={`
            absolute inset-0 pointer-events-none
            transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.1) 2px,
              rgba(0, 0, 0, 0.1) 4px
            )`,
          }}
        />

        <div
          className={`
            absolute top-3 right-3
            transition-all duration-300
            ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
          `}
          style={{ color }}
        >
          {hoverIcon}
        </div>

        <div className="relative z-10">
          <div
            className={`
              text-3xl sm:text-4xl font-bold mb-2
              flex items-center justify-center
              transition-all duration-200
              ${isHovered ? 'pixel-text-glitch' : ''}
            `}
            style={{
              color,
              fontFamily: isHovered ? '"Press Start 2P", cursive' : 'inherit',
              fontSize: isHovered ? '1.5rem' : undefined,
              textShadow: isHovered ? `0 0 10px ${color}, 0 0 20px ${color}50` : undefined,
            }}
          >
            {value}
            {showPulse && value > 0 && (
              <span
                className="w-2.5 h-2.5 rounded-full ml-2 animate-pulse"
                style={{ backgroundColor: color }}
              />
            )}
          </div>
          <div
            className={`
              text-sm sm:text-base text-gray-300
              transition-all duration-200
              ${isHovered ? 'text-white' : ''}
            `}
            style={{
              fontFamily: isHovered ? '"Press Start 2P", cursive' : 'inherit',
              fontSize: isHovered ? '0.5rem' : undefined,
              lineHeight: isHovered ? '1.4' : undefined,
            }}
          >
            {label}
          </div>
        </div>

        {isMobile && (
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-center">
            <ChevronDown className="h-3 w-3 animate-bounce" />
          </div>
        )}

        <div
          className={`
            absolute inset-0 pointer-events-none
            transition-opacity duration-500
            ${isHovered ? 'pixel-flicker' : 'opacity-0'}
          `}
          style={{
            background: `linear-gradient(
              180deg,
              transparent 0%,
              ${color}05 50%,
              transparent 100%
            )`,
          }}
        />
      </div>
    </div>
  );
};
