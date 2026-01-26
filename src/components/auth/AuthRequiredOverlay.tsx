import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, LogIn } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface AuthRequiredOverlayProps {
  theme: GameTheme;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const AuthRequiredOverlay: React.FC<AuthRequiredOverlayProps> = ({
  theme,
  title,
  description,
  children,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginClick = () => {
    const currentPath = location.pathname + location.search;
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-dark-100/70 backdrop-blur-[2px] rounded-xl">
        <div className="text-center px-6 py-8 max-w-md">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}15` }}
          >
            <Lock className="w-8 h-8" style={{ color: theme.colors.primary }} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.loginRequired', 'Login required')}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title || t('auth.unlockContent', 'Unlock this content')}
          </h3>

          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            {description || t('auth.loginToAccess', 'Login to access exclusive content and features')}
          </p>

          <button
            onClick={handleLoginClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.text,
              boxShadow: `0 4px 20px ${theme.colors.primary}40`,
            }}
          >
            <LogIn className="w-5 h-5" />
            {t('auth.login', 'Log In')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredOverlay;
