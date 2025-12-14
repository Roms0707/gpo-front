import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { MagicCardEffects } from './MagicCardEffects';

interface PixelStatCardProps {
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

export const PixelStatCard: React.FC<PixelStatCardProps> = ({
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
    <MagicCardEffects
      color={numberColor || color}
      onClick={onClick}
      starCount={15}
      enableStars={true}
      enableSpotlight={true}
      enableClickEffect={true}
      className="arcade-stat-card cursor-pointer group"
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ animationDelay }}
      >
        <div
          className={`
            relative overflow-hidden rounded-2xl p-5 sm:p-6
            transition-all duration-300 ease-out
            ${isHovered ? 'scale-[1.02]' : 'scale-100'}
          `}
          style={{
            background: `linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,30,0.95) 100%)`,
            boxShadow: isHovered
              ? `0 0 30px ${color}50, 0 0 60px ${color}20, inset 0 1px 0 rgba(255,255,255,0.1)`
              : `0 0 15px ${color}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
            border: `2px solid ${color}${isHovered ? '80' : '40'}`,
          }}
        >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${color}15 0%, transparent 60%)`,
            opacity: isHovered ? 1 : 0.5,
          }}
        />

        <div
          className={`
            absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full
            transition-all duration-500 ease-out
          `}
          style={{
            width: isHovered ? '80%' : '40%',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}50`,
          }}
        />

        <div
          className="absolute top-3 right-3 transition-all duration-300"
          style={{
            color: isHovered ? color : `${color}99`,
            filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {hoverIcon}
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div
              className="arcade-number text-3xl sm:text-4xl font-bold tracking-wider transition-all duration-300"
              style={{
                color: displayNumberColor,
                textShadow: isHovered
                  ? `0 0 20px ${displayNumberColor}, 0 0 40px ${displayNumberColor}60, 0 0 60px ${displayNumberColor}30`
                  : `0 0 10px ${displayNumberColor}80`,
                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {String(value).padStart(2, '0')}
            </div>
            {showPulse && value > 0 && (
              <span
                className="w-2 h-2 rounded-full ml-2 animate-pulse"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
                }}
              />
            )}
          </div>

          <div
            className="text-center text-xs sm:text-sm font-medium tracking-wide uppercase transition-colors duration-300"
            style={{
              color: isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
              letterSpacing: '0.05em',
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
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden"
          style={{
            background: `linear-gradient(90deg,
              transparent 0%,
              ${color}${isHovered ? '60' : '30'} 20%,
              ${color}${isHovered ? '80' : '50'} 50%,
              ${color}${isHovered ? '60' : '30'} 80%,
              transparent 100%
            )`,
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 50%)`,
            opacity: isHovered ? 1 : 0.5,
          }}
        />
        </div>
      </div>
    </MagicCardEffects>
  );
};
