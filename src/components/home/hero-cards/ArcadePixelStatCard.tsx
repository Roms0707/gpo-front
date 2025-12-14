import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface ArcadePixelStatCardProps {
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

export const ArcadePixelStatCard: React.FC<ArcadePixelStatCardProps> = ({
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

  const neonCyan = '#00FFFF';
  const neonPink = '#FF0080';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="arcade-pixel-stat-card relative cursor-pointer group"
      style={{ animationDelay }}
    >
      <div
        className={`
          relative overflow-hidden rounded-xl p-5 sm:p-6
          transition-all duration-300 ease-out
          ${isHovered ? 'scale-[1.03]' : 'scale-100'}
        `}
        style={{
          background: `linear-gradient(145deg, #0a0a0a 0%, #151520 50%, #0a0a0a 100%)`,
          boxShadow: isHovered
            ? `
              0 0 30px ${neonCyan}40,
              0 0 60px ${neonPink}20,
              inset 0 1px 0 rgba(255,255,255,0.15),
              inset 0 -1px 0 rgba(0,0,0,0.5)
            `
            : `
              0 0 15px ${neonCyan}20,
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `,
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        }}
      >
        <div
          className="absolute inset-[-2px] rounded-xl pointer-events-none arcade-border-glow"
          style={{
            background: isHovered
              ? `linear-gradient(135deg, ${neonCyan} 0%, ${neonPink} 50%, ${neonCyan} 100%)`
              : `linear-gradient(135deg, ${neonCyan}60 0%, ${neonPink}40 50%, ${neonCyan}60 100%)`,
            backgroundSize: '200% 200%',
            animation: isHovered ? 'arcade-border-chase 2s linear infinite' : 'none',
            zIndex: -1,
            borderRadius: '0.75rem',
            padding: '2px',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
          }}
        />

        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, ${neonCyan}08 0%, transparent 40%),
              radial-gradient(circle at 80% 80%, ${neonPink}08 0%, transparent 40%)
            `,
          }}
        />

        <div
          className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
          style={{
            background: `radial-gradient(1px 1px at 10px 10px, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            opacity: 0.3,
          }}
        />

        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-500"
          style={{
            width: isHovered ? '80%' : '50%',
            background: `linear-gradient(90deg, transparent, ${neonCyan}, ${neonPink}, ${neonCyan}, transparent)`,
            boxShadow: `0 0 10px ${neonCyan}, 0 0 20px ${neonPink}50`,
          }}
        />

        <div
          className="absolute top-3 right-3 transition-all duration-300"
          style={{
            color: isHovered ? neonCyan : `${neonCyan}99`,
            filter: isHovered ? `drop-shadow(0 0 8px ${neonCyan})` : 'none',
            transform: isHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1)',
          }}
        >
          {hoverIcon}
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div
              className="arcade-neon-number text-3xl sm:text-4xl font-bold tracking-wider transition-all duration-300"
              style={{
                color: '#fff',
                textShadow: isHovered
                  ? `
                    0 0 5px #fff,
                    0 0 10px ${displayNumberColor},
                    0 0 20px ${displayNumberColor},
                    0 0 40px ${displayNumberColor},
                    0 0 60px ${neonCyan}50
                  `
                  : `
                    0 0 5px ${displayNumberColor}80,
                    0 0 10px ${displayNumberColor}40
                  `,
                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {String(value).padStart(2, '0')}
            </div>
            {showPulse && value > 0 && (
              <span
                className="w-2.5 h-2.5 rounded-full ml-2"
                style={{
                  backgroundColor: neonPink,
                  boxShadow: `0 0 8px ${neonPink}, 0 0 16px ${neonPink}80`,
                  animation: 'arcade-pulse 1s ease-in-out infinite',
                }}
              />
            )}
          </div>

          <div
            className="text-center text-xs sm:text-sm font-medium tracking-wider uppercase transition-all duration-300"
            style={{
              color: isHovered ? '#fff' : 'rgba(255,255,255,0.7)',
              textShadow: isHovered ? `0 0 10px ${neonCyan}80` : 'none',
              letterSpacing: '0.08em',
            }}
          >
            {label}
          </div>
        </div>

        {isMobile && (
          <div className="mt-3 flex items-center justify-center">
            <ChevronDown
              className="h-4 w-4 animate-bounce"
              style={{ color: neonCyan }}
            />
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-xl overflow-hidden"
        >
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(90deg,
                ${neonCyan}${isHovered ? '80' : '40'} 0%,
                ${neonPink}${isHovered ? '80' : '40'} 50%,
                ${neonCyan}${isHovered ? '80' : '40'} 100%
              )`,
              backgroundSize: '200% 100%',
              animation: isHovered ? 'arcade-led-chase 1.5s linear infinite' : 'none',
            }}
          />
        </div>

        {isHovered && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
          >
            <div
              className="absolute inset-0 arcade-light-sweep-effect"
              style={{
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
                animation: 'arcade-sweep 2s ease-in-out infinite',
              }}
            />
          </div>
        )}

        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.2) 100%)`,
          }}
        />
      </div>
    </div>
  );
};
