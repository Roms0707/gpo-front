import React, { useState } from 'react';
import { X, User, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  opponentId: string;
  opponentUsername: string;
  opponentAvatar: string | null;
  tournamentName: string;
  roundNumber: number;
  onSuccess: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  matchId,
  opponentId,
  opponentUsername,
  opponentAvatar,
  tournamentName,
  roundNumber,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendRequest = async () => {
    if (!user?.id) return;

    try {
      setIsSending(true);

      const defaultMessage = t('postMatchSocial.defaultMessage', { tournamentName, roundNumber });
      const finalMessage = message.trim() || defaultMessage;

      const { error } = await supabase
        .from('match_friend_requests')
        .insert([
          {
            match_id: matchId,
            sender_id: user.id,
            receiver_id: opponentId,
            message: finalMessage,
            status: 'pending'
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          toast.error(t('postMatchSocial.friendRequestAlreadySent'));
        } else {
          throw error;
        }
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(t('postMatchSocial.friendRequestError'));
    } finally {
      setIsSending(false);
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75" onClick={onClose}></div>

      <div
        className="bg-white dark:bg-dark-100 rounded-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800 relative z-[61]"
        onClick={stopPropagation}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('postMatchSocial.sendFriendRequest')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-dark-200 overflow-hidden flex-shrink-0">
              {opponentAvatar ? (
                <img src={opponentAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <User className="h-8 w-8" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {opponentUsername}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tournamentName} - {t('postMatchSocial.roundLabel')} {roundNumber}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('postMatchSocial.addPersonalMessage')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('postMatchSocial.defaultMessagePlaceholder', { tournamentName })}
              className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={4}
              maxLength={500}
              disabled={isSending}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('postMatchSocial.charactersCount', { count: message.length, max: 500 })}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isSending}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSendRequest}
              disabled={isSending}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors font-medium"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  {t('postMatchSocial.sendRequest')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
