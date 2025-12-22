import {
  Goal,
  Target,
  Sword,
  Crosshair,
  Rocket,
  Gamepad2,
  Play,
  LucideIcon
} from 'lucide-react';

export type ButtonShape =
  | 'stadium'    // FC26 - pill/capsule like football
  | 'angled'     // Fortnite - skewed rectangle
  | 'hexagon'    // League of Legends - hexagonal
  | 'tactical'   // Valorant - cut corners
  | 'military'   // Call of Duty - beveled/chamfered
  | 'boost'      // Rocket League - dynamic curves
  | 'rounded';   // Default - standard rounded

export interface GameTheme {
  shape: ButtonShape;
  icon: LucideIcon;
  colors: {
    primary: string;
    secondary: string;
    glow: string;
    text: string;
    border: string;
  };
  borderStyle: 'solid' | 'double' | 'gradient' | 'none';
  animation: 'kick' | 'build' | 'shimmer' | 'flash' | 'tactical' | 'boost' | 'pulse';
}

const normalizeGameName = (name: string): string => {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/easportsfc/g, 'fc')
    .replace(/fifa/g, 'fc');
};

const gameThemes: Record<string, GameTheme> = {
  fc26: {
    shape: 'stadium',
    icon: Goal,
    colors: {
      primary: '#2E7D32',
      secondary: '#4CAF50',
      glow: 'rgba(46, 125, 50, 0.5)',
      text: '#FFFFFF',
      border: '#FFFFFF',
    },
    borderStyle: 'double',
    animation: 'kick',
  },
  fc25: {
    shape: 'stadium',
    icon: Goal,
    colors: {
      primary: '#2E7D32',
      secondary: '#4CAF50',
      glow: 'rgba(46, 125, 50, 0.5)',
      text: '#FFFFFF',
      border: '#FFFFFF',
    },
    borderStyle: 'double',
    animation: 'kick',
  },
  fc24: {
    shape: 'stadium',
    icon: Goal,
    colors: {
      primary: '#2E7D32',
      secondary: '#4CAF50',
      glow: 'rgba(46, 125, 50, 0.5)',
      text: '#FFFFFF',
      border: '#FFFFFF',
    },
    borderStyle: 'double',
    animation: 'kick',
  },
  easportsfc: {
    shape: 'stadium',
    icon: Goal,
    colors: {
      primary: '#2E7D32',
      secondary: '#4CAF50',
      glow: 'rgba(46, 125, 50, 0.5)',
      text: '#FFFFFF',
      border: '#FFFFFF',
    },
    borderStyle: 'double',
    animation: 'kick',
  },
  fortnite: {
    shape: 'angled',
    icon: Target,
    colors: {
      primary: '#F97316',
      secondary: '#FBBF24',
      glow: 'rgba(34, 211, 238, 0.5)',
      text: '#FFFFFF',
      border: '#22D3EE',
    },
    borderStyle: 'solid',
    animation: 'build',
  },
  leagueoflegends: {
    shape: 'hexagon',
    icon: Sword,
    colors: {
      primary: '#C89B3C',
      secondary: '#785A28',
      glow: 'rgba(200, 155, 60, 0.5)',
      text: '#FFFFFF',
      border: '#C89B3C',
    },
    borderStyle: 'gradient',
    animation: 'shimmer',
  },
  lol: {
    shape: 'hexagon',
    icon: Sword,
    colors: {
      primary: '#C89B3C',
      secondary: '#785A28',
      glow: 'rgba(200, 155, 60, 0.5)',
      text: '#FFFFFF',
      border: '#C89B3C',
    },
    borderStyle: 'gradient',
    animation: 'shimmer',
  },
  valorant: {
    shape: 'tactical',
    icon: Crosshair,
    colors: {
      primary: '#FF4655',
      secondary: '#BD3944',
      glow: 'rgba(255, 70, 85, 0.5)',
      text: '#FFFFFF',
      border: '#FF4655',
    },
    borderStyle: 'solid',
    animation: 'flash',
  },
  callofduty: {
    shape: 'military',
    icon: Target,
    colors: {
      primary: '#4A5D23',
      secondary: '#2D3B18',
      glow: 'rgba(74, 93, 35, 0.5)',
      text: '#FFFFFF',
      border: '#9CA3AF',
    },
    borderStyle: 'solid',
    animation: 'tactical',
  },
  cod: {
    shape: 'military',
    icon: Target,
    colors: {
      primary: '#4A5D23',
      secondary: '#2D3B18',
      glow: 'rgba(74, 93, 35, 0.5)',
      text: '#FFFFFF',
      border: '#9CA3AF',
    },
    borderStyle: 'solid',
    animation: 'tactical',
  },
  warzone: {
    shape: 'military',
    icon: Target,
    colors: {
      primary: '#4A5D23',
      secondary: '#2D3B18',
      glow: 'rgba(74, 93, 35, 0.5)',
      text: '#FFFFFF',
      border: '#9CA3AF',
    },
    borderStyle: 'solid',
    animation: 'tactical',
  },
  rocketleague: {
    shape: 'boost',
    icon: Rocket,
    colors: {
      primary: '#3B82F6',
      secondary: '#F97316',
      glow: 'rgba(59, 130, 246, 0.5)',
      text: '#FFFFFF',
      border: '#22D3EE',
    },
    borderStyle: 'gradient',
    animation: 'boost',
  },
  apex: {
    shape: 'tactical',
    icon: Crosshair,
    colors: {
      primary: '#DC2626',
      secondary: '#991B1B',
      glow: 'rgba(220, 38, 38, 0.5)',
      text: '#FFFFFF',
      border: '#DC2626',
    },
    borderStyle: 'solid',
    animation: 'flash',
  },
  apexlegends: {
    shape: 'tactical',
    icon: Crosshair,
    colors: {
      primary: '#DC2626',
      secondary: '#991B1B',
      glow: 'rgba(220, 38, 38, 0.5)',
      text: '#FFFFFF',
      border: '#DC2626',
    },
    borderStyle: 'solid',
    animation: 'flash',
  },
  csgo: {
    shape: 'military',
    icon: Crosshair,
    colors: {
      primary: '#F97316',
      secondary: '#C2410C',
      glow: 'rgba(249, 115, 22, 0.5)',
      text: '#FFFFFF',
      border: '#F97316',
    },
    borderStyle: 'solid',
    animation: 'tactical',
  },
  cs2: {
    shape: 'military',
    icon: Crosshair,
    colors: {
      primary: '#F97316',
      secondary: '#C2410C',
      glow: 'rgba(249, 115, 22, 0.5)',
      text: '#FFFFFF',
      border: '#F97316',
    },
    borderStyle: 'solid',
    animation: 'tactical',
  },
  counterstrike: {
    shape: 'military',
    icon: Crosshair,
    colors: {
      primary: '#F97316',
      secondary: '#C2410C',
      glow: 'rgba(249, 115, 22, 0.5)',
      text: '#FFFFFF',
      border: '#F97316',
    },
    borderStyle: 'solid',
    animation: 'tactical',
  },
  overwatch: {
    shape: 'angled',
    icon: Target,
    colors: {
      primary: '#F97316',
      secondary: '#EA580C',
      glow: 'rgba(249, 115, 22, 0.5)',
      text: '#FFFFFF',
      border: '#FFFFFF',
    },
    borderStyle: 'solid',
    animation: 'build',
  },
  overwatch2: {
    shape: 'angled',
    icon: Target,
    colors: {
      primary: '#F97316',
      secondary: '#EA580C',
      glow: 'rgba(249, 115, 22, 0.5)',
      text: '#FFFFFF',
      border: '#FFFFFF',
    },
    borderStyle: 'solid',
    animation: 'build',
  },
  pubg: {
    shape: 'military',
    icon: Crosshair,
    colors: {
      primary: '#EAB308',
      secondary: '#CA8A04',
      glow: 'rgba(234, 179, 8, 0.5)',
      text: '#000000',
      border: '#EAB308',
    },
    borderStyle: 'solid',
    animation: 'tactical',
  },
  mobilelegends: {
    shape: 'hexagon',
    icon: Sword,
    colors: {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      glow: 'rgba(59, 130, 246, 0.5)',
      text: '#FFFFFF',
      border: '#3B82F6',
    },
    borderStyle: 'gradient',
    animation: 'shimmer',
  },
  dota2: {
    shape: 'hexagon',
    icon: Sword,
    colors: {
      primary: '#DC2626',
      secondary: '#991B1B',
      glow: 'rgba(220, 38, 38, 0.5)',
      text: '#FFFFFF',
      border: '#DC2626',
    },
    borderStyle: 'gradient',
    animation: 'shimmer',
  },
  streetfighter: {
    shape: 'angled',
    icon: Gamepad2,
    colors: {
      primary: '#DC2626',
      secondary: '#991B1B',
      glow: 'rgba(220, 38, 38, 0.5)',
      text: '#FFFFFF',
      border: '#EAB308',
    },
    borderStyle: 'solid',
    animation: 'flash',
  },
  tekken: {
    shape: 'angled',
    icon: Gamepad2,
    colors: {
      primary: '#1D4ED8',
      secondary: '#1E40AF',
      glow: 'rgba(29, 78, 216, 0.5)',
      text: '#FFFFFF',
      border: '#F97316',
    },
    borderStyle: 'solid',
    animation: 'flash',
  },
};

