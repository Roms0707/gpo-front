import React, { useEffect, useRef } from 'react';
import { X, MessageSquare, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DiscordInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  discordUrl: string | null | undefined;
  tournamentTitle: string;
}

const DiscordInviteModal: React.FC<DiscordInviteModalProps> = ({
  isOpen,
  onClose,
  discordUrl,
  tournamentTitle
}) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Set focus to the modal when it opens
      modalRef.current.focus();
      // Scroll to top of the page
      window.scrollTo(0, 0);
    }
  }, [isOpen]);

  if (!isOpen || !discordUrl) return null;

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
        ref={modalRef}
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <MessageSquare className="text-indigo-500 h-5 w-5 mr-2" />
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
              {t('discordInvite.title')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label={t('discordInvite.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 text-indigo-500 rounded-full mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('discordInvite.congratulations')}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: t('discordInvite.nowRegistered', { tournamentTitle }) }} />
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('discordInvite.joinDiscordMessage')}
            </p>
          </div>
          
          <a 
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors"
          >
            <div className="flex items-center justify-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              <span>{t('discordInvite.joinDiscordButton')}</span>
              <ExternalLink className="h-4 w-4 ml-2" />
            </div>
          </a>
          
          <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-gray-300">{t('discordInvite.tipTitle')}</strong> {t('discordInvite.tipMessage')}
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white rounded-lg transition-colors"
          >
            {t('discordInvite.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscordInviteModal;