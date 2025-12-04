import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader, Link as LinkIcon, Unlink } from 'lucide-react';
import { discordVerificationService } from '../../services/discordVerificationService';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DiscordOAuthIntegrationProps {
  disabled?: boolean;
}

const DiscordOAuthIntegration: React.FC<DiscordOAuthIntegrationProps> = ({ disabled }) => {
  const { t } = useTranslation();
  const [isLinked, setIsLinked] = useState(false);
  const [discordInfo, setDiscordInfo] = useState<{ username?: string; id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    checkDiscordLink();
  }, []);

  const checkDiscordLink = async () => {
    setIsLoading(true);
    try {
      const linked = await discordVerificationService.isDiscordLinked();
      setIsLinked(linked);

      if (linked) {
        const info = await discordVerificationService.getDiscordIdentity();
        setDiscordInfo(info);
      }
    } catch (error) {
      console.error('Error checking Discord link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'discord',
        options: {
          scopes: 'identify',
        },
      });

      if (error) {
        console.error('Error linking Discord:', error);
        toast.error(t('discord.oauth.linkError'));
        setIsConnecting(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Discord:', error);
      toast.error(t('discord.oauth.linkError'));
      setIsConnecting(false);
    }
  };

  const handleUnlink = async () => {
    if (!discordInfo?.id) return;

    const confirmed = window.confirm(t('discord.oauth.unlinkConfirm'));
    if (!confirmed) return;

    setIsUnlinking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error(t('discord.oauth.unlinkError'));
        return;
      }

      const discordIdentity = user.identities?.find(
        (identity) => identity.provider === 'discord'
      );

      if (!discordIdentity) {
        toast.error(t('discord.oauth.notLinked'));
        return;
      }

      const { error } = await supabase.auth.unlinkIdentity(discordIdentity);

      if (error) {
        console.error('Error unlinking Discord:', error);
        toast.error(t('discord.oauth.unlinkError'));
        return;
      }

      toast.success(t('discord.oauth.unlinkSuccess'));
      setIsLinked(false);
      setDiscordInfo(null);
    } catch (error) {
      console.error('Error unlinking Discord:', error);
      toast.error(t('discord.oauth.unlinkError'));
    } finally {
      setIsUnlinking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isLinked && discordInfo) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                {t('discord.oauth.linkedAs')}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {discordInfo.username}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleUnlink}
          disabled={disabled || isUnlinking}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUnlinking ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {t('discord.oauth.unlinking')}
            </>
          ) : (
            <>
              <Unlink className="w-4 h-4" />
              {t('discord.oauth.unlinkButton')}
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('discord.oauth.linkedHelp')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('discord.oauth.notLinked')}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {t('discord.oauth.notLinkedHelp')}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={disabled || isConnecting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isConnecting ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            {t('discord.oauth.connecting')}
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4" />
            {t('discord.oauth.linkButton')}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('discord.oauth.linkHelp')}
      </p>
    </div>
  );
};

export default DiscordOAuthIntegration;
