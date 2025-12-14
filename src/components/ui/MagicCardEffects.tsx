import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  animationDelay: number;
}

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

interface MagicCardEffectsProps {
  children: React.ReactNode;
  color: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  starCount?: number;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableClickEffect?: boolean;
}

const generateStars = (count: number, seed: number): Star[] => {
  const stars: Star[] = [];
  const random = (min: number, max: number, offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: random(5, 95, i * 1.1),
      y: random(5, 95, i * 2.2),
      size: random(1, 3, i * 3.3),
      opacity: random(0.3, 0.8, i * 4.4),
      animationDuration: random(2, 5, i * 5.5),
      animationDelay: random(0, 3, i * 6.6),
    });
  }
  return stars;
};

const getLayoutSeed = (): number => {
  const stored = sessionStorage.getItem('magicCardSeed');
  if (stored) {
    return parseFloat(stored);
  }
  const newSeed = Math.random() * 1000;
  sessionStorage.setItem('magicCardSeed', newSeed.toString());
  return newSeed;
};

export const MagicCardEffects: React.FC<MagicCardEffectsProps> = ({
  children,
  color,
  onClick,
  className = '',
  starCount = 20,
  enableStars = true,
  enableSpotlight = true,
  enableClickEffect = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [clickRipples, setClickRipples] = useState<ClickRipple[]>([]);
  const rippleIdRef = useRef(0);

  const layoutSeed = useMemo(() => getLayoutSeed(), []);
  const stars = useMemo(() => generateStars(starCount, layoutSeed), [starCount, layoutSeed]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !enableSpotlight) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  }, [enableSpotlight]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setMousePosition({ x: 50, y: 50 });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (enableClickEffect && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const newRipple: ClickRipple = {
        id: rippleIdRef.current++,
        x,
        y,
      };

      setClickRipples(prev => [...prev, newRipple]);

      setTimeout(() => {
        setClickRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(e);
  }, [enableClickEffect, onClick]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`magic-card-wrapper relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {enableStars && (
        <div className="magic-stars-container absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-[1]">
          {stars.map((star) => (
            <div
              key={star.id}
              className="magic-star absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: color,
                opacity: star.opacity,
                animation: `magic-star-twinkle ${star.animationDuration}s ease-in-out infinite, magic-star-drift ${star.animationDuration * 2}s ease-in-out infinite`,
                animationDelay: `${star.animationDelay}s, ${star.animationDelay * 0.5}s`,
                boxShadow: `0 0 ${star.size * 2}px ${color}`,
              }}
            />
          ))}
        </div>
      )}

      {enableSpotlight && (
        <div
          className="magic-spotlight absolute inset-0 pointer-events-none rounded-2xl z-[2] transition-opacity duration-300"
          style={{
            opacity: isHovering ? 1 : 0,
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${color}25 0%, transparent 50%)`,
          }}
        />
      )}

      {enableSpotlight && (
        <div
          className="magic-spotlight-glow absolute inset-0 pointer-events-none rounded-2xl z-[2] transition-opacity duration-300"
          style={{
            opacity: isHovering ? 0.6 : 0,
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.1) 0%, transparent 25%)`,
          }}
        />
      )}

      {enableClickEffect && clickRipples.map((ripple) => (
        <div key={ripple.id} className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-[3]">
          <div
            className="magic-click-ripple absolute rounded-full"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'transparent',
              border: `2px solid ${color}`,
              boxShadow: `0 0 20px ${color}, 0 0 40px ${color}50`,
              animation: 'magic-click-expand 0.6s ease-out forwards',
            }}
          />

          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="magic-click-particle absolute rounded-full"
              style={{
                left: `${ripple.x}%`,
                top: `${ripple.y}%`,
                width: '4px',
                height: '4px',
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}`,
                animation: 'magic-click-burst 0.5s ease-out forwards',
                animationDelay: `${i * 0.02}s`,
                '--burst-angle': `${i * 45}deg`,
              } as React.CSSProperties}
            />
          ))}

          <div
            className="magic-click-flash absolute inset-0 rounded-2xl"
            style={{
              backgroundColor: color,
              animation: 'magic-click-flash 0.3s ease-out forwards',
            }}
          />
        </div>
      ))}

      <div className="relative z-[5]">
        {children}
      </div>
    </div>
  );
};
