import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, User, Clock, CheckCircle, Image, Smile, Paperclip, File, Download, XCircle, Edit2, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS, es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Lazy load emoji picker to reduce initial bundle size
const EmojiPicker = React.lazy(() => import('emoji-picker-react'));

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
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
  isEditing?: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string | null;
  initialSharedVideoUrl?: string;
  initialSharedVideoTitle?: string;
  initialSharedVideoDescription?: string;
  initialSharedVideoThumbnail?: string;
  initialMessageContent?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  initialSharedVideoUrl,
  initialSharedVideoTitle,
  initialSharedVideoDescription,
  initialSharedVideoThumbnail,
  initialMessageContent
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const MESSAGES_PER_PAGE = 20;

  useEffect(() => {
    if (isOpen && user?.id && recipientId) {
      loadMessages();

      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('private-chat')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id=eq.${user.id},receiver_id=eq.${recipientId})`,
        }, handleNewMessage)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id=eq.${recipientId},receiver_id=eq.${user.id})`,
        }, handleNewMessage)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id=eq.${user.id},receiver_id=eq.${recipientId})`,
        }, handleUpdatedMessage)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id=eq.${recipientId},receiver_id=eq.${user.id})`,
        }, handleUpdatedMessage)
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
  }, [isOpen, user?.id, recipientId, initialSharedVideoUrl, initialSharedVideoTitle, initialSharedVideoDescription]);

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

  // Focus edit input when editing a message
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessageId]);

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

    // Add sender info to the message from the recipient
    newMessage.sender = {
      username: recipientName,
      avatar_url: recipientAvatar || null
    };

    setMessages(prev => [...prev, newMessage]);

    // Mark message as read if it's from the other user
    markMessageAsRead(newMessage.id);
  };

  const handleUpdatedMessage = (payload: any) => {
    const updatedMessage = payload.new as Message;

    // Update the message in the state
    setMessages(prev => prev.map(msg =>
      msg.id === updatedMessage.id ? { ...updatedMessage, sender: msg.sender } : msg
    ));
  };

  const loadMessages = async () => {
    if (!user?.id || !recipientId) return;

    try {
      setIsLoading(true);

      // Get messages between the two users
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          type,
          file_url,
          file_name,
          file_type,
          sender:sender_id(username, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      // Reverse to show oldest first
      const sortedMessages = [...(data || [])].reverse();
      setMessages(sortedMessages);

      // Check if there are more messages to load
      setHasMore(data && data.length === MESSAGES_PER_PAGE);

      // Mark unread messages as read
      const unreadMessages = data?.filter(msg =>
        msg.sender_id === recipientId && !msg.read
      ) || [];

      for (const msg of unreadMessages) {
        markMessageAsRead(msg.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!user?.id || !recipientId || !hasMore) return;

    try {
      setIsLoadingMore(true);

      // Get older messages
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          type,
          file_url,
          file_name,
          file_type,
          sender:sender_id(username, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1);

      if (error) {
        console.error('Error loading more messages:', error);
        return;
      }

      if (data && data.length > 0) {
        // Reverse to show oldest first and prepend to existing messages
        const newMessages = [...data].reverse();
        setMessages(prev => [...newMessages, ...prev]);
        setPage(prev => prev + 1);

        // Check if there are more messages to load
        setHasMore(data.length === MESSAGES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
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
    if (!user?.id || !recipientId || (!newMessage.trim() && !selectedFile)) return;

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

      let messageContent = newMessage.trim() || (fileData ? t('chat.fileSent') : '');
      let messageType = 'direct';

      // Check if this is a shared video message
      if (initialSharedVideoUrl && initialSharedVideoTitle && newMessage.includes(initialSharedVideoUrl)) {
        messageType = 'shared_video';
        // Format the message with clickable link
        messageContent = messageContent.replace(
          initialSharedVideoUrl,
          `<a href="${initialSharedVideoUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${initialSharedVideoUrl}</a>`
        );
      }

      // Insert the message and get the complete message object back
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: recipientId,
            content: messageContent,
            read: false,
            type: messageType,
            file_url: fileData?.url,
            file_name: fileData?.name,
            file_type: fileData?.type
          }
        ])
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          type,
          file_url,
          file_name,
          file_type
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error(t('chat.errorSendingMessage'));
        return;
      }

      // Add the new message to the messages state immediately
      if (data) {
        // Add sender info to the message
        const newMessage: Message = {
          ...data,
          sender: {
            username: user.username,
            avatar_url: user.avatar_url || null
          }
        };

        // Add the message to the state
        setMessages(prev => [...prev, newMessage]);
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

  const startEditingMessage = (message: Message) => {
    // Only allow editing your own messages
    if (message.sender_id !== user?.id) return;

    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId || !editingContent.trim() || !user?.id) return;

    try {
      // Update the message in the database
      const { error } = await supabase
        .from('messages')
        .update({ content: editingContent.trim() })
        .eq('id', editingMessageId)
        .eq('sender_id', user.id); // Ensure only the sender can edit

      if (error) {
        console.error('Error updating message:', error);
        toast.error(t('chat.errorEditingMessage'));
        return;
      }

      // Update the message in the state
      setMessages(prev => prev.map(msg =>
        msg.id === editingMessageId
          ? { ...msg, content: editingContent.trim() }
          : msg
      ));

      // Reset editing state
      setEditingMessageId(null);
      setEditingContent('');

      toast.success(t('chat.messageEdited'));
    } catch (error) {
      console.error('Error saving edited message:', error);
      toast.error(t('toast.editMessageError'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEditedMessage();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingMessage();
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
        const dateFnsLocale = i18n.language.startsWith('fr') ? fr : i18n.language.startsWith('es') ? es : enUS;
        return formatDistanceToNow(date, { addSuffix: true, locale: dateFnsLocale });
      }

      // Otherwise show the date
      return date.toLocaleDateString();
    } catch (error) {
      return t('chat.unknownDate');
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    if (editingMessageId) {
      setEditingContent(prev => prev + emojiData.emoji);
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    } else {
      setNewMessage(prev => prev + emojiData.emoji);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
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
              alt={message.file_name || 'Image'}
              className="max-w-full h-auto"
            />
          </a>
        </div>
      );
    }

    return (
      <div className="mt-2 bg-gray-200/50 dark:bg-dark-300/50 rounded-lg p-2 flex items-center max-w-xs">
        <File className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
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

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col chat-modal-content border border-gray-200 dark:border-gray-800 relative z-50"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-200 overflow-hidden mr-3">
              {recipientAvatar ? (
                <img src={recipientAvatar} alt="" className="w-full h-full object-cover" aria-hidden="true" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-medium text-gray-900 dark:text-white">{recipientName}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('chat.online')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowEmojiPicker(false);
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

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
            </div>
          ) : messages.length > 0 ? (
            <>
              {messages.map((message) => {
                const isCurrentUser = message.sender_id === user?.id;
                const isEditing = message.id === editingMessageId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    aria-label={`Message from ${isCurrentUser ? 'you' : recipientName}`}
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
                        {isEditing ? (
                          <div className="flex flex-col">
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              className="bg-white dark:bg-dark-100 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 mb-2"
                              aria-label={t('chat.editMessage')}
                              autoFocus
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={cancelEditingMessage}
                                className="text-xs bg-gray-200 hover:bg-gray-300 dark:bg-dark-300 dark:hover:bg-dark-400 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors"
                                aria-label={t('chat.cancelEditing')}
                              >
                                {t('common.cancel')}
                              </button>
                              <button
                                onClick={saveEditedMessage}
                                className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded transition-colors flex items-center"
                                aria-label={t('chat.saveEditedMessage')}
                              >
                                <Save className="h-3 w-3 mr-1" aria-hidden="true" />
                                {t('common.save')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
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
                              isCurrentUser ? 'text-primary-300 justify-end' : 'text-gray-400'
                            }`}>
                              <span>{formatMessageTime(message.created_at)}</span>
                              {isCurrentUser && message.read && (
                                <CheckCircle className="h-3 w-3 ml-1 text-primary-300" aria-hidden="true" />
                              )}

                              {/* Edit button - only for text messages sent by current user */}
                              {isCurrentUser && !message.file_url && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Stop event propagation
                                    startEditingMessage(message);
                                  }}
                                  className="ml-2 text-primary-300 hover:text-white transition-colors"
                                  aria-label={t('chat.editMessage')}
                                >
                                  <Edit2 className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
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
                <Send className="h-8 w-8 text-primary-500" aria-hidden="true" />
              </div>
              <h3 className="font-medium text-lg mb-2">{t('chat.startConversation')}</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                {t('chat.sendMessageTo', { name: recipientName })}
              </p>
            </div>
          )}
        </div>

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="px-4 py-2 bg-gray-100 dark:bg-dark-200 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between bg-gray-200 dark:bg-dark-300 rounded-lg p-2">
              <div className="flex items-center flex-1 min-w-0">
                <File className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                <span className="text-sm truncate">{selectedFile.name}</span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                aria-label={t('chat.removeFile')}
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
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
                placeholder={t('chat.writeMessageTo', { name: recipientName })}
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
    </div>
  );
};

export default ChatModal;
