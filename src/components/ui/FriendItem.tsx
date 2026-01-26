import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, UserMinus, MessageSquare, Shield } from 'lucide-react';
import { UserRelationship } from '../../types';
import { removeRelationship } from '../../services/api';
import toast from 'react-hot-toast';
import { countries } from '../../utils/countries';
import ChatModal from '../chat/ChatModal';

interface FriendItemProps {
  relationship: UserRelationship;
  onRemove: (relationshipId: string) => void;
  isProcessing?: boolean;
}

const FriendItem: React.FC<FriendItemProps> = ({
  relationship,
  onRemove,
  isProcessing = false
}) => {
  const { t } = useTranslation();
  const { related_user } = relationship;
  const [showChatModal, setShowChatModal] = useState(false);

  if (!related_user) {
    return null;
  }

  const handleRemove = async () => {
    try {
      await removeRelationship(relationship.id);
      onRemove(relationship.id);
      toast.success(t('friends.friendRemovedSuccess', { username: related_user.username }));
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error(t('friends.removeFriendError'));
    }
  };

  // Get country name from country code
  const getCountryName = (countryCode?: string) => {
    if (!countryCode) return null;
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  return (
    <>
      <div className="bg-dark-200 p-4 rounded-lg hover:bg-dark-300/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
              {related_user.avatar_url ? (
                <img
                  src={related_user.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                  aria-hidden="true"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{related_user.username}</h3>
              {related_user.country && (
                <p className="text-xs text-gray-400">
                  {getCountryName(related_user.country)}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowChatModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
              title={t('friends.sendMessage')}
              aria-label={t('friends.sendMessageTo', { username: related_user.username })}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleRemove}
              disabled={isProcessing}
              className="bg-dark-300 hover:bg-dark-400 disabled:bg-dark-300/50 disabled:cursor-not-allowed text-gray-300 p-2 rounded-lg transition-colors"
              title={t('friends.removeFriend')}
              aria-label={t('friends.removeFriendFrom', { username: related_user.username })}
            >
              <UserMinus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        recipientId={related_user.id}
        recipientName={related_user.username}
        recipientAvatar={related_user.avatar_url}
      />
    </>
  );
};

export default FriendItem;
