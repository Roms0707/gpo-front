import { format, isValid } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { formatCountryDisplay } from '../utils/countries';
import i18n from '../locales/i18n';

const getDateFnsLocale = () => {
  const currentLanguage = i18n.language || 'en';
  return currentLanguage.startsWith('fr') ? fr : enUS;
};

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      return i18n.t('common.dateToBeConfirmed');
    }
    const locale = getDateFnsLocale();
    const pattern = locale === fr ? 'dd MMMM yyyy à HH:mm' : 'MMMM dd, yyyy \'at\' HH:mm';
    return format(date, pattern, { locale });
  } catch (error) {
    return i18n.t('common.dateToBeConfirmed');
  }
};

export const formatCreationDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      return i18n.t('common.unknownDate');
    }
    const locale = getDateFnsLocale();
    const pattern = 'dd MMMM yyyy';
    return format(date, pattern, { locale });
  } catch (error) {
    return i18n.t('common.unknownDate');
  }
};

export const formatEligibleCountries = (countriesString: string) => {
  const countryCodes = countriesString.split(',').map(c => c.trim());
  return countryCodes.map(code => formatCountryDisplay(code, false, true)).join(' ');
};