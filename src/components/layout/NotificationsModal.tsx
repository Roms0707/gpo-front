import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Bell, CheckCircle, XCircle, Clock, Trophy, Users, Calendar, Info, User, Video, Target, Award, UserPlus, Heart, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import ChatModal from '../chat/ChatModal';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string;
  related_id?: string;
  start_date?: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{id: string, name: string, avatar?: string}>({id: '', name: ''});
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications();
      loadUnreadMessages();
      
      // Set up real-time subscription for notifications
      const subscription = supabase
        .channel('notifications-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadNotifications();
        })
        .subscribe();
      
      // Set up real-time subscription for messages
      const messagesSubscription = supabase
        .channel('messages-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          loadUnreadMessages();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          loadUnreadMessages();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(subscription);
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [isOpen, user?.id, activeTab]);
  
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (activeTab === 'unread') {
        query = query.eq('read', false);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadUnreadMessages = async () => {
    if (!user?.id) return;
    
    try {
      // Get unread messages grouped by sender
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          read,
          sender:sender_id(id, username, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading unread messages:', error);
        return;
      }
      
      // Group messages by sender
      const messagesBySender = (data || []).reduce((acc: any, message: any) => {
        const senderId = message.sender_id;
        if (!acc[senderId]) {
          acc[senderId] = {
            sender: message.sender,
            messages: [],
            count: 0,
            latest: null
          };
        }
        
        acc[senderId].messages.push(message);
        acc[senderId].count += 1;
        
        // Track the latest message
        if (!acc[senderId].latest || new Date(message.created_at) > new Date(acc[senderId].latest.created_at)) {
          acc[senderId].latest = message;
        }
        
        return acc;
      }, {});
      
      // Convert to array
      const unreadMessagesArray = Object.values(messagesBySender);
      setUnreadMessages(unreadMessagesArray);
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Also mark all messages as read
      await markAllMessagesAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const markAllMessagesAsRead = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking all messages as read:', error);
        return;
      }
      
      // Update local state
      setUnreadMessages([]);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };
  
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  const deleteAllNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setIsDeletingAll(true);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting all notifications:', error);
        toast.error(t('notifications.errorDeletingNotifications'));
        return;
      }
      
      // Update local state
      setNotifications([]);
      toast.success(t('notifications.allNotificationsDeleted'));
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Erreur lors de la suppression des notifications');
    } finally {
      setIsDeletingAll(false);
    }
  };
  
  const markMessagesAsRead = async (senderId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }
      
      // Update local state
      setUnreadMessages(prev => 
        prev.filter(item => item.sender.id !== senderId)
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  const openChat = (senderId: string, senderName: string, senderAvatar?: string) => {
    setSelectedChat({
      id: senderId,
      name: senderName,
      avatar: senderAvatar
    });
    setShowChatModal(true);
    markMessagesAsRead(senderId);
    onClose();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tournament_status':
      case 'tournament_update':
        return <Trophy className="h-5 w-5 text-primary-500" aria-hidden="true" />;
      case 'team_application':
        return <Users className="h-5 w-5 text-info-400" aria-hidden="true" />;
      case 'tournament_start':
        return <Calendar className="h-5 w-5 text-warning-400" aria-hidden="true" />;
      case 'team_accepted':
        return <CheckCircle className="h-5 w-5 text-success-400" aria-hidden="true" />;
      case 'team_rejected':
        return <XCircle className="h-5 w-5 text-error-400" aria-hidden="true" />;
      case 'tournament_live':
        return <Video className="h-5 w-5 text-red-500" aria-hidden="true" />;
      case 'bracket_advance':
        return <Award className="h-5 w-5 text-success-400" aria-hidden="true" />;
      case 'bracket_eliminated':
        return <Target className="h-5 w-5 text-error-400" aria-hidden="true" />;
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-info-400" aria-hidden="true" />;
      case 'friend_accepted':
        return <Heart className="h-5 w-5 text-success-400" aria-hidden="true" />;
      case 'tournament_join_now':
        return <Video className="h-5 w-5 text-red-500" aria-hidden="true" />;
      case 'new_message':
        return <MessageSquare className="h-5 w-5 text-primary-500" aria-hidden="true" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" aria-hidden="true" />;
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: fr
      });
    } catch (error) {
      return t('notifications.unknownDate');
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalUnreadItems = unreadCount + unreadMessages.length;
  
  // Add/remove modal-open class to body
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 md:pt-24 px-4">
        <div className="fixed inset-0 bg-black/75 z-49" onClick={onClose}></div>
        
        <div 
          className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-800 relative z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notifications-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <Bell className="text-primary-500 h-5 w-5 mr-2" aria-hidden="true" />
              <h2 id="notifications-title" className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                {t('notifications.title')}
              </h2>
              {totalUnreadItems > 0 && (
                <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalUnreadItems}
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-800" role="tablist">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'all' 
                  ? 'text-primary-400 border-b-2 border-primary-500' 
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200'
              }`}
              role="tab"
              aria-selected={activeTab === 'all'}
              aria-controls="all-notifications"
              id="all-tab"
            >
              {t('notifications.all')}
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'unread' 
                  ? 'text-primary-400 border-b-2 border-primary-500' 
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200'
              }`}
              role="tab"
              aria-selected={activeTab === 'unread'}
              aria-controls="unread-notifications"
              id="unread-tab"
            >
              {t('notifications.unread')} {totalUnreadItems > 0 && `(${totalUnreadItems})`}
            </button>
            
            {totalUnreadItems > 0 && (
              <button
                onClick={markAllAsRead}
                className="py-3 px-4 text-sm text-primary-400 hover:text-primary-300"
                aria-label={t('notifications.markAllAsRead')}
              >
                {t('notifications.markAllAsRead')}
              </button>
            )}
            
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                disabled={isDeletingAll}
                className="py-3 px-4 text-sm text-error-400 hover:text-error-300 disabled:text-error-600 disabled:cursor-not-allowed"
                aria-label={t('notifications.deleteAll')}
              >
                {isDeletingAll ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span>
                    {t('notifications.deleting')}
                  </>
                ) : (
                  t('notifications.deleteAll')
                )}
              </button>
            )}
          </div>
          
          {/* Notifications List */}
          <div 
            className="overflow-y-auto max-h-[calc(80vh-120px)]"
            tabIndex={0}
            role="tabpanel"
            id={activeTab === 'all' ? 'all-notifications' : 'unread-notifications'}
            aria-labelledby={activeTab === 'all' ? 'all-tab' : 'unread-tab'}
          >
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                <span className="ml-3 text-gray-300">{t('notifications.loadingNotifications')}</span>
              </div>
            ) : (
              <>
                {/* Unread Messages Section */}
                {unreadMessages.length > 0 && (
                  <div className="p-3 bg-primary-100 dark:bg-primary-600/20 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" aria-hidden="true" />
                      {t('notifications.unreadMessages')}
                    </h3>
                    <div className="space-y-2">
                      {unreadMessages.map((item: any) => (
                        <div 
                          key={item.sender.id}
                          className="bg-white dark:bg-dark-200 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors cursor-pointer border border-gray-200 dark:border-transparent"
                          onClick={() => openChat(item.sender.id, item.sender.username, item.sender.avatar_url)}
                          tabIndex={0}
                          role="button"
                          aria-label={t('notifications.unreadMessagesFrom', { count: item.count, username: item.sender.username })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openChat(item.sender.id, item.sender.username, item.sender.avatar_url);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
                              {item.sender.avatar_url ? (
                                <img 
                                  src={item.sender.avatar_url} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                  aria-hidden="true"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                  <User className="h-5 w-5" aria-hidden="true" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium text-gray-900 dark:text-white">{item.sender.username}</h4>
                                <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                                  {item.count}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                                {item.latest.content}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {formatTimeAgo(item.latest.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Regular Notifications */}
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-dark-200/50 transition-colors ${!notification.read ? 'bg-gray-100 dark:bg-dark-200/30' : ''}`}
                      >
                        <div className="flex">
                          <div className="flex-shrink-0 mr-4">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-gray-900 dark:text-white">{notification.title}</h3>
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                              {notification.message}
                            </p>
                            
                            {notification.link && (
                              <Link 
                                to={notification.link} 
                                className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block"
                                onClick={() => markAsRead(notification.id)}
                                aria-label={`${notification.type === 'friend_request' ? t('notifications.viewRequest') :
                                notification.type === 'friend_accepted' ? t('notifications.viewMyFriends') :
                                notification.type === 'new_message' ? t('notifications.reply') :
                                t('notifications.viewDetails')} pour ${notification.title}`}
                              >
                                {notification.type === 'friend_request' ? t('notifications.viewRequest') :
                                notification.type === 'friend_accepted' ? t('notifications.viewMyFriends') :
                                notification.type === 'tournament_join_now' ? t('notifications.joinNow') :
                                notification.type === 'new_message' ? t('notifications.reply') :
                                t('notifications.viewDetails')}
                              </Link>
                            )}
                            
                            <div className="flex justify-end mt-2 space-x-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-300 dark:hover:bg-dark-400 transition-colors"
                                  aria-label={t('notifications.markAsRead')}
                                >
                                  {t('notifications.markAsRead')}
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-300 dark:hover:bg-dark-400 transition-colors"
                                aria-label={t('notifications.delete')}
                              >
                                {t('notifications.delete')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : unreadMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-gray-600 dark:text-gray-300">
                      {activeTab === 'all'
                        ? t('notifications.noNotifications')
                        : t('notifications.noUnreadNotifications')}
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Modal */}
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          recipientId={selectedChat.id}
          recipientName={selectedChat.name}
          recipientAvatar={selectedChat.avatar}
        />
      )}
    </>
  );
};

export default NotificationsModal;