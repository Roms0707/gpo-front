import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import ErrorMessage from '../../components/ui/ErrorMessage';
import InfoMessage from '../../components/ui/InfoMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';

const LoginEmailPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, isLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { redirectPath, teamId, shouldShowLoadingSpinner } = useAuthRedirect({ user, isLoading });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError(t('loginPage.errors.fillAllFields'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login(email, password, rememberMe);
    } catch (err) {
      console.error('Email login error:', err);
      const errorMessage = err instanceof Error ? err.message : t('loginPage.errors.loginError');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (shouldShowLoadingSpinner) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('loginPage.redirecting')} />
      </div>
    );
  }

  const teamInviteMessage = teamId ? (
    <InfoMessage message={t('loginPage.teamInviteMessage')} type="info" />
  ) : null;

  return (
    <AuthLayout
      title={t('loginPage.title')}
      subtitle={teamId ? t('loginPage.subtitleWithTeam') : t('loginPage.subtitle')}
      teamInviteMessage={teamInviteMessage}
    >
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            {t('auth.email')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('loginPage.emailPlaceholder')}
              className="input pl-10"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">
            {t('auth.password')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('loginPage.passwordPlaceholder')}
              className="input pl-10"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              disabled={isSubmitting}
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {t('loginPage.rememberMe')}
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">&#8635;</span>
              {t('loginPage.signingIn')}
            </>
          ) : (
            t('loginPage.signIn')
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {t('loginPage.noAccount')}
        </p>
        <Link
          to={`/signup${window.location.search}`}
          className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm underline transition-colors"
        >
          {t('loginPage.signUp')}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default LoginEmailPage;
