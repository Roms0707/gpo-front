import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Shield, Zap, Users, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AuthLayout from '../../components/auth/AuthLayout';
import ErrorMessage from '../../components/ui/ErrorMessage';
import InfoMessage from '../../components/ui/InfoMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';

const SignupDiscordPage: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading, user } = useAuth();
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { redirectPath, teamId, shouldShowLoadingSpinner } = useAuthRedirect({ user, isLoading });

  const handleDiscordSignup = async () => {
    try {
      setIsDiscordLoading(true);
      setError(null);

      let redirectTo = `${window.location.origin}/`;
      if (teamId) {
        const tournamentPath = redirectPath ? decodeURIComponent(redirectPath) : '/';
        redirectTo = `${window.location.origin}${tournamentPath}${tournamentPath.includes('?') ? '&' : '?'}teamId=${teamId}`;
      } else if (redirectPath) {
        redirectTo = `${window.location.origin}${decodeURIComponent(redirectPath)}`;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo,
          scopes: 'identify email',
          queryParams: {
            access_type: 'online',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        let errorMessage = t('auth.discordSignupErrorGeneric');
        if (error.message.includes('cancelled')) {
          errorMessage = t('auth.discordSignupCancelled');
        } else if (error.message.includes('redirect')) {
          errorMessage = t('auth.discordRedirectError');
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Discord signup error:', err);
      const errorMessage = t('auth.unexpectedDiscordSignupError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDiscordLoading(false);
    }
  };

  if (shouldShowLoadingSpinner) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('auth.redirecting')} />
      </div>
    );
  }

  const teamInviteMessage = teamId ? (
    <InfoMessage message={t('auth.teamInviteSignup')} type="info" />
  ) : null;

  return (
    <AuthLayout
      title={t('auth.discordSignupTitle')}
      subtitle={t('auth.discordSignupSubtitle')}
      teamInviteMessage={teamInviteMessage}
    >
      {error && <ErrorMessage message={error} />}

      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-dark-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary-500" />
            {t('auth.discordSignupBenefitsTitle')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <Zap className="h-4 w-4 mr-2 mt-0.5 text-primary-500 flex-shrink-0" />
              {t('auth.discordSignupBenefit1')}
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-primary-500 flex-shrink-0" />
              {t('auth.discordSignupBenefit2')}
            </li>
            <li className="flex items-start">
              <Users className="h-4 w-4 mr-2 mt-0.5 text-primary-500 flex-shrink-0" />
              {t('auth.discordSignupBenefit3')}
            </li>
            <li className="flex items-start">
              <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-primary-500 flex-shrink-0" />
              {t('auth.discordSignupBenefit4')}
            </li>
          </ul>
        </div>

        <button
          onClick={handleDiscordSignup}
          disabled={isLoading || isDiscordLoading}
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#5865F2]/50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg transition-colors flex items-center justify-center font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          {isDiscordLoading ? (
            <>
              <span className="animate-spin mr-2">&#8635;</span>
              {t('auth.connectingDiscord')}
            </>
          ) : (
            <>
              <MessageSquare className="h-6 w-6 mr-3" />
              {teamId ? t('auth.discordSignupAndJoinTeam') : t('auth.signupWithDiscord')}
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('auth.discordPrivacyNote')}
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link
            to={`/login${window.location.search}`}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 font-medium"
          >
            {t('auth.loginLink')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignupDiscordPage;
