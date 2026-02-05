import React, { useState, useEffect } from 'react';
import { X, MessageSquare, ExternalLink, Copy, CheckCircle, Gamepad2, Key, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tournament, User } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface JoinTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  user: User;
}

interface UserGameAccount {
  id: string;
  value: string;
  game_publisher_ids: {
    label: string;
    id_name: string;
  };
}

const JoinTournamentModal: React.FC<JoinTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  user
}) => {
  const { t } = useTranslation();
  const [userGameAccounts, setUserGameAccounts] = useState<UserGameAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [gameHasApi, setGameHasApi] = useState(false);
  const [privateServerCode, setPrivateServerCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tournament?.game_id) {
      loadUserGameAccounts();
      loadGameApiStatus();
      loadPrivateServerCode();
    }
  }, [isOpen, tournament?.game_id, user?.id]);

  const loadPrivateServerCode = async () => {
    if (!tournament?.id) return;

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('private_server_code')
        .eq('id', tournament.id)
        .single();

      if (error) {
        console.error('Error loading private server code:', error);
        return;
      }

      setPrivateServerCode(data?.private_server_code || null);
    } catch (error) {
      console.error('Error loading private server code:', error);
    }
  };

  const loadGameApiStatus = async () => {
    if (!tournament?.game_id) return;

    try {
      const { data, error } = await supabase
        .from('games')
        .select('has_an_api')
        .eq('id', tournament.game_id)
        .single();

      if (error) {
        console.error('Error loading game API status:', error);
        return;
      }

      setGameHasApi(data?.has_an_api || false);
    } catch (error) {
      console.error('Error loading game API status:', error);
    }
  };

  const loadUserGameAccounts = async () => {
    if (!user?.id || !tournament?.game_id) return;

    try {
      setIsLoadingAccounts(true);

      const { data, error } = await supabase
        .from('game_publisher_id_for_users')
        .select(`
          id,
          value,
          game_publisher_ids:game_publisher_id (
            label,
            id_name
          )
        `)
        .eq('user_id', user.id)
        .eq('game_id', tournament.game_id);

      if (error) {
        console.error('Error loading user game accounts:', error);
        return;
      }

      setUserGameAccounts(data || []);
    } catch (error) {
      console.error('Error loading user game accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleCopyCode = async () => {
    if (!privateServerCode) return;

    try {
      await navigator.clipboard.writeText(privateServerCode);
      setCopiedCode(true);
      toast.success(t('joinTournament.codeCopied'));

      setTimeout(() => {
        setCopiedCode(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying code:', error);
      toast.error(t('joinTournament.cannotCopyCode'));
    }
  };

  const handleCopyAccount = async (accountId: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedAccount(accountId);
      toast.success(t('joinTournament.identifierCopied'));

      setTimeout(() => {
        setCopiedAccount(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying account:', error);
      toast.error(t('joinTournament.cannotCopyIdentifier'));
    }
  };

  if (!isOpen) return null;

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Gamepad2 className="text-accent-600 dark:text-accent-500 h-5 w-5 mr-2" />
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
              {t('joinTournament.title')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label={t('joinTournament.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-600/20 text-success-500 rounded-full mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('joinTournament.tournamentStarted')}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: t('joinTournament.tournamentInProgress', { tournamentTitle: tournament.title }) }} />
            <p className="text-gray-600 dark:text-gray-400">
              {t('joinTournament.useInfoBelow')}
            </p>
          </div>

          {/* Private Server Code */}
          {privateServerCode ? (
            <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Key className="h-5 w-5 text-warning-500 mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">{t('joinTournament.privateServerCode')}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 dark:bg-dark-300 rounded-lg p-3 font-mono text-center text-lg font-bold text-accent-600 dark:text-accent-400">
                  {privateServerCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="bg-accent-600 hover:bg-accent-700 text-white p-3 rounded-lg transition-colors"
                  title={t('joinTournament.copyCode')}
                >
                  {copiedCode ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('joinTournament.useCodeToJoin')}
              </p>
            </div>
          ) : tournament.discord_url ? (
            <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <MessageSquare className="h-5 w-5 text-accent-600 dark:text-accent-500 mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">{t('joinTournament.joinTournamentTitle')}</h4>
              </div>
              <a
                href={tournament.discord_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-accent-600 hover:bg-accent-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors"
              >
                <div className="flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  <span>{t('joinTournament.joinTournamentDiscord')}</span>
                  <ExternalLink className="h-4 w-4 ml-2" />
                </div>
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('joinTournament.joinDiscordInstructions')}
              </p>
            </div>
          ) : null}

          {/* User Game Accounts */}
          {gameHasApi && userGameAccounts.length > 0 && (
            <div className="bg-dark-200 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-info-500 mr-2" />
                <h4 className="font-medium">{t('joinTournament.yourGameIdentifiers')}</h4>
              </div>
              {isLoadingAccounts ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                  <span className="ml-2 text-gray-400">{t('joinTournament.loading')}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {userGameAccounts.map((account) => (
                    <div key={account.id} className="bg-dark-300 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">{account.game_publisher_ids.label}</p>
                          <p className="font-medium">{account.value}</p>
                        </div>
                        <button 
                          onClick={() => handleCopyAccount(account.id, account.value)}
                          className="bg-dark-400 hover:bg-dark-500 text-gray-300 p-2 rounded transition-colors"
                          title={t('joinTournament.copyIdentifier')}
                        >
                          {copiedAccount === account.id ? (
                            <CheckCircle className="h-4 w-4 text-success-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {t('joinTournament.identifiersMayBeNeeded')}
              </p>
            </div>
          )}

          {/* Discord Link */}
          {tournament.discord_url && privateServerCode && (
            <div className="bg-dark-200 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <MessageSquare className="h-5 w-5 text-indigo-500 mr-2" />
                <h4 className="font-medium">{t('joinTournament.tournamentDiscord')}</h4>
              </div>
              <a 
                href={tournament.discord_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors"
              >
                <div className="flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  <span>{t('joinTournament.joinDiscord')}</span>
                  <ExternalLink className="h-4 w-4 ml-2" />
                </div>
              </a>
              <p className="text-xs text-gray-400 mt-2">
                {t('joinTournament.joinDiscordToCommunicate')}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-info-500/10 border border-info-600/30 p-4 rounded-lg">
            <h4 className="font-medium text-info-300 mb-2">{t('joinTournament.instructions')}</h4>
            <ul className="text-sm text-info-200 space-y-1">
              {privateServerCode ? (
                <li>{t('joinTournament.usePrivateServerCode')}</li>
              ) : tournament.discord_url ? (
                <li>{t('joinTournament.joinDiscordForInstructions')}</li>
              ) : null}
              {tournament.discord_url && privateServerCode && (
                <li>{t('joinTournament.joinDiscordToChat')}</li>
              )}
              {userGameAccounts.length > 0 && (
                <li>{t('joinTournament.gameIdentifiersShown')}</li>
              )}
              <li>{t('joinTournament.beReadyOnTime')}</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end bg-white dark:bg-dark-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center whitespace-nowrap"
          >
            {t('joinTournament.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinTournamentModal;