import React, { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

import { Menu, X, User, Bell, Video, MessageSquare, Award, TrendingUp, Swords } from 'lucide-react';
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

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    unreadCount: matchUnreadCount,
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
  
  // Check if we're on the home page
  const isHomePage = location.pathname === '/';
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Load notification count
  useEffect(() => {
    if (user?.id) {
      loadNotificationCount();
      loadUnreadMessageCount();
      
      // Set up real-time subscription for notifications
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
      
      // Set up real-time subscription for messages
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
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMatchNotificationClick = (notification: PlayerMatchNotification) => {
    setShowMatchNotificationPanel(false);
    setSelectedMatchNotification(notification);
  };

  const handleCloseMatchNotificationModal = () => {
    setSelectedMatchNotification(null);
  };

  // Calculate total unread items (notifications + messages)
  const totalUnreadItems = notificationCount + unreadMessageCount;
  
  // Get header styling based on page and scroll state
  const getHeaderStyling = () => {
    if (isHomePage) {
      // Home page: transparent when not scrolled, semi-transparent when scrolled
      return isScrolled 
        ? 'bg-white/98 dark:bg-dark-100/95 shadow-lg backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50' 
        : 'bg-transparent';
    } else {
      // Other pages: always use light mode styling
      return 'bg-white dark:bg-dark-100 shadow-lg';
    }
  };
  
  // Get container styling based on page
  const getContainerStyling = () => {
    if (isHomePage) {
      // Home page: transparent background with backdrop blur
      return isScrolled 
        ? 'bg-white/20 dark:bg-transparent backdrop-blur-sm' 
        : 'bg-white/10 dark:bg-dark-100/10 backdrop-blur-sm';
    } else {
      // Other pages: solid background
      return 'bg-transparent';
    }
  };
  
  // Get text styling based on page
  const getTextStyling = () => {
    if (isHomePage) {
      // Home page: white text when not scrolled, adaptive when scrolled
      return isScrolled ? 'text-gray-900 dark:text-white' : 'text-white';
    } else {
      // Other pages: adaptive text color
      return 'text-gray-900 dark:text-white';
    }
  };
  
  // Get navigation link styling based on page
  const getNavLinkStyling = () => {
    if (isHomePage) {
      // Home page: adaptive text based on scroll state
      return isScrolled 
        ? 'text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-300 transition-colors duration-200'
        : 'text-white hover:text-gray-300 transition-colors duration-200';
    } else {
      // Other pages: adaptive text color
      return 'text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-300 transition-colors duration-200';
    }
  };
  
  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${getHeaderStyling()}`}
    >
      <div className={`container mx-auto px-4 py-4 ${getContainerStyling()} rounded-lg mx-4 mt-2`}>
        <div className="flex items-center justify-between">
          <Link to="/" className={`flex items-center space-x-2 ${getTextStyling()}`} aria-label={`${brandName} Home`}>
            <DynamicLogo size="lg" />
          </Link>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={getNavLinkStyling()} aria-label={t('header.browseTournaments')}>
              {t('header.tournaments')}
            </Link>
            <Link to="/leaderboards" className={getNavLinkStyling()} aria-label={t('header.viewLeaderboards')}>
              {t('header.leaderboards')}
            </Link>
            <Link to="/communities" className={getNavLinkStyling()} aria-label={t('header.browseCommunities')}>
              {t('header.communities')}
            </Link>

            {/* Theme Toggle - Always visible */}
            <ThemeToggle className={`${getTextStyling()} hover:opacity-80`} />
            
            {/* Show loading state */}
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <div className="w-20 h-8 bg-dark-200 animate-pulse rounded-lg"></div>
                <div className="w-24 h-10 bg-dark-200 animate-pulse rounded-lg"></div>
              </div>
            ) : user ? (
              /* Logged in state */
              <>
                {/* Match Notifications Button - Only for gamers with active tournaments */}
                {user.type === 'gamer' && hasActiveTournaments && (
                  <button
                    onClick={() => setShowMatchNotificationPanel(!showMatchNotificationPanel)}
                    className={`relative p-2 ${getTextStyling()} hover:opacity-80 transition-colors`}
                    aria-label={`Notifications de match${activeTournamentUnreadCount > 0 ? `, ${activeTournamentUnreadCount} non lues` : ''}`}
                    aria-haspopup="dialog"
                  >
                    <Swords className="h-5 w-5" />
                    {activeTournamentUnreadCount > 0 && (
                      <span
                        className="absolute top-0 right-0 bg-warning-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        {activeTournamentUnreadCount > 9 ? '9+' : activeTournamentUnreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Notifications Button */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className={`relative p-2 ${getTextStyling()} hover:opacity-80 transition-colors`}
                  aria-label={`Notifications${totalUnreadItems > 0 ? `, ${totalUnreadItems} non lues` : ''}`}
                  aria-haspopup="dialog"
                >
                  <Bell className="h-5 w-5" />
                  {totalUnreadItems > 0 && (
                    <span
                      className="absolute top-0 right-0 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {totalUnreadItems > 9 ? '9+' : totalUnreadItems}
                    </span>
                  )}
                </button>
                
                {/* My Gaming Stats Button */}
                <button
                  onClick={openGamingStatsModal}
                  className={`relative p-2 ${getTextStyling()} hover:opacity-80 transition-colors`}
                  aria-label="Mes statistiques de jeu"
                  title="Mes statistiques de jeu"
                >
                    <Award className="h-4 w-4 mr-2" aria-hidden="true" />
                </button>
                
                <Link to="/profile" className={`${getTextStyling()} hover:opacity-80 transition-colors duration-200 flex items-center space-x-2`} aria-label="View Your Profile">
                  {user.avatar_url ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <User className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{user.username}</span>
                  
                </Link>
                
                {/* Theme Toggle */}
                
                <button
                  onClick={logout}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                  aria-label={t('header.logOut')}
                >
                  {t('header.logout')}
                </button>
              </>
            ) : (
              /* Not logged in state */
              <Link
                to="/login"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                aria-label={t('header.logIn')}
              >
                {t('header.login')}
              </Link>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className={`md:hidden ${getTextStyling()} hover:opacity-80 transition-colors`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className={`md:hidden mt-4 py-4 ${isHomePage ? 'bg-dark-100/90 backdrop-blur-md' : 'bg-white dark:bg-dark-100'} rounded-lg ${getTextStyling()}`}>
            <nav className="flex flex-col space-y-4 px-4">
              <Link to="/" className={`${getTextStyling()} hover:opacity-80 transition-colors duration-200 block py-2`} aria-label={t('header.browseTournaments')}>
                {t('header.tournaments')}
              </Link>
              <Link to="/leaderboards" className={`${getTextStyling()} hover:opacity-80 transition-colors duration-200 block py-2`} aria-label={t('header.viewLeaderboards')}>
                {t('header.leaderboards')}
              </Link>
              <Link to="/communities" className={`${getTextStyling()} hover:opacity-80 transition-colors duration-200 block py-2`} aria-label={t('header.browseCommunities')}>
                {t('header.communities')}
              </Link>

              {/* Mobile Theme Toggle */}
              <div className="py-2">
                <ThemeToggle className={`${getTextStyling()} hover:opacity-80`} />
              </div>
              
              {/* Mobile loading state */}
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-dark-200 animate-pulse rounded-lg"></div>
                  <div className="h-10 bg-dark-200 animate-pulse rounded-lg"></div>
                </div>
              ) : user ? (
                /* Mobile logged in state */
                <>
                  {/* Mobile Match Notifications Button - Only for gamers with active tournaments */}
                  {user.type === 'gamer' && hasActiveTournaments && (
                    <button
                      onClick={() => setShowMatchNotificationPanel(!showMatchNotificationPanel)}
                      className={`flex items-center justify-between py-2 ${getTextStyling()} hover:opacity-80 transition-colors`}
                      aria-label={`${t('header.matchNotifications')}${activeTournamentUnreadCount > 0 ? `, ${t('header.unreadNotifications', { count: activeTournamentUnreadCount })}` : ''}`}
                      aria-haspopup="dialog"
                    >
                      <span className="flex items-center">
                        <Swords className="h-4 w-4 mr-2" aria-hidden="true" />
                        {t('header.matchNotifications')}
                      </span>
                      {activeTournamentUnreadCount > 0 && (
                        <span
                          className="bg-warning-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          {activeTournamentUnreadCount > 9 ? '9+' : activeTournamentUnreadCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Mobile Notifications Button */}
                  <button
                    onClick={() => setShowNotifications(true)}
                    className={`flex items-center justify-between py-2 ${getTextStyling()} hover:opacity-80 transition-colors`}
                    aria-label={`${t('navigation.notifications')}${totalUnreadItems > 0 ? `, ${t('header.unreadNotifications', { count: totalUnreadItems })}` : ''}`}
                    aria-haspopup="dialog"
                  >
                    <span className="flex items-center">
                      <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
                      {t('navigation.notifications')}
                    </span>
                    {totalUnreadItems > 0 && (
                      <span 
                        className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        {totalUnreadItems > 9 ? '9+' : totalUnreadItems}
                      </span>
                    )}
                  </button>
                  
                  {/* Mobile My Gaming Stats Button */}
                  <button
                    onClick={openGamingStatsModal}
                    className={`flex items-center justify-between py-2 ${getTextStyling()} hover:opacity-80 transition-colors`}
                    aria-label={t('header.gamingStatsLabel')}
                  >
                    <span className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" aria-hidden="true" />
                      {t('header.gamingStatsLabel')}
                    </span>
                  </button>
                  
                  <Link to="/profile" className={`${getTextStyling()} hover:opacity-80 transition-colors duration-200 block py-2 flex items-center justify-between`} aria-label="View Your Profile">
                    <span className="flex items-center">
                      {user.avatar_url ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <User className="h-4 w-4 mr-2" aria-hidden="true" />
                      )}
                      {user.username}
                    </span>
                    
                  </Link>
                  
                  {/* Messages Link */}
                  <Link to="/profile/friends" className={`${getTextStyling()} hover:opacity-80 transition-colors duration-200 block py-2 flex items-center justify-between`} aria-label={`${t('header.messages')}${unreadMessageCount > 0 ? `, ${t('header.unreadMessages', { count: unreadMessageCount })}` : ''}`}>
                    <span className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                      {t('header.messages')}
                    </span>
                    {unreadMessageCount > 0 && (
                      <span 
                        className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                  
                  <button
                    onClick={logout}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg w-full text-left"
                    aria-label={t('header.logOut')}
                  >
                    {t('header.logout')}
                  </button>
                </>
              ) : (
                /* Mobile not logged in state */
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg block text-center"
                  aria-label={t('header.logIn')}
                >
                  {t('header.login')}
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
      
      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* My Gaming Stats Modal */}
      <MyGamingStatsModal
        isOpen={showGamingStatsModal}
        onClose={closeGamingStatsModal}
      />

      {/* Match Notification Panel - Only for gamers with active tournaments */}
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

      {/* Match Notification Modal */}
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