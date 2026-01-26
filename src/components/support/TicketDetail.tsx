import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, User, Send, Clock, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getSupportTicketWithMessages, addTicketMessage, updateTicketStatus } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface TicketMessage {
  id: string;
  message: string;
  created_at: string;
  is_admin_message: boolean;
  user_id: string;
  users: {
    username: string;
    avatar_url: string | null;
    type: string;
  };
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tournament_id: string | null;
  users: {
    username: string;
    avatar_url: string | null;
  };
  tournaments: {
    title: string;
  } | null;
  messages: TicketMessage[];
}

const TicketDetail: React.FC = () => {
  const { t } = useTranslation();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;

      try {
        setIsLoading(true);
        const data = await getSupportTicketWithMessages(ticketId);
        setTicket(data);
      } catch (error) {
        console.error('Error loading ticket:', error);
        toast.error(t('support.errorLoadingTicket'));
      } finally {
        setIsLoading(false);
      }
    };

    loadTicket();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`ticket-${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`
      }, handleNewMessage)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [ticketId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const handleNewMessage = async (payload: any) => {
    if (!ticketId) return;

    // Reload the ticket to get the new message with user info
    const data = await getSupportTicketWithMessages(ticketId);
    setTicket(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return t('support.unknownDate');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-warning-500/20 text-warning-400 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {t('support.open')}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-info-500/20 text-info-400 text-xs">
            <Clock className="h-3 w-3 mr-1 animate-pulse" />
            {t('support.inProgress')}
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-success-500/20 text-success-400 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('support.resolved')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            {t('support.unknown')}
          </span>
        );
    }
  };

  const handleSendMessage = async () => {
    if (!user?.id || !ticketId || !newMessage.trim()) return;

    try {
      setIsSending(true);

      const result = await addTicketMessage(
        ticketId,
        user.id,
        newMessage.trim(),
        user.type === 'admin'
      );

      if (result.success) {
        setNewMessage('');
      } else {
        toast.error(result.error || t('support.errorSendingMessage'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('support.errorSendingMessage'));
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (status: 'open' | 'in_progress' | 'closed') => {
    if (!ticketId) return;

    try {
      const result = await updateTicketStatus(ticketId, status);

      if (result.success) {
        // Update local state
        setTicket(prev => prev ? { ...prev, status } : null);
        toast.success(`${t('support.statusUpdated')} ${status === 'open' ? t('support.open') : status === 'in_progress' ? t('support.inProgress') : t('support.resolved')}`);
      } else {
        toast.error(result.error || t('support.errorUpdatingStatus'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('support.errorUpdatingStatus'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-400">{t('support.loadingTicket')}</span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-8 bg-dark-200 rounded-lg">
        <LifeBuoy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">{t('support.ticketNotFound')}</p>
        <Link to={backLink} className="text-primary-500 hover:text-primary-400">
          {t('support.backToTickets')}
        </Link>
      </div>
    );
  }

  const isAdmin = user?.type === 'admin';
  const isAdminRoute = location.pathname.startsWith('/admin/');
  const backLink = isAdminRoute ? '/admin/support' : '/profile/support';

  return (
    <div className="bg-dark-100 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <Link to={backLink} className="inline-flex items-center text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('support.backToTickets')}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center mb-2">
              <LifeBuoy className="h-5 w-5 text-primary-500 mr-2" />
              <h1 className="font-heading font-bold text-2xl">{ticket.subject}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <span>{t('support.createdOn')} {formatDate(ticket.created_at)}</span>
              <span className="hidden md:inline">•</span>
              <span>{t('support.by')} {ticket.users.username}</span>
              {ticket.tournaments && (
                <>
                  <span className="hidden md:inline">•</span>
                  <span className="flex items-center">
                    <Trophy className="h-3 w-3 mr-1 text-primary-400" />
                    {ticket.tournaments.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(ticket.status)}

            {/* Status change buttons for admins */}
            {isAdmin && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusChange('open')}
                  disabled={ticket.status === 'open'}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    ticket.status === 'open'
                      ? 'bg-warning-500/20 text-warning-400 cursor-default'
                      : 'bg-dark-300 hover:bg-dark-400 text-gray-300'
                  }`}
                >
                  {t('support.openButton')}
                </button>
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={ticket.status === 'in_progress'}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    ticket.status === 'in_progress'
                      ? 'bg-info-500/20 text-info-400 cursor-default'
                      : 'bg-dark-300 hover:bg-dark-400 text-gray-300'
                  }`}
                >
                  {t('support.inProgressButton')}
                </button>
                <button
                  onClick={() => handleStatusChange('closed')}
                  disabled={ticket.status === 'closed'}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    ticket.status === 'closed'
                      ? 'bg-success-500/20 text-success-400 cursor-default'
                      : 'bg-dark-300 hover:bg-dark-400 text-gray-300'
                  }`}
                >
                  {t('support.resolved')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-300px)]">
        {/* Ticket description */}
        <div className="p-6 bg-dark-200/50 border-b border-gray-800">
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
              {ticket.users.avatar_url ? (
                <img
                  src={ticket.users.avatar_url}
                  alt={ticket.users.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-gray-400 m-2.5" />
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">{ticket.users.username}</h3>
                <span className="text-xs text-gray-400 ml-2">{formatDate(ticket.created_at)}</span>
              </div>
              <div className="mt-2 text-gray-300 whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {ticket.messages.map((message) => (
            <div key={message.id} className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
                {message.users.avatar_url ? (
                  <img
                    src={message.users.avatar_url}
                    alt={message.users.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-gray-400 m-2.5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium">{message.users.username}</h3>
                  {message.is_admin_message && (
                    <span className="ml-2 bg-primary-600/20 text-primary-400 text-xs px-2 py-0.5 rounded-full">
                      {t('support.admin')}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-2">{formatDate(message.created_at)}</span>
                </div>
                <div className="mt-2 text-gray-300 whitespace-pre-wrap">
                  {message.message}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="p-4 border-t border-gray-800 bg-dark-100">
          {ticket.status !== 'closed' ? (
            <div className="flex items-center">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('support.writeMessage')}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px] max-h-[200px]"
                  disabled={isSending}
                />
              </div>
              <button
                onClick={handleSendMessage}
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
          ) : (
            <div className="bg-success-500/20 border border-success-500/30 p-4 rounded-lg text-center">
              <p className="text-success-300">
                {t('support.ticketClosedMessage')}
              </p>
              {isAdmin && (
                <button
                  onClick={() => handleStatusChange('open')}
                  className="mt-2 bg-dark-300 hover:bg-dark-400 text-gray-300 px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  {t('support.reopenTicket')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
