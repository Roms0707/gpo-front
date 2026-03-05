import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Swords, Trophy, Award, User, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { PlayerMatchNotification } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS, es } from 'date-fns/locale';

interface MatchNotificationPanelProps {
  notifications: PlayerMatchNotification[];
  unreadCount: number;
  onNotificationClick: (notification: PlayerMatchNotification) => void;
  onMarkAllAsRead: () => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

const MatchNotificationPanel: React.FC<MatchNotificationPanelProps> = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
  isOpen,
  onClose
}) => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: string, matchResult?: string) => {
    switch (type) {
      case 'match_starting':
        return <Swords className="h-5 w-5 text-warning-400" />;
      case 'match_result':
        return matchResult === 'won'
          ? <Trophy className="h-5 w-5 text-success-400" />
          : <XCircle className="h-5 w-5 text-error-400" />;
      case 'next_opponent':
        return <Award className="h-5 w-5 text-info-400" />;
      default:
        return <User className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const currentLanguage = i18n.language || 'en';
      const locale = currentLanguage.startsWith('fr') ? fr : currentLanguage.startsWith('es') ? es : enUS;
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale
      });
    } catch (error) {
      return t('notifications.justNow');
    }
  };

  const getNotificationTitle = (notification: PlayerMatchNotification) => {
    switch (notification.notification_type) {
      case 'match_starting':
        return t('notifications.matchInProgress');
      case 'match_result':
        return notification.match_result === 'won'
          ? t('notifications.victory')
          : notification.match_result === 'lost'
          ? t('notifications.defeat')
          : t('notifications.draw');
      case 'next_opponent':
        return t('notifications.nextOpponent');
      default:
        return t('notifications.notification');
    }
  };

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className={`absolute top-16 right-4 w-96 bg-white dark:bg-dark-100 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 transform transition-all duration-300 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('notifications.matchNotificationPanel')}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
              {t('notifications.matchNotifications')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label={t('notifications.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {unreadCount} {unreadCount > 1 ? t('notifications.unreadNotifications') : t('notifications.unreadNotification')}
              </span>
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-primary-500 hover:text-primary-400"
              >
                {t('notifications.markAllAsRead')}
              </button>
            </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Swords className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300">
                {t('notifications.noMatchNotifications')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onNotificationClick(notification)}
                  className={`w-full p-4 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors text-left ${
                    !notification.is_read ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-dark-200 flex items-center justify-center">
                        {getNotificationIcon(notification.notification_type, notification.match_result || undefined)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {getNotificationTitle(notification)}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                        )}
                      </div>
                      {notification.metadata?.tournament_title && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {notification.metadata.tournament_title}
                        </p>
                      )}
                      {notification.metadata?.opponent_username && (
                        <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                          {t('notifications.vs')} {notification.metadata.opponent_username}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchNotificationPanel;
