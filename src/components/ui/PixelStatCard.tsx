import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

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
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pixel-stat-card relative cursor-pointer group"
      style={{ animationDelay }}
    >
      <div
        className="rpg-card-container relative overflow-hidden bg-black/80 backdrop-blur-md p-5 sm:p-6"
        style={{
          boxShadow: `
            0 0 20px ${color}40,
            inset 0 0 30px ${color}10,
            inset 0 2px 0 ${color}30
          `,
          imageRendering: 'pixelated',
        }}
      >
        <div
          className="rpg-notched-border absolute inset-0 pointer-events-none"
          style={{
            '--rpg-border-color': color,
          } as React.CSSProperties}
        />

        <div
          className="absolute inset-0 pointer-events-none opacity-100"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.15) 2px,
              rgba(0, 0, 0, 0.15) 4px
            )`,
          }}
        />

        <div
          className={`
            rpg-scan-line absolute inset-0 pointer-events-none
            ${isHovered ? 'rpg-scan-active' : ''}
          `}
          style={{
            '--scan-color': color,
          } as React.CSSProperties}
        />

        <div
          className="absolute top-3 right-3 opacity-70"
          style={{ color }}
        >
          {hoverIcon}
        </div>

        <div className="relative z-10">
          <div
            className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center font-pixel"
            style={{
              color: displayNumberColor,
              textShadow: `0 0 10px ${displayNumberColor}, 0 0 20px ${displayNumberColor}50`,
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
            className="text-white font-pixel text-center"
            style={{
              fontSize: '0.5rem',
              lineHeight: '1.4',
              textShadow: `0 0 5px ${color}50`,
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
          className="absolute inset-0 pointer-events-none pixel-flicker"
          style={{
            background: `linear-gradient(
              180deg,
              transparent 0%,
              ${color}08 50%,
              transparent 100%
            )`,
          }}
        />
      </div>
    </div>
  );
};
