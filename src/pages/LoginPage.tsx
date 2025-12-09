import React from 'react';
import { useAppConfig } from '../contexts/AppConfigContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import LoginEmailPage from './auth/LoginEmailPage';
import LoginDiscordPage from './auth/LoginDiscordPage';
import LoginKlientoPage from './auth/LoginKlientoPage';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
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
      return <LoginDiscordPage />;
    case 'kliento':
      return <LoginKlientoPage />;
    case 'email':
    default:
      return <LoginEmailPage />;
  }
};

export default LoginPage;
