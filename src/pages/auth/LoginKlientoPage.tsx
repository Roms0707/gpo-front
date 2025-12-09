import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAppConfig } from '../../contexts/AppConfigContext';
import AuthLayout from '../../components/auth/AuthLayout';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { loginWithKliento, setKlientoSession } from '../../services/klientoAuthService';
import { useAuthStore } from '../../stores/authStore';

const LoginKlientoPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId } = useAppConfig();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checkSession } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError(t('loginPage.errors.fillAllFields'));
      return;
    }

    if (!productId) {
      setError(t('loginPage.errors.configurationError'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await loginWithKliento(username, password, productId);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (result.user) {
        setKlientoSession(result.user);
        toast.success(t('loginPage.loginSuccess'));
        await checkSession();
        navigate('/');
      }
    } catch (err) {
      console.error('Kliento login error:', err);
      const errorMessage = err instanceof Error ? err.message : t('loginPage.errors.loginError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t('loginPage.klientoTitle')}
      subtitle={t('loginPage.klientoSubtitle')}
    >
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="label">
            {t('loginPage.username')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('loginPage.usernamePlaceholder')}
              className="input pl-10"
              disabled={isSubmitting}
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('loginPage.usernameHint')}
          </p>
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

        <button
          type="submit"
          disabled={isSubmitting}
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

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {t('loginPage.klientoExternalSignup')}
            </h3>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              {t('loginPage.klientoExternalSignupHint')}
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginKlientoPage;
