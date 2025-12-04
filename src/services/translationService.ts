import i18n from '../locales/i18n';

export type SupportedLanguage = 'en' | 'fr';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';

export class TranslationService {
  private static instance: TranslationService;

  private constructor() {
    this.initializeLanguage();
  }

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  private initializeLanguage(): void {
    const savedLanguage = localStorage.getItem('userLanguagePreference');

    if (savedLanguage && this.isSupportedLanguage(savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
    } else {
      i18n.changeLanguage(DEFAULT_LANGUAGE);
    }
  }

  public async changeLanguage(language: SupportedLanguage): Promise<void> {
    if (!this.isSupportedLanguage(language)) {
      console.warn(`Language ${language} is not supported. Falling back to ${DEFAULT_LANGUAGE}`);
      language = DEFAULT_LANGUAGE;
    }

    await i18n.changeLanguage(language);
    localStorage.setItem('userLanguagePreference', language);

    console.log(`[TranslationService] Language changed to: ${language}`);
  }

  public getCurrentLanguage(): SupportedLanguage {
    return i18n.language as SupportedLanguage;
  }

  public getLanguageFromLocale(locale: string): SupportedLanguage {
    const languageCode = locale.split('_')[0].toLowerCase();

    switch (languageCode) {
      case 'en':
        return 'en';
      case 'fr':
        return 'fr';
      default:
        console.log(`[TranslationService] Unknown locale ${locale}, defaulting to ${DEFAULT_LANGUAGE}`);
        return DEFAULT_LANGUAGE;
    }
  }

  public getLanguageFromCountry(countryCode: string): SupportedLanguage {
    const languageMap: Record<string, SupportedLanguage> = {
      'TN': 'fr',
      'ET': 'en',
      'EG': 'en',
      'MA': 'fr',
      'DZ': 'fr',
      'US': 'en',
      'GB': 'en',
      'FR': 'fr',
      'CA': 'en',
      'AU': 'en',
      'DE': 'en',
      'ES': 'en',
      'IT': 'en',
      'PT': 'en',
      'BR': 'en',
      'MX': 'en',
      'AR': 'en',
      'CL': 'en',
      'CO': 'en',
      'PE': 'en',
      'DEFAULT': DEFAULT_LANGUAGE
    };

    return languageMap[countryCode.toUpperCase()] || languageMap['DEFAULT'];
  }

  private isSupportedLanguage(language: string): language is SupportedLanguage {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === language);
  }

  public getSupportedLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  public translate(key: string, options?: Record<string, any>): string {
    return i18n.t(key, options);
  }
}

export const translationService = TranslationService.getInstance();
