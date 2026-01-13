import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

type CallbackStatus = 'processing' | 'success' | 'error';

interface OAuthState {
  user_id: string;
  timestamp: number;
}

const DiscordOAuthCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [discordUsername, setDiscordUsername] = useState<string>('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processOAuthCallback = async () => {
      const code = searchParams.get('code');
      const stateParam = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || error);
        sendMessageToParent({ success: false, error: errorDescription || error });
        return;
      }

      if (!code || !stateParam) {
        setStatus('error');
        setErrorMessage(t('discordCallback.missingParams'));
        sendMessageToParent({ success: false, error: 'Missing authorization code or state' });
        return;
      }

      let state: OAuthState;
      try {
        state = JSON.parse(decodeURIComponent(stateParam));
      } catch {
        setStatus('error');
        setErrorMessage(t('discordCallback.invalidState'));
        sendMessageToParent({ success: false, error: 'Invalid state parameter' });
        return;
      }

      if (!state.user_id) {
        setStatus('error');
        setErrorMessage(t('discordCallback.missingUserId'));
        sendMessageToParent({ success: false, error: 'Missing user ID in state' });
        return;
      }

      const stateAge = Date.now() - state.timestamp;
      if (stateAge > 600000) {
        setStatus('error');
        setErrorMessage(t('discordCallback.stateExpired'));
        sendMessageToParent({ success: false, error: 'Authorization request expired' });
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const redirectUri = `${window.location.origin}/auth/discord-callback`;

        const response = await fetch(`${supabaseUrl}/functions/v1/discord-oauth-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            code,
            user_id: state.user_id,
            redirect_uri: redirectUri,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || t('discordCallback.linkFailed'));
        }

        setStatus('success');
        setDiscordUsername(result.discord_user?.handle || result.discord_user?.username || '');

        sendMessageToParent({
          success: true,
          discord_user: result.discord_user,
        });

        setTimeout(() => {
          window.close();
        }, 2000);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('discordCallback.unknownError');
        setStatus('error');
        setErrorMessage(message);
        sendMessageToParent({ success: false, error: message });
      }
    };

    processOAuthCallback();
  }, [searchParams, t]);

  const sendMessageToParent = (data: { success: boolean; error?: string; discord_user?: unknown }) => {
    if (window.opener) {
      window.opener.postMessage(
        { type: 'DISCORD_OAUTH_RESULT', ...data },
        window.location.origin
      );
    }
  };

  const handleClose = () => {
    sendMessageToParent({ success: false, error: 'User closed the window' });
    window.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-[#5865F2] rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
          </div>

          {status === 'processing' && (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <Loader2 className="w-12 h-12 text-[#5865F2] animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('discordCallback.processing')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('discordCallback.processingDescription')}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('discordCallback.success')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('discordCallback.successDescription')}
              </p>
              {discordUsername && (
                <p className="text-sm font-medium text-[#5865F2]">
                  @{discordUsername}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                {t('discordCallback.windowClosing')}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('discordCallback.error')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('discordCallback.errorDescription')}
              </p>
              {errorMessage && (
                <p className="text-sm text-red-500 dark:text-red-400 mb-4 break-words">
                  {errorMessage}
                </p>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                {t('common.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscordOAuthCallbackPage;
