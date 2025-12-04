import React, { useState, useEffect } from 'react';
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
  MessageSquare
} from 'lucide-react';
import {
  fetchUserRelationships,
  fetchPendingFriendRequests,
  fetchSentFriendRequests,
  fetchFriends,
  removeRelationship,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest
} from '../services/api';
import { supabase } from '../lib/supabase';
import { UserRelationship, FriendRequest } from '../types';
import FriendRequestItem from '../components/ui/FriendRequestItem';
import FriendItem from '../components/ui/FriendItem';
import toast from 'react-hot-toast';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';
import ChatModal from '../components/chat/ChatModal';

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

  // Player profile modal state
  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<{
    id: string;
    username: string;
    avatar?: string | null;
  } | null>(null);

  // Get tab from URL query parameter
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
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load friends (accepted relationships)
      const friendsData = await fetchFriends(user.id);
      setFriends(friendsData);

      // Load pending friend requests
      const pendingRequestsData = await fetchPendingFriendRequests(user.id);
      setPendingRequests(pendingRequestsData);

      // Load sent friend requests
      const sentRequestsData = await fetchSentFriendRequests(user.id);
      setSentRequests(sentRequestsData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user suggestions based on search query
  const loadUserSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUserSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);

      // Get existing friend IDs to exclude them from suggestions
      const existingFriendIds = friends.map(friend => friend.related_user?.id).filter(Boolean);
      const pendingRequestIds = [
        ...pendingRequests.map(req => req.sender_id),
        ...sentRequests.map(req => req.receiver_id)
      ];
      const excludeIds = [...existingFriendIds, ...pendingRequestIds, user?.id].filter(Boolean);

      // Search for users by username
      let suggestionQuery = supabase
        .from('users')
        .select('id, username, avatar_url, country')
        .ilike('username', `%${query.trim()}%`)
        .limit(5);

      // Exclude current user, existing friends, and pending requests
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

  // Handle search query change with debouncing
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    // Only show suggestions on Friends tab
    if (activeTab === 'friends') {
      // Debounce the search
      const timeoutId = setTimeout(() => {
        loadUserSuggestions(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestions(false);
    }
  };

  // Send friend request to suggested user
  const handleSendFriendRequest = async (receiverId: string, receiverUsername: string) => {
    if (!user?.id) return;

    try {
      await sendFriendRequest(user.id, receiverId);
      toast.success(t('friends.requestSentSuccess', { username: receiverUsername }));

      // Remove from suggestions and refresh data
      setUserSuggestions(prev => prev.filter(suggestion => suggestion.id !== receiverId));
      loadData();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(t('friends.requestSentError'));
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setPendingRequests(prev => prev.filter(request => request.id !== requestId));
    // Reload friends list
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

  // Handle player profile click
  const handlePlayerClick = (userId: string) => {
    setSelectedPlayerId(userId);
    setIsPlayerProfileModalOpen(true);
  };

  // Handle chat button click
  const handleChatClick = (friend: UserRelationship) => {
    if (!friend.related_user) return;

    setSelectedChatUser({
      id: friend.related_user.id,
      username: friend.related_user.username,
      avatar: friend.related_user.avatar_url
    });
    setShowChatModal(true);
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.related_user?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('friends.backToProfile')}
          </Link>

          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
              <h1 className="font-heading font-bold text-2xl flex items-center text-gray-900 dark:text-white">
                <Users className="h-6 w-6 mr-2 text-primary-500" />
                {t('friends.pageTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{t('friends.pageSubtitle')}</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'friends'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                {t('friends.myFriends')}
                <span className="ml-2 bg-dark-300 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                  {friends.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'requests'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                {t('friends.requestsReceived')}
                {pendingRequests.length > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'sent'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                {t('friends.requestsSent')}
                {sentRequests.length > 0 && (
                  <span className="ml-2 bg-dark-300 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                    {sentRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-primary-500 mr-3" />
                  <span className="text-gray-400">{t('common.loading')}</span>
                </div>
              ) : (
                <>
                  {/* Friends Tab */}
                  {activeTab === 'friends' && (
                    <div>
                      {/* Search Bar */}
                      <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder={t('friends.searchPlaceholder')}
                            className="w-full bg-dark-200 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onFocus={() => {
                              if (searchQuery.length >= 2) {
                                setShowSuggestions(true);
                              }
                            }}
                            onBlur={() => {
                              // Delay hiding suggestions to allow clicking on them
                              setTimeout(() => setShowSuggestions(false), 200);
                            }}
                          />

                          {/* User Suggestions Dropdown */}
                          {showSuggestions && activeTab === 'friends' && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-100 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                              {isLoadingSuggestions ? (
                                <div className="p-3 text-center">
                                  <Loader className="h-4 w-4 animate-spin text-primary-500 mx-auto" />
                                </div>
                              ) : userSuggestions.length > 0 ? (
                                <div className="py-2">
                                  <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                                    {t('friends.usersFound')}
                                  </div>
                                  {userSuggestions.map(suggestion => (
                                    <div
                                      key={suggestion.id}
                                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-200 transition-colors"
                                    >
                                      <div
                                        className="flex items-center flex-1 cursor-pointer"
                                        onClick={() => handlePlayerClick(suggestion.id)}
                                      >
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
                                          {suggestion.avatar_url ? (
                                            <img
                                              src={suggestion.avatar_url}
                                              alt={suggestion.username}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                              <User className="h-4 w-4" />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                                            {suggestion.username}
                                          </p>
                                          {suggestion.country && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {suggestion.country}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendFriendRequest(suggestion.id, suggestion.username);
                                        }}
                                        className="bg-primary-600 hover:bg-primary-700 text-white p-1.5 rounded-lg transition-colors"
                                        title={t('friends.addAsFriend', { username: suggestion.username })}
                                      >
                                        <UserPlus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : searchQuery.length >= 2 ? (
                                <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                                  {t('friends.noUsersFound', { query: searchQuery })}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Friends List */}
                      {friends.length > 0 ? (
                        <div className="space-y-3">
                          {filteredFriends.map(friend => (
                            <div key={friend.id} className="bg-dark-200 p-4 rounded-lg hover:bg-dark-300/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div
                                  className="flex items-center cursor-pointer"
                                  onClick={() => handlePlayerClick(friend.related_user?.id || '')}
                                >
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
                                  <div>
                                    <h3 className="font-medium hover:text-primary-400 transition-colors">
                                      {friend.related_user?.username}
                                    </h3>
                                    {friend.related_user?.country && (
                                      <p className="text-xs text-gray-400">
                                        {friend.related_user.country}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex space-x-2">
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
                                    className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
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
                                    className="bg-dark-300 hover:bg-dark-400 disabled:bg-dark-300/50 disabled:cursor-not-allowed text-gray-300 p-2 rounded-lg transition-colors"
                                    title={t('friends.removeFromFriends')}
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {filteredFriends.length === 0 && searchQuery && (
                            <div className="text-center py-8">
                              <p className="text-gray-400">{t('friends.noFriendsMatchSearch')}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <h3 className="font-medium text-lg mb-2">{t('friends.noFriendsYet')}</h3>
                          <p className="text-gray-400 mb-6">
                            {t('friends.noFriendsDescription')}
                          </p>
                          <button
                            onClick={() => {
                              const searchInput = document.querySelector(`input[placeholder="${t('friends.searchPlaceholder')}"]`) as HTMLInputElement;
                              if (searchInput) {
                                searchInput.focus();
                              }
                            }}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            {t('friends.searchPlayers')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Requests Tab */}
                  {activeTab === 'requests' && (
                    <div>
                      <h2 className="font-medium text-lg mb-4">{t('friends.pendingFriendRequests')}</h2>

                      {pendingRequests.length > 0 ? (
                        <div className="space-y-3">
                          {pendingRequests.map(request => (
                            <div key={request.id} className="bg-dark-200 p-4 rounded-lg hover:bg-dark-300/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div
                                  className="flex items-center cursor-pointer"
                                  onClick={() => handlePlayerClick(request.sender_id)}
                                >
                                  <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
                                    {request.sender_avatar ? (
                                      <img
                                        src={request.sender_avatar}
                                        alt={request.sender_username}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <UserPlus className="h-5 w-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-medium hover:text-primary-400 transition-colors">
                                      {request.sender_username}
                                    </h3>
                                    <p className="text-xs text-gray-400 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {new Date(request.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex space-x-2">
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
                                    className="bg-success-600 hover:bg-success-700 disabled:bg-success-600/50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                                    title={t('friends.acceptRequest')}
                                  >
                                    <CheckCircle className="h-4 w-4" />
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
                                    className="bg-error-600 hover:bg-error-700 disabled:bg-error-600/50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                                    title={t('friends.rejectRequest')}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-dark-200 rounded-lg">
                          <UserPlus className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">
                            {t('friends.noPendingRequests')}
                          </p>
                        </div>
                      )}

                      <div className="mt-8 p-4 bg-dark-200 rounded-lg">
                        <h3 className="font-medium mb-2">{t('friends.howToAddFriends')}</h3>
                        <p className="text-sm text-gray-400 mb-3">
                          {t('friends.howToAddFriendsDescription')}
                        </p>
                        <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
                          <li>{t('friends.addFriendsMethod1')}</li>
                          <li>{t('friends.addFriendsMethod2')}</li>
                          <li>{t('friends.addFriendsMethod3')}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Sent Requests Tab */}
                  {activeTab === 'sent' && (
                    <div>
                      <h2 className="font-medium text-lg mb-4">{t('friends.sentFriendRequests')}</h2>

                      {sentRequests.length > 0 ? (
                        <div className="space-y-3">
                          {sentRequests.map(request => (
                            <div key={request.id} className="bg-dark-200 p-4 rounded-lg hover:bg-dark-300/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div
                                  className="flex items-center cursor-pointer"
                                  onClick={() => handlePlayerClick(request.receiver_id)}
                                >
                                  <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
                                    {request.receiver_avatar ? (
                                      <img
                                        src={request.receiver_avatar}
                                        alt={request.receiver_username}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="h-5 w-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-medium hover:text-primary-400 transition-colors">
                                      {request.receiver_username}
                                    </h3>
                                    <p className="text-xs text-gray-400 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {t('friends.sentOn', { date: new Date(request.created_at).toLocaleDateString() })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center">
                                  <span className="bg-warning-600/20 text-warning-400 px-3 py-1 rounded-lg text-sm flex items-center mr-2">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {t('friends.pending')}
                                  </span>
                                  <button
                                    onClick={() => handleCancelRequest(request.id)}
                                    disabled={isProcessing}
                                    className="bg-dark-300 hover:bg-dark-400 disabled:bg-dark-300/50 disabled:cursor-not-allowed text-gray-300 p-2 rounded-lg transition-colors"
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
                        <div className="text-center py-8 bg-dark-200 rounded-lg">
                          <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">
                            {t('friends.noSentRequests')}
                          </p>
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

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
        gameId={null}
      />

      {/* Chat Modal */}
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
