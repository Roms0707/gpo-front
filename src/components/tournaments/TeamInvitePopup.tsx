import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, Share2, Copy, Mail, CheckCircle, Link as LinkIcon, Users, XCircle, Search, Loader2, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { APP_CONFIG } from '../../constants';

interface SearchResult {
  id: string;
  username: string;
  avatar_url: string | null;
  country: string | null;
}

interface TeamInvitePopupProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  tournamentId: string;
  tournamentName: string;
}

const TeamInvitePopup: React.FC<TeamInvitePopupProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  tournamentId,
  tournamentName
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [isTeamLfp, setIsTeamLfp] = useState(false);
  const [isUpdatingLfp, setIsUpdatingLfp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitedPlayerIds, setInvitedPlayerIds] = useState<Set<string>>(new Set());
  const [teamMemberIds, setTeamMemberIds] = useState<Set<string>>(new Set());
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen && teamId) {
      checkTeamLfpStatus();
      loadTeamMemberIds();
      setSearchQuery('');
      setSearchResults([]);
      setInvitedPlayerIds(new Set());
    }
  }, [isOpen, teamId]);

  const loadTeamMemberIds = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error loading team member IDs:', error);
        return;
      }

      setTeamMemberIds(new Set((data || []).map(m => m.user_id)));
    } catch (error) {
      console.error('Error loading team member IDs:', error);
    }
  };

  const searchPlayers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const excludeIds = [...teamMemberIds];
      if (user?.id) excludeIds.push(user.id);

      let q = supabase
        .from('users')
        .select('id, username, avatar_url, country')
        .ilike('username', `%${query.trim()}%`)
        .limit(10);

      if (excludeIds.length > 0) {
        q = q.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
      }

      const { data, error } = await q;

      if (error) {
        console.error('Error searching players:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsSearching(false);
    }
  }, [teamMemberIds, user?.id]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (value.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      searchPlayers(value);
    }, 300);
  };

  const handleInvitePlayer = async (player: SearchResult) => {
    if (!user?.id || sendingInviteId) return;
    setSendingInviteId(player.id);

    try {
      const { data: captainData } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      const captainUsername = captainData?.username || 'Captain';

      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: player.id,
          title: 'notif.team_invite',
          message: `${captainUsername} vous invite a rejoindre l'equipe "${teamName}" pour le tournoi ${tournamentName}`,
          type: 'team_invite',
          link: `/tournaments/${tournamentId}?teamId=${teamId}`,
          related_id: teamId,
          read: false,
          metadata: {
            captain_username: captainUsername,
            team_name: teamName,
            tournament_name: tournamentName
          }
        }]);

      if (error) {
        console.error('Error sending invite notification:', error);
        toast.error(t('teamInvite.inviteError'));
        return;
      }

      setInvitedPlayerIds(prev => new Set([...prev, player.id]));
      toast.success(t('teamInvite.inviteSent', { username: player.username }));
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error(t('teamInvite.inviteError'));
    } finally {
      setSendingInviteId(null);
    }
  };

  const checkTeamLfpStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('is_looking_for_players')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('Error checking LFP status:', error);
        return;
      }

      setIsTeamLfp(data?.is_looking_for_players || false);
    } catch (error) {
      console.error('Error checking LFP status:', error);
    }
  };

  const toggleLfpStatus = async () => {
    try {
      setIsUpdatingLfp(true);

      const newStatus = !isTeamLfp;

      const { error } = await supabase
        .from('teams')
        .update({ is_looking_for_players: newStatus })
        .eq('id', teamId);

      if (error) {
        console.error('Error updating LFP status:', error);
        toast.error(t('teamInvite.errorUpdatingStatus'));
        return;
      }

      setIsTeamLfp(newStatus);
      toast.success(newStatus ? t('teamInvite.teamNowSearching') : t('teamInvite.teamNoLongerSearching'));
    } catch (error) {
      console.error('Error updating LFP status:', error);
      toast.error(t('toast.statusUpdateError'));
    } finally {
      setIsUpdatingLfp(false);
    }
  };

  if (!isOpen) return null;

  // Generate invite link
  const generateInviteLink = (recipientEmail?: string) => {
    const baseUrl = window.location.origin;
    const path = `/tournaments/${tournamentId}`;

    // Add query parameters
    const params = new URLSearchParams();
    params.append('teamId', teamId);

    // Add email parameter if provided
    if (recipientEmail) {
      params.append('email', recipientEmail);
    }

    return `${baseUrl}${path}?${params.toString()}`;
  };

  const handleCopyLink = () => {
    const link = generateInviteLink();
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopied(true);
        toast.success(t('teamInvite.linkCopied'));

        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch(() => {
        toast.error(t('teamInvite.cannotCopyLink'));
      });
  };

  const handleSendEmail = () => {
    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error(t('teamInvite.validEmailRequired'));
      return;
    }

    const link = generateInviteLink(email);
    const subject = encodeURIComponent(t('teamInvite.emailSubject', { teamName, tournamentName }));
    const body = encodeURIComponent(t('teamInvite.emailBody', { teamName, tournamentName, link }));

    // Open mail client with pre-filled content
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);

    toast.success(t('teamInvite.invitePrepared'));
    setEmail('');
  };

  // Prevent clicks inside the modal from closing it
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-300/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Trophy className="text-primary-500 h-5 w-5 mr-2" />
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">{t('teamInvite.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label={t('teamInvite.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-success-600/20 text-success-500 rounded-full mb-4">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('teamInvite.registrationSuccessful')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4" dangerouslySetInnerHTML={{ __html: t('teamInvite.captainOfTeam', { teamName }) }} />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('teamInvite.inviteFriends')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Users className="text-primary-500 h-5 w-5 mr-2" />
              <span className="font-medium text-gray-900 dark:text-white">{teamName}</span>
            </div>

            {/* Team LFP Toggle */}
            <button
              onClick={toggleLfpStatus}
              disabled={isUpdatingLfp}
              className={`w-full py-2 px-3 rounded-lg transition-colors flex items-center justify-center ${
                isTeamLfp
                  ? 'bg-success-600 hover:bg-success-700 text-white'
                  : 'bg-dark-300 hover:bg-dark-400 text-gray-300'
              }`}
            >
              {isUpdatingLfp ? (
                <span className="animate-spin mr-2">⟳</span>
              ) : isTeamLfp ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {isTeamLfp ? t('teamInvite.searchActive') : t('teamInvite.activatePlayerSearch')}
            </button>

            {/* Copy link section */}
            <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
              <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                {t('teamInvite.inviteLinkLabel')}
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 bg-gray-200 dark:bg-dark-300 rounded-lg p-2 px-3 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {generateInviteLink()}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Email invitation section */}
            <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
              <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                {t('teamInvite.inviteByEmail')}
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('teamInvite.emailPlaceholder')}
                  className="flex-1 bg-gray-200 dark:bg-dark-300 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!email}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Player search section */}
          <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
            <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              {t('teamInvite.searchPlayer')}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('teamInvite.searchPlaceholder')}
              className="w-full bg-gray-200 dark:bg-dark-300 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {isSearching && (
                <div className="flex items-center justify-center py-3 text-gray-500 dark:text-gray-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('teamInvite.searching')}
                </div>
              )}
              {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">
                  {t('teamInvite.noResults')}
                </p>
              )}
              {!isSearching && searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  {t('teamInvite.searchMinChars')}
                </p>
              )}
              {searchResults.map((player) => {
                const alreadyInvited = invitedPlayerIds.has(player.id);
                const isSending = sendingInviteId === player.id;
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-dark-300/50 hover:bg-gray-50 dark:hover:bg-dark-300"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {player.username}
                      </p>
                      {player.country && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{player.country}</p>
                      )}
                    </div>
                    {alreadyInvited ? (
                      <span className="text-xs text-success-500 flex items-center gap-1 flex-shrink-0">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {t('teamInvite.alreadyInvited')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInvitePlayer(player)}
                        disabled={isSending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors flex-shrink-0"
                      >
                        {isSending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="h-3.5 w-3.5" />
                        )}
                        {t('teamInvite.invitePlayer')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-info-100 dark:bg-info-500/10 border border-info-300 dark:border-info-600/30 p-3 rounded-lg flex items-start">
            <LinkIcon className="h-5 w-5 text-info-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-info-700 dark:text-info-300 mb-1">
                <strong>{t('teamInvite.noteTitle')}</strong> {t('teamInvite.noteWhenUsingLink')}
              </p>
              <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <li>{t('teamInvite.noteLoggedIn')}</li>
                <li>{t('teamInvite.noteHasAccount')}</li>
                <li>{t('teamInvite.noteNoAccount')}</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {t('teamInvite.shareOnSocial')}
            </p>
            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  const url = encodeURIComponent(generateInviteLink());
                  const text = encodeURIComponent(t('teamInvite.joinMyTeam', { teamName, tournamentName }));
                  window.open(`${APP_CONFIG.SOCIAL_MEDIA.TWITTER_BASE}?text=${text}&url=${url}`, '_blank');
                }}
                className="bg-[#1DA1F2] hover:bg-[#1a94e0] text-white p-2 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = encodeURIComponent(generateInviteLink());
                  window.open(APP_CONFIG.SOCIAL_MEDIA.DISCORD_BASE, '_blank');
                }}
                className="bg-[#5865F2] hover:bg-[#4752d1] text-white p-2 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
                  <path d="M15 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
                  <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-6l-3 3v-3h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = encodeURIComponent(generateInviteLink());
                  const text = encodeURIComponent(t('teamInvite.joinMyTeam', { teamName, tournamentName }));
                  window.open(`${APP_CONFIG.SOCIAL_MEDIA.FACEBOOK_BASE}?u=${url}&quote=${text}`, '_blank');
                }}
                className="bg-[#1877F2] hover:bg-[#166fe0] text-white p-2 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            {t('teamInvite.finish')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamInvitePopup;
