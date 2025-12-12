import { useAppConfig } from '../contexts/AppConfigContext';
import { LegalVariables } from '../types/projectConfig';
import { APP_CONFIG } from '../constants';

interface UseLegalVariablesReturn extends LegalVariables {
  getSupportEmail: () => string;
  getLegalEmail: () => string;
  getPrivacyEmail: () => string;
  getCompanyName: () => string;
  getCompanyAddress: () => string;
  getPhoneNumber: () => string;
  getRegistrationNumber: () => string;
  getDiscordUrl: () => string;
}

export const useLegalVariables = (): UseLegalVariablesReturn => {
  const { legalVariables } = useAppConfig();

  return {
    ...legalVariables,
    getSupportEmail: () => legalVariables.support_email || APP_CONFIG.CONTACT.SUPPORT_EMAIL,
    getLegalEmail: () => legalVariables.legal_email || APP_CONFIG.CONTACT.LEGAL_EMAIL,
    getPrivacyEmail: () => legalVariables.privacy_email || APP_CONFIG.CONTACT.PRIVACY_EMAIL,
    getCompanyName: () => legalVariables.company_name || APP_CONFIG.CONTACT.COMPANY_NAME,
    getCompanyAddress: () => legalVariables.company_address || APP_CONFIG.CONTACT.COMPANY_ADDRESS,
    getPhoneNumber: () => legalVariables.phone_number || '',
    getRegistrationNumber: () => legalVariables.registration_number || '',
    getDiscordUrl: () => legalVariables.discord_url || APP_CONFIG.CONTACT.DISCORD_INVITE,
  };
};
