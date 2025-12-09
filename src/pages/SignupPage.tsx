import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppConfig } from '../contexts/AppConfigContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SignupEmailPage from './auth/SignupEmailPage';
import SignupDiscordPage from './auth/SignupDiscordPage';
import { useTranslation } from 'react-i18next';

const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  const { authMethod, isLoading } = useAppConfig();

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('common.loading')} />
      </div>
    );
  }

  switch (authMethod) {
    case 'discord':
      return <SignupDiscordPage />;
    case 'kliento':
      return <Navigate to="/login" replace />;
    case 'email':
    default:
      return <SignupEmailPage />;
  }
};

export default SignupPage;
