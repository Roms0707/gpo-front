import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface DiscordConnectionRequiredProps {
  variant?: 'banner' | 'modal';
  onClose?: () => void;
  onConnectClick?: () => void | Promise<void>;
  isConnecting?: boolean;
  message?: string;
}

export const DiscordConnectionRequired: React.FC<DiscordConnectionRequiredProps> = ({
  variant = 'banner',
  onClose,
  onConnectClick,
  isConnecting = false,
  message,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { infoSectionTextColor } = useAppConfig();

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
              <AlertCircle className="w-6 h-6 text-accent-500" />
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
                  className="flex-1 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
    <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${!infoSectionTextColor ? 'text-accent-600 dark:text-accent-500' : ''}`}
          style={infoSectionTextColor ? { color: infoSectionTextColor } : undefined}
        />
        <div className="flex-1">
          <h4
            className={`font-semibold mb-1 ${!infoSectionTextColor ? 'text-accent-900 dark:text-accent-100' : ''}`}
            style={infoSectionTextColor ? { color: infoSectionTextColor } : undefined}
          >
            {t('discord.required.title')}
          </h4>
          <p
            className={`text-sm mb-3 ${!infoSectionTextColor ? 'text-accent-800 dark:text-accent-200' : ''}`}
            style={infoSectionTextColor ? { color: infoSectionTextColor } : undefined}
          >
            {message || t('discord.required.description')}
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
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
