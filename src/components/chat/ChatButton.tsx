import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ChatListModal from './ChatListModal';
import LiveMessageNotification from './LiveMessageNotification';

const ChatButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState<any | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Load initial unread count
    loadUnreadCount();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        loadUnreadCount();
        handleNewMessage(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        loadUnreadCount();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);
  
  const loadUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error loading unread message count:', error);
        return;
      }
      
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread message count:', error);
    }
  };
  
  const handleNewMessage = async (message: any) => {
    if (!message || !user?.id || isOpen) return;
    
    try {
      // Get sender information
      const { data: senderData, error: senderError } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', message.sender_id)
        .single();
      
      if (senderError) {
        console.error('Error fetching sender info:', senderError);
        return;
      }
      
      // Set the new message with sender info for notification
      setNewMessage({
        ...message,
        sender: {
          username: senderData.username,
          avatar_url: senderData.avatar_url
        }
      });
      
      // Clear the notification after 5 seconds
      setTimeout(() => {
        setNewMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Clear new message notification when opening chat
    if (!isOpen) {
      setNewMessage(null);
    }
  };
  
  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          buttonRef.current && 
          !buttonRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('.chat-list-modal') &&
          !(event.target as Element).closest('.chat-modal-content')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  if (!user) return null;
  
  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-error-600 hover:bg-error-700 rotate-90' 
            : 'bg-primary-600 hover:bg-primary-700'
        }`}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
        aria-expanded={isOpen}
        aria-controls="chat-list-modal"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-white" />
            {unreadCount > 0 && (
              <span 
                className="absolute -top-2 -right-2 bg-error-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                aria-label={`${unreadCount} messages non lus`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        )}
      </button>
      
      {/* New Message Notification */}
      {newMessage && !isOpen && (
        <LiveMessageNotification 
          message={newMessage} 
          onClose={() => setNewMessage(null)}
          onClick={() => {
            setNewMessage(null);
            setIsOpen(true);
          }}
        />
      )}
      
      <ChatListModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatButton;