import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LifeBuoy, Clock, CheckCircle, XCircle, ChevronRight, Loader } from 'lucide-react';
import { getUserSupportTickets } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr, enUS, es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  tournament_id: string | null;
  tournaments: {
    title: string;
  } | null;
}

const TicketList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const data = await getUserSupportTickets(user.id);
        setTickets(data);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    try {
      const dateFnsLocale = i18n.language.startsWith('fr') ? fr : i18n.language.startsWith('es') ? es : enUS;
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: dateFnsLocale });
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="h-6 w-6 animate-spin text-primary-500 mr-2" />
        <span className="text-gray-400">{t('support.loadingTickets')}</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 bg-dark-200 rounded-lg">
        <LifeBuoy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">{t('support.noTicketsYet')}</p>
        <p className="text-sm text-gray-500">
          {t('support.contactSupportTeam')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          to={`/profile/support/${ticket.id}`}
          className="block bg-dark-200 rounded-lg p-4 hover:bg-dark-300 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium mb-1">{ticket.subject}</h3>
              <div className="flex items-center text-sm text-gray-400 space-x-3">
                <span>{t('support.createdOn')} {formatDate(ticket.created_at)}</span>
                <span>•</span>
                <span>{t('support.updatedOn')} {formatDate(ticket.updated_at)}</span>
              </div>
              {ticket.tournaments && (
                <div className="mt-2 text-sm">
                  <span className="text-primary-400">{t('support.tournament')} {ticket.tournaments.title}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(ticket.status)}
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default TicketList;
