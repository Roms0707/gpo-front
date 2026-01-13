import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageSquare, ExternalLink, AlertTriangle, Clock, CheckCircle, AlertOctagon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

interface DiscordInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: () => void;
  discordUrl: string | null | undefined;
  tournamentTitle: string;
  deadlineAt?: Date | null;
  isMandatory?: boolean;
  registrationId?: string | null;
  userId?: string | null;
}

const DiscordInviteModal: React.FC<DiscordInviteModalProps> = ({
  isOpen,
  onClose,
  onAcknowledge,
  discordUrl,
  tournamentTitle,
  deadlineAt,
  isMandatory = true,
  registrationId,
  userId
}) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [hasClickedJoinButton, setHasClickedJoinButton] = useState(false);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    if (!deadlineAt) return null;

    const now = new Date();
    const deadline = new Date(deadlineAt);
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  }, [deadlineAt]);

  useEffect(() => {
    if (!isOpen || !deadlineAt) return;

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, deadlineAt, calculateTimeRemaining]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
      window.scrollTo(0, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasClickedJoinButton(false);
      setHasAcknowledgedWarning(false);
    }
  }, [isOpen]);

  if (!isOpen || !discordUrl) return null;

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleJoinDiscord = async () => {
    window.open(discordUrl, '_blank', 'noopener,noreferrer');
    setHasClickedJoinButton(true);

    if (registrationId) {
      try {
        await supabase
          .from('tournament_registrations')
          .update({ discord_join_clicked_at: new Date().toISOString() })
          .eq('id', registrationId);
      } catch (error) {
        console.error('[DiscordInviteModal] Error saving discord_join_clicked_at:', error);
      }
    }
  };

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge();
    }
    onClose();
  };

  const canClose = hasClickedJoinButton && hasAcknowledgedWarning;
  const isUrgent = timeRemaining && timeRemaining.hours < 4;
  const isExpired = timeRemaining && timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={isMandatory && !canClose ? stopPropagation : onClose}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-2xl"
        onClick={stopPropagation}
        tabIndex={-1}
      >
        <div className="bg-red-600 p-4">
          <div className="flex items-center justify-center">
            <AlertOctagon className="h-6 w-6 mr-2 text-white" />
            <h2 className="font-heading font-bold text-xl text-white">
              {t('discordInvite.mandatory.disqualificationWarning')}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-[#5865F2]/20 text-[#5865F2]">
              <MessageSquare className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {t('discordInvite.congratulations')}
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: t('discordInvite.nowRegistered', { tournamentTitle }) }} />
          </div>

          <div className="bg-red-600/10 border-2 border-red-600 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 mt-0.5 mr-3 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-bold text-red-600 dark:text-red-500 text-lg">
                  {t('discordInvite.mandatory.willBeDisqualified')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t('discordInvite.mandatory.warningDetails')}
                </p>
              </div>
            </div>
          </div>

          {deadlineAt && timeRemaining && !isExpired && (
            <div className={`rounded-lg p-4 ${isUrgent ? 'bg-red-500/10 border border-red-500/30' : 'bg-gray-100 dark:bg-dark-200'}`}>
              <div className="flex items-center justify-center mb-2">
                <Clock className={`h-5 w-5 mr-2 ${isUrgent ? 'text-red-500' : 'text-primary-500'}`} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('discordInvite.mandatory.timeRemaining')}
                </span>
              </div>
              <div className="flex justify-center gap-3">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${isUrgent ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">{t('discordInvite.mandatory.hours')}</div>
                </div>
                <div className={`text-3xl font-bold ${isUrgent ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>:</div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${isUrgent ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">{t('discordInvite.mandatory.minutes')}</div>
                </div>
                <div className={`text-3xl font-bold ${isUrgent ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>:</div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${isUrgent ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">{t('discordInvite.mandatory.seconds')}</div>
                </div>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-600 dark:text-red-400 font-semibold">
                {t('discordInvite.mandatory.expired')}
              </p>
            </div>
          )}

          <button
            onClick={handleJoinDiscord}
            className={`w-full py-4 px-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center relative overflow-hidden ${
              hasClickedJoinButton
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-[#5865F2] hover:bg-[#4752C4] text-white animate-pulse shadow-lg shadow-[#5865F2]/50'
            }`}
          >
            {hasClickedJoinButton ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>{t('discordInvite.mandatory.joinedButton')}</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5 mr-2" />
                <span>{t('discordInvite.joinDiscordButton')}</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </>
            )}
          </button>

          <div className={`p-4 rounded-lg border-2 transition-colors ${
            hasAcknowledgedWarning
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
          }`}>
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={hasAcknowledgedWarning}
                onChange={(e) => setHasAcknowledgedWarning(e.target.checked)}
                className="mt-1 mr-3 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className={`text-sm font-medium ${
                hasAcknowledgedWarning
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}>
                {t('discordInvite.mandatory.acknowledgeCheckbox')}
              </span>
            </label>
          </div>

          <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-gray-300">{t('discordInvite.tipTitle')}</strong> {t('discordInvite.mandatory.tipMessage')}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          {!canClose && (
            <p className="text-center text-sm text-amber-600 dark:text-amber-400">
              {!hasClickedJoinButton
                ? t('discordInvite.mandatory.mustJoinFirst')
                : t('discordInvite.mandatory.mustAcknowledge')
              }
            </p>
          )}
          <button
            onClick={handleAcknowledge}
            disabled={!canClose}
            className={`w-full px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center text-sm ${
              canClose
                ? 'bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300'
                : 'bg-gray-100 dark:bg-dark-300 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('discordInvite.mandatory.remindLater')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscordInviteModal;