const defaultTheme: GameTheme = {
  shape: 'rounded',
  icon: Play,
  colors: {
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    glow: 'rgba(59, 130, 246, 0.4)',
    text: '#FFFFFF',
    border: '#3B82F6',
  },
  borderStyle: 'none',
  animation: 'pulse',
};

export const getGameTheme = (gameName: string | undefined | null): GameTheme => {
  if (!gameName) return defaultTheme;

  const normalizedName = normalizeGameName(gameName);

  for (const [key, theme] of Object.entries(gameThemes)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return theme;
    }
  }

  return defaultTheme;
};

export const getShapeStyles = (shape: ButtonShape): React.CSSProperties => {
  switch (shape) {
    case 'stadium':
      return {
        borderRadius: '9999px',
        padding: '0.875rem 2.5rem',
      };
    case 'angled':
      return {
        borderRadius: '4px',
        transform: 'skewX(-12deg)',
        padding: '0.875rem 2rem',
      };
    case 'hexagon':
      return {
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
        padding: '0.875rem 2.5rem',
        borderRadius: '0',
      };
    case 'tactical':
      return {
        clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)',
        padding: '0.875rem 2rem',
        borderRadius: '0',
      };
    case 'military':
      return {
        clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
        padding: '0.875rem 2rem',
        borderRadius: '0',
      };
    case 'boost':
      return {
        borderRadius: '9999px 16px 9999px 16px',
        padding: '0.875rem 2rem',
      };
    case 'rounded':
    default:
      return {
        borderRadius: '0.5rem',
        padding: '0.875rem 2rem',
      };
  }
};

