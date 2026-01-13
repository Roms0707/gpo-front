import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { discordVerificationService } from '../../services/discordVerificationService';

interface DiscordJoinBannerProps {
  discordUrl: string;
  deadlineAt: Date | null;
  tournamentId: string;
  userId: string;
  isMember: boolean;
  onVerify?: () => void;
}

const DiscordJoinBanner: React.FC<DiscordJoinBannerProps> = ({
  discordUrl,
  deadlineAt,
  tournamentId,
  userId,
  isMember,
  onVerify
}) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    if (!deadlineAt) return null;

    const now = new Date();
    const deadline = new Date(deadlineAt);
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0 };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  }, [deadlineAt]);

  useEffect(() => {
    if (!deadlineAt) return;

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, [deadlineAt, calculateTimeRemaining]);

  const handleVerifyNow = async () => {
    setIsVerifying(true);
    try {
      await discordVerificationService.verifyDiscordMembership(userId, tournamentId);
      if (onVerify) {
        onVerify();
      }
    } catch (error) {
      console.error('Error verifying Discord membership:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isMember) return null;

  const isUrgent = timeRemaining && timeRemaining.hours < 4;
  const isExpired = timeRemaining && timeRemaining.hours === 0 && timeRemaining.minutes === 0;

  return (
    <div className={`rounded-lg p-4 ${isUrgent ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-full ${isUrgent ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            <AlertTriangle className={`h-5 w-5 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
          </div>
          <div>
            <h4 className={`font-semibold ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {t('discordBanner.title')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {isExpired
                ? t('discordBanner.expired')
                : t('discordBanner.description')
              }
            </p>
            {deadlineAt && timeRemaining && !isExpired && (
              <div className="flex items-center mt-2 text-sm">
                <Clock className={`h-4 w-4 mr-1.5 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
                <span className={`font-medium ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {t('discordBanner.timeRemaining', {
                    hours: timeRemaining.hours,
                    minutes: timeRemaining.minutes
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors text-sm"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('discordBanner.joinButton')}
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </a>
          <button
            onClick={handleVerifyNow}
            disabled={isVerifying}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
            {t('discordBanner.verifyButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscordJoinBanner;
