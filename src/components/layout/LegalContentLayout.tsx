import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface LegalContentLayoutProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  lastUpdated?: Date;
}

const LegalContentLayout: React.FC<LegalContentLayoutProps> = ({
  title,
  icon,
  children,
  lastUpdated = new Date()
}) => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen pt-28 pb-16 bg-gray-50 dark:bg-dark-200">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                {icon}
                <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white">
                  {title}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('footer.lastUpdated')} {lastUpdated.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className="p-6">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {children}
              </div>
            </div>

            <div className="p-6 bg-gray-100 dark:bg-dark-200 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
                  {t('footer.copyright', { year: new Date().getFullYear(), brandName: 'E-Sport Zone SAS' })}
                </p>
                <div className="flex space-x-4">
                  <Link to="/terms" className="text-primary-500 hover:text-primary-400 flex items-center">
                    {t('footer.terms')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                  <Link to="/privacy" className="text-primary-500 hover:text-primary-400 flex items-center">
                    {t('footer.privacy')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                  <Link to="/legal" className="text-primary-500 hover:text-primary-400 flex items-center">
                    {t('footer.legalNotice')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalContentLayout;
