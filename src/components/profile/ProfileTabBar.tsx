import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Trophy,
  BarChart3,
  Users,
  Award,
  Settings
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

export type ProfileTab = 'overview' | 'tournaments' | 'stats' | 'friends' | 'achievements';

interface ProfileTabBarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  theme: GameTheme;
}

const tabs: { id: ProfileTab; labelKey: string; fallback: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', labelKey: 'profile.tabOverview', fallback: 'Overview', icon: LayoutDashboard },
  { id: 'tournaments', labelKey: 'profile.tabTournaments', fallback: 'Tournaments', icon: Trophy },
  { id: 'stats', labelKey: 'profile.tabStats', fallback: 'Stats', icon: BarChart3 },
  { id: 'friends', labelKey: 'profile.tabFriends', fallback: 'Friends', icon: Users },
  { id: 'achievements', labelKey: 'profile.tabAchievements', fallback: 'Achievements', icon: Award },
];

const ProfileTabBar: React.FC<ProfileTabBarProps> = ({ activeTab, onTabChange, theme }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 border-b border-gray-800 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t(tab.labelKey, tab.fallback)}</span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              )}
            </button>
          );
        })}
      </div>
      <Link
        to="/profile/settings"
        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-300 whitespace-nowrap transition-colors border-l border-gray-800 ml-auto flex-shrink-0"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden md:inline">{t('profile.settings', 'Settings')}</span>
      </Link>
    </div>
  );
};

export default ProfileTabBar;
