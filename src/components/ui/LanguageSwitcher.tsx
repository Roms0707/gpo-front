import React, { useState, useEffect } from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import { translationService, SupportedLanguage } from '../../services/translationService';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'inline' | 'dropdown';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '', variant = 'inline' }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(translationService.getCurrentLanguage());
  const [isOpen, setIsOpen] = useState(false);

  // Update language when i18n changes (e.g., from browser detection)
  useEffect(() => {
    const handleLanguageChanged = () => {
      setCurrentLanguage(translationService.getCurrentLanguage());
    };

    window.addEventListener('languageChanged', handleLanguageChanged);
    return () => window.removeEventListener('languageChanged', handleLanguageChanged);
  }, []);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang !== currentLanguage) {
      await translationService.changeLanguage(lang);
      setCurrentLanguage(lang);
      setIsOpen(false);

      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
  };

  const getLanguageDisplay = (lang: SupportedLanguage): { flag: string; label: string } => {
    if (lang === 'fr') {
      return { flag: '🇫🇷', label: 'FR' };
    }
    return { flag: '🇬🇧', label: 'EN' };
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors border border-gray-200 dark:border-gray-700"
          aria-label="Change language"
          aria-expanded={isOpen}
        >
          <Languages className="h-4 w-4 opacity-70" aria-hidden="true" />
          <span className="text-sm font-medium">
            {getLanguageDisplay(currentLanguage).flag} {getLanguageDisplay(currentLanguage).label}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  currentLanguage === 'fr'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300'
                }`}
                aria-label="Switch to French"
              >
                <span className="text-2xl" role="img" aria-label="French flag">🇫🇷</span>
                <span className="text-sm font-medium">Français</span>
                {currentLanguage === 'fr' && (
                  <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
                )}
              </button>

              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  currentLanguage === 'en'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300'
                }`}
                aria-label="Switch to English"
              >
                <span className="text-2xl" role="img" aria-label="UK flag">🇬🇧</span>
                <span className="text-sm font-medium">English</span>
                {currentLanguage === 'en' && (
                  <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Languages className="h-4 w-4 opacity-70" aria-hidden="true" />
      <div className="flex items-center bg-gray-100 dark:bg-dark-200/50 rounded-lg p-1 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50">
        <button
          onClick={() => handleLanguageChange('fr')}
          className={`
            flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
            ${currentLanguage === 'fr'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-300/50'
            }
          `}
          aria-label="Switch to French"
          aria-pressed={currentLanguage === 'fr'}
        >
          <span role="img" aria-label="French flag">🇫🇷</span>
          <span>FR</span>
        </button>
        <button
          onClick={() => handleLanguageChange('en')}
          className={`
            flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
            ${currentLanguage === 'en'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-300/50'
            }
          `}
          aria-label="Switch to English"
          aria-pressed={currentLanguage === 'en'}
        >
          <span role="img" aria-label="UK flag">🇬🇧</span>
          <span>EN</span>
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