export const getContentSkew = (shape: ButtonShape): React.CSSProperties => {
  if (shape === 'angled') {
    return { transform: 'skewX(12deg)' };
  }
  return {};
};

export const getCardClipPath = (shape: ButtonShape): string => {
  switch (shape) {
    case 'hexagon':
      return 'polygon(16px 0%, calc(100% - 16px) 0%, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0% calc(100% - 16px), 0% 16px)';
    case 'tactical':
      return 'polygon(20px 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% 20px)';
    case 'military':
      return 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)';
    case 'angled':
      return 'polygon(0% 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%)';
    case 'boost':
      return 'polygon(0% 12px, 12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%)';
    case 'stadium':
    case 'rounded':
    default:
      return 'none';
  }
};

export const getCardBorderRadius = (shape: ButtonShape): string => {
  switch (shape) {
    case 'hexagon':
    case 'tactical':
    case 'military':
    case 'angled':
    case 'boost':
      return '0';
    case 'stadium':
      return '16px';
    case 'rounded':
    default:
      return '12px';
  }
};

export const getCardCornerAccent = (shape: ButtonShape): { topLeft: boolean; topRight: boolean; bottomLeft: boolean; bottomRight: boolean } => {
  switch (shape) {
    case 'tactical':
      return { topLeft: true, topRight: false, bottomLeft: false, bottomRight: true };
    case 'military':
      return { topLeft: true, topRight: true, bottomLeft: true, bottomRight: true };
    case 'hexagon':
      return { topLeft: true, topRight: true, bottomLeft: true, bottomRight: true };
    case 'angled':
      return { topLeft: false, topRight: false, bottomLeft: false, bottomRight: true };
    default:
      return { topLeft: false, topRight: false, bottomLeft: false, bottomRight: false };
  }
};
