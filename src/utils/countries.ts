import i18n from '../locales/i18n';

// Static country data with codes, flags, and phone codes
const countryData = [
  { code: "BF", flag: "🇧🇫", phoneCode: "bf" },
  { code: "BJ", flag: "🇧🇯", phoneCode: "bj" },
  { code: "BW", flag: "🇧🇼", phoneCode: "bw" },
  { code: "CD", flag: "🇨🇩", phoneCode: "cd" },
  { code: "CF", flag: "🇨🇫", phoneCode: "cf" },
  { code: "CI", flag: "🇨🇮", phoneCode: "ci" },
  { code: "CM", flag: "🇨🇲", phoneCode: "cm" },
  { code: "EG", flag: "🇪🇬", phoneCode: "eg" },
  { code: "GA", flag: "🇬🇦", phoneCode: "ga" },
  { code: "GH", flag: "🇬🇭", phoneCode: "gh" },
  { code: "GN", flag: "🇬🇳", phoneCode: "gn" },
  { code: "GW", flag: "🇬🇼", phoneCode: "gw" },
  { code: "JO", flag: "🇯🇴", phoneCode: "jo" },
  { code: "LR", flag: "🇱🇷", phoneCode: "lr" },
  { code: "MA", flag: "🇲🇦", phoneCode: "ma" },
  { code: "MG", flag: "🇲🇬", phoneCode: "mg" },
  { code: "ML", flag: "🇲🇱", phoneCode: "ml" },
  { code: "SL", flag: "🇸🇱", phoneCode: "sl" },
  { code: "SN", flag: "🇸🇳", phoneCode: "sn" },
  { code: "TG", flag: "🇹🇬", phoneCode: "tg" },
  { code: "TN", flag: "🇹🇳", phoneCode: "tn" }
];

// Get countries with translated names (function to get fresh translations)
export const getCountries = () => countryData.map(country => ({
  ...country,
  name: i18n.t(`countries.${country.code}`)
}));

// For backward compatibility, export countries as a getter
export const countries = getCountries();

// Utility function to get country information by code
export const getCountryByCode = (code: string) => {
  const country = countryData.find(c => c.code === code);
  if (!country) return undefined;

  return {
    ...country,
    name: i18n.t(`countries.${code}`)
  };
};

// Utility function to format country display with flag
export const formatCountryDisplay = (code: string, showFlag: boolean = true, flagOnly: boolean = false) => {
  const country = getCountryByCode(code);
  if (!country) return code;

  if (flagOnly) return country.flag;
  return showFlag ? `${country.flag} ${country.name}` : country.name;
};

export const getPhoneCountryCode = (countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  return country?.phoneCode || countryCode.toLowerCase();
};

export const getDefaultPhoneCountry = (eligibleCountries?: string): string => {
  if (!eligibleCountries || eligibleCountries.trim() === '') {
    return 'ci';
  }

  const countryCodes = eligibleCountries.split(',').map(c => c.trim());
  if (countryCodes.length === 0) {
    return 'ci';
  }

  const firstCountry = getCountryByCode(countryCodes[0]);
  return firstCountry?.phoneCode || countryCodes[0].toLowerCase();
};

export const getEligiblePhoneCountries = (eligibleCountries?: string): string[] => {
  if (!eligibleCountries || eligibleCountries.trim() === '') {
    return [];
  }

  const countryCodes = eligibleCountries.split(',').map(c => c.trim());
  return countryCodes
    .map(code => getPhoneCountryCode(code))
    .filter(Boolean);
};