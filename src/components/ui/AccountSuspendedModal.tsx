import React, { useState, useEffect, useCallback } from 'react';
import { X, Smartphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SubscriptionStatus } from '../../services/subscriptionService';

interface AccountSuspendedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  subscriptionStatus: SubscriptionStatus;
}

const AccountSuspendedModal: React.FC<AccountSuspendedModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  subscriptionStatus,
}) => {
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  useEffect(() => {
    if (!isOpen) {
      setIsChecking(false);
      setCooldownRemaining(0);
      setMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!subscriptionStatus.isLoading && !subscriptionStatus.isSuspended && isChecking) {
      setMessage({ type: 'success', text: t('subscription.accountReactivated') });
      setIsChecking(false);
      const closeTimer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(closeTimer);
    }
  }, [subscriptionStatus.isLoading, subscriptionStatus.isSuspended, isChecking, onClose, t]);

  const handleTryAgain = useCallback(async () => {
    setIsChecking(true);
    setMessage(null);

    try {
      await onRefresh();

      if (subscriptionStatus.isSuspended) {
        setMessage({ type: 'warning', text: t('subscription.stillSuspended') });
        setCooldownRemaining(5);
        setIsChecking(false);
      }
    } catch (error) {
      const isNetworkError = error instanceof Error &&
        (error.message.includes('network') || error.message.includes('fetch'));

      setMessage({
        type: 'error',
        text: isNetworkError
          ? t('subscription.networkError')
          : t('subscription.checkError')
      });
      setCooldownRemaining(5);
      setIsChecking(false);
    }
  }, [onRefresh, subscriptionStatus.isSuspended, t]);

  if (!isOpen) return null;

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const isButtonDisabled = isChecking || cooldownRemaining > 0 || message?.type === 'success';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
            {t('subscription.suspendedTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-500/20 rounded-full mb-4">
            <Smartphone className="h-10 w-10 text-warning-500" />
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {t('subscription.suspendedMessage')}
          </p>

          {message && (
            <div className={`flex items-center justify-center gap-2 mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-success-500/20 text-success-600 dark:text-success-400'
                : message.type === 'warning'
                ? 'bg-warning-500/20 text-warning-600 dark:text-warning-400'
                : 'bg-error-500/20 text-error-600 dark:text-error-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <button
            onClick={handleTryAgain}
            disabled={isButtonDisabled}
            className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('subscription.checkingStatus')}
              </>
            ) : cooldownRemaining > 0 ? (
              t('subscription.tryAgainIn', { seconds: cooldownRemaining })
            ) : (
              t('subscription.tryAgain')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSuspendedModal;
