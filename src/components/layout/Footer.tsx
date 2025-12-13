import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Twitch } from 'lucide-react';
import { APP_CONFIG } from '../../constants';
import { DynamicLogo } from '../common/DynamicLogo';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();
  const { brandName } = useAppConfig();
  const { t } = useTranslation();

  return (
    <footer className={`bg-gray-100 dark:bg-dark-300 text-gray-900 dark:text-white py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <DynamicLogo size="sm" showBrandName={false} />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('footer.joinCompetition')}
            </p>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.myProfile')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.howItWorks')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">{t('footer.help')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.support')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.legalNotice')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('footer.copyright', { year: currentYear, brandName })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;