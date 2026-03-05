import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Trophy,
  Crown,
  Play,
  Crosshair,
  Brain,
  Flame
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';

export type GameHubTabId = 'overview' | 'tournaments' | 'leaderboard' | 'training' | 'grindZone' | 'skillLab' | 'coaching';

interface Tab {
  id: GameHubTabId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const tabs: Tab[] = [
  { id: 'overview', labelKey: 'gameHub.tabs.overview', icon: LayoutGrid },
  { id: 'tournaments', labelKey: 'gameHub.tabs.tournaments', icon: Trophy },
  { id: 'leaderboard', labelKey: 'gameHub.tabs.leaderboard', icon: Crown },
  { id: 'training', labelKey: 'gameHub.tabs.training', icon: Play },
  { id: 'grindZone', labelKey: 'gameHub.tabs.grindZone', icon: Flame },
  { id: 'skillLab', labelKey: 'gameHub.tabs.skillLab', icon: Crosshair },
  { id: 'coaching', labelKey: 'gameHub.tabs.coaching', icon: Brain },
];

interface GameHubTabsProps {
  activeTab: GameHubTabId;
  onTabChange: (tab: GameHubTabId) => void;
  theme: GameTheme;
  hiddenTabs?: GameHubTabId[];
}

const PROTECTED_TABS: GameHubTabId[] = ['training', 'grindZone', 'skillLab', 'coaching'];

const GameHubTabs: React.FC<GameHubTabsProps> = ({ activeTab, onTabChange, theme, hiddenTabs }) => {
  const { t } = useTranslation();
  const { checkAccess, isKliento } = useSubscriptionGuard();

  const visibleTabs = hiddenTabs?.length ? tabs.filter(tab => !hiddenTabs.includes(tab.id)) : tabs;

  const handleTabClick = async (tabId: GameHubTabId) => {
    if (isKliento && PROTECTED_TABS.includes(tabId)) {
      const hasAccess = await checkAccess();
      if (!hasAccess) return;
    }
    onTabChange(tabId);
  };

  return (
    <div id="walkthrough-gamehub-tabs" className="relative">
      <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex items-center gap-1 min-w-max px-4 sm:px-6 lg:px-8 py-3 bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={
                  tab.id === 'coaching' ? 'walkthrough-tab-coaching' :
                  tab.id === 'training' ? 'walkthrough-tab-training' :
                  undefined
                }
                onClick={() => handleTabClick(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-300/50'
                  }
                `}
                style={isActive ? {
                  backgroundColor: `${theme.colors.primary}20`,
                  color: theme.colors.primary,
                } : undefined}
              >
                <Icon
                  className="w-4 h-4"
                  style={isActive ? { color: theme.colors.primary } : undefined}
                />
                <span>{t(tab.labelKey)}</span>

                {isActive && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${theme.colors.primary}30, transparent)`,
        }}
      />
    </div>
  );
};

export default GameHubTabs;
