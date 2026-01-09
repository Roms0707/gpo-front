import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LifeBuoy, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TicketList from '../components/support/TicketList';
import CreateTicketModal from '../components/support/CreateTicketModal';

const ProfileSupportPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    if (!user && !localStorage.getItem('supabase.auth.token')) {
      navigate('/login?redirect=/profile/support');
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('support.backToProfile')}
          </Link>
          
          <div className="bg-dark-100 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-6 border-b border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="font-heading font-bold text-2xl flex items-center">
                  <LifeBuoy className="h-6 w-6 text-primary-500 mr-2" />
                  {t('support.mySupportTickets')}
                </h1>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('support.newTicket')}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <TicketList />
            </div>
          </div>
          
          <div className="mt-8 bg-dark-200 p-6 rounded-xl">
            <h2 className="font-heading font-semibold text-xl mb-4">
              {t('support.needHelp')}
            </h2>
            <p className="text-gray-300 mb-4">
              {t('support.supportTeamDescription')}
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• {t('support.createTicketTechnical')}</p>
              <p>• {t('support.askQuestionsTournaments')}</p>
              <p>• {t('support.reportInappropriateBehavior')}</p>
              <p>• {t('support.requestHelpProfile')}</p>
            </div>
            <div className="mt-4">
              <Link to="/faq" className="text-primary-500 hover:text-primary-400 flex items-center">
                {t('support.checkFAQ')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default ProfileSupportPage;