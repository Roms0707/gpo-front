import React from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LegalContentLayout from '../components/layout/LegalContentLayout';
import { useLegalVariables } from '../hooks/useLegalVariables';
import { useAppConfig } from '../contexts/AppConfigContext';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();
  const legalVars = useLegalVariables();
  const { brandName } = useAppConfig();
  const companyName = legalVars.getCompanyName();
  const companyAddress = legalVars.getCompanyAddress();
  const phoneNumber = legalVars.getPhoneNumber();
  const privacyEmail = legalVars.getPrivacyEmail();

  return (
    <LegalContentLayout
      title={t('privacyPage.title')}
      icon={<Shield className="h-6 w-6 text-primary-500 mr-3" />}
    >
      <h2>{t('privacyPage.section1.title')}</h2>
      <h3>{t('privacyPage.section1.sub1.title')}</h3>
      <p>{t('privacyPage.section1.sub1.intro')}</p>
      <ul>
        <li>{t('privacyPage.section1.sub1.items.account')}</li>
        <li>{t('privacyPage.section1.sub1.items.profile')}</li>
        <li>{t('privacyPage.section1.sub1.items.tournaments')}</li>
        <li>{t('privacyPage.section1.sub1.items.contact')}</li>
        <li>{t('privacyPage.section1.sub1.items.minors')}</li>
      </ul>

      <h3>{t('privacyPage.section1.sub2.title')}</h3>
      <p>{t('privacyPage.section1.sub2.intro')}</p>
      <ul>
        <li>{t('privacyPage.section1.sub2.items.ip')}</li>
        <li>{t('privacyPage.section1.sub2.items.device')}</li>
        <li>{t('privacyPage.section1.sub2.items.pages')}</li>
        <li>{t('privacyPage.section1.sub2.items.cookies')}</li>
      </ul>

      <h2>{t('privacyPage.section2.title')}</h2>
      <p>{t('privacyPage.section2.intro')}</p>

      <h3>{t('privacyPage.section2.sub1.title')}</h3>
      <ul>
        <li>{t('privacyPage.section2.sub1.items.account')}</li>
        <li>{t('privacyPage.section2.sub1.items.participation')}</li>
        <li>{t('privacyPage.section2.sub1.items.eligibility')}</li>
        <li>{t('privacyPage.section2.sub1.items.connect')}</li>
        <li>{t('privacyPage.section2.sub1.items.rewards')}</li>
      </ul>

      <h3>{t('privacyPage.section2.sub2.title')}</h3>
      <ul>
        <li>{t('privacyPage.section2.sub2.items.notifications')}</li>
        <li>{t('privacyPage.section2.sub2.items.respond')}</li>
        <li>{t('privacyPage.section2.sub2.items.inform')}</li>
        <li>{t('privacyPage.section2.sub2.items.marketing')}</li>
      </ul>

      <h3>{t('privacyPage.section2.sub3.title')}</h3>
      <ul>
        <li>{t('privacyPage.section2.sub3.items.improve')}</li>
        <li>{t('privacyPage.section2.sub3.items.analyze')}</li>
        <li>{t('privacyPage.section2.sub3.items.detect')}</li>
        <li>{t('privacyPage.section2.sub3.items.resolve')}</li>
      </ul>

      <h2>{t('privacyPage.section3.title')}</h2>
      <p>{t('privacyPage.section3.intro')}</p>
      <ul>
        <li><strong>{t('privacyPage.section3.items.contract')}</strong></li>
        <li><strong>{t('privacyPage.section3.items.consent')}</strong></li>
        <li><strong>{t('privacyPage.section3.items.legitimate')}</strong></li>
        <li><strong>{t('privacyPage.section3.items.legal')}</strong></li>
      </ul>

      <h2>{t('privacyPage.section4.title')}</h2>
      <h3>{t('privacyPage.section4.sub1.title')}</h3>
      <p>{t('privacyPage.section4.sub1.content')}</p>

      <h3>{t('privacyPage.section4.sub2.title')}</h3>
      <p>{t('privacyPage.section4.sub2.intro')}</p>
      <ul>
        <li>{t('privacyPage.section4.sub2.items.hosting')}</li>
        <li>{t('privacyPage.section4.sub2.items.payment')}</li>
        <li>{t('privacyPage.section4.sub2.items.analytics')}</li>
        <li>{t('privacyPage.section4.sub2.items.support')}</li>
      </ul>
      <p>{t('privacyPage.section4.sub2.outro')}</p>

      <h3>{t('privacyPage.section4.sub3.title')}</h3>
      <p>{t('privacyPage.section4.sub3.intro')}</p>
      <ul>
        <li>{t('privacyPage.section4.sub3.items.legal')}</li>
        <li>{t('privacyPage.section4.sub3.items.protect', { brandName })}</li>
      </ul>

      <h2>{t('privacyPage.section5.title')}</h2>
      <p>{t('privacyPage.section5.content')}</p>

      <h2>{t('privacyPage.section6.title')}</h2>
      <p>{t('privacyPage.section6.intro')}</p>
      <ul>
        <li>{t('privacyPage.section6.items.account')}</li>
        <li>{t('privacyPage.section6.items.tournament')}</li>
        <li>{t('privacyPage.section6.items.parental')}</li>
        <li>{t('privacyPage.section6.items.support')}</li>
      </ul>
      <p>{t('privacyPage.section6.outro')}</p>

      <h2>{t('privacyPage.section7.title')}</h2>
      <p>{t('privacyPage.section7.intro')}</p>
      <ul>
        <li>{t('privacyPage.section7.items.encryption')}</li>
        <li>{t('privacyPage.section7.items.access')}</li>
        <li>{t('privacyPage.section7.items.audits')}</li>
        <li>{t('privacyPage.section7.items.training')}</li>
      </ul>
      <p>{t('privacyPage.section7.outro')}</p>

      <h2>{t('privacyPage.section8.title')}</h2>
      <p>{t('privacyPage.section8.intro')}</p>
      <ul>
        <li><strong>{t('privacyPage.section8.items.access')}</strong></li>
        <li><strong>{t('privacyPage.section8.items.rectification')}</strong></li>
        <li><strong>{t('privacyPage.section8.items.erasure')}</strong></li>
        <li><strong>{t('privacyPage.section8.items.restriction')}</strong></li>
        <li><strong>{t('privacyPage.section8.items.portability')}</strong></li>
        <li><strong>{t('privacyPage.section8.items.objection')}</strong></li>
        <li><strong>{t('privacyPage.section8.items.withdraw')}</strong></li>
      </ul>
      <p>{t('privacyPage.section8.contact')}</p>

      <h2>{t('privacyPage.section9.title')}</h2>
      <p>{t('privacyPage.section9.intro')}</p>
      <ul>
        <li>{t('privacyPage.section9.items.authorization')}</li>
        <li>{t('privacyPage.section9.items.document')}</li>
        <li>{t('privacyPage.section9.items.restrictions')}</li>
      </ul>
      <p>{t('privacyPage.section9.outro')}</p>

      <h2>{t('privacyPage.section10.title')}</h2>
      <p>{t('privacyPage.section10.content')}</p>

      <h2>{t('privacyPage.section11.title')}</h2>
      <p>{t('privacyPage.section11.content')}</p>

      <h2>{t('privacyPage.section12.title')}</h2>
      <p>{t('privacyPage.section12.intro')}</p>
      <p>
        <strong>{t('privacyPage.section12.company')}:</strong> {companyName}<br />
        <strong>{t('privacyPage.section12.address')}:</strong> {companyAddress}<br />
        {phoneNumber && (
          <>
            <strong>{t('privacyPage.section12.phone')}:</strong> {phoneNumber}<br />
          </>
        )}
        <strong>{t('privacyPage.section12.email')}:</strong> {privacyEmail}
      </p>
      <p>{t('privacyPage.section12.complaint')}</p>
    </LegalContentLayout>
  );
}

export default PrivacyPage;
