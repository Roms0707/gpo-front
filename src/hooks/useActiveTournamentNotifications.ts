import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlayerMatchNotification } from '../types';

interface TournamentWithNotification {
  tournament_id: string;
  tournament_title: string;
  tournament_start_date: string;
  tournament_end_date: string;
  has_bracket_ready: boolean;
  unread_notifications: number;
}

interface UseActiveTournamentNotificationsOptions {
  userId?: string;
  enabled?: boolean;
}

interface UseActiveTournamentNotificationsReturn {
  activeTournaments: TournamentWithNotification[];
  totalUnreadCount: number;
  hasActiveTournaments: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export const useActiveTournamentNotifications = (
  options: UseActiveTournamentNotificationsOptions = {}
): UseActiveTournamentNotificationsReturn => {
  const { userId, enabled = true } = options;
  const [activeTournaments, setActiveTournaments] = useState<TournamentWithNotification[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveTournamentNotifications = async () => {
    if (!userId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select(`
          tournament_id,
          tournaments:tournament_id (
            id,
            title,
            start_date,
            end_date,
            status
          )
        `)
        .eq('user_id', userId)
        .in('status', ['approved', 'validated']);

      if (regError) {
        console.error('[useActiveTournamentNotifications] Error fetching registrations:', regError);
        return;
      }

      if (!registrations || registrations.length === 0) {
        setActiveTournaments([]);
        setTotalUnreadCount(0);
        setIsLoading(false);
        return;
      }

      const tournamentIds = registrations
        .map(reg => reg.tournament_id)
        .filter((id): id is string => id !== null);

      if (tournamentIds.length === 0) {
        setActiveTournaments([]);
        setTotalUnreadCount(0);
        setIsLoading(false);
        return;
      }

      const { data: notifications, error: notifError } = await supabase
        .from('player_match_notifications')
        .select('*')
        .eq('user_id', userId)
        .in('tournament_id', tournamentIds);

      if (notifError) {
        console.error('[useActiveTournamentNotifications] Error fetching notifications:', notifError);
        return;
      }

      const now = new Date();
      const activeTournamentsData: TournamentWithNotification[] = [];
      let totalUnread = 0;

      for (const reg of registrations) {
        const tournament = reg.tournaments;
        if (!tournament) continue;

        const startDate = new Date(tournament.start_date);
        const endDate = new Date(tournament.end_date);

        const tournamentNotifications = (notifications || []).filter(
          n => n.tournament_id === reg.tournament_id
        );

        const hasBracketReady = tournamentNotifications.some(
          n => n.notification_type === 'bracket_ready'
        );

        const timeUntilStart = startDate.getTime() - now.getTime();
        const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);

        const isUpcomingSoon = hoursUntilStart > 0 && hoursUntilStart <= 24;
        const isOngoing = now >= startDate && now <= endDate;
        const isActive = (isUpcomingSoon || isOngoing) && hasBracketReady;

        if (isActive) {
          const unreadNotifications = tournamentNotifications.filter(n => !n.is_read).length;

          activeTournamentsData.push({
            tournament_id: reg.tournament_id,
            tournament_title: tournament.title,
            tournament_start_date: tournament.start_date,
            tournament_end_date: tournament.end_date,
            has_bracket_ready: hasBracketReady,
            unread_notifications: unreadNotifications
          });

          totalUnread += unreadNotifications;
        }
      }

      setActiveTournaments(activeTournamentsData);
      setTotalUnreadCount(totalUnread);
    } catch (error) {
      console.error('[useActiveTournamentNotifications] Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || !enabled) return;

    fetchActiveTournamentNotifications();

    const notificationSubscription = supabase
      .channel(`active-tournament-notifications-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_match_notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchActiveTournamentNotifications();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_registrations',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchActiveTournamentNotifications();
      })
      .subscribe();

    const refreshInterval = setInterval(() => {
      fetchActiveTournamentNotifications();
    }, 60000);

    return () => {
      supabase.removeChannel(notificationSubscription);
      clearInterval(refreshInterval);
    };
  }, [userId, enabled]);

  return {
    activeTournaments,
    totalUnreadCount,
    hasActiveTournaments: activeTournaments.length > 0,
    isLoading,
    refetch: fetchActiveTournamentNotifications
  };
};
