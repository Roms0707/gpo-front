import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DiscordConnectionRequiredProps {
  variant?: 'banner' | 'modal';
  onClose?: () => void;
  onConnectClick?: () => void | Promise<void>;
  isConnecting?: boolean;
}

export const DiscordConnectionRequired: React.FC<DiscordConnectionRequiredProps> = ({
  variant = 'banner',
  onClose,
  onConnectClick,
  isConnecting = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    navigate('/profile/edit');
    onClose?.();
  };

  const handleConnect = async () => {
    if (onConnectClick) {
      // Use custom handler if provided (for direct OAuth)
      await onConnectClick();
    } else {
      // Default behavior: navigate to profile edit
      handleGoToProfile();
    }
  };

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('discord.required.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('discord.required.description')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      {t('discord.oauth.connecting')}
                    </>
                  ) : (
                    t('discord.required.connectButton')
                  )}
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    disabled={isConnecting}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
            {t('discord.required.title')}
          </h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            {t('discord.required.description')}
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t('discord.oauth.connecting')}
              </>
            ) : (
              t('discord.required.connectButton')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
