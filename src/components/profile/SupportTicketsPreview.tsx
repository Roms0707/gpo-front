import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';

interface SupportTicketsPreviewProps {
  tickets: any[];
  isLoading: boolean;
}

const SupportTicketsPreview: React.FC<SupportTicketsPreviewProps> = ({ tickets, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-semibold text-xl flex items-center text-gray-900 dark:text-white">
          <LifeBuoy className="h-5 w-5 mr-2 text-primary-500" />
          {t('support.mySupportTickets')}
        </h2>
        <Link to="/profile/support" className="text-primary-500 hover:text-primary-400 text-sm">
          {t('support.viewAllTickets')}
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.slice(0, 3).map(ticket => (
            <Link
              key={ticket.id}
              to={`/profile/support/${ticket.id}`}
              className="block bg-gray-100 dark:bg-dark-200 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(ticket.created_at).toLocaleDateString()} •
                    {ticket.status === 'open' && <span className="text-warning-400"> {t('support.open')}</span>}
                    {ticket.status === 'in_progress' && <span className="text-info-400"> {t('support.inProgress')}</span>}
                    {ticket.status === 'closed' && <span className="text-success-400"> {t('support.resolved')}</span>}
                  </p>
                </div>
                <div className="text-primary-500">
                  <span className="text-xs">{t('support.view')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">{t('support.noTicketsYet')}</p>
          <Link to="/profile/support" className="text-primary-500 hover:text-primary-400 text-sm">
            {t('support.createTicket')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default SupportTicketsPreview;