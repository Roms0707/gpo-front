import React, { useState, useEffect, ReactNode } from 'react';

interface FlippableStatCardProps {
  value: number;
  label: string;
  backLabel: string;
  icon: ReactNode;
  accentColor: string;
  isLive?: boolean;
  delay?: number;
  onClick?: () => void;
}

export const FlippableStatCard: React.FC<FlippableStatCardProps> = ({
  value,
  label,
  backLabel,
  icon,
  accentColor,
  isLive = false,
  delay = 0,
  onClick,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(visibilityTimer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = value / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  return (
    <div
      className={`relative cursor-pointer group transition-all duration-500 min-h-[56px] sm:min-h-[70px] md:min-h-[80px] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        transitionDelay: `${delay}ms`,
        perspective: '1000px',
      }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={onClick}
    >
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="relative"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="relative px-1.5 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-6 lg:py-5">
            <div
              className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3 transition-all duration-300 group-hover:scale-110"
              style={{
                color: accentColor,
                filter: `drop-shadow(0 0 8px ${accentColor})`,
              }}
            >
              {icon}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                <span
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider tabular-nums"
                  style={{
                    fontFamily: "'Orbitron', 'Rajdhani', monospace",
                    color: accentColor,
                    textShadow: `0 0 20px ${accentColor}, 0 0 40px ${accentColor}80`,
                  }}
                >
                  {String(displayValue).padStart(2, '0')}
                </span>
                {isLive && value > 0 && (
                  <span
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full animate-pulse"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${accentColor}, 0 0 16px ${accentColor}80`,
                    }}
                  />
                )}
              </div>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-semibold tracking-wide sm:tracking-widest uppercase text-gray-200 text-center leading-tight">
                {label}
              </span>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative h-full px-1.5 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-6 lg:py-5 flex items-center justify-center min-h-[56px] sm:min-h-[70px] md:min-h-[80px]">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(circle at center, ${accentColor}60 0%, transparent 70%)`,
              }}
            />
            <span
              className="text-[9px] sm:text-xs md:text-sm font-bold tracking-wide text-center uppercase"
              style={{
                color: accentColor,
                textShadow: `0 0 12px ${accentColor}`,
              }}
            >
              {backLabel}
            </span>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}${isFlipped ? 'ff' : '80'}, transparent)`,
          boxShadow: isFlipped ? `0 0 10px ${accentColor}80` : 'none',
        }}
      />
    </div>
  );
};
