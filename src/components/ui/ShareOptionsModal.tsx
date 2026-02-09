import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, MessageSquare, Eye, Share2 } from 'lucide-react';

interface ShareOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareWithFriend: () => void;
  onViewPublicProfile: () => void;
  onShareToCommunity: () => void;
}

const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({
  isOpen,
  onClose,
  onShareWithFriend,
  onViewPublicProfile,
  onShareToCommunity
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Prevent clicks inside the modal from closing it
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Share2 className="text-primary-500 h-5 w-5 mr-2" />
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
              {t('shareModal.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label={t('shareModal.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {t('shareModal.description')}
          </p>

          {/* Share with Friend Option */}
          <button
            onClick={() => {
              onShareWithFriend();
              onClose();
            }}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">{t('shareModal.shareWithFriend')}</span>
          </button>

          {/* Share to Community Option */}
          <button
            onClick={() => {
              onShareToCommunity();
              onClose();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">{t('shareModal.shareToCommunity')}</span>
          </button>

          {/* View Public Profile Option */}
          <button
            onClick={() => {
              onViewPublicProfile();
              onClose();
            }}
            className="w-full bg-secondary-600 hover:bg-secondary-700 text-white p-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
          >
            <Eye className="h-5 w-5" />
            <span className="font-medium">{t('shareModal.viewPublicProfile')}</span>
          </button>

          {/* Info text */}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-dark-200 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-gray-300">{t('shareModal.tip')}</strong> {t('shareModal.tipDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareOptionsModal;
