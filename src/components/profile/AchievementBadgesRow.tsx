import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trophy,
  Sword,
  Medal,
  Flame,
  Crown,
  Users,
  Heart,
  CheckCircle,
  Gamepad2,
  UserCheck,
  Zap,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked?: boolean;
  unlocked_at?: string;
}

interface AchievementBadgesRowProps {
  achievements: Achievement[];
  theme: GameTheme;
  isLoading?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  sword: Sword,
  medal: Medal,
  flame: Flame,
  crown: Crown,
  users: Users,
  heart: Heart,
  'check-circle': CheckCircle,
  'gamepad-2': Gamepad2,
  'user-check': UserCheck,
  zap: Zap,
  calendar: Calendar
};

const rarityStyles: Record<string, { bg: string; border: string; glow: string }> = {
  common: {
    bg: 'from-gray-500 to-gray-600',
    border: 'border-gray-400',
    glow: 'shadow-gray-500/30'
  },
  rare: {
    bg: 'from-blue-500 to-blue-600',
    border: 'border-blue-400',
    glow: 'shadow-blue-500/40'
  },
  epic: {
    bg: 'from-fuchsia-500 to-fuchsia-600',
    border: 'border-fuchsia-400',
    glow: 'shadow-fuchsia-500/50'
  },
  legendary: {
    bg: 'from-amber-400 via-yellow-400 to-orange-500',
    border: 'border-yellow-400',
    glow: 'shadow-yellow-500/60'
  }
};

const AchievementBadge: React.FC<{
  achievement: Achievement;
  theme: GameTheme;
}> = ({ achievement, theme }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = iconMap[achievement.icon] || Trophy;
  const rarity = rarityStyles[achievement.rarity] || rarityStyles.common;

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
          achievement.unlocked
            ? `bg-gradient-to-br ${rarity.bg} shadow-lg ${rarity.glow} hover:scale-110 cursor-pointer`
            : 'bg-gray-800/50 border border-gray-700 opacity-40 grayscale'
        }`}
        style={achievement.unlocked ? {
          boxShadow: `0 0 16px ${theme.colors.primary}30`
        } : undefined}
      >
        {achievement.unlocked ? (
          <Icon className="w-6 h-6 text-white" />
        ) : (
          <Lock className="w-5 h-5 text-gray-500" />
        )}

        {achievement.unlocked && achievement.rarity === 'legendary' && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 pointer-events-none">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                achievement.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                achievement.rarity === 'epic' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {achievement.rarity}
              </span>
            </div>
            <h4 className="font-bold text-white text-sm">{achievement.name}</h4>
            <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
            {achievement.unlocked ? (
              <p className="text-xs text-green-400 mt-2">
                +{achievement.xp_reward} XP earned
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                +{achievement.xp_reward} XP on unlock
              </p>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

const AchievementBadgesRow: React.FC<AchievementBadgesRowProps> = ({
  achievements,
  theme,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [achievements]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return (rarityOrder[a.rarity] || 4) - (rarityOrder[b.rarity] || 4);
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-gray-200 dark:bg-dark-300 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-dark-300 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-14 h-14 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: theme.colors.primary }} />
          {t('profile.achievements', 'Achievements')}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-gray-900/80 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sortedAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              theme={theme}
            />
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-gray-900/80 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AchievementBadgesRow;
