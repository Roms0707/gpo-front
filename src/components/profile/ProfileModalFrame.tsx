import React, { useMemo } from 'react';
import type { ProfileFrame, FrameCssStyles } from '../../types';

interface ProfileModalFrameProps {
  frame?: ProfileFrame | null;
  themeColor?: string;
  children: React.ReactNode;
  className?: string;
}

const getAnimationClass = (animationClass?: string): string => {
  if (!animationClass) return '';

  switch (animationClass) {
    case 'animate-pulse-glow':
      return 'animate-pulse-border';
    case 'animate-shimmer':
      return 'animate-shimmer-border';
    case 'animate-flame':
      return 'animate-flame-border';
    case 'animate-cosmic':
      return 'animate-cosmic-border';
    default:
      return '';
  }
};

const applyThemeToStyles = (styles: FrameCssStyles, themeColor?: string): React.CSSProperties => {
  const cssStyles: React.CSSProperties = {};

  if (styles.borderWidth) cssStyles.borderWidth = styles.borderWidth;
  if (styles.borderStyle) cssStyles.borderStyle = styles.borderStyle as React.CSSProperties['borderStyle'];
  if (styles.borderRadius) cssStyles.borderRadius = styles.borderRadius;

  if (themeColor) {
    const isNeonOrDiamond = styles.borderColor === '#00ff88' || styles.borderColor === '#b9f2ff';
    if (isNeonOrDiamond) {
      cssStyles.borderColor = themeColor;
      if (styles.boxShadow) {
        cssStyles.boxShadow = styles.boxShadow
          .replace(/#00ff88/g, themeColor)
          .replace(/#b9f2ff/g, themeColor)
          .replace(/rgba\(0, 255, 136, [0-9.]+\)/g, `${themeColor}40`)
          .replace(/rgba\(185, 242, 255, [0-9.]+\)/g, `${themeColor}40`);
      }
    } else {
      if (styles.borderColor) cssStyles.borderColor = styles.borderColor;
      if (styles.boxShadow) cssStyles.boxShadow = styles.boxShadow;
    }
  } else {
    if (styles.borderColor) cssStyles.borderColor = styles.borderColor;
    if (styles.boxShadow) cssStyles.boxShadow = styles.boxShadow;
  }

  return cssStyles;
};

const ProfileModalFrame: React.FC<ProfileModalFrameProps> = ({
  frame,
  themeColor,
  children,
  className = '',
}) => {
  const frameStyles = useMemo(() => {
    if (!frame?.css_styles) {
      return {
        borderWidth: '1px',
        borderStyle: 'solid' as const,
        borderColor: 'rgba(75, 85, 99, 0.5)',
        borderRadius: '16px',
      };
    }
    return applyThemeToStyles(frame.css_styles, themeColor);
  }, [frame, themeColor]);

  const animationClass = frame?.animation_class ? getAnimationClass(frame.animation_class) : '';

  const isLegendary = frame?.rarity === 'legendary';
  const isEpic = frame?.rarity === 'epic';

  return (
    <div
      className={`relative overflow-hidden ${animationClass} ${className}`}
      style={frameStyles}
    >
      {(isLegendary || isEpic) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isLegendary
              ? `linear-gradient(135deg, ${frame?.css_styles?.borderColor || themeColor}10 0%, transparent 50%, ${frame?.css_styles?.borderColor || themeColor}05 100%)`
              : `linear-gradient(135deg, ${frame?.css_styles?.borderColor || themeColor}08 0%, transparent 60%)`,
          }}
        />
      )}

      {isLegendary && frame?.animation_class === 'animate-flame' && (
        <div className="absolute -inset-1 pointer-events-none overflow-hidden rounded-[18px]">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent animate-pulse" />
        </div>
      )}

      {isLegendary && frame?.animation_class === 'animate-cosmic' && (
        <div className="absolute -inset-1 pointer-events-none overflow-hidden rounded-[18px]">
          <div className="absolute w-2 h-2 bg-white/30 rounded-full animate-float-particle-1" style={{ top: '20%', left: '10%' }} />
          <div className="absolute w-1.5 h-1.5 bg-white/20 rounded-full animate-float-particle-2" style={{ top: '60%', right: '15%' }} />
          <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-float-particle-3" style={{ bottom: '30%', left: '20%' }} />
        </div>
      )}

      {children}

      {frame && frame.rarity !== 'common' && (
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: getRarityBackgroundColor(frame.rarity),
            color: getRarityTextColor(frame.rarity),
          }}
        >
          {frame.name}
        </div>
      )}
    </div>
  );
};

const getRarityBackgroundColor = (rarity: string): string => {
  switch (rarity) {
    case 'rare': return 'rgba(59, 130, 246, 0.2)';
    case 'epic': return 'rgba(139, 92, 246, 0.2)';
    case 'legendary': return 'rgba(255, 107, 53, 0.2)';
    default: return 'rgba(107, 114, 128, 0.2)';
  }
};

const getRarityTextColor = (rarity: string): string => {
  switch (rarity) {
    case 'rare': return '#60a5fa';
    case 'epic': return '#a78bfa';
    case 'legendary': return '#fb923c';
    default: return '#9ca3af';
  }
};

export default ProfileModalFrame;
