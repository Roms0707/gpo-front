import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { countries } from '../utils/countries';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/auth/AuthLayout';
import FormField from '../components/ui/FormField';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import InfoMessage from '../components/ui/InfoMessage';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  const { signup, isLoading, user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [isUnder18, setIsUnder18] = useState(false);
  const [parentalConsent, setParentalConsent] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  
  // Discord signup state
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  
  // Use the auth redirect hook
  const { redirectPath, teamId, shouldShowLoadingSpinner } = useAuthRedirect({ user, isLoading });
  
  // Get email param from URL
  const params = new URLSearchParams(window.location.search);
  const emailParam = params.get('email');
  
  // Set email from param if available
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);
  
  // Scroll to top when component mounts
  useEffect(() => {
    if (pageRef.current) {
      window.scrollTo(0, 0);
    }
  }, []);
  
  useEffect(() => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setIsUnder18(age < 18);
    }
  }, [dateOfBirth]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setParentalConsent(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username || !email || !password || !confirmPassword || !dateOfBirth || !country) {
      setError(t('auth.fillAllRequiredFields'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    
    if (isUnder18 && !parentalConsent) {
      setError(t('auth.parentalConsentRequiredUnder18'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('Attempting signup...');
      await signup(username, email, password, dateOfBirth, country, parentalConsent || undefined);
      
      // The useEffect above will handle the redirect once user state is updated
      console.log('Signup function completed');
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(t('auth.signupError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDiscordSignup = async () => {
    try {
      setIsDiscordLoading(true);
      setError(null);
      
      console.log('Initiating Discord OAuth signup...');
      
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
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectTo,
          scopes: 'identify email',
          queryParams: {
            access_type: 'online',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Discord OAuth error:', error);
        
        let errorMessage = t('auth.discordSignupErrorGeneric');
        if (error.message.includes('cancelled')) {
          errorMessage = t('auth.discordSignupCancelled');
        } else if (error.message.includes('redirect')) {
          errorMessage = t('auth.discordRedirectError');
        } else if (error.message.includes('cors') || error.message.includes('autorise')) {
          errorMessage = t('auth.discordConfigError');
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        console.log('Discord OAuth initiated successfully');
        // The redirect will happen automatically
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
  
  // Show loading spinner if user is logged in and we're about to redirect
  if (shouldShowLoadingSpinner) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('auth.redirecting')} />
      </div>
    );
  }
  
  // Team invite message component
  const teamInviteMessage = teamId ? (
    <InfoMessage 
      message={t('auth.teamInviteSignup')}
      type="info"
    />
  ) : null;
  
  return (
    <div ref={pageRef}>
      <AuthLayout
        title={t('auth.createAccount')}
        subtitle={teamId ? t('auth.createAccountToJoinTeam') : t('auth.signupForTournaments')}
        teamInviteMessage={teamInviteMessage}
      >
        <>
        {error && <ErrorMessage message={error} />}

        {/* Email/Password Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
              <FormField
                label={t('auth.username')}
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting || isLoading}
              />
              
              <FormField
                label={t('auth.email')}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting || isLoading}
              />
              
              <FormField
                label={t('auth.dateOfBirth')}
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                disabled={isSubmitting || isLoading}
                max={new Date().toISOString().split('T')[0]}
                helpText={t('auth.cannotBeChangedLater')}
              />

              <FormField
                label={t('auth.country')}
                id="country"
                as="select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                disabled={isSubmitting || isLoading}
                helpText={t('auth.cannotBeChangedLater')}
              >
                <option value="">{t('auth.selectCountry')}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </FormField>
              
              {isUnder18 && (
                <div>
                  <label htmlFor="parentalConsent" className="label">
                    {t('auth.parentalConsent')} <span className="text-error-500">*</span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="block w-full">
                      <div className="bg-dark-300 border border-gray-700 rounded-lg px-4 py-2 cursor-pointer hover:bg-dark-400 transition-colors">
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-gray-300">
                            {parentalConsent ? parentalConsent.name : t('auth.selectPDFFile')}
                          </span>
                        </div>
                      </div>
                      <input
                        type="file"
                        id="parentalConsent"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf"
                        required={isUnder18}
                        disabled={isSubmitting || isLoading}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('auth.parentalConsentRequired')}
                  </p>
                </div>
              )}
              
              <FormField
                label={t('auth.password')}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting || isLoading}
              />
              
              <FormField
                label={t('auth.confirmPassword')}
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting || isLoading}
              />
            </div>
            
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {t('auth.signingUp')}
              </>
            ) : (
              teamId ? t('auth.signupAndJoinTeam') : t('auth.signup')
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
              {t('auth.orContinueWith')}
            </span>
          </div>
        </div>

        {/* Discord Signup Button - Alternative option */}
        <button
          onClick={handleDiscordSignup}
          disabled={isLoading || isSubmitting || isDiscordLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          {isDiscordLoading ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              {t('auth.connectingDiscord')}
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5 mr-2" />
              {teamId ? t('auth.discordSignupAndJoinTeam') : t('auth.signupWithDiscord')}
            </>
          )}
        </button>
        
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
        
        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-800/30 rounded-lg border border-indigo-200 dark:border-indigo-700/50">
          <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">{t('auth.discordSignupTitle')}</h3>
          <ul className="text-xs text-indigo-600 dark:text-indigo-200 space-y-1">
            <li>• {t('auth.discordSignupBenefit1')}</li>
            <li>• {t('auth.discordSignupBenefit2')}</li>
            <li>• {t('auth.discordSignupBenefit3')}</li>
            <li>• {t('auth.discordSignupBenefit4')}</li>
          </ul>
        </div>
        </>
      </AuthLayout>
    </div>
  );
};

export default SignupPage;