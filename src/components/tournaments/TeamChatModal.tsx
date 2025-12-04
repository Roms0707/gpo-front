import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface TeamChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  tournamentId: string;
  teamId: string;
  tournamentName: string;
  roundNumber: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface TeamMember {
  id: string;
  username: string;
  avatar_url: string | null;
}

const TeamChatModal: React.FC<TeamChatModalProps> = ({
  isOpen,
  onClose,
  matchId,
  tournamentId,
  teamId,
  tournamentName,
  roundNumber
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadTeamMembers();
      loadMessages();
      initializeChat();

      const subscription = supabase
        .channel(`team-chat-${matchId}-${teamId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'match_team_chat_messages',
          filter: `match_id=eq.${matchId},team_id=eq.${teamId}`
        }, handleNewMessage)
        .subscribe();

      if (inputRef.current) {
        inputRef.current.focus();
      }

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [isOpen, user?.id, matchId, teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          users:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (error) throw error;

      const members = (data || []).map(item => ({
        id: item.users.id,
        username: item.users.username,
        avatar_url: item.users.avatar_url
      }));

      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('match_team_chat_messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          sender:sender_id(username, avatar_url)
        `)
        .eq('match_id', matchId)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      if (data && data.length > 0 && user?.id) {
        for (const msg of data) {
          if (msg.sender_id !== user.id) {
            await markMessageAsRead(msg.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeChat = async () => {
    try {
      const { data: existingMessages, error: checkError } = await supabase
        .from('match_team_chat_messages')
        .select('id')
        .eq('match_id', matchId)
        .eq('team_id', teamId)
        .limit(1);

      if (checkError) throw checkError;

      if (!existingMessages || existingMessages.length === 0) {
        await sendWelcomeMessage();
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendWelcomeMessage = async () => {
    if (!user?.id) return;

    try {
      const welcomeContent = `${t('postMatchSocial.teamChatCreated')}\n\n${t('postMatchSocial.tournamentLabel')}: ${tournamentName}\n${t('postMatchSocial.roundLabel')}: ${roundNumber}\n\n${t('postMatchSocial.teamMembersLabel')}:\n${teamMembers.map((m, i) => `${i + 1}. ${m.username}`).join('\n')}\n\n${t('postMatchSocial.goodLuck')}`;

      const { error } = await supabase
        .from('match_team_chat_messages')
        .insert([
          {
            match_id: matchId,
            team_id: teamId,
            sender_id: user.id,
            content: welcomeContent
          }
        ]);

      if (error && error.code !== '23505') {
        console.error('Error sending welcome message:', error);
      }
    } catch (error) {
      console.error('Error in sendWelcomeMessage:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('match_team_chat_read_status')
        .insert([
          {
            message_id: messageId,
            user_id: user.id
          }
        ]);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleNewMessage = (payload: any) => {
    const newMessage = payload.new as ChatMessage;

    if (newMessage.sender_id === user?.id) {
      return;
    }

    const member = teamMembers.find(m => m.id === newMessage.sender_id);
    newMessage.sender = member ? {
      username: member.username,
      avatar_url: member.avatar_url
    } : {
      username: t('postMatchSocial.unknown'),
      avatar_url: null
    };

    setMessages(prev => [...prev, newMessage]);

    if (user?.id) {
      markMessageAsRead(newMessage.id);
    }
  };

  const sendMessage = async () => {
    if (!user?.id || !newMessage.trim()) return;

    try {
      setIsSending(true);

      const { data, error } = await supabase
        .from('match_team_chat_messages')
        .insert([
          {
            match_id: matchId,
            team_id: teamId,
            sender_id: user.id,
            content: newMessage.trim()
          }
        ])
        .select(`
          id,
          sender_id,
          content,
          created_at
        `)
        .single();

      if (error) throw error;

      if (data) {
        const messageWithSender: ChatMessage = {
          ...data,
          sender: {
            username: user.username,
            avatar_url: user.avatar_url || null
          }
        };

        setMessages(prev => [...prev, messageWithSender]);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('postMatchSocial.messageSendError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(date, { addSuffix: true });
      }

      return date.toLocaleDateString();
    } catch (error) {
      return t('postMatchSocial.unknownDate');
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75" onClick={onClose}></div>

      <div
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800 relative z-[61]"
        onClick={stopPropagation}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{t('postMatchSocial.teamChat')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tournamentName} - {t('postMatchSocial.roundLabel')} {roundNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-200/50"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : messages.length > 0 ? (
            <>
              {messages.map((message) => {
                const isCurrentUser = message.sender_id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-end max-w-[80%]">
                      {!isCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mr-2 flex-shrink-0">
                          {message.sender?.avatar_url ? (
                            <img
                              src={message.sender.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-dark-300 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-transparent'
                      }`}>
                        {!isCurrentUser && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {message.sender?.username}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <div className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-primary-300' : 'text-gray-400'
                        }`}>
                          {formatMessageTime(message.created_at)}
                        </div>
                      </div>

                      {isCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden ml-2 flex-shrink-0">
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-primary-600/20 flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="font-medium text-lg mb-2">{t('postMatchSocial.startChatting')}</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                {t('postMatchSocial.coordinateStrategies')}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-100">
          <div className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('postMatchSocial.typeMessageToTeam')}
              className="flex-1 bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="ml-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
            >
              {isSending ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChatModal;
