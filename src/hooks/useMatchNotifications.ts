import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlayerMatchNotification } from '../types';

interface UseMatchNotificationsOptions {
  userId?: string;
  tournamentId?: string;
  enabled?: boolean;
}

interface UseMatchNotificationsReturn {
  notifications: PlayerMatchNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMatchNotifications = (
  options: UseMatchNotificationsOptions = {}
): UseMatchNotificationsReturn => {
  const { userId, tournamentId, enabled = true } = options;
  const [notifications, setNotifications] = useState<PlayerMatchNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!userId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      let query = supabase
        .from('player_match_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching match notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching match notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || !enabled) return;

    fetchNotifications();

    const channelName = tournamentId
      ? `match-notifications-${userId}-${tournamentId}`
      : `match-notifications-${userId}`;

    let query = `user_id=eq.${userId}`;
    if (tournamentId) {
      query += ` AND tournament_id=eq.${tournamentId}`;
    }

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'player_match_notifications',
        filter: query
      }, (payload) => {
        const newNotification = payload.new as PlayerMatchNotification;
        setNotifications(prev => [newNotification, ...prev]);
        if (!newNotification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'player_match_notifications',
        filter: query
      }, (payload) => {
        const updatedNotification = payload.new as PlayerMatchNotification;
        setNotifications(prev =>
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, tournamentId, enabled]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('player_match_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('player_match_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
