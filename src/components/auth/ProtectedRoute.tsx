import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'gamer';
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-400">{t('auth.verifyingAuthentication')}</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && user.type !== requiredRole) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-dark-100 rounded-xl p-8 border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-error-500/20 rounded-full mb-4">
                <Shield className="h-8 w-8 text-error-500" />
              </div>
              <h1 className="font-heading font-bold text-2xl mb-4 text-gray-900 dark:text-white">
                {t('auth.accessDenied')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('auth.noPermissionsForPage')}
                {requiredRole === 'admin' && ` ${t('auth.adminOnly')}`}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white rounded-lg transition-colors"
                >
                  {t('auth.back')}
                </button>
                <Navigate to="/" replace />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated and has the required role (or no role required), render the child routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
