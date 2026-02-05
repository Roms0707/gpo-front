import React from 'react';
import { useParams } from 'react-router-dom';
import TicketDetail from '../components/support/TicketDetail';

const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <TicketDetail />
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;