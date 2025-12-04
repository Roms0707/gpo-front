import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, User, Clock, Smile, Paperclip, File, Download, MessageSquare, Users, Settings, Info, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Lazy load emoji picker to reduce initial bundle size
const EmojiPicker = React.lazy(() => import('emoji-picker-react'));
import { getChannelMembers, getChannelMessages, sendChannelMessage, leaveChannel } from '../../services/channelService';
import ChannelSettingsModal from './ChannelSettingsModal';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ChannelMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  users: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  channelDescription?: string;
  initialSharedVideoUrl?: string;
  initialSharedVideoTitle?: string;
  initialSharedVideoDescription?: string;
  initialSharedVideoThumbnail?: string;
  initialMessageContent?: string;
}

interface ChannelInfo {
  is_community: boolean;
  is_private: boolean;
  member_count: number;
  created_at: string;
}

const ChannelModal: React.FC<ChannelModalProps> = ({
  isOpen,
  onClose,
  channelId,
  channelName,
  channelDescription,
  initialSharedVideoUrl,
  initialSharedVideoTitle,
  initialSharedVideoDescription,
  initialSharedVideoThumbnail,
  initialMessageContent
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const MESSAGES_PER_PAGE = 20;

  useEffect(() => {
    if (isOpen && user?.id && channelId) {
      loadMessages();
      loadMembers();
      loadChannelInfo();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel(`channel-${channelId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        }, handleNewMessage)
        .subscribe();
      
      // Focus the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Pre-fill message with shared video if provided
      if (initialSharedVideoUrl && initialSharedVideoTitle) {
        let sharedMessage = `🎬 ${initialSharedVideoTitle}\n\n`;
        if (initialSharedVideoDescription) {
          sharedMessage += `${initialSharedVideoDescription}\n\n`;
        }
        sharedMessage += `${t('chat.watchHere')}: ${initialSharedVideoUrl}`;
        setNewMessage(sharedMessage);
      } else if (initialMessageContent) {
        // Pre-fill message with provided content (for stats sharing)
        setNewMessage(initialMessageContent);
      }
      
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [isOpen, user?.id, channelId, initialSharedVideoUrl, initialSharedVideoTitle, initialSharedVideoDescription, initialMessageContent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (page === 1) {
      scrollToBottom();
    }
  }, [messages, page]);

  // Handle scroll to load more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !isLoadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, page]);

  // Handle click outside emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker && 
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        event.target instanceof Element && 
        !event.target.closest('[data-testid="emoji-picker-button"]')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewMessage = (payload: any) => {
    const newMessage = payload.new as Message;
    
    // Skip messages that were sent by the current user
    // These are already added to the messages state in the sendMessage function
    if (newMessage.sender_id === user?.id) {
      return;
    }
    
    // Get sender info
    supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', newMessage.sender_id)
      .single()
      .then(({ data }) => {
        if (data) {
          // Add sender info to the message
          newMessage.sender = {
            username: data.username,
            avatar_url: data.avatar_url
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      });
  };

  const loadChannelInfo = async () => {
    if (!channelId) return;
    
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('is_community, is_private, created_at, image_url')
        .eq('id', channelId)
        .single();
      
      if (error) {
        console.error('Error loading channel info:', error);
        return;
      }
      
      // Get member count
      const { count, error: countError } = await supabase
        .from('channel_members')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId);
      
      if (countError) {
        console.error('Error loading member count:', countError);
      }
      
      setChannelInfo({
        ...data,
        member_count: count || 0
      });
    } catch (error) {
      console.error('Error loading channel info:', error);
    }
  };

  const loadMessages = async () => {
    if (!user?.id || !channelId) return;
    
    try {
      setIsLoading(true);
      
      const messages = await getChannelMessages(channelId, 1, MESSAGES_PER_PAGE);
      setMessages(messages);
      
      // Check if there are more messages to load
      setHasMore(messages.length === MESSAGES_PER_PAGE);
      
    } catch (error) {
      console.error('Error loading channel messages:', error);
      toast.error(t('chat.errorLoadingMessages'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!user?.id || !channelId || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      
      const nextPage = page + 1;
      const olderMessages = await getChannelMessages(channelId, nextPage, MESSAGES_PER_PAGE);
      
      if (olderMessages.length > 0) {
        // Prepend older messages
        setMessages(prev => [...olderMessages, ...prev]);
        setPage(nextPage);
        
        // Check if there are more messages to load
        setHasMore(olderMessages.length === MESSAGES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMembers = async () => {
    if (!user?.id || !channelId) return;
    
    try {
      const members = await getChannelMembers(channelId);
      setMembers(members);
      
      // Check if current user is an admin
      const currentUserMember = members.find(member => member.user_id === user.id);
      setIsAdmin(currentUserMember?.role === 'admin');
      
    } catch (error) {
      console.error('Error loading channel members:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('chat.fileTooLarge'));
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadFile = async (): Promise<{ url: string; name: string; type: string } | null> => {
    if (!selectedFile || !user?.id) return null;
    
    try {
      setIsUploading(true);
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `chat-attachments/${fileName}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, selectedFile);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);
      
      return {
        url: data.publicUrl,
        name: selectedFile.name,
        type: selectedFile.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('chat.errorUploadingFile'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!user?.id || !channelId || (!newMessage.trim() && !selectedFile)) return;
    
    try {
      setIsSending(true);
      
      let fileData = null;
      if (selectedFile) {
        fileData = await uploadFile();
        if (!fileData && !newMessage.trim()) {
          // If file upload failed and there's no text message, abort
          return;
        }
      }
      
      const messageContent = newMessage.trim() || (fileData ? t('chat.fileSent') : '');
      let messageType = 'channel';
      
      // Check if this is a shared video message
      if (initialSharedVideoUrl && initialSharedVideoTitle && messageContent.includes(initialSharedVideoUrl)) {
        messageType = 'shared_video';
        // Format the message with clickable link
        const formattedContent = messageContent.replace(
          initialSharedVideoUrl,
          `<a href="${initialSharedVideoUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${initialSharedVideoUrl}</a>`
        );
        
        // Send the formatted message
        const sentMessage = await sendChannelMessage(
          channelId,
          formattedContent,
          fileData?.url,
          fileData?.name,
          fileData?.type
        );
        
        // Add sender info to the message for immediate display
        if (sentMessage) {
          const messageWithSender = {
            ...sentMessage,
            type: messageType,
            sender: {
              username: user.username,
              avatar_url: user.avatar_url || null
            }
          };
          
          // Add the message to the state
          setMessages(prev => [...prev, messageWithSender]);
        }
        
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Close emoji picker when sending a message
        setShowEmojiPicker(false);
        return;
      }
      
      // Send the message
      const sentMessage = await sendChannelMessage(
        channelId,
        messageContent,
        fileData?.url,
        fileData?.name,
        fileData?.type
      );
      
      // Add sender info to the message for immediate display
      if (sentMessage) {
        const messageWithSender = {
          ...sentMessage,
          sender: {
            username: user.username,
            avatar_url: user.avatar_url || null
          }
        };
        
        // Add the message to the state
        setMessages(prev => [...prev, messageWithSender]);
      }
      
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close emoji picker when sending a message
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('chat.errorSendingMessage'));
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

  const handleEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // If it's today, just show the time
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // If it's within the last week, show relative time
      if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(date, { addSuffix: true, locale: fr });
      }
      
      // Otherwise show the date
      return date.toLocaleDateString();
    } catch (error) {
      return t('chat.unknownDate');
    }
  };

  const handleLeaveChannel = async () => {
    if (!channelId) return;
    
    if (confirm(t('chat.confirmLeaveChannel'))) {
      try {
        const result = await leaveChannel(channelId);
        
        if (result.success) {
          toast.success(result.message);
          onClose();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Error leaving channel:', error);
        toast.error(t('chat.leaveChannelError'));
      }
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderFilePreview = (message: Message) => {
    if (!message.file_url) return null;
    
    const isImage = message.file_type?.startsWith('image/');
    
    if (isImage) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
          <a 
            href={message.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
            aria-label={message.file_name || t('chat.attachedImage')}
          >
            <img 
              src={message.file_url} 
              alt={message.file_name || t('chat.attachedImage')}
              className="w-full h-auto rounded-lg"
            />
          </a>
        </div>
      );
    }
    
    return (
      <div className="mt-2 bg-dark-300/50 rounded-lg p-2 flex items-center max-w-xs">
        <File className="h-5 w-5 mr-2 text-gray-400" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{message.file_name}</p>
        </div>
        <a 
          href={message.file_url} 
          download={message.file_name}
          className="ml-2 text-primary-400 hover:text-primary-300"
          aria-label={t('chat.downloadFile', { filename: message.file_name })}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    );
  };

  if (!isOpen) return null;

  // Add/remove modal-open class to body
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 chat-modal-content">
      <div className="fixed inset-0 bg-black/75 z-49" onClick={onClose}></div>
      
      <div 
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col chat-modal-content border border-gray-200 dark:border-gray-800 relative z-50"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-full overflow-hidden mr-3 flex items-center justify-center ${
              channelInfo?.is_community 
                ? 'bg-indigo-100 dark:bg-indigo-600/20'
                : channelInfo?.is_private 
                  ? 'bg-gray-200 dark:bg-gray-600/20' 
                  : 'bg-primary-100 dark:bg-primary-600/20'
            }`}>
              {channelInfo?.image_url ? (
                <img 
                  src={channelInfo?.image_url} 
                  alt={channelName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <MessageSquare className={`h-5 w-5 ${
                  channelInfo?.is_community 
                    ? 'text-indigo-600 dark:text-indigo-500' 
                    : channelInfo?.is_private 
                      ? 'text-gray-600 dark:text-gray-400' 
                      : 'text-primary-600 dark:text-primary-500'
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-semibold text-xl flex items-center truncate text-gray-900 dark:text-white">
                # {channelName}
                {channelInfo?.is_community && (
                  <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-600/20 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400">
                    {t('chat.community')}
                  </span>
                )}
                {channelInfo?.is_private && (
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-dark-300 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                    {t('chat.private')}
                  </span>
                )}
              </h2>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                {channelInfo && (
                  <span className="flex items-center mr-3">
                    <Users className="h-3 w-3 mr-1" />
                    {t('chat.memberCount', { count: channelInfo.member_count })}
                  </span>
                )}
                {channelDescription && (
                  <p className="truncate">{channelDescription}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMembersList(!showMembersList)}
              className={`text-gray-300 hover:text-white transition-colors p-2 rounded ${
                showMembersList ? 'bg-dark-200' : ''
              }`}
              aria-label={showMembersList ? t('chat.hideMembers') : t('chat.showMembers')}
            >
              <Users className="h-5 w-5" />
            </button>
            {isAdmin && (
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-dark-200 rounded"
                aria-label={t('chat.channelSettingsLabel')}
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <button 
              onClick={handleLeaveChannel}
              className="text-gray-500 hover:text-error-600 dark:text-gray-300 dark:hover:text-error-400 transition-colors p-2"
              aria-label={t('chat.leaveChannelLabel')}
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-200/50"
              tabIndex={0}
              aria-label={t('chat.messages')}
              role="log"
            >
              {isLoadingMore && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              )}
              
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">{t('chat.loading')}</span>
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((message) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        aria-label={`Message from ${isCurrentUser ? 'you' : message.sender?.username}`}
                      >
                        <div className="flex items-end max-w-[80%]">
                          {!isCurrentUser && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mr-2 flex-shrink-0">
                              {message.sender?.avatar_url ? (
                                <img 
                                  src={message.sender.avatar_url} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                  aria-hidden="true"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                  <User className="h-4 w-4" aria-hidden="true" />
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
                              <div className="font-medium text-xs text-gray-600 dark:text-gray-300 mb-1">
                                {message.sender?.username || t('chat.unknownUser2')}
                              </div>
                            )}
                            
                            {message.type === 'shared_video' || message.content.includes('<a href=') ? (
                              <div 
                                className="whitespace-pre-wrap break-words"
                                dangerouslySetInnerHTML={{ __html: message.content }}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                            
                            {/* File attachment */}
                            {renderFilePreview(message)}
                            
                            <div className={`text-xs mt-1 flex items-center ${
                              isCurrentUser ? 'text-primary-300 justify-end' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <span>{formatMessageTime(message.created_at)}</span>
                            </div>
                          </div>
                          
                          {isCurrentUser && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden ml-2 flex-shrink-0">
                              {user?.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                  aria-hidden="true"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                  <User className="h-4 w-4" aria-hidden="true" />
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
                    <MessageSquare className="h-8 w-8 text-primary-500" aria-hidden="true" />
                  </div>
                  <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('chat.welcomeToChannel', { channelName })}</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    {t('chat.startOfConversation')}
                  </p>
                  {channelInfo?.created_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                      {t('chat.channelCreatedOn', { date: format(new Date(channelInfo.created_at), 'dd/MM/yyyy') })}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Selected File Preview */}
            {selectedFile && (
              <div className="px-4 py-2 bg-dark-200 border-t border-gray-800">
                <div className="flex items-center justify-between bg-dark-300 rounded-lg p-2">
                  <div className="flex items-center flex-1 min-w-0">
                    <File className="h-5 w-5 mr-2 text-gray-400" aria-hidden="true" />
                    <span className="text-sm truncate">{selectedFile.name}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="ml-2 text-gray-400 hover:text-white"
                    aria-label={t('chat.removeFile')}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-20 right-4 z-10"
                role="dialog"
                aria-label={t('chat.emojiPicker')}
              >
                <React.Suspense fallback={<div className="w-[300px] h-[400px] bg-dark-200 rounded-lg flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>}>
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={300}
                    height={400}
                    theme="dark"
                  />
                </React.Suspense>
              </div>
            )}
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-100">
              <div className="flex items-center">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat.sendMessagePlaceholder', { channelName })}
                    className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 pr-24 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isSending || isUploading}
                    aria-label={t('chat.messageInput')}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button 
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                      disabled={isSending || isUploading}
                      data-testid="emoji-picker-button"
                      aria-label={t('chat.addEmoji')}
                    >
                      <Smile className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                      disabled={isSending || isUploading}
                      aria-label={t('chat.attachFile')}
                    >
                      <Paperclip className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isSending || isUploading}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                  className="ml-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
                  aria-label={t('chat.sendMessageButton')}
                >
                  {isSending || isUploading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Members Sidebar - Only shown when showMembersList is true */}
          {showMembersList && (
            <div className="w-64 border-l border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-dark-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary-500" />
                  {t('chat.members')} ({members.length})
                </h3>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Admins */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-1 bg-gray-200 dark:bg-dark-300/50">{t('chat.administrators')}</h4>
                  <div className="space-y-1">
                    {members
                      .filter(member => member.role === 'admin')
                      .map(member => (
                        <div key={member.id} className="flex items-center p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mr-2">
                            {member.users.avatar_url ? (
                              <img 
                                src={member.users.avatar_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-500 dark:text-gray-400 m-2" />
                            )}
                          </div>
                          <span className="text-sm truncate text-gray-900 dark:text-white">{member.users.username}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Regular Members */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-1 bg-gray-200 dark:bg-dark-300/50">{t('chat.members')}</h4>
                  <div className="space-y-1">
                    {members
                      .filter(member => member.role === 'member')
                      .map(member => (
                        <div key={member.id} className="flex items-center p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mr-2">
                            {member.users.avatar_url ? (
                              <img 
                                src={member.users.avatar_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-500 dark:text-gray-400 m-2" />
                            )}
                          </div>
                          <span className="text-sm truncate text-gray-900 dark:text-white">{member.users.username}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Channel Settings Modal */}
      {showSettingsModal && (
        <ChannelSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          channelId={channelId}
          channelName={channelName}
          channelDescription={channelDescription}
          onChannelUpdated={(newName, newDescription) => {
            // Update local state with new channel info
            if (newName !== channelName) {
              // Update the channel name in the parent component
              // This would typically be handled by the parent component
              // but we'll just update the document title for now
              document.title = `#${newName}`;
            }
          }}
        />
      )}
    </div>
  );
};

export default ChannelModal;