import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HelpCircle, Trophy, Mail, MessageSquare, FileText, ArrowRight, LifeBuoy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TicketList from '../components/support/TicketList';

const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen pt-28 pb-16 bg-gray-50 dark:bg-dark-200">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl mb-4">
              {t('support.helpCenter')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('support.helpCenterDescription')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-dark-300/50 transition-colors border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                <HelpCircle className="h-6 w-6 text-primary-500" />
              </div>
              <h2 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">{t('support.faqTitle')}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('support.faqDescription')}
              </p>
              <Link to="/faq" className="text-primary-500 hover:text-primary-400 flex items-center">
                {t('support.viewFAQ')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-dark-300/50 transition-colors border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                <Mail className="h-6 w-6 text-primary-500" />
              </div>
              <h2 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">{t('support.contactTitle')}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('support.contactDescription')}
              </p>
              <Link to="/contact" className="text-primary-500 hover:text-primary-400 flex items-center">
                {t('support.contactUs')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
          
          {/* Support Tickets Section - Only show for logged in users */}
          {user && (
            <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden mb-12 border border-gray-200 dark:border-gray-800">
              <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="font-heading font-semibold text-2xl flex items-center">
                  <LifeBuoy className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-gray-900 dark:text-white">{t('support.mySupportTickets')}</span>
                </h2>
              </div>
              
              <div className="p-6">
                <TicketList />
                
                <div className="mt-6 text-center">
                  <Link 
                    to="/profile/support"
                    className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <LifeBuoy className="h-4 w-4 mr-2" />
                    {t('support.viewAllMyTickets')}
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden mb-12 border border-gray-200 dark:border-gray-800">
            <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-heading font-semibold text-2xl text-gray-900 dark:text-white">
                {t('support.commonIssues')}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('support.tournamentRegistrationIssues')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('support.tournamentRegistrationDescription')}
                </p>
              </div>
              
              <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('support.technicalIssuesDuringMatches')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('support.technicalIssuesDescription')}
                </p>
              </div>
              
              <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('support.claimsAndDisputes')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('support.claimsAndDisputesDescription')}
                </p>
              </div>
              
              <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('support.paymentsAndRewards')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('support.paymentsAndRewardsDescription')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-dark-300/50 transition-colors border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                <Trophy className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('support.tournamentRules')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('support.tournamentRulesDescription')}
              </p>
              <a href="#" className="text-primary-500 hover:text-primary-400 flex items-center">
                {t('support.viewRules')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </div>
            
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-dark-300/50 transition-colors border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                <MessageSquare className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('support.communityDiscord')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('support.communityDiscordDescription')}
              </p>
              <a href="https://discord.gg/esportzone" className="text-primary-500 hover:text-primary-400 flex items-center">
                {t('support.joinDiscord')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </div>
            
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-dark-300/50 transition-colors border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                <FileText className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('support.tutorials')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('support.tutorialsDescription')}
              </p>
              <a href="#" className="text-primary-500 hover:text-primary-400 flex items-center">
                {t('support.viewTutorials')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;