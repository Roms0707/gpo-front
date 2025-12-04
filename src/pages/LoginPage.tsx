import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Mail, Lock } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import InfoMessage from '../components/ui/InfoMessage';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, isLoading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Use the auth redirect hook
  const { redirectPath, teamId, shouldShowLoadingSpinner } = useAuthRedirect({ user, isLoading });

  // Scroll to top when component mounts
  useEffect(() => {
    if (pageRef.current) {
      window.scrollTo(0, 0);
    }
  }, []);
  
  const handleDiscordOAuth = async (isSignup: boolean = false) => {
    try {
      setIsDiscordLoading(true);
      setError(null);

      console.log(`Initiating Discord OAuth ${isSignup ? 'signup' : 'login'}...`);

      // Determine redirect URL based on team invitation
      let redirectTo = `${window.location.origin}/`;
      if (teamId) {
        // If there's a team invitation, redirect back to the tournament page with team ID
        const tournamentPath = redirectPath ? decodeURIComponent(redirectPath) : '/';
        redirectTo = `${window.location.origin}${tournamentPath}${tournamentPath.includes('?') ? '&' : '?'}teamId=${teamId}`;
      } else if (redirectPath) {
        // If there's a general redirect path, use it
        redirectTo = `${window.location.origin}${decodeURIComponent(redirectPath)}`;
      }

      console.log('Discord OAuth redirect URL:', redirectTo);

      const queryParams: Record<string, string> = {
        access_type: 'online',
        prompt: isSignup ? 'consent' : 'consent'
      };

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectTo,
          scopes: 'identify email',
          queryParams: queryParams
        }
      });

      if (error) {
        console.error('Discord OAuth error:', error);

        let errorMessage = `${isSignup ? t('loginPage.errors.discordSignupError') : t('loginPage.errors.discordLoginError')}`;
        if (error.message.includes('cancelled')) {
          errorMessage = `${isSignup ? t('loginPage.errors.discordSignupCancelled') : t('loginPage.errors.discordCancelled')}`;
        } else if (error.message.includes('redirect')) {
          errorMessage = t('loginPage.errors.discordRedirect');
        } else if (error.message.includes('cors') || error.message.includes('autorise')) {
          errorMessage = t('loginPage.errors.discordConfig');
        }

        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        console.log('Discord OAuth initiated successfully');
        // The redirect will happen automatically
      }
    } catch (err) {
      console.error('Discord OAuth error:', err);
      const errorMessage = `${isSignup ? t('loginPage.errors.unexpectedDiscordSignupError') : t('loginPage.errors.unexpectedDiscordError')}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDiscordLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError(t('loginPage.errors.fillAllFields'));
      return;
    }

    try {
      setIsEmailLoading(true);
      setError(null);

      await login(email, password, rememberMe);

      // Redirect is handled by useAuthRedirect hook
    } catch (err) {
      console.error('Email login error:', err);
      const errorMessage = err instanceof Error ? err.message : t('loginPage.errors.loginError');
      setError(errorMessage);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleDiscordLogin = () => handleDiscordOAuth(false);
  const handleDiscordSignup = () => handleDiscordOAuth(true);
  
  // Show loading spinner if user is logged in and we're about to redirect
  if (shouldShowLoadingSpinner) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('loginPage.redirecting')} />
      </div>
    );
  }
  
  // Team invite message component
  const teamInviteMessage = teamId ? (
    <InfoMessage 
      message={t('loginPage.teamInviteMessage')}
      type="info"
    />
  ) : null;
  
  return (
    <div ref={pageRef}>
      <AuthLayout
        title={t('loginPage.title')}
        subtitle={teamId ? t('loginPage.subtitleWithTeam') : t('loginPage.subtitle')}
        teamInviteMessage={teamInviteMessage}
      >
        {error && <ErrorMessage message={error} />}

        {/* Email/Password Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="label">
              Email
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
                disabled={isEmailLoading}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">
              Mot de passe
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
                disabled={isEmailLoading}
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
                disabled={isEmailLoading}
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {t('loginPage.rememberMe')}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isEmailLoading || isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            {isEmailLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {t('loginPage.signingIn')}
              </>
            ) : (
              t('loginPage.signIn')
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-dark-100 text-gray-500 dark:text-gray-400">
              {t('loginPage.orContinueWith')}
            </span>
          </div>
        </div>

        {/* Discord Login */}
        <button
          onClick={handleDiscordLogin}
          disabled={isLoading || isDiscordLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg transition-colors flex items-center justify-center font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          {isDiscordLoading ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              {t('loginPage.signingInDiscord')}
            </>
          ) : (
            <>
              <MessageSquare className="h-6 w-6 mr-3" />
              {t('loginPage.signInWithDiscord')}
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('loginPage.noAccount')}
          </p>
          <a
            href="/signup"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm underline transition-colors"
          >
            {t('loginPage.signUp')}
          </a>
        </div>
      </AuthLayout>
    </div>
  );
};

export default LoginPage;