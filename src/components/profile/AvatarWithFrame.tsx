import React, { useMemo } from 'react';
import { User, Star, CheckCircle, TrendingUp, Crown, Trophy, Flame } from 'lucide-react';
import type { ProfileFrame, ProfileBadge, FrameCssStyles, BadgeCssStyles } from '../../types';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarWithFrameProps {
  avatarUrl?: string | null;
  username?: string;
  frame?: ProfileFrame | null;
  badge?: ProfileBadge | null;
  size?: AvatarSize;
  themeColor?: string;
  className?: string;
  onClick?: () => void;
}

const sizeConfig: Record<AvatarSize, { container: string; avatar: string; icon: string; badge: string; badgeIcon: string }> = {
  xs: { container: 'w-8 h-8', avatar: 'w-8 h-8', icon: 'w-4 h-4', badge: 'w-4 h-4', badgeIcon: 'w-2.5 h-2.5' },
  sm: { container: 'w-12 h-12', avatar: 'w-12 h-12', icon: 'w-5 h-5', badge: 'w-5 h-5', badgeIcon: 'w-3 h-3' },
  md: { container: 'w-16 h-16', avatar: 'w-16 h-16', icon: 'w-6 h-6', badge: 'w-6 h-6', badgeIcon: 'w-3.5 h-3.5' },
  lg: { container: 'w-20 h-20', avatar: 'w-20 h-20', icon: 'w-8 h-8', badge: 'w-7 h-7', badgeIcon: 'w-4 h-4' },
  xl: { container: 'w-24 h-24', avatar: 'w-24 h-24', icon: 'w-10 h-10', badge: 'w-8 h-8', badgeIcon: 'w-5 h-5' },
};

const getBadgeIcon = (iconName: string) => {
  switch (iconName) {
    case 'star': return Star;
    case 'check-circle': return CheckCircle;
    case 'trending-up': return TrendingUp;
    case 'crown': return Crown;
    case 'trophy': return Trophy;
    case 'flame': return Flame;
    default: return Star;
  }
};

const getBadgePositionClasses = (position: string): string => {
  switch (position) {
    case 'top-left': return '-top-1 -left-1';
    case 'top-right': return '-top-1 -right-1';
    case 'bottom-left': return '-bottom-1 -left-1';
    case 'bottom-right': return '-bottom-1 -right-1';
    default: return '-bottom-1 -right-1';
  }
};

const getAnimationClass = (animationClass?: string): string => {
  if (!animationClass) return '';

  const animationMap: Record<string, string> = {
    'animate-pulse-glow': 'animate-pulse',
    'animate-shimmer': 'animate-frame-shimmer',
    'animate-flame': 'animate-frame-flame',
    'animate-void': 'animate-frame-void',
    'animate-cosmic': 'animate-frame-cosmic',
    'animate-hextech-pulse': 'animate-hextech-pulse',
    'animate-radianite-flow': 'animate-radianite-flow',
    'animate-ember-dance': 'animate-ember-dance',
    'animate-frost-shimmer': 'animate-frost-shimmer',
    'animate-void-swirl': 'animate-void-swirl',
    'animate-electric-arc': 'animate-electric-arc',
    'animate-holographic-shift': 'animate-holographic-shift',
    'animate-ancient-glow': 'animate-ancient-glow',
    'animate-neon-breathe': 'animate-neon-breathe',
    'animate-blood-drip': 'animate-blood-drip',
    'animate-golden-sweep': 'animate-golden-sweep',
    'animate-ruination-mist': 'animate-ruination-mist',
    'animate-dragon-breathe': 'animate-dragon-breathe',
    'animate-singularity-warp': 'animate-singularity-warp',
    'animate-damascus-shimmer': 'animate-damascus-shimmer',
    'animate-boost-trail': 'animate-boost-trail',
    'animate-solar-corona': 'animate-solar-corona',
    'animate-diamond-sparkle': 'animate-diamond-sparkle',
    'animate-frame-shimmer': 'animate-frame-shimmer',
    'animate-frame-flame': 'animate-frame-flame',
    'animate-frame-void': 'animate-frame-void',
    'animate-frame-cosmic': 'animate-frame-cosmic',
  };

  return animationMap[animationClass] || '';
};

