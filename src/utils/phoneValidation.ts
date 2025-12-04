import i18n from '../locales/i18n';

export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: i18n.t('validation.phoneRequired') };
  }

  if (phone.length < 8) {
    return { isValid: false, error: i18n.t('validation.phoneTooShort') };
  }

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: i18n.t('validation.invalidPhoneFormat') };
  }

  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { isValid: false, error: i18n.t('validation.phoneLength') };
  }

  return { isValid: true };
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '');
};

export const getPhoneCountryFromNumber = (phone: string): string | null => {
  const countryCodeMap: { [key: string]: string } = {
    '226': 'bf',
    '229': 'bj',
    '267': 'bw',
    '243': 'cd',
    '236': 'cf',
    '225': 'ci',
    '237': 'cm',
    '20': 'eg',
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

  const cleanPhone = phone.replace(/[\s\-\(\)+]/g, '');

  for (const [code, country] of Object.entries(countryCodeMap)) {
    if (cleanPhone.startsWith(code)) {
      return country;
    }
  }

  return null;
};
