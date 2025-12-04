import React, { useState, useEffect } from 'react';
import { UserPlus, MessageCircle, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import AddFriendModal from './AddFriendModal';
import TeamChatModal from './TeamChatModal';

interface PostMatchSocialPanelProps {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  roundNumber: number;
  opponentId: string | null;
  userTeamId: string | null;
  onClose: () => void;
}

interface OpponentProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  country: string | null;
}

interface FriendRequestStatus {
  exists: boolean;
  status: 'pending' | 'accepted' | 'rejected' | null;
  sentByCurrentUser: boolean;
}

const PostMatchSocialPanel: React.FC<PostMatchSocialPanelProps> = ({
  matchId,
  tournamentId,
  tournamentName,
  roundNumber,
  opponentId,
  userTeamId,
  onClose
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [opponent, setOpponent] = useState<OpponentProfile | null>(null);
  const [friendRequestStatus, setFriendRequestStatus] = useState<FriendRequestStatus>({
    exists: false,
    status: null,
    sentByCurrentUser: false
  });
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showTeamChatModal, setShowTeamChatModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (opponentId) {
      loadOpponentData();
      checkFriendRequestStatus();
    } else {
      setIsLoading(false);
    }
  }, [opponentId]);

  const loadOpponentData = async () => {
    if (!opponentId) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, country')
        .eq('id', opponentId)
        .maybeSingle();

      if (error) throw error;
      if (data) setOpponent(data);
    } catch (error) {
      console.error('Error loading opponent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFriendRequestStatus = async () => {
    if (!opponentId || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('match_friend_requests')
        .select('status, sender_id')
        .eq('match_id', matchId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${opponentId},receiver_id.eq.${opponentId}`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFriendRequestStatus({
          exists: true,
          status: data.status as 'pending' | 'accepted' | 'rejected',
          sentByCurrentUser: data.sender_id === user.id
        });
      }
    } catch (error) {
      console.error('Error checking friend request status:', error);
    }
  };

  const handleAddFriend = () => {
    setShowAddFriendModal(true);
  };

  const handleOpenTeamChat = () => {
    if (!userTeamId) {
      toast.error(t('postMatchSocial.notPartOfTeam'));
      return;
    }
    setShowTeamChatModal(true);
  };

  const handleFriendRequestSent = () => {
    setFriendRequestStatus({
      exists: true,
      status: 'pending',
      sentByCurrentUser: true
    });
    setShowAddFriendModal(false);
    toast.success(t('postMatchSocial.friendRequestSentSuccess'));
  };

  const renderFriendButton = () => {
    if (!opponentId) return null;

    if (friendRequestStatus.exists) {
      if (friendRequestStatus.status === 'accepted') {
        return (
          <div className="flex items-center justify-center px-4 py-3 bg-green-500/20 text-green-400 rounded-lg">
            <UserPlus className="h-5 w-5 mr-2" />
            <span>{t('postMatchSocial.alreadyFriends')}</span>
          </div>
        );
      }

      if (friendRequestStatus.status === 'pending') {
        return (
          <div className="flex items-center justify-center px-4 py-3 bg-yellow-500/20 text-yellow-400 rounded-lg">
            <UserPlus className="h-5 w-5 mr-2" />
            <span>{friendRequestStatus.sentByCurrentUser ? t('postMatchSocial.requestSent') : t('postMatchSocial.requestPending')}</span>
          </div>
        );
      }
    }

    return (
      <button
        onClick={handleAddFriend}
        className="flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors w-full"
      >
        <UserPlus className="h-5 w-5 mr-2" />
        <span>{t('postMatchSocial.addAsFriend', { username: opponent?.username })}</span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
        <div className="bg-white dark:bg-dark-100 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
        <div className="bg-white dark:bg-dark-100 rounded-xl max-w-lg w-full mx-4 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('postMatchSocial.title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {t('postMatchSocial.greatMatch', { tournamentName, roundNumber })}
              </p>
            </div>

            <div className="space-y-4">
              {opponentId && opponent && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('postMatchSocial.connectWithOpponent')}
                  </h3>
                  {renderFriendButton()}
                </div>
              )}

              {userTeamId && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('postMatchSocial.teamCommunication')}
                  </h3>
                  <button
                    onClick={handleOpenTeamChat}
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    <span>{t('postMatchSocial.openTeamChat')}</span>
                  </button>
                </div>
              )}

              {!opponentId && !userTeamId && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('postMatchSocial.noSocialFeatures')}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                {t('postMatchSocial.continue')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddFriendModal && opponentId && opponent && (
        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          matchId={matchId}
          opponentId={opponentId}
          opponentUsername={opponent.username}
          opponentAvatar={opponent.avatar_url}
          tournamentName={tournamentName}
          roundNumber={roundNumber}
          onSuccess={handleFriendRequestSent}
        />
      )}

      {showTeamChatModal && userTeamId && (
        <TeamChatModal
          isOpen={showTeamChatModal}
          onClose={() => setShowTeamChatModal(false)}
          matchId={matchId}
          tournamentId={tournamentId}
          teamId={userTeamId}
          tournamentName={tournamentName}
          roundNumber={roundNumber}
        />
      )}
    </>
  );
};

export default PostMatchSocialPanel;
