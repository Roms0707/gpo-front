import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { discordVerificationService } from '../../services/discordVerificationService';
import { DiscordVerificationStatus as DiscordStatus } from '../../types';
import toast from 'react-hot-toast';

interface DiscordVerificationStatusProps {
  userId: string;
  tournamentId: string;
  discordHandle?: string;
  onStatusChange?: (status: DiscordStatus) => void;
}

export const DiscordVerificationStatus: React.FC<DiscordVerificationStatusProps> = ({
  userId,
  tournamentId,
  discordHandle,
  onStatusChange,
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<DiscordStatus>({
    isConnected: false,
    isMember: false,
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatus();

    const unsubscribe = discordVerificationService.subscribeToVerificationUpdates(
      userId,
      tournamentId,
      (newStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    );

    return unsubscribe;
  }, [userId, tournamentId]);

  const loadStatus = async () => {
    setIsLoading(true);
    const result = await discordVerificationService.checkVerificationStatus(userId, tournamentId);
    setStatus(result);
    setIsLoading(false);
    onStatusChange?.(result);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await discordVerificationService.verifyDiscordMembership(userId, tournamentId);

      if (result.success) {
        toast.success(t('discord.verification.success'));
        await loadStatus();
      } else {
        toast.error(result.error || t('discord.verification.error'));
      }
    } catch (error) {
      console.error('Error verifying Discord:', error);
      toast.error(t('discord.verification.error'));
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>{t('discord.status.loading')}</span>
      </div>
    );
  }

  if (!status.isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="w-4 h-4 text-accent-500" />
        <span className="text-gray-700 dark:text-gray-300">
          {t('discord.status.notConnected')}
        </span>
      </div>
    );
  }

  if (!status.isMember) {
    if (!discordHandle) return null;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-gray-700 dark:text-gray-300">
            {t('discord.status.notMember', { username: discordHandle })}
          </span>
        </div>
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t('discord.action.verifying')}
            </>
          ) : (
            t('discord.action.verify')
          )}
        </button>
      </div>
    );
  }

  if (!discordHandle) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle className="w-4 h-4 text-green-500" />
      <span className="text-gray-700 dark:text-gray-300">
        {t('discord.status.verified', { username: discordHandle })}
      </span>
      <button
        onClick={handleVerify}
        disabled={isVerifying}
        className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
        title={t('discord.action.refresh')}
      >
        <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
