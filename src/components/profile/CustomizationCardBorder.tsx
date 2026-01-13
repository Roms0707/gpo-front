import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ItemRarity } from '../../types';

interface CustomizationCardBorderProps {
  children: React.ReactNode;
  rarity: ItemRarity;
  isSelected: boolean;
  isLocked: boolean;
  className?: string;
}

interface RarityConfig {
  duration: number;
  color: string;
  glowColor: string;
  glowIntensity: number;
  beamSize: number;
}

const getRarityConfig = (rarity: ItemRarity): RarityConfig => {
  switch (rarity) {
    case 'common':
      return {
        duration: 5,
        color: '#9ca3af',
        glowColor: 'rgba(156, 163, 175, 0.3)',
        glowIntensity: 0.3,
        beamSize: 40,
      };
    case 'rare':
      return {
        duration: 3.5,
        color: '#3b82f6',
        glowColor: 'rgba(59, 130, 246, 0.4)',
        glowIntensity: 0.5,
        beamSize: 50,
      };
    case 'epic':
      return {
        duration: 2.5,
        color: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.5)',
        glowIntensity: 0.7,
        beamSize: 60,
      };
    case 'legendary':
      return {
        duration: 1.8,
        color: '#f97316',
        glowColor: 'rgba(249, 115, 22, 0.6)',
        glowIntensity: 0.9,
        beamSize: 80,
      };
    default:
      return {
        duration: 5,
        color: '#9ca3af',
        glowColor: 'rgba(156, 163, 175, 0.3)',
        glowIntensity: 0.3,
        beamSize: 40,
      };
  }
};

const getLockedConfig = (rarity: ItemRarity): RarityConfig => {
  const baseConfig = getRarityConfig(rarity);
  return {
    ...baseConfig,
    duration: baseConfig.duration * 2,
    color: '#4b5563',
    glowColor: 'rgba(75, 85, 99, 0.2)',
    glowIntensity: 0.15,
  };
};

const CustomizationCardBorder: React.FC<CustomizationCardBorderProps> = ({
  children,
  rarity,
  isSelected,
  isLocked,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  const config = isLocked ? getLockedConfig(rarity) : getRarityConfig(rarity);
  const showEffect = isHovered || isSelected;
  const isLegendary = rarity === 'legendary' && !isLocked;

  const pathLength = dimensions.width * 2 + dimensions.height * 2;
  const beamGradient = isLocked
    ? `linear-gradient(90deg, transparent, ${config.color}40, ${config.color}60, ${config.color}40, transparent)`
    : `linear-gradient(90deg, transparent, ${config.color}80, ${config.color}, ${config.color}80, transparent)`;

  return (
    <motion.div
      ref={containerRef}
      className={`relative customization-card-border ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        scale: isHovered && !isLocked ? 1.02 : 1,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {showEffect && dimensions.width > 0 && (
        <>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={`beam-gradient-${rarity}-${isLocked ? 'locked' : 'unlocked'}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="30%" stopColor={config.color} stopOpacity={isLocked ? 0.3 : 0.6} />
                <stop offset="50%" stopColor={config.color} stopOpacity={isLocked ? 0.5 : 1} />
                <stop offset="70%" stopColor={config.color} stopOpacity={isLocked ? 0.3 : 0.6} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <filter id={`glow-${rarity}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={isLocked ? 2 : 4} result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect
              x="1"
              y="1"
              width={dimensions.width - 2}
              height={dimensions.height - 2}
              rx="12"
              ry="12"
              fill="none"
              stroke={`url(#beam-gradient-${rarity}-${isLocked ? 'locked' : 'unlocked'})`}
              strokeWidth={isLocked ? 1 : 2}
              strokeDasharray={`${config.beamSize} ${pathLength}`}
              filter={`url(#glow-${rarity})`}
              style={{
                animation: `dash ${config.duration}s linear infinite`,
              }}
            />
          </svg>

          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none z-0 customization-card-border-glow"
            initial={{ opacity: 0 }}
            animate={{
              opacity: showEffect ? (isLocked ? 0.15 : config.glowIntensity * (isSelected ? 1.2 : 0.8)) : 0,
              boxShadow: showEffect
                ? `0 0 ${isLocked ? 10 : 20}px ${config.glowColor}, inset 0 0 ${isLocked ? 5 : 10}px ${config.glowColor}`
                : 'none',
            }}
            transition={{ duration: 0.3 }}
          />

          {isLegendary && isSelected && (
            <>
              <motion.div
                className="absolute -inset-1 rounded-xl pointer-events-none z-0"
                animate={{
                  boxShadow: [
                    `0 0 20px ${config.glowColor}, 0 0 40px ${config.glowColor}`,
                    `0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor}`,
                    `0 0 20px ${config.glowColor}, 0 0 40px ${config.glowColor}`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-0">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(45deg, transparent 30%, ${config.color}20 50%, transparent 70%)`,
                    backgroundSize: '200% 200%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>
            </>
          )}
        </>
      )}

      {children}

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -${pathLength}px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default CustomizationCardBorder;
