import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Trophy,
  Users,
  User,
  LogIn,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface MobileNavBarProps {
  user: { avatar_url?: string } | null;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ user }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const leftItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Ranking', href: '/leaderboards', icon: Trophy },
  ];

  const hubItem = { label: 'Hub', href: '/hub', icon: LayoutGrid };

  const rightItems = [
    { label: 'Community', href: '/communities', icon: Users },
  ];

  const profileItem = user
    ? { label: 'Profile', href: '/profile', icon: User, avatar: user.avatar_url }
    : { label: 'Login', href: '/login', icon: LogIn };

  const renderNavItem = (item: { label: string; href: string; icon: React.ElementType }, isProfile = false, avatar?: string) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        to={item.href}
        className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200 ${
          active
            ? 'text-primary-500'
            : isDark
            ? 'text-gray-400 hover:text-gray-200'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
          active
            ? isDark
              ? 'bg-primary-500/15'
              : 'bg-primary-500/10'
            : ''
        }`}>
          {isProfile && avatar ? (
            <img
              src={avatar}
              alt=""
              className={`w-5 h-5 rounded-full object-cover ${
                active ? 'ring-2 ring-primary-500 ring-offset-1' : ''
              }`}
              style={{ ringOffsetColor: isDark ? '#111827' : '#ffffff' }}
            />
          ) : (
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
          )}
        </div>
        <span className={`text-[10px] mt-0.5 ${active ? 'font-semibold' : 'font-medium'}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  const hubActive = isActive(hubItem.href);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden ${
        isDark
          ? 'bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50'
          : 'bg-white/95 backdrop-blur-xl border-t border-gray-200/50'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="relative flex items-end justify-around h-16 px-1">
        {leftItems.map((item) => renderNavItem(item))}

        <div className="flex flex-col items-center justify-end flex-1 pb-2">
          <Link
            to={hubItem.href}
            className="relative -mt-6 group"
            aria-current={hubActive ? 'page' : undefined}
          >
            <div
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                hubActive
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/40'
                  : isDark
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 shadow-black/30 group-hover:from-gray-600 group-hover:to-gray-700'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 shadow-gray-400/30 group-hover:from-gray-50 group-hover:to-gray-100'
              } group-active:scale-95`}
            >
              <div className={`absolute inset-0.5 rounded-full ${
                hubActive
                  ? 'bg-gradient-to-br from-primary-400/20 to-transparent'
                  : isDark
                  ? 'bg-gradient-to-br from-white/10 to-transparent'
                  : 'bg-gradient-to-br from-white/80 to-transparent'
              }`} />
              <LayoutGrid
                className={`w-6 h-6 relative z-10 transition-colors duration-200 ${
                  hubActive
                    ? 'text-white'
                    : isDark
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-gray-600 group-hover:text-gray-800'
                }`}
                strokeWidth={hubActive ? 2.5 : 2}
              />
              {hubActive && (
                <div className="absolute inset-0 rounded-full bg-primary-400/30 animate-pulse" />
              )}
            </div>
          </Link>
          <span className={`text-[10px] mt-1 transition-colors duration-200 ${
            hubActive
              ? 'font-semibold text-primary-500'
              : isDark
              ? 'font-medium text-gray-400'
              : 'font-medium text-gray-500'
          }`}>
            {hubItem.label}
          </span>
        </div>

        {rightItems.map((item) => renderNavItem(item))}
        {renderNavItem(profileItem, true, profileItem.avatar)}
      </div>
    </nav>
  );
};

export default MobileNavBar;
