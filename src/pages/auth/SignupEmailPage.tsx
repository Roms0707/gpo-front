import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { countries } from '../../utils/countries';
import AuthLayout from '../../components/auth/AuthLayout';
import FormField from '../../components/ui/FormField';
import ErrorMessage from '../../components/ui/ErrorMessage';
import InfoMessage from '../../components/ui/InfoMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';

const SignupEmailPage: React.FC = () => {
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

  const { redirectPath, teamId, shouldShowLoadingSpinner } = useAuthRedirect({ user, isLoading });

  const params = new URLSearchParams(window.location.search);
  const emailParam = params.get('email');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

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
      await signup(username, email, password, dateOfBirth, country, parentalConsent || undefined);
    } catch (err) {
      console.error('Signup error:', err);
      setError(t('auth.signupError'));
    } finally {
      setIsSubmitting(false);
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
      title={t('auth.createAccount')}
      subtitle={teamId ? t('auth.createAccountToJoinTeam') : t('auth.signupForTournaments')}
      teamInviteMessage={teamInviteMessage}
    >
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="mt-1">
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
            <p className="text-xs text-gray-400 mt-1">{t('auth.parentalConsentRequired')}</p>
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

        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          disabled={isLoading || isSubmitting}
        >
          {isLoading || isSubmitting ? (
            <>
              <span className="animate-spin mr-2">&#8635;</span>
              {t('auth.signingUp')}
            </>
          ) : teamId ? (
            t('auth.signupAndJoinTeam')
          ) : (
            t('auth.signup')
          )}
        </button>
      </form>

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

export default SignupEmailPage;
