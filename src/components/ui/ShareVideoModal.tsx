import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Share2, MessageSquare, Users, Copy, CheckCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserChannels } from '../../services/channelService';
import { fetchFriends } from '../../services/api';
import { UserRelationship } from '../../types';
import toast from 'react-hot-toast';
import ChatModal from '../chat/ChatModal';
import ChannelModal from '../chat/ChannelModal';

interface ShareVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoUrl: string;
  videoDescription?: string;
  videoThumbnail?: string;
}

interface Channel {
  channel_id: string;
  channels: {
    id: string;
    name: string;
    description?: string;
    is_community: boolean;
    is_private: boolean;
  };
}

const ShareVideoModal: React.FC<ShareVideoModalProps> = ({
  isOpen,
  onClose,
  videoTitle,
  videoUrl,
  videoDescription,
  videoThumbnail
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'communities' | 'link'>('friends');
  const [friends, setFriends] = useState<UserRelationship[]>([]);
  const [communities, setCommunities] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Chat and channel modal states
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{id: string, name: string, avatar?: string}>({id: '', name: ''});
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<{id: string, name: string, description?: string}>({id: '', name: ''});

  useEffect(() => {
    if (isOpen && user?.id) {
      loadFriendsAndCommunities();
    }
  }, [isOpen, user?.id]);

  const loadFriendsAndCommunities = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Load friends
      const friendsData = await fetchFriends(user.id);
      setFriends(friendsData);

      // Load user's communities
      const communitiesData = await getUserChannels();
      setCommunities(communitiesData);
    } catch (error) {
      console.error('Error loading friends and communities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopiedLink(true);
      toast.success(t('shareVideoModal.linkCopied'));

      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error(t('shareVideoModal.copyLinkError'));
    }
  };

  const handleShareWithFriend = (friend: UserRelationship) => {
    if (!friend.related_user) return;

    setSelectedFriend({
      id: friend.related_user.id,
      name: friend.related_user.username,
      avatar: friend.related_user.avatar_url
    });
    setShowChatModal(true);
  };

  const handleShareToCommunity = (community: Channel) => {
    setSelectedChannel({
      id: community.channel_id,
      name: community.channels.name,
      description: community.channels.description
    });
    setShowChannelModal(true);
  };

  if (!isOpen) return null;

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800"
          onClick={stopPropagation}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <Share2 className="text-primary-500 h-5 w-5 mr-2" />
              <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
                {t('shareVideoModal.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label={t('shareVideoModal.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Video Preview */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              {videoThumbnail && (
                <div className="w-16 h-12 rounded overflow-hidden bg-gray-200 dark:bg-dark-300 flex-shrink-0">
                  <img
                    src={videoThumbnail}
                    alt={videoTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">{videoTitle}</h3>
                {videoDescription && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{videoDescription}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'friends'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              {t('shareVideoModal.friendsTab')}
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'communities'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              {t('shareVideoModal.communitiesTab')}
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'link'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Copy className="h-4 w-4 inline mr-2" />
              {t('shareVideoModal.linkTab')}
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">{t('shareVideoModal.loading')}</span>
              </div>
            ) : (
              <>
                {/* Friends Tab */}
                {activeTab === 'friends' && (
                  <div className="space-y-3">
                    {friends.length > 0 ? (
                      friends.map((friend) => (
                        <button
                          key={friend.id}
                          onClick={() => handleShareWithFriend(friend)}
                          className="w-full flex items-center p-3 bg-gray-50 dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-lg transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
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
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {friend.related_user?.username}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('shareVideoModal.sendPrivateMessage')}
                            </p>
                          </div>
                          <MessageSquare className="h-4 w-4 text-primary-500" />
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">{t('shareVideoModal.noFriendsFound')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {t('shareVideoModal.addFriendsToShare')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Communities Tab */}
                {activeTab === 'communities' && (
                  <div className="space-y-3">
                    {communities.length > 0 ? (
                      communities.map((community) => (
                        <button
                          key={community.channel_id}
                          onClick={() => handleShareToCommunity(community)}
                          className="w-full flex items-center p-3 bg-gray-50 dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-lg transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary-600/20 overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-primary-500" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900 dark:text-white">
                              #{community.channels.name}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              {community.channels.is_community ? (
                                <span className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {t('shareVideoModal.community')}
                                </span>
                              ) : community.channels.is_private ? (
                                <span>{t('shareVideoModal.privateChannel')}</span>
                              ) : (
                                <span>{t('shareVideoModal.publicChannel')}</span>
                              )}
                            </div>
                          </div>
                          <MessageSquare className="h-4 w-4 text-primary-500" />
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">{t('shareVideoModal.noCommunitiesFound')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {t('shareVideoModal.joinCommunities')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Link Tab */}
                {activeTab === 'link' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('shareVideoModal.videoLink')}
                      </label>
                      <div className="flex space-x-2">
                        <div className="flex-1 bg-gray-100 dark:bg-dark-200 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 break-all">
                          {videoUrl}
                        </div>
                        <button
                          onClick={handleCopyLink}
                          className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-lg transition-colors flex-shrink-0"
                        >
                          {copiedLink ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-info-100 dark:bg-info-500/20 border border-info-300 dark:border-info-600/30 p-3 rounded-lg">
                      <p className="text-info-700 dark:text-info-300 text-sm">
                        {t('shareVideoModal.linkShareTip')}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && selectedFriend.id && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false);
            onClose();
          }}
          recipientId={selectedFriend.id}
          recipientName={selectedFriend.name}
          recipientAvatar={selectedFriend.avatar}
          initialSharedVideoTitle={videoTitle}
          initialSharedVideoUrl={videoUrl}
          initialSharedVideoDescription={videoDescription}
          initialSharedVideoThumbnail={videoThumbnail}
        />
      )}

      {/* Channel Modal */}
      {showChannelModal && selectedChannel.id && (
        <ChannelModal
          isOpen={showChannelModal}
          onClose={() => {
            setShowChannelModal(false);
            onClose();
          }}
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          channelDescription={selectedChannel.description}
          initialSharedVideoTitle={videoTitle}
          initialSharedVideoUrl={videoUrl}
          initialSharedVideoDescription={videoDescription}
          initialSharedVideoThumbnail={videoThumbnail}
        />
      )}
    </>
  );
};

export default ShareVideoModal;
