import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  User,
  MessageSquare,
  Gamepad2,
  Send,
  Inbox,
  UserCheck
} from 'lucide-react';
import {
  fetchPendingFriendRequests,
  fetchSentFriendRequests,
  fetchFriends,
  removeRelationship,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest
} from '../services/api';
import { supabase } from '../lib/supabase';
import { UserRelationship, FriendRequest, Game } from '../types';
import toast from 'react-hot-toast';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';
import ChatModal from '../components/chat/ChatModal';
import { getGameTheme, GameTheme } from '../utils/gameThemes';
import { countries } from '../utils/countries';

type OnlineStatus = 'online' | 'away' | 'offline';

const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent'>('friends');
  const [friends, setFriends] = useState<UserRelationship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [favoriteGame, setFavoriteGame] = useState<Game | null>(null);

  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<{
    id: string;
    username: string;
    avatar?: string | null;
  } | null>(null);

  const theme: GameTheme = useMemo(() => {
    return getGameTheme(favoriteGame?.name || null);
  }, [favoriteGame]);

  useEffect(() => {
    const loadFavoriteGame = async () => {
      if (!user?.favorite_game_id) return;

      try {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('id', user.favorite_game_id)
          .maybeSingle();

        if (data) {
          setFavoriteGame(data);
        }
      } catch (error) {
        console.error('Error loading favorite game:', error);
      }
    };

    loadFavoriteGame();
  }, [user?.favorite_game_id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');

    if (tabParam === 'requests') {
      setActiveTab('requests');
    } else if (tabParam === 'sent') {
      setActiveTab('sent');
    }
  }, [location.search]);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const friendsData = await fetchFriends(user.id);
      setFriends(friendsData);

      const pendingRequestsData = await fetchPendingFriendRequests(user.id);
      setPendingRequests(pendingRequestsData);

      const sentRequestsData = await fetchSentFriendRequests(user.id);
      setSentRequests(sentRequestsData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUserSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);

      const existingFriendIds = friends.map(friend => friend.related_user?.id).filter(Boolean);
      const pendingRequestIds = [
        ...pendingRequests.map(req => req.sender_id),
        ...sentRequests.map(req => req.receiver_id)
      ];
      const excludeIds = [...existingFriendIds, ...pendingRequestIds, user?.id].filter(Boolean);

      let suggestionQuery = supabase
        .from('users')
        .select('id, username, avatar_url, country, favorite_game_id')
        .ilike('username', `%${query.trim()}%`)
        .limit(5);

      if (excludeIds.length > 0) {
        suggestionQuery = suggestionQuery.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
      }

      const { data, error } = await suggestionQuery;

      if (error) {
        console.error('Error loading user suggestions:', error);
        return;
      }

      setUserSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error loading user suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    if (activeTab === 'friends') {
      const timeoutId = setTimeout(() => {
        loadUserSuggestions(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSendFriendRequest = async (receiverId: string, receiverUsername: string) => {
    if (!user?.id) return;

    try {
      await sendFriendRequest(user.id, receiverId);
      toast.success(t('friends.requestSentSuccess', { username: receiverUsername }));

      setUserSuggestions(prev => prev.filter(suggestion => suggestion.id !== receiverId));
      loadData();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(t('friends.requestSentError'));
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setPendingRequests(prev => prev.filter(request => request.id !== requestId));
    if (user?.id) {
      fetchFriends(user.id).then(data => setFriends(data));
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setPendingRequests(prev => prev.filter(request => request.id !== requestId));
  };

  const handleRemoveFriend = (relationshipId: string) => {
    setFriends(prev => prev.filter(friend => friend.id !== relationshipId));
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      setIsProcessing(true);
      await removeRelationship(requestId);
      setSentRequests(prev => prev.filter(request => request.id !== requestId));
      toast.success(t('friends.requestCancelledSuccess'));
    } catch (error) {
      console.error('Error canceling request:', error);
      toast.error(t('friends.requestCancelledError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayerClick = (userId: string) => {
    setSelectedPlayerId(userId);
    setIsPlayerProfileModalOpen(true);
  };

  const filteredFriends = friends.filter(friend =>
    friend.related_user?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOnlineStatus = (userId: string): OnlineStatus => {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const statuses: OnlineStatus[] = ['online', 'away', 'offline'];
    return statuses[Math.abs(hash) % 3];
  };

  const getCountryName = (countryCode?: string) => {
    if (!countryCode) return null;
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode) return null;
    const country = countries.find(c => c.code === countryCode);
    return country?.flag || null;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('friends.today');
    if (diffDays === 1) return t('friends.yesterday');
    if (diffDays < 7) return t('friends.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  return (
    <div
      className="min-h-screen pt-28 pb-16"
      style={{
        background: `linear-gradient(180deg, ${theme.colors.primary}08 0%, transparent 30%)`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('friends.backToProfile')}
          </Link>

          <div
            className="relative rounded-2xl mb-6"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}20 0%, ${theme.colors.secondary}15 50%, ${theme.colors.primary}10 100%)`
            }}
          >
            <div
              className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div
              className="absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-15"
              style={{ backgroundColor: theme.colors.secondary }}
            />

            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${theme.colors.primary}25`,
                      boxShadow: `0 0 20px ${theme.colors.primary}30`
                    }}
                  >
                    <Users className="w-7 h-7" style={{ color: theme.colors.primary }} />
                  </div>
                  <div>
                    <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
                      {t('friends.pageTitle')}
                    </h1>
                    <p className="text-gray-400 text-sm">{t('friends.pageSubtitle')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{friends.length}</div>
                      <div className="text-xs text-gray-400">{t('friends.friends')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: pendingRequests.length > 0 ? theme.colors.primary : 'white' }}>
                        {pendingRequests.length}
                      </div>
                      <div className="text-xs text-gray-400">{t('friends.pending')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{sentRequests.length}</div>
                      <div className="text-xs text-gray-400">{t('friends.sent')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t('friends.searchPlaceholder')}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 transition-all focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  style={{
                    boxShadow: 'none'
                  }}
                />

                {showSuggestions && activeTab === 'friends' && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-dark-100 border border-gray-700/50 rounded-xl shadow-2xl z-20 max-h-80 overflow-y-auto">
                    {isLoadingSuggestions ? (
                      <div className="p-4 flex items-center justify-center">
                        <Loader className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    ) : userSuggestions.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-700/50">
                          {t('friends.usersFound')} ({userSuggestions.length})
                        </div>
                        {userSuggestions.map(suggestion => (
                          <div
                            key={suggestion.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-dark-200/50 transition-colors"
                          >
                            <div
                              className="flex items-center flex-1 cursor-pointer"
                              onClick={() => handlePlayerClick(suggestion.id)}
                            >
                              <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-dark-300 overflow-hidden mr-3">
                                  {suggestion.avatar_url ? (
                                    <img
                                      src={suggestion.avatar_url}
                                      alt={suggestion.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <User className="h-5 w-5" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-white text-sm">
                                  {suggestion.username}
                                </p>
                                {suggestion.country && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <span>{getCountryFlag(suggestion.country)}</span>
                                    {getCountryName(suggestion.country)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendFriendRequest(suggestion.id, suggestion.username);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                              style={{
                                backgroundColor: theme.colors.primary,
                                color: theme.colors.text
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                              {t('friends.add')}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.length >= 2 ? (
                      <div className="p-6 text-center">
                        <User className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">
                          {t('friends.noUsersFound', { query: searchQuery })}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
            <div className="p-2 border-b border-gray-800/50">
              <div className="flex rounded-xl bg-dark-200/50 p-1">
                {[
                  { id: 'friends' as const, icon: Users, label: t('friends.myFriends'), count: friends.length },
                  { id: 'requests' as const, icon: Inbox, label: t('friends.requestsReceived'), count: pendingRequests.length, highlight: true },
                  { id: 'sent' as const, icon: Send, label: t('friends.requestsSent'), count: sentRequests.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all
                      ${activeTab === tab.id
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-300'
                      }
                    `}
                    style={{
                      backgroundColor: activeTab === tab.id ? theme.colors.primary : 'transparent',
                      boxShadow: activeTab === tab.id ? `0 4px 15px ${theme.colors.primary}30` : 'none'
                    }}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${activeTab === tab.id
                            ? 'bg-white/20 text-white'
                            : tab.highlight && tab.count > 0
                              ? 'text-white'
                              : 'bg-dark-300 text-gray-400'
                          }
                        `}
                        style={{
                          backgroundColor: activeTab !== tab.id && tab.highlight && tab.count > 0 ? theme.colors.primary : undefined
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader className="h-10 w-10 animate-spin mb-4" style={{ color: theme.colors.primary }} />
                  <span className="text-gray-400">{t('common.loading')}</span>
                </div>
              ) : (
                <>
                  {activeTab === 'friends' && (
                    <div>
                      {friends.length > 0 ? (
                        <div className="space-y-3">
                          {filteredFriends.map(friend => {
                            const onlineStatus = getOnlineStatus(friend.related_user?.id || '');
                            return (
                              <div
                                key={friend.id}
                                className="group bg-dark-200/50 rounded-xl p-4 hover:bg-dark-200 transition-all border border-transparent hover:border-gray-700/30"
                              >
                                <div className="flex items-center justify-between">
                                  <div
                                    className="flex items-center flex-1 cursor-pointer"
                                    onClick={() => handlePlayerClick(friend.related_user?.id || '')}
                                  >
                                    <div className="relative mr-4">
                                      <div className="w-12 h-12 rounded-xl bg-dark-300 overflow-hidden">
                                        {friend.related_user?.avatar_url ? (
                                          <img
                                            src={friend.related_user.avatar_url}
                                            alt={friend.related_user.username}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <User className="h-6 w-6" />
                                          </div>
                                        )}
                                      </div>
                                      <div
                                        className={`
                                          absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-dark-200
                                          ${onlineStatus === 'online' ? 'bg-success-500' : onlineStatus === 'away' ? 'bg-warning-500' : 'bg-gray-500'}
                                        `}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors truncate">
                                        {friend.related_user?.username}
                                      </h3>
                                      <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {friend.related_user?.country && (
                                          <span className="flex items-center gap-1">
                                            <span>{getCountryFlag(friend.related_user.country)}</span>
                                            {getCountryName(friend.related_user.country)}
                                          </span>
                                        )}
                                        <span
                                          className={`
                                            ${onlineStatus === 'online' ? 'text-success-400' : onlineStatus === 'away' ? 'text-warning-400' : ''}
                                          `}
                                        >
                                          {onlineStatus === 'online' && t('friends.online')}
                                          {onlineStatus === 'away' && t('friends.away')}
                                          {onlineStatus === 'offline' && t('friends.offline')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        if (friend.related_user) {
                                          setSelectedChatUser({
                                            id: friend.related_user.id,
                                            username: friend.related_user.username,
                                            avatar: friend.related_user.avatar_url
                                          });
                                          setShowChatModal(true);
                                        }
                                      }}
                                      className="p-2.5 rounded-xl transition-all"
                                      style={{
                                        backgroundColor: `${theme.colors.primary}20`,
                                        color: theme.colors.primary
                                      }}
                                      title={t('friends.sendMessage')}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (friend.id) {
                                          handleRemoveFriend(friend.id);
                                          removeRelationship(friend.id)
                                            .then(() => toast.success(t('friends.friendRemovedSuccess', { username: friend.related_user?.username })))
                                            .catch(err => {
                                              console.error('Error removing friend:', err);
                                              toast.error(t('friends.removeFriendError'));
                                            });
                                        }
                                      }}
                                      disabled={isProcessing}
                                      className="p-2.5 rounded-xl bg-dark-300/50 hover:bg-dark-300 text-gray-400 hover:text-gray-300 transition-all disabled:opacity-50"
                                      title={t('friends.removeFromFriends')}
                                    >
                                      <UserMinus className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {filteredFriends.length === 0 && searchQuery && (
                            <div className="text-center py-12">
                              <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                              <p className="text-gray-400">{t('friends.noFriendsMatchSearch')}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div
                            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                            style={{ backgroundColor: `${theme.colors.primary}15` }}
                          >
                            <Users className="h-10 w-10" style={{ color: theme.colors.primary }} />
                          </div>
                          <h3 className="font-heading font-bold text-xl text-white mb-2">
                            {t('friends.noFriendsYet')}
                          </h3>
                          <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            {t('friends.noFriendsDescription')}
                          </p>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                const searchInput = document.querySelector(`input[placeholder="${t('friends.searchPlaceholder')}"]`) as HTMLInputElement;
                                if (searchInput) {
                                  searchInput.focus();
                                }
                              }}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all"
                              style={{
                                backgroundColor: theme.colors.primary,
                                color: theme.colors.text,
                                boxShadow: `0 4px 15px ${theme.colors.primary}30`
                              }}
                            >
                              <Search className="h-4 w-4" />
                              {t('friends.searchPlayers')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'requests' && (
                    <div>
                      {pendingRequests.length > 0 ? (
                        <div className="space-y-3">
                          {pendingRequests.map(request => (
                            <div
                              key={request.id}
                              className="group bg-dark-200/50 rounded-xl p-4 hover:bg-dark-200 transition-all border border-transparent hover:border-gray-700/30"
                            >
                              <div className="flex items-center justify-between">
                                <div
                                  className="flex items-center flex-1 cursor-pointer"
                                  onClick={() => handlePlayerClick(request.sender_id)}
                                >
                                  <div className="w-12 h-12 rounded-xl bg-dark-300 overflow-hidden mr-4">
                                    {request.sender_avatar ? (
                                      <img
                                        src={request.sender_avatar}
                                        alt={request.sender_username}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="h-6 w-6" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                      {request.sender_username}
                                    </h3>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {t('friends.receivedTime', { time: formatRelativeTime(request.created_at) })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      acceptFriendRequest(request.id)
                                        .then(() => {
                                          handleAcceptRequest(request.id);
                                          toast.success(t('friends.friendRequestAcceptedSuccess', { username: request.sender_username }));
                                        })
                                        .catch(err => {
                                          console.error('Error accepting friend request:', err);
                                          toast.error(t('friends.friendRequestAcceptedError'));
                                        });
                                    }}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white transition-all disabled:opacity-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('friends.accept')}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      rejectFriendRequest(request.id)
                                        .then(() => {
                                          handleRejectRequest(request.id);
                                          toast.success(t('friends.friendRequestRejectedSuccess'));
                                        })
                                        .catch(err => {
                                          console.error('Error rejecting friend request:', err);
                                          toast.error(t('friends.friendRequestRejectedError'));
                                        });
                                    }}
                                    disabled={isProcessing}
                                    className="p-2 rounded-xl bg-error-600/20 hover:bg-error-600/30 text-error-400 transition-all disabled:opacity-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div
                            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                            style={{ backgroundColor: `${theme.colors.primary}15` }}
                          >
                            <Inbox className="h-10 w-10" style={{ color: theme.colors.primary }} />
                          </div>
                          <h3 className="font-heading font-bold text-xl text-white mb-2">
                            {t('friends.allCaughtUp')}
                          </h3>
                          <p className="text-gray-400 max-w-md mx-auto">
                            {t('friends.noPendingRequests')}
                          </p>
                        </div>
                      )}

                      <div className="mt-8 p-5 bg-dark-200/30 rounded-xl border border-gray-800/30">
                        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                          <UserCheck className="h-5 w-5" style={{ color: theme.colors.primary }} />
                          {t('friends.howToAddFriends')}
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                          <li className="flex items-start gap-2">
                            <span style={{ color: theme.colors.primary }}>1.</span>
                            {t('friends.addFriendsMethod1')}
                          </li>
                          <li className="flex items-start gap-2">
                            <span style={{ color: theme.colors.primary }}>2.</span>
                            {t('friends.addFriendsMethod2')}
                          </li>
                          <li className="flex items-start gap-2">
                            <span style={{ color: theme.colors.primary }}>3.</span>
                            {t('friends.addFriendsMethod3')}
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'sent' && (
                    <div>
                      {sentRequests.length > 0 ? (
                        <div className="space-y-3">
                          {sentRequests.map(request => (
                            <div
                              key={request.id}
                              className="group bg-dark-200/50 rounded-xl p-4 hover:bg-dark-200 transition-all border border-transparent hover:border-gray-700/30"
                            >
                              <div className="flex items-center justify-between">
                                <div
                                  className="flex items-center flex-1 cursor-pointer"
                                  onClick={() => handlePlayerClick(request.receiver_id)}
                                >
                                  <div className="w-12 h-12 rounded-xl bg-dark-300 overflow-hidden mr-4">
                                    {request.receiver_avatar ? (
                                      <img
                                        src={request.receiver_avatar}
                                        alt={request.receiver_username}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="h-6 w-6" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                      {request.receiver_username}
                                    </h3>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {t('friends.sentOn', { date: formatRelativeTime(request.created_at) })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-500/15 text-warning-400 text-sm">
                                    <Clock className="h-3.5 w-3.5" />
                                    {t('friends.pending')}
                                  </span>
                                  <button
                                    onClick={() => handleCancelRequest(request.id)}
                                    disabled={isProcessing}
                                    className="p-2 rounded-xl bg-dark-300/50 hover:bg-dark-300 text-gray-400 hover:text-gray-300 transition-all disabled:opacity-50"
                                    title={t('friends.cancelRequest')}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div
                            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                            style={{ backgroundColor: `${theme.colors.primary}15` }}
                          >
                            <Send className="h-10 w-10" style={{ color: theme.colors.primary }} />
                          </div>
                          <h3 className="font-heading font-bold text-xl text-white mb-2">
                            {t('friends.noSentRequestsTitle')}
                          </h3>
                          <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            {t('friends.noSentRequests')}
                          </p>
                          <button
                            onClick={() => {
                              setActiveTab('friends');
                              setTimeout(() => {
                                const searchInput = document.querySelector(`input[placeholder="${t('friends.searchPlaceholder')}"]`) as HTMLInputElement;
                                if (searchInput) {
                                  searchInput.focus();
                                }
                              }, 100);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all mx-auto"
                            style={{
                              backgroundColor: theme.colors.primary,
                              color: theme.colors.text,
                              boxShadow: `0 4px 15px ${theme.colors.primary}30`
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                            {t('friends.findFriends')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
        gameId={null}
      />

      {showChatModal && selectedChatUser && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          recipientId={selectedChatUser.id}
          recipientName={selectedChatUser.username}
          recipientAvatar={selectedChatUser.avatar}
        />
      )}
    </div>
  );
};

export default FriendsPage;
