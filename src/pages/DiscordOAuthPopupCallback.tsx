import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

type CallbackStatus = 'loading' | 'success' | 'error';

const DiscordOAuthPopupCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState('Connecting to Discord...');

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const error = searchParams.get('error');
    const discordId = searchParams.get('discord_id');
    const discordHandle = searchParams.get('discord_handle');

    const postMessageData = success
      ? {
          type: 'DISCORD_OAUTH_RESULT',
          success: true,
          discord_user: {
            id: discordId,
            handle: discordHandle,
            username: discordHandle,
          },
        }
      : {
          type: 'DISCORD_OAUTH_RESULT',
          success: false,
          error: error || 'Authorization failed',
        };

    if (window.opener) {
      try {
        window.opener.postMessage(postMessageData, window.location.origin);

        if (success) {
          setStatus('success');
          setMessage('Discord account linked successfully!');
        } else {
          setStatus('error');
          setMessage(error || 'Authorization failed');
        }

        setTimeout(() => {
          window.close();
        }, 1000);
      } catch (err) {
        console.error('[DiscordOAuthPopupCallback] Error posting message:', err);
        setStatus('error');
        setMessage('Failed to communicate with parent window');
      }
    } else {
      if (success) {
        setStatus('success');
        setMessage('Discord account linked! You can close this window.');
      } else {
        setStatus('error');
        setMessage(error || 'Authorization failed. You can close this window.');
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="text-center p-8">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-[#5865F2]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>

        <div className="mb-4">
          {status === 'loading' && (
            <Loader className="w-8 h-8 mx-auto text-[#5865F2] animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-8 h-8 mx-auto text-green-400" />
          )}
          {status === 'error' && (
            <XCircle className="w-8 h-8 mx-auto text-red-400" />
          )}
        </div>

        <p className={`text-lg font-medium mb-2 ${
          status === 'success' ? 'text-green-400' :
          status === 'error' ? 'text-red-400' :
          'text-white'
        }`}>
          {message}
        </p>

        <p className="text-gray-400 text-sm">
          {status === 'loading' ? 'Please wait...' : 'This window will close automatically...'}
        </p>
      </div>
    </div>
  );
};

export default DiscordOAuthPopupCallback;
