import { LegalVariables } from '../types/projectConfig';
import { APP_CONFIG } from '../constants';

export const replaceTemplateVariables = (
  text: string,
  legalVariables: LegalVariables
): string => {
  const replacements: Record<string, string> = {
    '{{company_name}}': legalVariables.company_name || APP_CONFIG.CONTACT.COMPANY_NAME,
    '{{support_email}}': legalVariables.support_email || APP_CONFIG.CONTACT.SUPPORT_EMAIL,
    '{{legal_email}}': legalVariables.legal_email || APP_CONFIG.CONTACT.LEGAL_EMAIL,
    '{{privacy_email}}': legalVariables.privacy_email || APP_CONFIG.CONTACT.PRIVACY_EMAIL,
    '{{company_address}}': legalVariables.company_address || APP_CONFIG.CONTACT.COMPANY_ADDRESS,
    '{{phone_number}}': legalVariables.phone_number || '',
    '{{registration_number}}': legalVariables.registration_number || '',
  };

  let result = text;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
};

export const createReactElementsWithReplacements = (
  content: React.ReactNode,
  legalVariables: LegalVariables
): React.ReactNode => {
  if (typeof content === 'string') {
    return replaceTemplateVariables(content, legalVariables);
  }
  return content;
};
