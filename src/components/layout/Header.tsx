import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar, SIDEBAR_WIDTH } from '../../contexts/SidebarContext';
import {
  Bell,
  User,
  Award,
  Swords,
  LogIn,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import NotificationsModal from './NotificationsModal';
import MyGamingStatsModal from '../ui/MyGamingStatsModal';
import { supabase } from '../../lib/supabase';
import { fetchUnreadMessageCount } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { DynamicLogo } from '../common/DynamicLogo';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useMatchNotifications } from '../../hooks/useMatchNotifications';
import { useActiveTournamentNotifications } from '../../hooks/useActiveTournamentNotifications';
import MatchNotificationPanel from '../notifications/MatchNotificationPanel';
import MatchNotificationModal from '../notifications/MatchNotificationModal';
import { PlayerMatchNotification } from '../../types';
import PillNav, { PillNavItem } from '../navigation/PillNav';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showMatchNotificationPanel, setShowMatchNotificationPanel] =
    useState(false);
  const [selectedMatchNotification, setSelectedMatchNotification] =
    useState<PlayerMatchNotification | null>(null);
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showGamingStatsModal, openGamingStatsModal, closeGamingStatsModal } =
    useAuthStore();
  const { brandName } = useAppConfig();
  const location = useLocation();
  const { t } = useTranslation();
  const { isSidebarVisible } = useSidebar();

  const {
    notifications: matchNotifications,
    markAsRead: markMatchNotificationAsRead,
    markAllAsRead: markAllMatchNotificationsAsRead,
  } = useMatchNotifications({
    userId: user?.id,
    enabled: user?.type === 'gamer',
  });

  const { hasActiveTournaments, totalUnreadCount: activeTournamentUnreadCount } =
    useActiveTournamentNotifications({
      userId: user?.id,
      enabled: user?.type === 'gamer',
    });

  const isHomePage = location.pathname === '/';
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadNotificationCount();
      loadUnreadMessageCount();

      const notificationSubscription = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotificationCount();
          }
        )
        .subscribe();

      const messageSubscription = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            loadUnreadMessageCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            loadUnreadMessageCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationSubscription);
        supabase.removeChannel(messageSubscription);
      };
    }
  }, [user?.id]);

  const loadNotificationCount = async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error loading notification count:', error);
        return;
      }

      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const loadUnreadMessageCount = async () => {
    if (!user?.id) return;

    try {
      const count = await fetchUnreadMessageCount(user.id);
      setUnreadMessageCount(count);
    } catch (error) {
      console.error('Error loading unread message count:', error);
    }
  };

  const handleMatchNotificationClick = (notification: PlayerMatchNotification) => {
    setShowMatchNotificationPanel(false);
    setSelectedMatchNotification(notification);
  };

  const handleCloseMatchNotificationModal = () => {
    setSelectedMatchNotification(null);
  };

  const totalUnreadItems = notificationCount + unreadMessageCount;

  const getHeaderStyling = () => {
    if (isHomePage) {
      return isScrolled
        ? 'bg-white/98 dark:bg-dark-100/95 shadow-lg backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50'
        : 'bg-transparent';
    }
    return 'bg-white dark:bg-dark-100 shadow-lg';
  };


  const getTextStyling = () => {
    if (isHomePage) {
      return isScrolled ? 'text-gray-900 dark:text-white' : 'text-white';
    }
    return 'text-gray-900 dark:text-white';
  };

  const navItems: PillNavItem[] = [
    { label: t('header.tournaments'), href: '/' },
    { label: t('header.leaderboards'), href: '/leaderboards' },
    { label: t('header.communities'), href: '/communities' },
    { label: t('header.masterclasses'), href: '/masterclasses' },
    { label: t('header.grindZone'), href: '/grind-zone' },
  ];

  if (user) {
    if (user.type === 'gamer' && hasActiveTournaments) {
      navItems.push({
        label: t('header.matchNotifications'),
        href: '#match-notifications',
        icon: <Swords className="w-4 h-4" />,
        badge: activeTournamentUnreadCount,
        onClick: () => setShowMatchNotificationPanel(!showMatchNotificationPanel),
      });
    }

    navItems.push({
      label: t('navigation.notifications'),
      href: '#notifications',
      icon: <Bell className="w-4 h-4" />,
      badge: totalUnreadItems,
      onClick: () => setShowNotifications(true),
    });

    navItems.push({
      label: t('header.gamingStatsLabel'),
      href: '#gaming-stats',
      icon: <Award className="w-4 h-4" />,
      onClick: openGamingStatsModal,
      id: 'walkthrough-gaming-stats',
    });

    navItems.push({
      label: user.username,
      href: '/profile',
      icon: user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt=""
          className="w-4 h-4 rounded-full object-cover"
        />
      ) : (
        <User className="w-4 h-4" />
      ),
    });
  }

  return (
    <header
      className={`fixed top-0 z-50 transition-all duration-300 ${getHeaderStyling()}`}
      style={{
        left: isSidebarVisible ? `${SIDEBAR_WIDTH}px` : '0px',
        width: isSidebarVisible ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%',
      }}
    >
      <div className="w-full px-4 lg:px-6 py-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className={`flex items-center space-x-2 ${getTextStyling()}`}
            aria-label={`${brandName} Home`}
          >
            <DynamicLogo size="lg" />
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <PillNav items={navItems} />

            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                isDark
                  ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50'
                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-gray-200/50'
              } backdrop-blur-sm`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {isLoading ? (
              <div className="w-24 h-10 bg-gray-200 dark:bg-dark-200 animate-pulse rounded-full" />
            ) : user ? (
              <button
                onClick={logout}
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white hover:shadow-lg hover:shadow-gray-900/25 dark:hover:shadow-gray-700/25 hover:scale-105 active:scale-95"
                aria-label={t('header.logOut')}
              >
                <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                <span>{t('header.logout')}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 active:scale-95"
                aria-label={t('header.logIn')}
              >
                <LogIn className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                <span>{t('header.login')}</span>
              </Link>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                isHomePage && !isScrolled
                  ? 'text-white hover:bg-white/10'
                  : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {!isLoading && (
              <>
                {user ? (
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-xs transition-all duration-200 bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600"
                    aria-label={t('header.logOut')}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-xs transition-all duration-200 bg-primary-500 text-white hover:bg-primary-600"
                    aria-label={t('header.logIn')}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <MyGamingStatsModal
        isOpen={showGamingStatsModal}
        onClose={closeGamingStatsModal}
      />

      {user?.type === 'gamer' && hasActiveTournaments && (
        <MatchNotificationPanel
          notifications={matchNotifications}
          unreadCount={activeTournamentUnreadCount}
          onNotificationClick={handleMatchNotificationClick}
          onMarkAllAsRead={markAllMatchNotificationsAsRead}
          isOpen={showMatchNotificationPanel}
          onClose={() => setShowMatchNotificationPanel(false)}
        />
      )}

      {selectedMatchNotification && (
        <MatchNotificationModal
          notification={selectedMatchNotification}
          onClose={handleCloseMatchNotificationModal}
          onMarkAsRead={markMatchNotificationAsRead}
        />
      )}
    </header>
  );
};

export default Header;
