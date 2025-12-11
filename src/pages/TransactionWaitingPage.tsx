import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAppConfig } from '../contexts/AppConfigContext';
import CompleteProfileModal from '../components/profile/CompleteProfileModal';

const POLL_INTERVAL = 1500;
const MAX_POLL_DURATION = 120000;

type VerificationStatus = 'verifying' | 'success' | 'timeout' | 'error' | 'missing_params';

const TransactionWaitingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginTransactionUser, user } = useAuthStore();
  const { brandName, accentColor } = useAppConfig();

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const isPollingRef = useRef(false);

  const operationId = searchParams.get('operationId');
  const offerId = searchParams.get('offerId');

  const clearIntervals = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const verifyTransaction = useCallback(async () => {
    if (!operationId || !offerId) return;

    try {
      const result = await loginTransactionUser(operationId, offerId);

      if (result.isPending) {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= MAX_POLL_DURATION) {
          clearIntervals();
          setStatus('timeout');
        }
        return;
      }

      clearIntervals();

      if (result.user) {
        setStatus('success');
        if (!result.user.is_profile_completed) {
          setShowCompleteProfile(true);
        } else {
          setTimeout(() => navigate('/'), 1500);
        }
      } else if (result.error) {
        setStatus('error');
        setErrorMessage(result.error);
      }
    } catch (err) {
      clearIntervals();
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [operationId, offerId, loginTransactionUser, navigate, clearIntervals]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;

    isPollingRef.current = true;
    startTimeRef.current = Date.now();
    setStatus('verifying');
    setElapsedTime(0);
    setErrorMessage(null);

    verifyTransaction();

    pollIntervalRef.current = setInterval(verifyTransaction, POLL_INTERVAL);

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);

      if (elapsed >= MAX_POLL_DURATION) {
        clearIntervals();
        setStatus('timeout');
      }
    }, 100);
  }, [verifyTransaction, clearIntervals]);

  useEffect(() => {
    if (!operationId || !offerId) {
      setStatus('missing_params');
      return;
    }

    startPolling();

    return () => {
      clearIntervals();
    };
  }, [operationId, offerId, startPolling, clearIntervals]);

  const handleRetry = () => {
    startPolling();
  };

  const progressPercentage = Math.min((elapsedTime / MAX_POLL_DURATION) * 100, 100);
  const remainingSeconds = Math.max(0, Math.ceil((MAX_POLL_DURATION - elapsedTime) / 1000));

  const renderContent = () => {
    switch (status) {
      case 'missing_params':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('transactionWaiting.missingParams')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('transactionWaiting.missingParamsDescription')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              {t('transactionWaiting.goToLogin')}
            </button>
          </div>
        );

      case 'verifying':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div
                className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"
              />
              <div
                className="absolute inset-0 rounded-full border-4 border-t-primary-500 animate-spin"
                style={{ borderTopColor: accentColor || undefined }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-pulse" style={{ color: accentColor || undefined }} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('transactionWaiting.verifying')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('transactionWaiting.verifyingDescription')}
            </p>

            <div className="w-full max-w-xs mx-auto mb-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-100 ease-linear"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: accentColor || undefined
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              <span>
                {t('transactionWaiting.timeRemaining', { seconds: remainingSeconds })}
              </span>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('transactionWaiting.success')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {showCompleteProfile
                ? t('transactionWaiting.completeProfilePrompt')
                : t('transactionWaiting.redirecting')
              }
            </p>
          </div>
        );

      case 'timeout':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('transactionWaiting.timeout')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('transactionWaiting.timeoutDescription')}
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('transactionWaiting.retry')}
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('transactionWaiting.error')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t('transactionWaiting.errorDescription')}
            </p>
            {errorMessage && (
              <p className="text-sm text-red-500 dark:text-red-400 mb-6">
                {errorMessage}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="inline-flex items-center justify-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('transactionWaiting.retry')}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('transactionWaiting.goToLogin')}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {brandName || t('transactionWaiting.defaultBrand')}
            </h1>
          </div>

          {renderContent()}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t('transactionWaiting.secureConnection')}
        </p>
      </div>

      {showCompleteProfile && user && (
        <CompleteProfileModal
          isOpen={showCompleteProfile}
          currentUsername={user.username}
          currentAvatarUrl={user.avatar_url}
          currentBio={user.bio}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default TransactionWaitingPage;
