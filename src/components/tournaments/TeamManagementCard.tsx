import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Crown, UserPlus, MessageSquare, ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ChannelModal from '../chat/ChannelModal';
import { getGameTheme } from '../../utils/gameThemes';
import { createChannel, joinChannel } from '../../services/channelService';
import toast from 'react-hot-toast';

interface TeamManagementCardProps {
  userTeamId: string;
  userTeamName: string;
  isTeamCaptain: boolean;
  currentTeamSize: number;
  maxTeamSize: number | null;
  isLoadingTeamInfo: boolean;
  gameName: string;
  onTeamInvite: () => void;
}

interface TeamMember {
  id: string;
  username: string;
  avatar_url: string | null;
  is_captain: boolean;
}

const TeamManagementCard: React.FC<TeamManagementCardProps> = ({
  userTeamId,
  userTeamName,
  isTeamCaptain,
  currentTeamSize,
  maxTeamSize,
  isLoadingTeamInfo,
  gameName,
  onTeamInvite
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showTeamChatModal, setShowTeamChatModal] = useState(false);
  const [teamChatChannelId, setTeamChatChannelId] = useState<string | null>(null);
  const [teamChatChannelName, setTeamChatChannelName] = useState<string>('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const gameTheme = getGameTheme(gameName);

  const handleCreateTeamChat = async () => {
    if (isCreatingChat || !userTeamId) return;
    setIsCreatingChat(true);

    try {
      const channelName = `Team ${userTeamName || 'Chat'}`;
      const channel = await createChannel(channelName, '', true, false);
      if (!channel) {
        toast.error(t('tournamentPage.sidebar.chatCreateError'));
        return;
      }

      const { error: updateError } = await supabase
        .from('teams')
        .update({ chat_channel_id: channel.id })
        .eq('id', userTeamId);

      if (updateError) {
        console.error('Error updating team chat_channel_id:', updateError);
        toast.error(t('tournamentPage.sidebar.chatCreateError'));
        return;
      }

      for (const member of teamMembers) {
        if (!member.is_captain) {
          try {
            await joinChannel(channel.id, member.id);
          } catch (err) {
            console.error(`Error adding member ${member.id} to channel:`, err);
          }
        }
      }

      setTeamChatChannelId(channel.id);
      setTeamChatChannelName(channelName);
      toast.success(t('tournamentPage.sidebar.chatCreated'));
    } catch (error) {
      console.error('Error creating team chat:', error);
      toast.error(t('tournamentPage.sidebar.chatCreateError'));
    } finally {
      setIsCreatingChat(false);
    }
  };

  useEffect(() => {
    const loadTeamData = async () => {
      if (!userTeamId) return;

      try {
        const { data, error } = await supabase
          .from('teams')
          .select(`
            chat_channel_id,
            channels:chat_channel_id (
              name,
              description
            )
          `)
          .eq('id', userTeamId)
          .single();

        if (error) {
          console.error('Error loading team data:', error);
          return;
        }

        if (data?.chat_channel_id) {
          setTeamChatChannelId(data.chat_channel_id);
          setTeamChatChannelName(data.channels?.name || 'Team Chat');
        }
      } catch (error) {
        console.error('Error loading team data:', error);
      }
    };

    loadTeamData();
  }, [userTeamId]);

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!userTeamId || !isExpanded) return;

      setIsLoadingMembers(true);
      try {
        const { data: teamData } = await supabase
          .from('teams')
          .select('captain_id')
          .eq('id', userTeamId)
          .maybeSingle();

        const { data, error } = await supabase
          .from('team_members')
          .select(`
            user_id,
            role,
            users:user_id (
              id,
              username,
              avatar_url
            )
          `)
          .eq('team_id', userTeamId)
          .eq('status', 'accepted');

        if (error) {
          console.error('Error loading team members:', error);
          return;
        }

        const members: TeamMember[] = (data || [])
          .map(member => ({
            id: member.users?.id || '',
            username: member.users?.username || 'Unknown',
            avatar_url: member.users?.avatar_url || null,
            is_captain: member.role === 'captain' || member.user_id === teamData?.captain_id
          }))
          .sort((a, b) => {
            if (a.is_captain && !b.is_captain) return -1;
            if (!a.is_captain && b.is_captain) return 1;
            return a.username.localeCompare(b.username);
          });

        setTeamMembers(members);
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadTeamMembers();
  }, [userTeamId, isExpanded]);

  return (
    <>
      <div
        className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border transition-all duration-300"
        style={{
          borderColor: `${gameTheme.colors.primary}30`
        }}
      >
        <div
          className="px-4 py-3 border-b flex items-center justify-between cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${gameTheme.colors.primary}10 0%, ${gameTheme.colors.secondary}05 100%)`,
            borderColor: `${gameTheme.colors.primary}20`
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${gameTheme.colors.primary}20` }}
            >
              <Users className="h-5 w-5" style={{ color: gameTheme.colors.primary }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {userTeamName || t('tournamentPage.team')}
                {isTeamCaptain && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: `${gameTheme.colors.primary}20`,
                      color: gameTheme.colors.primary
                    }}
                  >
                    <Crown className="h-3 w-3" />
                    {t('tournamentPage.captain')}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoadingTeamInfo ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `${currentTeamSize}${maxTeamSize ? `/${maxTeamSize}` : ''} ${t('tournamentPage.members')}`
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
          <div className="p-4 space-y-4">
            {isLoadingMembers ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-primary-500" />
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-dark-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                      {member.username}
                    </span>
                    {member.is_captain && (
                      <Crown className="h-4 w-4" style={{ color: gameTheme.colors.primary }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {teamChatChannelId ? (
                <button
                  onClick={() => setShowTeamChatModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: `${gameTheme.colors.primary}15`,
                    color: gameTheme.colors.primary
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('tournamentPage.sidebar.teamChat')}
                </button>
              ) : isTeamCaptain ? (
                <button
                  onClick={handleCreateTeamChat}
                  disabled={isCreatingChat}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: `${gameTheme.colors.primary}15`,
                    color: gameTheme.colors.primary
                  }}
                >
                  {isCreatingChat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isCreatingChat
                    ? t('tournamentPage.sidebar.creatingChat')
                    : t('tournamentPage.sidebar.createTeamChat')}
                </button>
              ) : null}
              {isTeamCaptain && (
                <button
                  onClick={onTeamInvite}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{
                    backgroundColor: gameTheme.colors.primary
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  {t('tournamentPage.invitePlayers')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {teamChatChannelId && (
        <ChannelModal
          isOpen={showTeamChatModal}
          onClose={() => setShowTeamChatModal(false)}
          channelId={teamChatChannelId}
          channelName={teamChatChannelName}
        />
      )}
    </>
  );
};

export default TeamManagementCard;
