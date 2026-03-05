import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Search, MessageSquare, Clock, CheckCircle, X, Plus, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserChannels, getPublicChannels, joinChannel, getChannelInvitations, acceptChannelInvitation, rejectChannelInvitation } from '../../services/channelService';
import { supabase } from '../../lib/supabase';
import { fetchFriends } from '../../services/api';
import { UserRelationship } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS, es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ChatModal from './ChatModal';
import ChannelModal from './ChannelModal';
import CreateChannelModal from './CreateChannelModal';

interface ChatListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSelectForShare?: (
    contactType: 'user' | 'channel',
    contactId: string,
    contactName: string,
    contactAvatarOrDescription?: string | null
  ) => void;
  shareTargetType?: 'friend' | 'community';
}

interface ChatPreview {
  userId: string;
  username: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  is_private: boolean;
  created_by: string;
  role?: string;
  unread_count?: number;
}

const ChatListModal: React.FC<ChatListModalProps> = ({
  isOpen,
  onClose,
  initialMessageContent,
  onContactSelectForShare,
  shareTargetType = 'friend'
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [friends, setFriends] = useState<UserRelationship[]>([]);
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([]);
  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [channelInvitations, setChannelInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<{id: string, name: string, avatar?: string | null} | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<{id: string, name: string, description?: string} | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'friends' | 'channels' | 'invitations'>('recent');
  const [isJoiningChannel, setIsJoiningChannel] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadFriends();
      loadRecentChats();
      loadUserChannels();
      loadChannelInvitations();
      if (activeTab === 'channels') {
        loadPublicChannels();
      }

      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('chat-updates')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          loadRecentChats();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          loadRecentChats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [isOpen, user?.id]);

  const loadFriends = async () => {
    if (!user?.id) return;

    try {
      const data = await fetchFriends(user.id);
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadRecentChats = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get the most recent message with each user
      const { data, error } = await supabase.rpc('execute_sql', {
        query: `
          WITH ranked_messages AS (
            SELECT
              m.*,
              ROW_NUMBER() OVER (
                PARTITION BY
                  CASE
                    WHEN m.sender_id = '${user.id}' THEN m.receiver_id
                    ELSE m.sender_id
                  END
                ORDER BY m.created_at DESC
              ) as rn
            FROM messages m
            WHERE m.sender_id = '${user.id}' OR m.receiver_id = '${user.id}'
          ),
          latest_messages AS (
            SELECT * FROM ranked_messages WHERE rn = 1
          ),
          unread_counts AS (
            SELECT
              sender_id,
              COUNT(*) as unread_count
            FROM messages
            WHERE receiver_id = '${user.id}' AND read = false
            GROUP BY sender_id
          )
          SELECT
            lm.*,
            COALESCE(uc.unread_count, 0) as unread_count,
            u.username,
            u.avatar_url
          FROM latest_messages lm
          LEFT JOIN unread_counts uc ON
            CASE
              WHEN lm.sender_id = '${user.id}' THEN lm.receiver_id
              ELSE lm.sender_id
            END = uc.sender_id
          LEFT JOIN users u ON
            CASE
              WHEN lm.sender_id = '${user.id}' THEN lm.receiver_id
              ELSE lm.sender_id
            END = u.id
          ORDER BY lm.created_at DESC
          LIMIT 20
        `
      });

      if (error) {
        console.error('Error loading recent chats:', error);
        return;
      }

      // Transform the data
      const chatPreviews: ChatPreview[] = (data || []).map((message: any) => {
        const isCurrentUser = message.sender_id === user.id;
        const otherUserId = isCurrentUser ? message.receiver_id : message.sender_id;

        return {
          userId: otherUserId,
          username: message.username || t('chat.unknownUser'),
          avatarUrl: message.avatar_url,
          lastMessage: message.content,
          lastMessageTime: message.created_at,
          unreadCount: parseInt(message.unread_count) || 0
        };
      });

      setRecentChats(chatPreviews);
    } catch (error) {
      console.error('Error loading recent chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserChannels = async () => {
    if (!user?.id) return;

    try {
      const channels = await getUserChannels();
      setUserChannels(channels.map(channel => ({
        id: channel.channel_id,
        name: channel.channels.name,
        description: channel.channels.description,
        created_at: channel.channels.created_at,
        is_private: channel.channels.is_private,
        created_by: channel.channels.created_by,
        role: channel.role,
        unread_count: 0 // TODO: Implement unread count for channels
      })));
    } catch (error) {
      console.error('Error loading user channels:', error);
    }
  };

  const loadChannelInvitations = async () => {
    if (!user?.id) return;

    try {
      const invitations = await getChannelInvitations();
      setChannelInvitations(invitations);
    } catch (error) {
      console.error('Error loading channel invitations:', error);
    }
  };

  const handleAcceptInvitation = async (membershipId: string) => {
    try {
      const result = await acceptChannelInvitation(membershipId);

      if (result.success) {
        toast.success(t('chat.invitationAccepted'));

        // Refresh invitations and channels
        await loadChannelInvitations();
        await loadUserChannels();
      } else {
        toast.error(result.message || t('chat.invitationAcceptError'));
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(t('chat.invitationAcceptError'));
    }
  };

  const handleRejectInvitation = async (membershipId: string) => {
    try {
      const result = await rejectChannelInvitation(membershipId);

      if (result.success) {
        toast.success(t('chat.invitationRejected'));

        // Refresh invitations
        await loadChannelInvitations();
      } else {
        toast.error(result.message || t('chat.invitationRejectError'));
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error(t('chat.invitationRejectError'));
    }
  };

  const loadPublicChannels = async () => {
    try {
      const channels = await getPublicChannels();

      // Filter out channels the user is already a member of
      const userChannelIds = userChannels.map(c => c.id);
      const filteredChannels = channels.filter(c => !userChannelIds.includes(c.id));

      setPublicChannels(filteredChannels);
    } catch (error) {
      console.error('Error loading public channels:', error);
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    if (!user) {
      console.error(t('chat.mustBeLoggedIn'));
      return;
    }

    try {
      setIsJoiningChannel(true);

      const result = await joinChannel(channelId);

      if (result.success) {
        console.log(result.message);

        // Refresh channels lists
        await loadUserChannels();
        await loadPublicChannels();
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error('Error joining channel:', error);
      toast.error(t('chat.joinChannelError'));
    } finally {
      setIsJoiningChannel(false);
    }
  };

  const openChat = (userId: string, username: string, avatarUrl?: string | null) => {
    // If this is for sharing stats, use the callback instead of opening chat directly
    if (onContactSelectForShare) {
      onContactSelectForShare('user', userId, username, avatarUrl);
      return;
    }

    setSelectedChat({
      id: userId,
      name: username,
      avatar: avatarUrl
    });
    setShowChatModal(true);
  };

  const openChannel = (channelId: string, channelName: string, channelDescription?: string) => {
    // If this is for sharing stats, use the callback instead of opening channel directly
    if (onContactSelectForShare) {
      onContactSelectForShare('channel', channelId, channelName, channelDescription);
      return;
    }

    setSelectedChannel({
      id: channelId,
      name: channelName,
      description: channelDescription
    });
    setShowChannelModal(true);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const dateFnsLocale = i18n.language.startsWith('fr') ? fr : i18n.language.startsWith('es') ? es : enUS;
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: dateFnsLocale
      });
    } catch (error) {
      return t('chat.unknownDate');
    }
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.related_user?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter recent chats based on search query
  const filteredRecentChats = recentChats.filter(chat =>
    chat.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter channels based on search query
  const filteredUserChannels = userChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPublicChannels = publicChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total unread messages
  const totalUnreadMessages = recentChats.reduce((total, chat) => total + chat.unreadCount, 0);
  const totalInvitations = channelInvitations.length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed bottom-24 right-6 z-40 w-80 bg-white dark:bg-dark-100 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 chat-list-modal">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-heading font-semibold text-lg flex items-center text-gray-900 dark:text-white">
            <MessageSquare className="h-5 w-5 text-primary-500 mr-2" />
            {t('chat.messages')}
            {totalUnreadMessages > 0 && (
              <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                {totalUnreadMessages}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('chat.searchPlaceholder')}
              className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search contacts"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'recent'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            aria-selected={activeTab === 'recent'}
            role="tab"
            aria-controls="recent-chats-panel"
            id="recent-tab"
          >
            <Clock className="h-4 w-4 inline mr-2" />
            {shareTargetType === 'community' ? t('chat.myChannels') : t('chat.recent')}
            {totalUnreadMessages > 0 && activeTab !== 'recent' && (
              <span className="ml-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {totalUnreadMessages}
              </span>
            )}
          </button>
          {shareTargetType === 'friend' && (
            <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'friends'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            aria-selected={activeTab === 'friends'}
            role="tab"
            aria-controls="friends-panel"
            id="friends-tab"
          >
            <User className="h-4 w-4 inline mr-2" />
            {t('chat.friends')}
          </button>
          )}
          <button
            onClick={() => {
              setActiveTab('channels');
              loadPublicChannels();
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'channels'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            aria-selected={activeTab === 'channels'}
            role="tab"
            aria-controls="channels-panel"
            id="channels-tab"
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            {shareTargetType === 'community' ? t('chat.publicCommunities') : t('chat.channels')}
          </button>
          {shareTargetType === 'friend' && (
            <button
            onClick={() => {
              setActiveTab('invitations');
              loadChannelInvitations();
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'invitations'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            aria-selected={activeTab === 'invitations'}
            role="tab"
            aria-controls="invitations-panel"
            id="invitations-tab"
          >
            <Bell className="h-4 w-4 inline mr-2" />
            {t('chat.invitations')}
            {totalInvitations > 0 && activeTab !== 'invitations' && (
              <span className="ml-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {totalInvitations}
              </span>
            )}
          </button>
          )}
        </div>

        {/* Chat List */}
        <div
          className="overflow-y-auto max-h-96"
          tabIndex={0}
          role="tabpanel"
          id={activeTab === 'recent' ? 'recent-chats-panel' : 'friends-panel'}
          aria-labelledby={activeTab === 'recent' ? 'recent-tab' : 'friends-tab'}
        >
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : activeTab === 'recent' ? (
            // Recent Chats Tab
            shareTargetType === 'community' ? (
              // Show user channels when sharing to community
              filteredUserChannels.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {filteredUserChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className="p-3 hover:bg-dark-200 transition-colors cursor-pointer"
                      onClick={() => openChannel(channel.id, channel.name, channel.description)}
                      role="button"
                      aria-label={`Share to channel ${channel.name}`}
                      tabIndex={0}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center ${
                          channel.is_community
                            ? 'bg-indigo-600/20'
                            : channel.is_private
                              ? 'bg-gray-600/20'
                              : 'bg-primary-600/20'
                        }`}>
                          <MessageSquare className={`h-5 w-5 ${
                            channel.is_community
                              ? 'text-indigo-500'
                              : channel.is_private
                                ? 'text-gray-400'
                                : 'text-primary-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-300 flex items-center">
                            # {channel.name}
                            {channel.is_community && (
                              <span className="ml-1 text-xs bg-indigo-600/20 px-1 py-0.5 rounded text-indigo-400">
                                {t('chat.community')}
                              </span>
                            )}
                            {channel.is_private && (
                              <span className="ml-1 text-xs bg-dark-300 px-1 py-0.5 rounded text-gray-400">
                                {t('chat.private')}
                              </span>
                            )}
                          </h3>
                          {channel.description && (
                            <p className="text-xs text-gray-400 truncate">
                              {channel.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    {t('chat.noChannelsJoined')}
                  </p>
                  <a
                    href="/communities"
                    className="mt-2 text-primary-500 hover:text-primary-400 text-sm inline-block"
                  >
                    {t('chat.joinCommunities')}
                  </a>
                </div>
              )
            ) : filteredRecentChats.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {filteredRecentChats.map((chat) => (
                  <div
                    key={chat.userId}
                    className={`p-3 hover:bg-dark-200 transition-colors cursor-pointer ${
                      chat.unreadCount > 0 ? 'bg-dark-200/50' : ''
                    }`}
                    onClick={() => openChat(chat.userId, chat.username, chat.avatarUrl)}
                    role="button"
                    aria-label={`Chat with ${chat.username}${chat.unreadCount > 0 ? `, ${chat.unreadCount} unread messages` : ''}`}
                    tabIndex={0}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
                        {chat.avatarUrl ? (
                          <img
                            src={chat.avatarUrl}
                            alt={chat.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className={`font-medium text-sm ${chat.unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                            {chat.username}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(chat.lastMessageTime)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-gray-300' : 'text-gray-400'}`}>
                            {chat.lastMessage}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="ml-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">
                  {searchQuery ? t('chat.noConversationsFound') : t('chat.noConversations')}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setActiveTab('friends')}
                    className="mt-2 text-primary-500 hover:text-primary-400 text-sm"
                  >
                    {t('chat.startNewConversation')}
                  </button>
                )}
              </div>
            )
          ) : activeTab === 'friends' ? (
            // Friends Tab
            filteredFriends.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-3 hover:bg-dark-200 transition-colors cursor-pointer"
                    onClick={() => friend.related_user && openChat(
                      friend.related_user.id,
                      friend.related_user.username,
                      friend.related_user.avatar_url
                    )}
                    role="button"
                    aria-label={`Start chat with ${friend.related_user?.username}`}
                    tabIndex={0}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
                        {friend.related_user?.avatar_url ? (
                          <img
                            src={friend.related_user.avatar_url}
                            alt={friend.related_user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-300">
                          {friend.related_user?.username}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {friend.related_user?.country || t('chat.online')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">
                  {searchQuery ? t('chat.noFriendsFound') : t('chat.noFriends')}
                </p>
                {!searchQuery && (
                  <a
                    href="/profile/friends"
                    className="mt-2 text-primary-500 hover:text-primary-400 text-sm inline-block"
                  >
                    {t('chat.addFriends')}
                  </a>
                )}
              </div>
            )
          ) : activeTab === 'channels' ? (
            // Channels Tab
            <>
              {/* My Channels Section - only show when not sharing or when sharing to community */}
              {filteredUserChannels.length > 0 && (!onContactSelectForShare || shareTargetType === 'community') && (
                <div>
                  <div className="px-3 py-2 text-xs text-gray-400 font-medium">
                    {t('chat.myChannels')}
                  </div>
                  <div className="divide-y divide-gray-800">
                  {filteredUserChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className="p-3 hover:bg-dark-200 transition-colors cursor-pointer"
                      onClick={() => openChannel(channel.id, channel.name, channel.description)}
                      role="button"
                      aria-label={`Open channel ${channel.name}`}
                      tabIndex={0}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center ${
                          channel.is_community
                            ? 'bg-indigo-600/20'
                            : channel.is_private
                              ? 'bg-gray-600/20'
                              : 'bg-primary-600/20'
                        }`}>
                          {channel.image_url ? (
                            <img
                              src={channel.image_url}
                              alt={channel.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <MessageSquare className={`h-5 w-5 ${
                              channel.is_community
                                ? 'text-indigo-500'
                                : channel.is_private
                                  ? 'text-gray-400'
                                  : 'text-primary-500'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-sm text-gray-300 flex items-center">
                              # {channel.name}
                              {channel.is_community && (
                                <span className="ml-1 text-xs bg-indigo-600/20 px-1 py-0.5 rounded text-indigo-400">
                                  {t('chat.community')}
                                </span>
                              )}
                              {channel.is_private && (
                                <span className="ml-1 text-xs bg-dark-300 px-1 py-0.5 rounded text-gray-400">
                                  {t('chat.private')}
                                </span>
                              )}
                            </h3>
                            {channel.role === 'admin' && (
                              <span className="text-xs bg-primary-600/20 text-primary-400 px-1.5 py-0.5 rounded">
                                {t('chat.admin')}
                              </span>
                            )}
                          </div>
                          {channel.description && (
                            <p className="text-xs text-gray-400 truncate">
                              {channel.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {/* Public Channels Section */}
              {filteredPublicChannels.length > 0 && (!onContactSelectForShare || shareTargetType === 'community') && (
                <div>
                  <div className="px-3 py-2 text-xs text-gray-400 font-medium">
                    {shareTargetType === 'community' ? t('chat.otherCommunities') : t('chat.publicCommunities')}
                  </div>
                  <div className="divide-y divide-gray-800">
                    {filteredPublicChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className="p-3 hover:bg-dark-200 transition-colors cursor-pointer"
                        onClick={() => onContactSelectForShare ?
                          openChannel(channel.id, channel.name, channel.description) :
                          undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-indigo-600/20 overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                              {channel.image_url ? (
                                <img
                                  src={channel.image_url}
                                  alt={channel.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <MessageSquare className="h-5 w-5 text-indigo-500" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-sm text-gray-300">
                                # {channel.name}
                              </h3>
                              {channel.description && (
                                <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                  {channel.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {!onContactSelectForShare && (
                            <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinChannel(channel.id);
                            }}
                            disabled={isJoiningChannel}
                            className="ml-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg text-xs transition-colors"
                          >
                            {isJoiningChannel ? t('chat.joining') : t('chat.join')}
                          </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredUserChannels.length === 0 && filteredPublicChannels.length === 0 && !onContactSelectForShare && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? t('chat.noChannelsFound') : t('chat.noChannels')}
                  </p>
                  <a
                    href="/communities"
                    className="mt-2 text-primary-500 hover:text-primary-400 text-sm inline-block"
                  >
                    {t('chat.joinCommunities')}
                  </a>
                </div>
              )}

              {/* Empty state for sharing */}
              {filteredUserChannels.length === 0 && filteredPublicChannels.length === 0 && onContactSelectForShare && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    {t('chat.noChannelsJoined')}
                  </p>
                  <a
                    href="/communities"
                    className="mt-2 text-primary-500 hover:text-primary-400 text-sm inline-block"
                  >
                    {t('chat.joinCommunities')}
                  </a>
                </div>
              )}
            </>
          ) : activeTab === 'invitations' ? (
            // Invitations Tab
            <>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : channelInvitations.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {channelInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="p-3 hover:bg-dark-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary-600/20 overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-primary-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-gray-300 flex items-center">
                              # {invitation.channels.name}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                              {t('chat.invitationFrom', { sender: invitation.channels.users?.username || t('chat.unknownUser') })}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            className="bg-success-600 hover:bg-success-700 text-white px-2 py-1 rounded text-xs"
                          >
                            {t('chat.accept')}
                          </button>
                          <button
                            onClick={() => handleRejectInvitation(invitation.id)}
                            className="bg-error-600 hover:bg-error-700 text-white px-2 py-1 rounded text-xs"
                          >
                            {t('chat.reject')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    {t('chat.noPendingInvitations')}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        {!onContactSelectForShare && (
          <div className="p-3 border-t border-gray-800 text-center">
          {activeTab === 'channels' ? (
            <a
              href="/communities"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center transition-colors"
              aria-label={t('chat.goToCommunities')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {t('chat.goToCommunities')}
            </a>
          ) : (
            <a
              href="/profile/friends"
              className="text-primary-500 hover:text-primary-400 text-sm flex items-center justify-center"
              aria-label={t('chat.manageContacts')}
            >
              <User className="h-4 w-4 mr-1" />
              {t('chat.manageContacts')}
            </a>
          )}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChatModal && selectedChat && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false);
            loadRecentChats(); // Reload chats when closing modal to update read status
          }}
          recipientId={selectedChat.id}
          recipientName={selectedChat.name}
          recipientAvatar={selectedChat.avatar}
          initialMessageContent={initialMessageContent}
        />
      )}

      {/* Channel Modal */}
      {showChannelModal && selectedChannel && (
        <ChannelModal
          isOpen={showChannelModal}
          onClose={() => {
            setShowChannelModal(false);
            loadUserChannels(); // Reload channels when closing modal
          }}
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          channelDescription={selectedChannel.description}
          initialMessageContent={initialMessageContent}
        />
      )}

    </>
  );
};

export default ChatListModal;
