import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, Bell, UserPlus, CheckCircle, XCircle, Award, Target, Trophy, Heart, Video } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  related_id?: string;
  created_at: string;
}

interface LiveNotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const LiveNotification: React.FC<LiveNotificationProps> = ({ notification, onClose }) => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Animate in
    setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose(notification.id);
      }, 300); // Wait for animation to complete
    }, 8000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'team_application':
        return <UserPlus className="h-5 w-5 text-info-400" aria-hidden="true" />;
      case 'team_accepted':
        return <CheckCircle className="h-5 w-5 text-success-400" aria-hidden="true" />;
      case 'team_rejected':
        return <XCircle className="h-5 w-5 text-error-400" aria-hidden="true" />;
      case 'team_member_joined':
        return <Users className="h-5 w-5 text-primary-400" aria-hidden="true" />;
      case 'bracket_advance':
        return <Award className="h-5 w-5 text-success-400" aria-hidden="true" />;
      case 'bracket_eliminated':
        return <Target className="h-5 w-5 text-error-400" aria-hidden="true" />;
      case 'tournament_update':
      case 'tournament_status':
        return <Trophy className="h-5 w-5 text-primary-400" aria-hidden="true" />;
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-info-400" aria-hidden="true" />;
      case 'friend_accepted':
        return <Heart className="h-5 w-5 text-success-400" aria-hidden="true" />;
      case 'tournament_join_now':
        return <Video className="h-5 w-5 text-red-500" aria-hidden="true" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" aria-hidden="true" />;
      case 'registration_cancelled':
        return <XCircle className="h-5 w-5 text-error-400" aria-hidden="true" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const currentLanguage = i18n.language || 'en';
      const locale = currentLanguage.startsWith('fr') ? fr : enUS;
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale
      });
    } catch (error) {
      return t('notifications.justNow');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Wait for animation to complete
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Close the notification
    setIsVisible(false);

    // Extract the base URL and add the tab parameter for specific notifications
    if (notification.link) {
      let targetUrl = notification.link;

      // For team application notifications, ensure we navigate to the LFP tab
      if (notification.type === 'team_application') {
        // Check if the URL already has query parameters
        if (targetUrl.includes('?')) {
          // Add tab=lfp to existing parameters
          targetUrl = `${targetUrl}&tab=lfp`;
        } else {
          // Add tab=lfp as the first parameter
          targetUrl = `${targetUrl}?tab=lfp`;
        }
      }

      // For bracket notifications, ensure we navigate to the bracket tab
      if (notification.type === 'bracket_advance' || notification.type === 'bracket_eliminated') {
        // Check if the URL already has query parameters
        if (targetUrl.includes('?')) {
          // Add tab=bracket to existing parameters
          targetUrl = `${targetUrl}&tab=bracket`;
        } else {
          // Add tab=bracket as the first parameter
          targetUrl = `${targetUrl}?tab=bracket`;
        }
      }

      // For friend request notifications, ensure we navigate to the requests tab
      if (notification.type === 'friend_request') {
        // Check if the URL already has query parameters
        if (targetUrl.includes('?')) {
          // Add tab=requests to existing parameters
          targetUrl = `${targetUrl}&tab=requests`;
        } else {
          // Add tab=requests as the first parameter
          targetUrl = `${targetUrl}?tab=requests`;
        }
      }

      // Navigate after the animation completes
      setTimeout(() => {
        navigate(targetUrl);
        onClose(notification.id);
      }, 300);
    } else {
      // Just close if there's no link
      setTimeout(() => {
        onClose(notification.id);
      }, 300);
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm w-full bg-dark-100 rounded-lg shadow-lg border border-gray-800 transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
      role="alert"
      aria-live="polite"
      tabIndex={0}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-dark-200 flex items-center justify-center">
              {getNotificationIcon()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <h3 className="font-medium text-white">{notification.title}</h3>
              <button
                onClick={handleClose}
                className="text-gray-300 hover:text-white"
                aria-label={t('notifications.close')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-gray-200 mt-1">{notification.message}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-300">
                {formatTimeAgo(notification.created_at)}
              </span>
              {notification.link && (
                <button
                  onClick={handleLinkClick}
                  className="text-primary-400 hover:text-primary-300 text-xs"
                  aria-label={`${notification.type === 'friend_request' ? t('notifications.viewRequest') :
                   notification.type === 'friend_accepted' ? t('notifications.viewFriends') :
                   t('notifications.viewDetails')} pour ${notification.title}`}
                >
                  {notification.type === 'friend_request' ? t('notifications.viewRequest') :
                   notification.type === 'friend_accepted' ? t('notifications.viewFriends') :
                   t('notifications.viewDetails')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveNotification;
