import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { FriendRequest } from '../../types';
import { acceptFriendRequest, rejectFriendRequest } from '../../services/api';
import toast from 'react-hot-toast';

interface FriendRequestItemProps {
  request: FriendRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isProcessing?: boolean;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  request,
  onAccept,
  onReject,
  isProcessing = false
}) => {
  const { t } = useTranslation();
  const handleAccept = async () => {
    try {
      await acceptFriendRequest(request.id);
      onAccept(request.id);
      toast.success(t('friends.friendRequestAcceptedSuccess', { username: request.sender_username }));
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error(t('friends.friendRequestAcceptedError'));
    }
  };

  const handleReject = async () => {
    try {
      await rejectFriendRequest(request.id);
      onReject(request.id);
      toast.success(t('friends.friendRequestRejectedSuccess'));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error(t('friends.friendRequestRejectedError'));
    }
  };

  return (
    <div className="bg-dark-200 p-4 rounded-lg hover:bg-dark-300/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
            {request.sender_avatar ? (
              <img
                src={request.sender_avatar}
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <UserPlus className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium">{request.sender_username}</h3>
            <p className="text-xs text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="bg-success-600 hover:bg-success-700 disabled:bg-success-600/50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            title={t('friends.acceptRequest')}
            aria-label={t('friends.acceptRequestFrom', { username: request.sender_username })}
          >
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="bg-error-600 hover:bg-error-700 disabled:bg-error-600/50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            title={t('friends.rejectRequest')}
            aria-label={t('friends.rejectRequestFrom', { username: request.sender_username })}
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendRequestItem;
