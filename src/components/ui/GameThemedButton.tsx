import React, { useMemo } from 'react';
import { getGameTheme, getShapeStyles, getContentSkew, GameTheme } from '../../utils/gameThemes';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface GameThemedButtonProps {
  gameName?: string | null;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  useDefaultColors?: boolean;
}

export const GameThemedButton: React.FC<GameThemedButtonProps> = ({
  gameName,
  children,
  onClick,
  className = '',
  useDefaultColors = false,
}) => {
  const { primaryColor } = useAppConfig();
  const theme = useMemo(() => getGameTheme(gameName), [gameName]);
  const shapeStyles = useMemo(() => getShapeStyles(theme.shape), [theme.shape]);
  const contentSkew = useMemo(() => getContentSkew(theme.shape), [theme.shape]);

  const effectiveColors = useDefaultColors
    ? {
        ...theme.colors,
        primary: primaryColor,
        secondary: primaryColor,
        glow: `${primaryColor}40`,
      }
    : theme.colors;

  const Icon = theme.icon;

  const getAnimationClass = (animation: GameTheme['animation']): string => {
    switch (animation) {
      case 'kick':
        return 'game-btn-kick';
      case 'build':
        return 'game-btn-build';
      case 'shimmer':
        return 'game-btn-shimmer';
      case 'flash':
        return 'game-btn-flash';
      case 'tactical':
        return 'game-btn-tactical';
      case 'boost':
        return 'game-btn-boost';
      case 'pulse':
      default:
        return 'game-btn-pulse';
    }
  };

  const getBorderStyles = (): React.CSSProperties => {
    switch (theme.borderStyle) {
      case 'double':
        return {
          border: `3px double ${effectiveColors.border}`,
        };
      case 'gradient':
        return {
          border: `2px solid ${effectiveColors.border}`,
        };
      case 'solid':
        return {
          border: `2px solid ${effectiveColors.border}`,
        };
      case 'none':
      default:
        return {};
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        game-themed-button
        ${getAnimationClass(theme.animation)}
        relative inline-flex items-center justify-center
        font-semibold text-base
        transition-all duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100
        ${className}
      `}
      style={{
        ...shapeStyles,
        ...getBorderStyles(),
        background: `linear-gradient(135deg, ${effectiveColors.primary} 0%, ${effectiveColors.secondary} 100%)`,
        color: effectiveColors.text,
        boxShadow: `0 4px 20px ${effectiveColors.glow}`,
      }}
    >
      <span
        className="relative z-10 flex items-center justify-center gap-2"
        style={contentSkew}
      >
        <Icon className="w-5 h-5" />
        {children}
      </span>

      <span
        className="absolute inset-0 opacity-0 transition-opacity duration-300 game-btn-hover-overlay"
        style={{
          ...shapeStyles,
          background: `linear-gradient(135deg, ${effectiveColors.secondary} 0%, ${effectiveColors.primary} 100%)`,
        }}
      />
    </button>
  );
};
