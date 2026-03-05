import React from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeType, BADGE_DEFINITIONS } from '../../services/badgeService';

const BADGE_ORDER: BadgeType[] = ['new', 'hype', 'trending', 'featured', 'hot', 'must_watch'];

interface BadgeFilterBarProps {
  selectedBadges: Set<BadgeType>;
  onToggleBadge: (badge: BadgeType) => void;
  badgeCounts: Record<BadgeType, number>;
  className?: string;
}

const BadgeFilterBar: React.FC<BadgeFilterBarProps> = ({
  selectedBadges,
  onToggleBadge,
  badgeCounts,
  className = '',
}) => {
  const { t } = useTranslation();
  const allInactive = selectedBadges.size === 0;

  const handleClearAll = () => {
    if (!allInactive) {
      for (const badge of Array.from(selectedBadges)) {
        onToggleBadge(badge);
      }
    }
  };

  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto pb-1 ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <button
        onClick={handleClearAll}
        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
          allInactive
            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
            : 'bg-gray-100 dark:bg-dark-300/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-300'
        }`}
      >
        {t('badges.filterAll', 'All')}
      </button>

      {BADGE_ORDER.map((badgeType) => {
        const def = BADGE_DEFINITIONS[badgeType];
        const Icon = def.icon;
        const count = badgeCounts[badgeType] || 0;
        const isActive = selectedBadges.has(badgeType);
        const isDisabled = count === 0;

        return (
          <button
            key={badgeType}
            onClick={() => !isDisabled && onToggleBadge(badgeType)}
            disabled={isDisabled}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              isDisabled
                ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-dark-300/30 text-gray-400 dark:text-gray-600'
                : isActive
                ? 'text-white shadow-sm'
                : 'bg-gray-100 dark:bg-dark-300/50 hover:bg-gray-200 dark:hover:bg-dark-300'
            }`}
            style={
              isActive && !isDisabled
                ? { backgroundColor: def.bgColor, color: def.textColor }
                : !isDisabled && !isActive
                ? { color: def.bgColor.replace('0.85', '1') }
                : undefined
            }
          >
            <Icon className="w-3 h-3" />
            {t(def.labelKey, def.fallbackLabel)}
            <span
              className={`min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none ${
                isActive
                  ? 'bg-white/25 text-white'
                  : isDisabled
                  ? 'bg-gray-200 dark:bg-dark-300/50 text-gray-400 dark:text-gray-600'
                  : 'bg-black/10 dark:bg-white/10'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BadgeFilterBar;
