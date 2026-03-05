import i18n from '../locales/i18n';
import { supabase } from '../lib/supabase';

export type SupportedLanguage = 'en' | 'fr' | 'es';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Fran\u00e7ais' },
  { code: 'es', name: 'Spanish', nativeName: 'Espa\u00f1ol' }
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

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
      return;
    }

    const detectedLanguage = this.detectBrowserLanguage();
    i18n.changeLanguage(detectedLanguage);
    localStorage.setItem('userLanguagePreference', detectedLanguage);
  }

  private detectBrowserLanguage(): SupportedLanguage {
    const browserLang = navigator.language || (navigator as any).userLanguage || '';
    const langCode = browserLang.split('-')[0].toLowerCase();

    if (langCode === 'fr') {
      return 'fr';
    }
    if (langCode === 'es') {
      return 'es';
    }

    return DEFAULT_LANGUAGE;
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

  public async syncLanguageToSupabase(userId: string, language: SupportedLanguage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ preferred_language: language })
        .eq('id', userId);

      if (error) {
        console.error('[TranslationService] Error syncing language to Supabase:', error);
        return false;
      }

      console.log(`[TranslationService] Language preference synced to Supabase: ${language}`);
      return true;
    } catch (err) {
      console.error('[TranslationService] Exception syncing language to Supabase:', err);
      return false;
    }
  }

  public async loadLanguageFromSupabase(userId: string): Promise<SupportedLanguage | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferred_language')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        console.log('[TranslationService] No saved language preference found in Supabase');
        return null;
      }

      const savedLanguage = data.preferred_language;
      if (savedLanguage && this.isSupportedLanguage(savedLanguage)) {
        console.log(`[TranslationService] Loaded language preference from Supabase: ${savedLanguage}`);
        return savedLanguage as SupportedLanguage;
      }

      return null;
    } catch (err) {
      console.error('[TranslationService] Exception loading language from Supabase:', err);
      return null;
    }
  }

  public async applyUserLanguagePreference(userId: string): Promise<void> {
    const supabaseLanguage = await this.loadLanguageFromSupabase(userId);

    if (supabaseLanguage) {
      await this.changeLanguage(supabaseLanguage);
    }
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
      case 'es':
        return 'es';
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
      'ES': 'es',
      'IT': 'en',
      'PT': 'en',
      'BR': 'en',
      'MX': 'es',
      'AR': 'es',
      'CL': 'es',
      'CO': 'es',
      'PE': 'es',
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
