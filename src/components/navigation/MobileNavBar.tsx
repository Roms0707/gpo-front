import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Home,
  LayoutGrid,
  Film,
  Trophy,
  Users,
  User,
  LogIn,
  Award,
  Plus,
  X,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import RadialMenu from './RadialMenu';

interface MobileNavBarProps {
  user: { avatar_url?: string } | null;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ user }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';
  const [isRadialOpen, setIsRadialOpen] = useState(false);

  useEffect(() => {
    setIsRadialOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isRadialOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRadialOpen]);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const navItems = [
    { label: t('navigation.home'), href: '/', icon: Home },
    { label: t('navigation.tournaments'), href: '/tournaments', icon: Trophy },
  ];

  const profileItem = user
    ? { label: t('navigation.profile'), href: '/profile', icon: User, avatar: user.avatar_url }
    : { label: t('header.login'), href: '/login', icon: LogIn };

  const communitiesItem = { label: t('navigation.communities'), href: '/communities', icon: Users };

  const radialItems = [
    { label: t('navigation.masterclasses'), href: '/masterclasses', icon: Film, isActive: isActive('/masterclasses') },
    { label: 'Hub', href: '/hub', icon: LayoutGrid, isActive: isActive('/hub') },
    { label: t('navigation.myGamingStats'), href: '/profile/gaming-stats', icon: Award, isActive: isActive('/profile/gaming-stats') },
    { label: t('navigation.leaderboards'), href: '/leaderboards', icon: Trophy, isActive: isActive('/leaderboards') },
  ];

  const isAnyRadialActive = radialItems.some((item) => item.isActive);

  const renderNavItem = (
    item: { label: string; href: string; icon: React.ElementType; avatar?: string },
    isProfile = false
  ) => {
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
        <div
          className={`relative p-1.5 rounded-xl transition-all duration-200 ${
            active
              ? isDark
                ? 'bg-primary-500/15'
                : 'bg-primary-500/10'
              : ''
          }`}
        >
          {isProfile && item.avatar ? (
            <img
              src={item.avatar}
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

  return (
    <>
      <RadialMenu
        items={radialItems}
        isOpen={isRadialOpen}
        onClose={() => setIsRadialOpen(false)}
      />

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
        <button
          onClick={() => setIsRadialOpen((prev) => !prev)}
          className="absolute left-1/2 -translate-x-1/2 -top-8 z-10 group"
          aria-expanded={isRadialOpen}
          aria-label={isRadialOpen ? t('common.close') : t('navigation.more')}
        >
          <div
            className={`absolute -inset-2 rounded-full ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
          />
          <motion.div
            className={`relative w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 ${
              isRadialOpen || isAnyRadialActive
                ? 'bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600'
                : isDark
                ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800'
                : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'
            }`}
            style={{
              boxShadow: isRadialOpen || isAnyRadialActive
                ? '0 4px 20px rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.4), 0 0 40px rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.15)'
                : isDark
                ? '0 4px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)'
                : '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
            }}
            animate={{ rotate: isRadialOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className={`absolute inset-[1px] rounded-full ${
                isRadialOpen || isAnyRadialActive
                  ? 'bg-gradient-to-br from-white/20 via-transparent to-black/10'
                  : isDark
                  ? 'bg-gradient-to-br from-white/15 via-transparent to-black/10'
                  : 'bg-gradient-to-br from-white/90 via-white/40 to-transparent'
              }`}
            />
            <div
              className={`absolute inset-0 rounded-full border-2 ${
                isRadialOpen || isAnyRadialActive
                  ? 'border-white/20'
                  : isDark
                  ? 'border-white/10'
                  : 'border-white/60'
              }`}
            />
            {isRadialOpen ? (
              <X
                className="w-6 h-6 relative z-10 text-white"
                strokeWidth={2.5}
              />
            ) : (
              <Plus
                className={`w-6 h-6 relative z-10 transition-colors duration-200 ${
                  isAnyRadialActive
                    ? 'text-white'
                    : isDark
                    ? 'text-gray-200'
                    : 'text-gray-600'
                }`}
                strokeWidth={2.5}
              />
            )}
            {isAnyRadialActive && !isRadialOpen && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary-400/50"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        </button>

        <div className="relative flex items-end justify-around h-16 px-1">
          {navItems.map((item) => renderNavItem(item))}
          <div className="flex-1" />
          {renderNavItem(communitiesItem)}
          {renderNavItem(profileItem, true)}
        </div>
      </nav>
    </>
  );
};

export default MobileNavBar;
