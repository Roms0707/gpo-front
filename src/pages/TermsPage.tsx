import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LegalContentLayout from '../components/layout/LegalContentLayout';
import { useLegalVariables } from '../hooks/useLegalVariables';
import { useAppConfig } from '../contexts/AppConfigContext';

const TermsPage: React.FC = () => {
  const { t } = useTranslation();
  const legalVars = useLegalVariables();
  const { brandName } = useAppConfig();
  const companyName = legalVars.getCompanyName();
  const legalEmail = legalVars.getLegalEmail();

  return (
    <LegalContentLayout
      title={t('termsPage.title')}
      icon={<FileText className="h-6 w-6 text-primary-500 mr-3" />}
    >
      <p>
        {t('termsPage.intro', { brandName })}
      </p>

      <h2>{t('termsPage.section1.title')}</h2>
      <ul>
        <li><strong>{t('termsPage.section1.platform', { brandName })}</strong></li>
        <li><strong>{t('termsPage.section1.user')}</strong></li>
        <li><strong>{t('termsPage.section1.participant')}</strong></li>
        <li><strong>{t('termsPage.section1.account')}</strong></li>
        <li><strong>{t('termsPage.section1.tournament')}</strong></li>
        <li><strong>{t('termsPage.section1.content')}</strong></li>
      </ul>

      <h2>{t('termsPage.section2.title')}</h2>
      <h3>{t('termsPage.section2.sub1.title')}</h3>
      <p>
        {t('termsPage.section2.sub1.content')}
      </p>

      <h3>{t('termsPage.section2.sub2.title')}</h3>
      <p>
        {t('termsPage.section2.sub2.content')}
      </p>

      <h3>{t('termsPage.section2.sub3.title')}</h3>
      <p>
        {t('termsPage.section2.sub3.content', { brandName })}
      </p>

      <h2>{t('termsPage.section3.title')}</h2>
      <h3>{t('termsPage.section3.sub1.title')}</h3>
      <p>
        {t('termsPage.section3.sub1.content')}
      </p>

      <h3>{t('termsPage.section3.sub2.title')}</h3>
      <p>
        {t('termsPage.section3.sub2.content')}
      </p>

      <h3>{t('termsPage.section3.sub3.title')}</h3>
      <p>
        {t('termsPage.section3.sub3.content', { brandName })}
      </p>

      <h3>{t('termsPage.section3.sub4.title')}</h3>
      <p>
        {t('termsPage.section3.sub4.content', { brandName })}
      </p>

      <h2>{t('termsPage.section4.title')}</h2>
      <h3>{t('termsPage.section4.sub1.title')}</h3>
      <p>
        {t('termsPage.section4.sub1.content', { brandName })}
      </p>

      <h3>{t('termsPage.section4.sub2.title')}</h3>
      <p>
        {t('termsPage.section4.sub2.content')}
      </p>

      <h3>{t('termsPage.section4.sub3.title')}</h3>
      <p>
        {t('termsPage.section4.sub3.content', { brandName })}
      </p>

      <h2>{t('termsPage.section5.title')}</h2>
      <h3>{t('termsPage.section5.sub1.title')}</h3>
      <p>
        {t('termsPage.section5.sub1.content', { companyName })}
      </p>

      <h3>{t('termsPage.section5.sub2.title')}</h3>
      <p>
        {t('termsPage.section5.sub2.content', { companyName })}
      </p>

      <h2>{t('termsPage.section6.title')}</h2>
      <p>
        {t('termsPage.section6.content')} <Link to="/privacy" className="text-primary-500 hover:text-primary-400">{t('termsPage.section6.linkText')}</Link>.
      </p>

      <h2>{t('termsPage.section7.title')}</h2>
      <p>
        {t('termsPage.section7.content', { brandName })}
      </p>

      <h2>{t('termsPage.section8.title')}</h2>
      <p>
        {t('termsPage.section8.content', { brandName })}
      </p>

      <h2>{t('termsPage.section9.title')}</h2>
      <p>
        {t('termsPage.section9.content', { brandName })}
      </p>

      <h2>{t('termsPage.section10.title')}</h2>
      <p>
        {t('termsPage.section10.content')}
      </p>

      <h2>{t('termsPage.section11.title')}</h2>
      <p>
        {t('termsPage.section11.content', { brandName, legalEmail })}
      </p>
    </LegalContentLayout>
  );
};

export default TermsPage;
