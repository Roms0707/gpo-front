import i18n from '../locales/i18n';

const DEFAULT_COUNTRY_CODE = '251';

const COUNTRY_CODE_MAP: { [key: string]: string } = {
  '251': 'et',
  '226': 'bf',
  '229': 'bj',
  '267': 'bw',
  '243': 'cd',
  '236': 'cf',
  '225': 'ci',
  '237': 'cm',
  '20': 'eg',
  '33': 'fr',
  '241': 'ga',
  '233': 'gh',
  '224': 'gn',
  '245': 'gw',
  '962': 'jo',
  '231': 'lr',
  '212': 'ma',
  '261': 'mg',
  '223': 'ml',
  '232': 'sl',
  '221': 'sn',
  '228': 'tg',
  '216': 'tn'
};

export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: i18n.t('validation.phoneRequired') };
  }

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length < 9) {
    return { isValid: false, error: i18n.t('validation.phoneTooShort') };
  }

  if (cleaned.length > 15) {
    return { isValid: false, error: i18n.t('validation.phoneLength') };
  }

  return { isValid: true };
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '');
};

export const normalizePhoneToE164 = (phone: string, defaultCountryCode: string = DEFAULT_COUNTRY_CODE): string => {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) {
    return '';
  }

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  const hasCountryCode = Object.keys(COUNTRY_CODE_MAP).some(code => cleaned.startsWith(code));

  if (!hasCountryCode) {
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = defaultCountryCode + cleaned;
  }

  return '+' + cleaned;
};

export const getPhoneCountryFromNumber = (phone: string): string | null => {
  const cleanPhone = phone.replace(/[\s\-\(\)+]/g, '');

  for (const [code, country] of Object.entries(COUNTRY_CODE_MAP)) {
    if (cleanPhone.startsWith(code)) {
      return country;
    }
  }

  return null;
};
