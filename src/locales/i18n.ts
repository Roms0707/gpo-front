import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './en.json';
import frTranslations from './fr.json';
import esTranslations from './es.json';

const resources = {
  en: {
    translation: enTranslations
  },
  fr: {
    translation: frTranslations
  },
  es: {
    translation: esTranslations
  }
};

const detectionOptions = {
  order: ['localStorage', 'navigator'],
  caches: ['localStorage'],
  lookupLocalStorage: 'i18nextLng'
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['en', 'fr', 'es'],
    fallbackLng: 'en',
    detection: detectionOptions,

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;
