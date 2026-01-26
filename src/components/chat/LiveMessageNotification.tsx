import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MessageSquare, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
  file_url?: string;
  file_name?: string;
  file_type?: string;
}

interface LiveMessageNotificationProps {
  message: Message;
  onClose: () => void;
  onClick: () => void;
}

const LiveMessageNotification: React.FC<LiveMessageNotificationProps> = ({
  message,
  onClose,
  onClick
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Wait for animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch (error) {
      return t('chat.justNow');
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  // Truncate message content if it's too long
  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={`fixed bottom-24 right-6 z-40 max-w-sm w-full bg-dark-100 rounded-lg shadow-lg border border-gray-800 transform transition-all duration-300 cursor-pointer ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
      onClick={onClick}
      role="alert"
      aria-live="polite"
      tabIndex={0}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-dark-200 flex items-center justify-center overflow-hidden">
              {message.sender?.avatar_url ? (
                <img
                  src={message.sender.avatar_url}
                  alt={message.sender.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <h3 className="font-medium text-white flex items-center">
                <MessageSquare className="h-4 w-4 text-primary-500 mr-1" />
                {message.sender?.username || t('chat.user')}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {message.file_url ? (
                <span className="flex items-center">
                  <span className="bg-primary-600/20 text-primary-400 text-xs px-2 py-0.5 rounded mr-2">
                    {t('chat.file')}
                  </span>
                  {truncateContent(message.content)}
                </span>
              ) : (
                truncateContent(message.content)
              )}
            </p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">
                {formatTimeAgo(message.created_at)}
              </span>
              <span className="text-primary-500 hover:text-primary-400 text-xs">
                {t('chat.reply')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMessageNotification;