const applyThemeToStyles = (styles: FrameCssStyles, themeColor?: string): React.CSSProperties => {
  const cssStyles: React.CSSProperties = {};

  if (styles.borderWidth) cssStyles.borderWidth = styles.borderWidth;
  if (styles.borderStyle) cssStyles.borderStyle = styles.borderStyle as React.CSSProperties['borderStyle'];
  if (styles.borderRadius) cssStyles.borderRadius = styles.borderRadius;

  if (themeColor && styles.borderColor) {
    const isThemeAdaptive = styles.borderColor.includes('rgba') ||
                           styles.borderColor === '#00ff88' ||
                           styles.borderColor === '#b9f2ff';
    if (isThemeAdaptive) {
      cssStyles.borderColor = themeColor;
      if (styles.boxShadow) {
        cssStyles.boxShadow = styles.boxShadow.replace(/#[0-9A-Fa-f]{6}/g, themeColor)
                                              .replace(/rgba\([^)]+\)/g, `${themeColor}40`);
      }
    } else {
      cssStyles.borderColor = styles.borderColor;
      cssStyles.boxShadow = styles.boxShadow;
    }
  } else {
    if (styles.borderColor) cssStyles.borderColor = styles.borderColor;
    if (styles.boxShadow) cssStyles.boxShadow = styles.boxShadow;
  }

  return cssStyles;
};

const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  avatarUrl,
  username,
  frame,
  badge,
  size = 'md',
  themeColor,
  className = '',
  onClick,
}) => {
  const sizes = sizeConfig[size];

  const frameStyles = useMemo(() => {
    if (!frame?.css_styles) {
      return {
        borderWidth: '3px',
        borderStyle: 'solid' as const,
        borderColor: themeColor ? `${themeColor}50` : 'rgba(255,255,255,0.2)',
        borderRadius: '16px',
        boxShadow: themeColor ? `0 0 20px ${themeColor}30` : undefined,
      };
    }
    return applyThemeToStyles(frame.css_styles, themeColor);
  }, [frame, themeColor]);

  const animationClass = frame?.animation_class ? getAnimationClass(frame.animation_class) : '';

  const BadgeIcon = badge?.css_styles ? getBadgeIcon(badge.css_styles.icon) : null;
  const badgeStyles = badge?.css_styles as BadgeCssStyles | undefined;

  return (
    <div
      className={`relative inline-block ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div
        className={`${sizes.container} relative overflow-hidden flex items-center justify-center ${animationClass}`}
        style={frameStyles}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username || 'Avatar'}
            className={`${sizes.avatar} object-cover`}
            style={{ borderRadius: frameStyles.borderRadius }}
          />
        ) : (
          <div
            className={`${sizes.avatar} flex items-center justify-center bg-dark-200`}
            style={{
              borderRadius: frameStyles.borderRadius,
              backgroundColor: themeColor ? `${themeColor}20` : undefined
            }}
          >
            <User className={`${sizes.icon} text-white/40`} />
          </div>
        )}
      </div>

      {badge && BadgeIcon && badgeStyles && (
        <div
          className={`absolute ${getBadgePositionClasses(badge.position)} ${sizes.badge} rounded-full flex items-center justify-center z-10`}
          style={{
            backgroundColor: '#1a1a2e',
            boxShadow: badgeStyles.glow ? `0 0 10px ${badgeStyles.color}60` : undefined,
          }}
        >
          <BadgeIcon
            className={`${sizes.badgeIcon} ${badgeStyles.animated ? 'animate-pulse' : ''}`}
            style={{ color: badgeStyles.color }}
          />
        </div>
      )}
    </div>
  );
};

export default AvatarWithFrame;