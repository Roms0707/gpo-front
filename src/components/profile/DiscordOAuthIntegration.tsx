import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader, Link as LinkIcon, Unlink, Copy, Info } from 'lucide-react';
import { discordVerificationService } from '../../services/discordVerificationService';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DiscordOAuthIntegrationProps {
  disabled?: boolean;
}

const DiscordOAuthIntegration: React.FC<DiscordOAuthIntegrationProps> = ({ disabled }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshKlientoUser } = useAuthStore();
  const [isLinked, setIsLinked] = useState(false);
  const [discordInfo, setDiscordInfo] = useState<{ username?: string; id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isKlientoLinked, setIsKlientoLinked] = useState(false);

  useEffect(() => {
    checkDiscordLink();
  }, [user?.discord_user_id, user?.discord_handle]);

  const checkDiscordLink = async () => {
    setIsLoading(true);
    try {
      const hasDiscordInUsersTable = !!(user?.discord_user_id || user?.discord_handle);
      const linkedViaSupabaseAuth = await discordVerificationService.isDiscordLinked();
      const linked = hasDiscordInUsersTable || linkedViaSupabaseAuth;

      setIsLinked(linked);
      setIsKlientoLinked(hasDiscordInUsersTable && !linkedViaSupabaseAuth);

      if (linked) {
        if (hasDiscordInUsersTable) {
          setDiscordInfo({
            username: user?.discord_handle || undefined,
            id: user?.discord_user_id || undefined,
          });
        } else {
          const info = await discordVerificationService.getDiscordIdentity();
          setDiscordInfo(info);
        }
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
    if (!discordInfo?.id && !isKlientoLinked) return;

    const confirmed = window.confirm(t('discord.oauth.unlinkConfirm'));
    if (!confirmed) return;

    setIsUnlinking(true);
    try {
      if (isKlientoLinked && user?.id) {
        const result = await discordVerificationService.unlinkDiscordAccount(user.id);

        if (!result.success) {
          console.error('Error unlinking Discord from users table:', result.error);
          toast.error(t('discord.oauth.unlinkError'));
          return;
        }

        await refreshKlientoUser();
        toast.success(t('discord.oauth.unlinkSuccess'));
        setIsLinked(false);
        setDiscordInfo(null);
        setIsKlientoLinked(false);
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          toast.error(t('discord.oauth.unlinkError'));
          return;
        }

        const discordIdentity = authUser.identities?.find(
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
      }
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

  const maskDiscordId = (id: string): string => {
    if (id.length <= 6) return id;
    return `${id.slice(0, 3)}...${id.slice(-3)}`;
  };

  const handleCopyDiscordId = async () => {
    if (!discordInfo?.id) return;
    try {
      await navigator.clipboard.writeText(discordInfo.id);
      toast.success(t('discord.oauth.userIdCopied'));
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (isLinked) {
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
                {discordInfo?.username || t('discord.oauth.discordConnected')}
              </p>
            </div>
          </div>
        </div>

        {discordInfo?.id && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('discord.oauth.userId')}:
                </span>
                <code className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {maskDiscordId(discordInfo.id)}
                </code>
                <button
                  onClick={handleCopyDiscordId}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title={t('discord.oauth.userId')}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400" />
                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  {t('discord.oauth.userIdTooltip')}
                </div>
              </div>
            </div>
          </div>
        )}

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
