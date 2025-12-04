import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMatchNotifications } from '../../hooks/useMatchNotifications';
import { PlayerMatchNotification } from '../../types';
import MatchNotificationModal from './MatchNotificationModal';
import BracketReadyModal from './BracketReadyModal';

const MatchNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const [notificationQueue, setNotificationQueue] = useState<PlayerMatchNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<PlayerMatchNotification | null>(null);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const { notifications, markAsRead } = useMatchNotifications({
    userId: user?.id,
    enabled: user?.type === 'gamer'
  });

  useEffect(() => {
    if (user?.type !== 'gamer') return;

    const newNotifications = notifications.filter(
      n => !n.is_read &&
           !processedIds.has(n.id) &&
           (n.notification_type === 'match_starting' || n.notification_type === 'bracket_ready')
    );

    const sortedNotifications = [...newNotifications].sort((a, b) => {
      const priorityOrder = { bracket_ready: 0, match_starting: 1, match_result: 2, next_opponent: 3 };
      const priorityA = priorityOrder[a.notification_type] ?? 4;
      const priorityB = priorityOrder[b.notification_type] ?? 4;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    if (sortedNotifications.length > 0) {
      setNotificationQueue(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const toAdd = sortedNotifications.filter(n => !existingIds.has(n.id));
        return [...prev, ...toAdd];
      });
    }
  }, [notifications, processedIds, user?.type]);

  useEffect(() => {
    if (notificationQueue.length > 0 && !currentNotification) {
      const [next, ...rest] = notificationQueue;
      setCurrentNotification(next);
      setNotificationQueue(rest);
      setProcessedIds(prev => new Set([...prev, next.id]));
    }
  }, [notificationQueue, currentNotification]);

  const handleCloseNotification = () => {
    setCurrentNotification(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  if (!user || user.type !== 'gamer' || !currentNotification) {
    return null;
  }

  if (currentNotification.notification_type === 'bracket_ready') {
    return (
      <BracketReadyModal
        notification={currentNotification}
        onClose={handleCloseNotification}
        onMarkAsRead={handleMarkAsRead}
      />
    );
  }

  return (
    <MatchNotificationModal
      notification={currentNotification}
      onClose={handleCloseNotification}
      onMarkAsRead={handleMarkAsRead}
    />
  );
};

export default MatchNotificationManager;
