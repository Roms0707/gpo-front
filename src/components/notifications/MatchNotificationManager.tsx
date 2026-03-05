import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMatchNotifications } from '../../hooks/useMatchNotifications';
import { PlayerMatchNotification } from '../../types';
import { supabase } from '../../lib/supabase';
import MatchNotificationModal from './MatchNotificationModal';
import BracketReadyModal from './BracketReadyModal';

const MatchNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const [notificationQueue, setNotificationQueue] = useState<PlayerMatchNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<PlayerMatchNotification | null>(null);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const finishedTournamentIds = useRef<Set<string>>(new Set());

  const { notifications, markAsRead } = useMatchNotifications({
    userId: user?.id,
    enabled: user?.type === 'gamer'
  });

  const checkTournamentStatuses = useCallback(async (tournamentIds: string[]): Promise<Set<string>> => {
    const uncheckedIds = tournamentIds.filter(id => !finishedTournamentIds.current.has(id));
    if (uncheckedIds.length === 0) return finishedTournamentIds.current;

    const { data } = await supabase
      .from('tournaments')
      .select('id, status')
      .in('id', uncheckedIds);

    if (data) {
      for (const t of data) {
        if (t.status === 'past') {
          finishedTournamentIds.current.add(t.id);
        }
      }
    }

    return finishedTournamentIds.current;
  }, []);

  useEffect(() => {
    if (user?.type !== 'gamer') return;

    const newNotifications = notifications.filter(
      n => !n.is_read &&
           !processedIds.has(n.id) &&
           (n.notification_type === 'match_starting' || n.notification_type === 'bracket_ready')
    );

    if (newNotifications.length === 0) return;

    const tournamentIds = [...new Set(newNotifications.map(n => n.tournament_id))];

    checkTournamentStatuses(tournamentIds).then(finishedIds => {
      const staleNotifications = newNotifications.filter(n => finishedIds.has(n.tournament_id));
      for (const n of staleNotifications) {
        markAsRead(n.id);
      }

      const activeNotifications = newNotifications.filter(n => !finishedIds.has(n.tournament_id));

      const sortedNotifications = [...activeNotifications].sort((a, b) => {
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
    });
  }, [notifications, processedIds, user?.type, checkTournamentStatuses, markAsRead]);

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
