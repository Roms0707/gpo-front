import React, { useRef, useState, useCallback, useEffect } from 'react';

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  transitionDuration?: number;
  shineIntensity?: number;
  glowColor?: string;
  glowIntensity?: number;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  className = '',
  maxTilt = 4,
  scale = 1.02,
  transitionDuration = 300,
  shineIntensity = 0.12,
  glowColor = 'rgba(var(--color-primary-500), 0.4)',
  glowIntensity = 0,
  disabled = false,
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
  const [shinePosition, setShinePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || prefersReducedMotion || isTouchDevice) return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateX = (mouseY / (rect.height / 2)) * -maxTilt;
    const rotateY = (mouseX / (rect.width / 2)) * maxTilt;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`);

    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
    setShinePosition({ x: shineX, y: shineY });
  }, [disabled, prefersReducedMotion, isTouchDevice, maxTilt, scale]);

  const handleMouseEnter = useCallback(() => {
    if (disabled || prefersReducedMotion || isTouchDevice) return;
    setIsHovered(true);
  }, [disabled, prefersReducedMotion, isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    if (disabled || prefersReducedMotion || isTouchDevice) return;
    setIsHovered(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
    setShinePosition({ x: 50, y: 50 });
  }, [disabled, prefersReducedMotion, isTouchDevice]);

  const effectiveShineIntensity = isHovered ? shineIntensity : 0;

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        transform: disabled || prefersReducedMotion || isTouchDevice ? undefined : transform,
        transition: `transform ${transitionDuration}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
        transformStyle: 'preserve-3d',
        willChange: isHovered ? 'transform' : 'auto',
        zIndex: isHovered ? 10 : 1
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}

      {!disabled && !prefersReducedMotion && !isTouchDevice && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
          style={{
            background: `radial-gradient(circle at ${shinePosition.x}% ${shinePosition.y}%, rgba(255,255,255,${effectiveShineIntensity}) 0%, transparent 60%)`,
            opacity: isHovered ? 1 : 0,
            transition: `opacity ${transitionDuration}ms ease`
          }}
        />
      )}

      {glowIntensity > 0 && !disabled && !prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            boxShadow: isHovered
              ? `0 0 ${20 * glowIntensity}px ${5 * glowIntensity}px ${glowColor}, inset 0 0 ${10 * glowIntensity}px 0 ${glowColor}`
              : 'none',
            transition: `box-shadow ${transitionDuration}ms ease`,
            opacity: isHovered ? 1 : 0
          }}
        />
      )}
    </div>
  );
};

export default TiltedCard;
