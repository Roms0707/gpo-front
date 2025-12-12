import React from 'react';
import { Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LegalContentLayout from '../components/layout/LegalContentLayout';
import { useLegalVariables } from '../hooks/useLegalVariables';
import { useAppConfig } from '../contexts/AppConfigContext';

const LegalPage: React.FC = () => {
  const { t } = useTranslation();
  const legalVars = useLegalVariables();
  const { brandName } = useAppConfig();
  const companyName = legalVars.getCompanyName();
  const companyAddress = legalVars.getCompanyAddress();
  const phoneNumber = legalVars.getPhoneNumber();
  const registrationNumber = legalVars.getRegistrationNumber();
  const supportEmail = legalVars.getSupportEmail();
  const legalEmail = legalVars.getLegalEmail();

  return (
    <LegalContentLayout
      title={t('legalPage.title')}
      icon={<Building className="h-6 w-6 text-primary-500 mr-3" />}
    >
      <h2>{t('legalPage.section1.title')}</h2>
      <h3>{t('legalPage.section1.sub1.title')}</h3>
      <p>
        <strong>{t('legalPage.section1.sub1.companyName')}:</strong> {companyName}<br />
        <strong>{t('legalPage.section1.sub1.address')}:</strong> {companyAddress}<br />
        {phoneNumber && (
          <>
            <strong>{t('legalPage.section1.sub1.phone')}:</strong> {phoneNumber}<br />
          </>
        )}
        {registrationNumber && (
          <>
            <strong>{t('legalPage.section1.sub1.registrationNumber')}:</strong> {registrationNumber}<br />
          </>
        )}
        <strong>{t('legalPage.section1.sub1.email')}:</strong> {supportEmail}
      </p>

      <h3>{t('legalPage.section1.sub3.title')}</h3>
      <p>
        {t('legalPage.section1.sub3.hostedBy', { brandName })}<br />
        <strong>{companyName}</strong><br />
        {t('legalPage.section1.sub3.address')}: {companyAddress}<br />
      </p>
      <p>
        <strong>Supabase Technologies, Inc.</strong><br />
        Address: 3650 Langton St, San Francisco, CA 94116, USA<br />
        {t('legalPage.section1.supabase.website')}: https://supabase.com<br />
        {t('legalPage.section1.supabase.email')}: support@supabase.io
      </p>

      <h2>{t('legalPage.section2.title')}</h2>
      <p>{t('legalPage.section2.content', { brandName })}</p>

      <h2>{t('legalPage.section3.title')}</h2>
      <h3>{t('legalPage.section3.sub1.title')}</h3>
      <p>{t('legalPage.section3.sub1.content', { brandName, companyName })}</p>

      <h3>{t('legalPage.section3.sub2.title')}</h3>
      <p>{t('legalPage.section3.sub2.content', { companyName })}</p>

      <h3>{t('legalPage.section3.sub3.title')}</h3>
      <p>{t('legalPage.section3.sub3.content')}</p>

      <h2>{t('legalPage.section4.title')}</h2>
      <h3>{t('legalPage.section4.sub1.title', { brandName })}</h3>
      <p>{t('legalPage.section4.sub1.content', { brandName, companyName })}</p>

      <h3>{t('legalPage.section4.sub2.title', { brandName })}</h3>
      <p>{t('legalPage.section4.sub2.content', { brandName, companyName })}</p>

      <h2>{t('legalPage.section5.title')}</h2>
      <p>
        {t('legalPage.section5.content')} <Link to="/privacy" className="text-primary-500 hover:text-primary-400">{t('legalPage.section5.privacyLink')}</Link>.
      </p>

      <h2>{t('legalPage.section6.title')}</h2>
      <p>{t('legalPage.section6.content')}</p>

      <h2>{t('legalPage.section7.title')}</h2>
      <p>{t('legalPage.section7.intro', { companyName })}</p>
      <p>{t('legalPage.section7.details', { companyName })}</p>

      <h2>{t('legalPage.section8.title')}</h2>
      <p>{t('legalPage.section8.content', { companyName })}</p>

      <h2>{t('legalPage.section9.title')}</h2>
      <p>{t('legalPage.section9.content', { legalEmail })}</p>
    </LegalContentLayout>
  );
};

export default LegalPage;
