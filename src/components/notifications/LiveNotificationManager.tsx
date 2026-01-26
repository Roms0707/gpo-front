import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import LiveNotification from './LiveNotification';
import { useNavigate, useLocation } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  related_id?: string;
  created_at: string;
}

const LiveNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotification, setVisibleNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // All notification types that should trigger live notifications
  const LIVE_NOTIFICATION_TYPES = [
    'team_application',
    'team_accepted',
    'team_rejected',
    'team_member_joined',
    'bracket_advance',
    'bracket_eliminated',
    'friend_request',
    'friend_accepted',
    'tournament_join_now',
    'registration_cancelled'
  ];

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscription for live notifications
    const subscription = supabase
      .channel('live-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id} AND type=in.(${LIVE_NOTIFICATION_TYPES.map(t => `"${t}"`).join(',')})`
      }, (payload) => {
        const newNotification = payload.new as Notification;

        // Add to queue
        setNotifications(prev => [...prev, newNotification]);

        // Mark as read after a delay (user has seen it)
        setTimeout(async () => {
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', newNotification.id);
        }, 10000); // Mark as read after 10 seconds

        // Handle automatic navigation for specific notification types
        if (newNotification.link) {
          const currentPath = location.pathname;
          const notificationPath = newNotification.link.split('?')[0]; // Get path without query params

          if (currentPath === notificationPath) {
            // We're already on the right page, just add the appropriate tab parameter
            if (newNotification.type === 'team_application') {
              navigate(`${notificationPath}?tab=lfp`, { replace: true });
            } else if (newNotification.type === 'bracket_advance' || newNotification.type === 'bracket_eliminated') {
              navigate(`${notificationPath}?tab=bracket`, { replace: true });
            } else if (newNotification.type === 'friend_request') {
              navigate(`${notificationPath}?tab=requests`, { replace: true });
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, navigate, location.pathname]);

  // Process notification queue
  useEffect(() => {
    if (notifications.length > 0 && !visibleNotification) {
      // Show the next notification
      setVisibleNotification(notifications[0]);
      // Remove it from the queue
      setNotifications(prev => prev.slice(1));
    }
  }, [notifications, visibleNotification]);

  const handleCloseNotification = (id: string) => {
    setVisibleNotification(null);
  };

  if (!visibleNotification) return null;

  return (
    <LiveNotification
      notification={visibleNotification}
      onClose={handleCloseNotification}
    />
  );
};

export default LiveNotificationManager;
