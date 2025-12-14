import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface MagicBentStatCardProps {
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

export const MagicBentStatCard: React.FC<MagicBentStatCardProps> = ({
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

  const magicTeal = '#0D9488';
  const magicGold = '#F59E0B';
  const magicBlue = '#60A5FA';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="magic-stat-card relative cursor-pointer group"
      style={{ animationDelay }}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl p-5 sm:p-6
          transition-all duration-500 ease-out
          ${isHovered ? 'scale-[1.02]' : 'scale-100'}
        `}
        style={{
          background: `linear-gradient(135deg,
            rgba(13, 148, 136, 0.15) 0%,
            rgba(15, 23, 42, 0.95) 30%,
            rgba(15, 23, 42, 0.98) 70%,
            rgba(96, 165, 250, 0.1) 100%
          )`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: isHovered
            ? `
              0 8px 32px rgba(13, 148, 136, 0.3),
              0 0 60px rgba(245, 158, 11, 0.15),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 0 30px rgba(13, 148, 136, 0.1)
            `
            : `
              0 4px 20px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.05)
            `,
          border: `1px solid ${isHovered ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.1)'}`,
          animation: isHovered ? 'magic-breathe 3s ease-in-out infinite' : 'none',
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none magic-aurora"
          style={{
            background: `
              radial-gradient(ellipse at 0% 0%, ${magicTeal}30 0%, transparent 50%),
              radial-gradient(ellipse at 100% 0%, ${magicBlue}20 0%, transparent 50%),
              radial-gradient(ellipse at 50% 100%, ${magicGold}15 0%, transparent 50%)
            `,
            backgroundSize: '200% 200%',
            animation: 'magic-aurora-shift 8s ease-in-out infinite',
            opacity: isHovered ? 1 : 0.5,
            transition: 'opacity 0.5s ease',
          }}
        />

        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="magic-particle absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                background: i % 2 === 0 ? magicGold : magicTeal,
                boxShadow: `0 0 ${4 + i * 2}px ${i % 2 === 0 ? magicGold : magicTeal}`,
                animation: `magic-float-${(i % 3) + 1} ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                opacity: isHovered ? 0.8 : 0.3,
                transition: 'opacity 0.5s ease',
              }}
            />
          ))}
        </div>

        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% -20%, ${magicGold}10 0%, transparent 60%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />

        <div
          className="absolute top-3 right-3 transition-all duration-500"
          style={{
            color: isHovered ? magicGold : `${magicTeal}cc`,
            filter: isHovered ? `drop-shadow(0 0 8px ${magicGold})` : 'none',
            transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
          }}
        >
          {hoverIcon}
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div
              className="magic-number text-3xl sm:text-4xl font-bold tracking-wider transition-all duration-500"
              style={{
                background: isHovered
                  ? `linear-gradient(135deg, ${magicGold} 0%, #fff 50%, ${magicTeal} 100%)`
                  : `linear-gradient(135deg, ${displayNumberColor} 0%, #fff 100%)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: isHovered ? 'magic-shimmer 3s ease-in-out infinite' : 'none',
                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                fontVariantNumeric: 'tabular-nums',
                filter: isHovered ? `drop-shadow(0 0 10px ${magicGold}60)` : 'none',
              }}
            >
              {String(value).padStart(2, '0')}
            </div>
            {showPulse && value > 0 && (
              <span
                className="w-2 h-2 rounded-full ml-2"
                style={{
                  background: `radial-gradient(circle, ${magicGold} 0%, ${magicTeal} 100%)`,
                  boxShadow: `0 0 8px ${magicGold}, 0 0 16px ${magicTeal}80`,
                  animation: 'magic-orb-pulse 2s ease-in-out infinite',
                }}
              />
            )}
          </div>

          <div
            className="text-center text-xs sm:text-sm font-medium tracking-wide uppercase transition-all duration-500"
            style={{
              color: isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
              textShadow: isHovered ? `0 0 20px ${magicTeal}60` : 'none',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </div>
        </div>

        {isMobile && (
          <div className="mt-3 flex items-center justify-center">
            <ChevronDown
              className="h-4 w-4"
              style={{
                color: magicGold,
                animation: 'magic-float-1 2s ease-in-out infinite',
              }}
            />
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl overflow-hidden"
          style={{
            background: `linear-gradient(90deg,
              transparent 0%,
              ${magicTeal}${isHovered ? 'cc' : '60'} 20%,
              ${magicGold}${isHovered ? 'cc' : '60'} 50%,
              ${magicBlue}${isHovered ? 'cc' : '60'} 80%,
              transparent 100%
            )`,
            boxShadow: isHovered ? `0 0 10px ${magicGold}40` : 'none',
          }}
        />

        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: isHovered
              ? `inset 0 0 40px rgba(245, 158, 11, 0.05), inset 0 0 80px rgba(13, 148, 136, 0.03)`
              : 'none',
            transition: 'box-shadow 0.5s ease',
          }}
        />

        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)`,
          }}
        />
      </div>
    </div>
  );
};
