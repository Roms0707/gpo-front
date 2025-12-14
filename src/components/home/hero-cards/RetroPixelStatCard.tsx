import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface RetroPixelStatCardProps {
  value: number;
  label: string;
  color: string;
  numberColor?: string;
  hoverIcon: ReactNode;
  showPulse?: boolean;
  isMobile: boolean;
  onClick: () => void;
  animationDelay?: string;
}

export const RetroPixelStatCard: React.FC<RetroPixelStatCardProps> = ({
  value,
  label,
  color,
  numberColor,
  hoverIcon,
  showPulse = false,
  isMobile,
  onClick,
  animationDelay = '0s',
}) => {
  const displayNumberColor = numberColor || color;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="retro-stat-card relative cursor-pointer group"
      style={{ animationDelay }}
    >
      <div
        className={`
          relative overflow-hidden rounded-none p-5 sm:p-6
          transition-all duration-200
          ${isHovered ? 'translate-y-[-2px]' : ''}
        `}
        style={{
          background: '#0a0a0a',
          border: '4px solid',
          borderColor: isHovered ? color : '#2a2a2a',
          boxShadow: isHovered
            ? `
              4px 4px 0 ${color},
              8px 8px 0 rgba(0,0,0,0.5),
              inset 0 0 20px ${color}15
            `
            : `
              4px 4px 0 #1a1a1a,
              8px 8px 0 rgba(0,0,0,0.3)
            `,
          imageRendering: 'pixelated',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none retro-scanlines"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.3) 2px,
              rgba(0,0,0,0.3) 4px
            )`,
            opacity: 0.5,
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)`,
            opacity: isHovered ? 1 : 0.3,
            transition: 'opacity 0.3s ease',
          }}
        />

        <div
          className="absolute top-2 left-2 w-2 h-2 rounded-full retro-power-led"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}, 0 0 12px ${color}80`,
            animation: 'retro-led-pulse 2s ease-in-out infinite',
          }}
        />

        <div
          className="absolute top-3 right-3 transition-all duration-200"
          style={{
            color: isHovered ? color : `${color}80`,
            filter: isHovered ? `drop-shadow(0 0 4px ${color})` : 'none',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {hoverIcon}
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div
              className="retro-number text-3xl sm:text-4xl font-bold tracking-wider transition-all duration-200"
              style={{
                color: displayNumberColor,
                textShadow: isHovered
                  ? `0 0 10px ${displayNumberColor}, 2px 2px 0 #000, -1px -1px 0 ${displayNumberColor}40`
                  : `2px 2px 0 #000`,
                fontFamily: "'VT323', 'Courier New', monospace",
                letterSpacing: '0.15em',
              }}
            >
              {String(value).padStart(2, '0')}
            </div>
            {showPulse && value > 0 && (
              <span
                className="w-2 h-2 ml-2"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 4px ${color}`,
                  animation: 'retro-blink 1s step-end infinite',
                }}
              />
            )}
          </div>

          <div
            className="text-center text-xs sm:text-sm font-medium tracking-wide uppercase transition-colors duration-200"
            style={{
              color: isHovered ? '#e0e0e0' : '#808080',
              fontFamily: "'VT323', 'Courier New', monospace",
              letterSpacing: '0.1em',
              textShadow: '1px 1px 0 #000',
            }}
          >
            {label}
          </div>
        </div>

        {isMobile && (
          <div className="mt-3 flex items-center justify-center">
            <ChevronDown
              className="h-4 w-4 animate-bounce"
              style={{ color: `${color}80` }}
            />
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg,
              transparent 0%,
              ${color}${isHovered ? '80' : '40'} 50%,
              transparent 100%
            )`,
          }}
        />

        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-100 ${isHovered ? 'retro-flicker' : ''}`}
          style={{
            background: 'rgba(255,255,255,0.02)',
            opacity: isHovered ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
};
