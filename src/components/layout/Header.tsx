import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

import { User, Bell, Award, Swords, Trophy, TrendingUp, Users, LogOut } from 'lucide-react';
import NotificationsModal from './NotificationsModal';
import MyGamingStatsModal from '../ui/MyGamingStatsModal';
import ThemeToggle from '../ui/ThemeToggle';
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
import PillNav from '../navigation/PillNav';
import Dock from '../navigation/Dock';
import LoginButton from '../navigation/LoginButton';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showMatchNotificationPanel, setShowMatchNotificationPanel] = useState(false);
  const [selectedMatchNotification, setSelectedMatchNotification] = useState<PlayerMatchNotification | null>(null);
  const { user, logout, isLoading } = useAuth();
  const { showGamingStatsModal, openGamingStatsModal, closeGamingStatsModal } = useAuthStore();
  const { brandName } = useAppConfig();
  const location = useLocation();
  const { t } = useTranslation();

  const {
    notifications: matchNotifications,
    markAsRead: markMatchNotificationAsRead,
    markAllAsRead: markAllMatchNotificationsAsRead
  } = useMatchNotifications({
    userId: user?.id,
    enabled: user?.type === 'gamer'
  });

  const {
    hasActiveTournaments,
    totalUnreadCount: activeTournamentUnreadCount
  } = useActiveTournamentNotifications({
    userId: user?.id,
    enabled: user?.type === 'gamer'
  });

  const isHomePage = location.pathname === '/';

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
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadNotificationCount();
        })
        .subscribe();

      const messageSubscription = supabase
        .channel('messages-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          loadUnreadMessageCount();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          loadUnreadMessageCount();
        })
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
    } else {
      return 'bg-white dark:bg-dark-100 shadow-lg';
    }
  };

  const getContainerStyling = () => {
    if (isHomePage) {
      return isScrolled
        ? 'bg-white/20 dark:bg-transparent backdrop-blur-sm'
        : 'bg-white/10 dark:bg-dark-100/10 backdrop-blur-sm';
    } else {
      return 'bg-transparent';
    }
  };

  const getTextStyling = () => {
    if (isHomePage) {
      return isScrolled ? 'text-gray-900 dark:text-white' : 'text-white';
    } else {
      return 'text-gray-900 dark:text-white';
    }
  };

  const getPillNavTextStyling = () => {
    if (isHomePage && !isScrolled) {
      return {
        textClassName: 'text-white/80',
        activeTextClassName: 'text-white',
        indicatorClassName: 'bg-white',
      };
    }
    return {
      textClassName: 'text-gray-600 dark:text-gray-400',
      activeTextClassName: 'text-gray-900 dark:text-white',
      indicatorClassName: 'bg-primary-500',
    };
  };

  const navItems = [
    { label: t('header.tournaments'), path: '/' },
    { label: t('header.leaderboards'), path: '/leaderboards' },
    { label: t('header.communities'), path: '/communities' },
  ];

  const dockItems = [
    { icon: <Trophy className="w-full h-full" />, label: t('header.tournaments'), path: '/' },
    { icon: <TrendingUp className="w-full h-full" />, label: t('header.leaderboards'), path: '/leaderboards' },
    { icon: <Users className="w-full h-full" />, label: t('header.communities'), path: '/communities' },
    {
      icon: <User className="w-full h-full" />,
      label: user ? t('header.profile') : t('header.login'),
      path: user ? '/profile' : '/login',
      badge: user ? totalUnreadItems : undefined,
    },
  ];

  const pillNavStyles = getPillNavTextStyling();

  return (
    <>
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${getHeaderStyling()}`}
      >
        <div className={`container mx-auto px-4 py-3 ${getContainerStyling()} rounded-lg mx-4 mt-2`}>
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center space-x-2 ${getTextStyling()}`} aria-label={`${brandName} Home`}>
              <DynamicLogo size="lg" />
            </Link>

            <div className="hidden md:flex items-center justify-center flex-1 px-8">
              <PillNav
                items={navItems}
                {...pillNavStyles}
              />
            </div>

            <div className="hidden md:flex items-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-dark-200 animate-pulse rounded-full"></div>
                  <div className="w-20 h-8 bg-gray-200 dark:bg-dark-200 animate-pulse rounded-full"></div>
                </div>
              ) : user ? (
                <>
                  {user.type === 'gamer' && hasActiveTournaments && (
                    <button
                      onClick={() => setShowMatchNotificationPanel(!showMatchNotificationPanel)}
                      className={`relative p-2 rounded-full transition-colors ${getTextStyling()} hover:bg-black/10 dark:hover:bg-white/10`}
                      aria-label={`Match notifications${activeTournamentUnreadCount > 0 ? `, ${activeTournamentUnreadCount} unread` : ''}`}
                    >
                      <Swords className="h-5 w-5" />
                      {activeTournamentUnreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-warning-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold">
                          {activeTournamentUnreadCount > 9 ? '9+' : activeTournamentUnreadCount}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setShowNotifications(true)}
                    className={`relative p-2 rounded-full transition-colors ${getTextStyling()} hover:bg-black/10 dark:hover:bg-white/10`}
                    aria-label={`Notifications${totalUnreadItems > 0 ? `, ${totalUnreadItems} unread` : ''}`}
                  >
                    <Bell className="h-5 w-5" />
                    {totalUnreadItems > 0 && (
                      <span className="absolute top-0 right-0 bg-primary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold">
                        {totalUnreadItems > 9 ? '9+' : totalUnreadItems}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={openGamingStatsModal}
                    className={`p-2 rounded-full transition-colors ${getTextStyling()} hover:bg-black/10 dark:hover:bg-white/10`}
                    aria-label="Gaming stats"
                  >
                    <Award className="h-5 w-5" />
                  </button>

                  <ThemeToggle className={`${getTextStyling()} p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10`} />

                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${getTextStyling()} hover:bg-black/10 dark:hover:bg-white/10`}
                  >
                    {user.avatar_url ? (
                      <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-primary-500/50">
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-500" />
                      </div>
                    )}
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.username}</span>
                  </Link>

                  <button
                    onClick={logout}
                    className={`p-2 rounded-full transition-colors ${getTextStyling()} hover:bg-error-500/10 hover:text-error-500`}
                    aria-label={t('header.logOut')}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <ThemeToggle className={`${getTextStyling()} p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10`} />
                  <LoginButton
                    label={t('header.login')}
                    variant={isHomePage && !isScrolled ? 'transparent' : 'default'}
                  />
                </>
              )}
            </div>

            <div className="flex md:hidden items-center gap-2">
              {user && (
                <button
                  onClick={() => setShowNotifications(true)}
                  className={`relative p-2 rounded-full transition-colors ${getTextStyling()} hover:bg-black/10 dark:hover:bg-white/10`}
                  aria-label={`Notifications${totalUnreadItems > 0 ? `, ${totalUnreadItems} unread` : ''}`}
                >
                  <Bell className="h-5 w-5" />
                  {totalUnreadItems > 0 && (
                    <span className="absolute top-0 right-0 bg-primary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold">
                      {totalUnreadItems > 9 ? '9+' : totalUnreadItems}
                    </span>
                  )}
                </button>
              )}
              <ThemeToggle className={`${getTextStyling()} p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10`} />
            </div>
          </div>
        </div>
      </header>

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

      <Dock items={dockItems} />
    </>
  );
};

export default Header;
