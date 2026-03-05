import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, XCircle, Trophy, Swords, Award, User, UserPlus, MessageSquare, Users, Clock, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayerMatchNotification } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { sendFriendRequest, acceptFriendRequest } from '../../services/api';
import { checkFriendshipStatus, getOpponentUserProfile, getOpponentGameIdsForTournament, generateMatchContextMessage, FriendshipStatus, GameIdEntry } from '../../services/matchFriendshipService';
import { createAndInitializeTeamChat } from '../../services/matchTeamChatService';
import ChatModal from '../chat/ChatModal';
import ChannelModal from '../chat/ChannelModal';
import toast from 'react-hot-toast';

interface MatchNotificationModalProps {
  notification: PlayerMatchNotification;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}

interface OpponentProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
  country?: string;
  bio?: string;
  discord_handle?: string | null;
  riot_game_name?: string | null;
  riot_tagline?: string | null;
  fortnite_epic_id?: string | null;
}

const MatchNotificationModal: React.FC<MatchNotificationModalProps> = ({
  notification,
  onClose,
  onMarkAsRead
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const navigate = useNavigate();

  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile | null>(null);
  const [gameSpecificIds, setGameSpecificIds] = useState<GameIdEntry[]>([]);
  const [isLoadingFriendship, setIsLoadingFriendship] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [showDirectChat, setShowDirectChat] = useState(false);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [teamChatChannelId, setTeamChatChannelId] = useState<string | null>(null);
  const [isCreatingTeamChat, setIsCreatingTeamChat] = useState(false);

  const opponentUserId = notification.opponent_id || notification.opponent_user_id;

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 100);

    if (opponentUserId && user?.id) {
      loadOpponentData();
    }
  }, [opponentUserId, user?.id]);

  const loadOpponentData = async () => {
    if (!opponentUserId || !user?.id) return;

    try {
      setIsLoadingFriendship(true);

      const [profile, friendship, tournamentGameIds] = await Promise.all([
        getOpponentUserProfile(opponentUserId),
        checkFriendshipStatus(user.id, opponentUserId),
        notification.tournament_id
          ? getOpponentGameIdsForTournament(opponentUserId, notification.tournament_id)
          : Promise.resolve([])
      ]);

      setOpponentProfile(profile);
      setFriendshipStatus(friendship);
      setGameSpecificIds(tournamentGameIds);
    } catch (error) {
      console.error('Error loading opponent data:', error);
    } finally {
      setIsLoadingFriendship(false);
    }
  };

  const handleClose = async () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleMarkAsRead = async () => {
    await onMarkAsRead(notification.id);
    handleClose();
  };

  const handleSendFriendRequest = async () => {
    if (!user?.id || !opponentUserId) return;

    try {
      setIsSendingRequest(true);
      await sendFriendRequest(user.id, opponentUserId);

      setFriendshipStatus({
        areFriends: false,
        hasPendingRequest: true,
        requestSentByCurrentUser: true,
        requestSentByOpponent: false
      });

      toast.success(t('notifications.friendRequestSent'));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(t('notifications.errorSendingRequest'));
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipStatus?.relationshipId) return;

    try {
      setIsSendingRequest(true);
      await acceptFriendRequest(friendshipStatus.relationshipId);

      setFriendshipStatus({
        areFriends: true,
        hasPendingRequest: false,
        requestSentByCurrentUser: false,
        requestSentByOpponent: false,
        relationshipId: friendshipStatus.relationshipId
      });

      toast.success(t('notifications.friendRequestAccepted'));
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error(t('notifications.errorAcceptingRequest'));
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleOpenDirectChat = () => {
    if (!opponentProfile) return;
    setShowDirectChat(true);
  };

  const handleOpenTeamChat = async () => {
    if (!notification.team_id || !user?.id) {
      toast.error(t('notifications.missingTeamInfo'));
      return;
    }

    try {
      setIsCreatingTeamChat(true);

      const channelId = await createAndInitializeTeamChat(
        notification.match_id || notification.id,
        notification.tournament_id,
        notification.team_id,
        notification.metadata?.tournament_title || 'Tournament',
        notification.round_number,
        user.id
      );

      setTeamChatChannelId(channelId);
      setShowTeamChat(true);
    } catch (error) {
      console.error('Error opening team chat:', error);
      toast.error(t('notifications.errorOpeningTeamChat'));
    } finally {
      setIsCreatingTeamChat(false);
    }
  };

  const getMatchContextMessage = () => {
    if (!opponentProfile || !notification.metadata?.tournament_title) return undefined;

    return generateMatchContextMessage(
      notification.metadata.tournament_title,
      notification.round_number,
      opponentProfile.username,
      t,
      notification.tournament_id
    );
  };

  const handleViewBracket = () => {
    navigate(`/tournaments/${notification.tournament_id}?tab=bracket`);
    handleClose();
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} ${t('notifications.copied')}`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error(t('notifications.errorSendingRequest'));
    }
  };

  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case 'match_starting':
        return <Swords className="h-8 w-8 text-warning-400" />;
      case 'match_result':
        return notification.match_result === 'won'
          ? <Trophy className="h-8 w-8 text-success-400" />
          : <XCircle className="h-8 w-8 text-error-400" />;
      case 'next_opponent':
        return <Award className="h-8 w-8 text-info-400" />;
      default:
        return <User className="h-8 w-8 text-gray-400" />;
    }
  };

  const getNotificationTitle = () => {
    switch (notification.notification_type) {
      case 'match_starting':
        return t('notifications.yourMatchStarts');
      case 'match_result':
        return notification.match_result === 'won'
          ? t('notifications.victory')
          : notification.match_result === 'lost'
          ? t('notifications.defeat')
          : t('notifications.draw');
      case 'next_opponent':
        return t('notifications.nextOpponent');
      default:
        return t('notifications.notification');
    }
  };

  const formatGameIds = (profile: OpponentProfile | null, tournamentGameIds: GameIdEntry[]) => {
    const formattedIds: Array<{ label: string; value: string; key: string }> = [];

    if (profile?.discord_handle) {
      formattedIds.push({
        label: 'Discord',
        value: profile.discord_handle,
        key: 'discord_handle'
      });
    }

    tournamentGameIds.forEach((gameId) => {
      formattedIds.push({
        label: gameId.label,
        value: gameId.value,
        key: gameId.key
      });
    });

    return formattedIds;
  };

  const gameIds = formatGameIds(opponentProfile, gameSpecificIds);
  const metadata = notification.metadata || {};
  const resultBadgeClass =
    notification.match_result === 'won'
      ? 'bg-success-500 text-white'
      : notification.match_result === 'lost'
      ? 'bg-error-500 text-white'
      : 'bg-gray-500 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-notification-title"
    >
      <div
        className="fixed inset-0 bg-black/75 z-49"
        onClick={handleClose}
      ></div>

      <div
        className={`bg-white dark:bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 relative z-50 transform transition-all duration-300 ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-dark-200 flex items-center justify-center">
                {getNotificationIcon()}
              </div>
              <div>
                <h2
                  id="match-notification-title"
                  className="text-2xl font-heading font-bold text-gray-900 dark:text-white"
                >
                  {getNotificationTitle()}
                </h2>
                {notification.notification_type === 'match_result' && notification.match_result && (
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${resultBadgeClass}`}>
                    {notification.match_result === 'won' ? t('notifications.victory') : notification.match_result === 'lost' ? t('notifications.defeat') : t('notifications.draw')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label={t('notifications.close')}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {metadata.tournament_title && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('notifications.tournament')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {metadata.tournament_title}
              </p>
            </div>
          )}

          {metadata.round_name && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('notifications.round')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Round {notification.round_number} - {metadata.round_name}
              </p>
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-100 dark:bg-dark-200 rounded-lg">
            <p className="text-gray-900 dark:text-white whitespace-pre-line">
              {notification.message}
            </p>
          </div>

          {(opponentProfile?.username || metadata.opponent_username) && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('notifications.opponent')}</p>
              <div className="bg-gray-100 dark:bg-dark-200 rounded-lg overflow-hidden">
                <div className="flex items-center space-x-3 p-3">
                  {opponentProfile?.avatar_url ? (
                    <img
                      src={opponentProfile.avatar_url}
                      alt={opponentProfile?.username || metadata.opponent_username}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary-600/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {opponentProfile?.username || metadata.opponent_username}
                    </p>
                    {opponentProfile?.country && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {opponentProfile.country}
                      </p>
                    )}
                  </div>
                  {friendshipStatus && (
                    <div className="flex items-center space-x-2">
                      {friendshipStatus.areFriends ? (
                        <div className="flex items-center px-3 py-1.5 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-lg text-sm font-medium">
                          <CheckCheck className="h-4 w-4 mr-1" />
                          {t('notifications.friends')}
                        </div>
                      ) : friendshipStatus.requestSentByOpponent ? (
                        <button
                          onClick={handleAcceptFriendRequest}
                          disabled={isSendingRequest}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t('notifications.accept')}
                        </button>
                      ) : friendshipStatus.requestSentByCurrentUser ? (
                        <div className="flex items-center px-3 py-1.5 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-lg text-sm font-medium">
                          <Clock className="h-4 w-4 mr-1" />
                          {t('notifications.pending')}
                        </div>
                      ) : (
                        <button
                          onClick={handleSendFriendRequest}
                          disabled={isSendingRequest || isLoadingFriendship}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {t('notifications.addFriend')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {opponentProfile && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-dark-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleOpenDirectChat}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t('notifications.message')}
                      </button>
                      {notification.team_id && (
                        <button
                          onClick={handleOpenTeamChat}
                          disabled={isCreatingTeamChat}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-secondary-600 hover:bg-secondary-700 disabled:bg-secondary-600/50 text-white rounded-lg transition-colors font-medium"
                        >
                          {isCreatingTeamChat ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          ) : (
                            <Users className="h-4 w-4 mr-2" />
                          )}
                          {t('notifications.teamChat')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameIds.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {t('notifications.opponentGameIds')}
              </p>
              <div className="space-y-2">
                {gameIds.map((gameId) => (
                  <div
                    key={gameId.key}
                    className="flex items-center justify-between p-3 bg-gray-100 dark:bg-dark-200 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {gameId.label}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {gameId.value}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(gameId.value, gameId.label)}
                      className="ml-3 p-2 text-primary-500 hover:text-primary-400 transition-colors"
                      aria-label={`${t('notifications.copy')} ${gameId.label}`}
                    >
                      {copiedField === gameId.label ? (
                        <CheckCircle className="h-5 w-5 text-success-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameIds.length === 0 && (opponentProfile?.username || metadata.opponent_username) && (
            <div className="mb-6 p-4 bg-warning-100 dark:bg-warning-900/20 border border-warning-300 dark:border-warning-700 rounded-lg">
              <p className="text-sm text-warning-800 dark:text-warning-300">
                {t('notifications.opponentNoGameIds')}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-3">
          <button
            onClick={handleViewBracket}
            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-lg transition-colors"
          >
            {t('notifications.viewBracket')}
          </button>
          <button
            onClick={handleMarkAsRead}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            {t('notifications.understood')}
          </button>
        </div>
      </div>

      {showDirectChat && opponentProfile && (
        <ChatModal
          isOpen={showDirectChat}
          onClose={() => setShowDirectChat(false)}
          recipientId={opponentProfile.id}
          recipientName={opponentProfile.username}
          recipientAvatar={opponentProfile.avatar_url}
          initialMessageContent={getMatchContextMessage()}
        />
      )}

      {showTeamChat && teamChatChannelId && (
        <ChannelModal
          isOpen={showTeamChat}
          onClose={() => setShowTeamChat(false)}
          channelId={teamChatChannelId}
        />
      )}
    </div>
  );
};

export default MatchNotificationModal;
