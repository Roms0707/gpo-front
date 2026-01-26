import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { useAuth } from '../../contexts/AuthContext';
import AuthRequiredOverlay from '../auth/AuthRequiredOverlay';

interface OthersArticlesTabProps {
  theme: GameTheme;
}

const OthersArticlesTab: React.FC<OthersArticlesTabProps> = ({ theme }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const content = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${theme.colors.primary}15` }}
      >
        <FileText className="w-10 h-10" style={{ color: theme.colors.primary }} />
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {t('othersHub.articlesComingSoon')}
      </h3>

      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        {t('othersHub.articlesDescription')}
      </p>

      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
        style={{
          backgroundColor: `${theme.colors.primary}15`,
          color: theme.colors.primary,
        }}
      >
        <Clock className="w-4 h-4" />
        <span>{t('othersHub.stayTuned')}</span>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-gray-700 p-4 opacity-50"
          >
            <div className="h-32 bg-gray-100 dark:bg-dark-300 rounded-lg mb-3 animate-pulse" />
            <div className="h-4 bg-gray-100 dark:bg-dark-300 rounded w-3/4 mb-2 animate-pulse" />
            <div className="h-3 bg-gray-100 dark:bg-dark-300 rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!user) {
    return (
      <AuthRequiredOverlay
        theme={theme}
        title={t('auth.articlesLocked.title', 'Unlock Articles')}
        description={t('auth.articlesLocked.description', 'Login to access exclusive articles and guides')}
      >
        {content}
      </AuthRequiredOverlay>
    );
  }

  return content;
};

export default OthersArticlesTab;
