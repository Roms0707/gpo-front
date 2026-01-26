import React from 'react';
import { useTranslation } from 'react-i18next';
import { Video, FileText } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { RubricInfo } from '../../services/othersService';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';

export type OthersTabId = string;

interface OthersHubDynamicTabsProps {
  rubrics: RubricInfo[];
  activeTab: OthersTabId;
  onTabChange: (tabId: OthersTabId) => void;
  theme: GameTheme;
  isLoading?: boolean;
}

const OthersHubDynamicTabs: React.FC<OthersHubDynamicTabsProps> = ({
  rubrics,
  activeTab,
  onTabChange,
  theme,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { checkAccess, isKliento } = useSubscriptionGuard();

  const handleTabClick = async (tabId: OthersTabId) => {
    if (isKliento && tabId !== 'articles') {
      const hasAccess = await checkAccess();
      if (!hasAccess) return;
    }
    onTabChange(tabId);
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex items-center gap-1 min-w-max px-4 sm:px-6 lg:px-8 py-3 bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 w-28 bg-gray-200 dark:bg-dark-300 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allTabs = [
    ...rubrics.map((rubric) => ({
      id: rubric.rubric_id,
      label: rubric.rubric_name || rubric.rubric_id,
      icon: Video,
    })),
    {
      id: 'articles',
      label: t('othersHub.tabs.articles'),
      icon: FileText,
    },
  ];

  return (
    <div className="relative">
      <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex items-center gap-1 min-w-max px-4 sm:px-6 lg:px-8 py-3 bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
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
                <span>{tab.label}</span>

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

export default OthersHubDynamicTabs;
