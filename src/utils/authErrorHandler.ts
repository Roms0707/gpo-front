import i18n from '../locales/i18n';

// Handle authentication errors with user-friendly messages
export const handleAuthError = (error: any): string => {
  let errorMessage = i18n.t('errors.connectionRetry');

  if (!error.message) return errorMessage;

  switch (error.message) {
    case 'Invalid login credentials':
    case 'Invalid email or password':
      return i18n.t('errors.invalidCredentials');
    case 'Email not confirmed':
      return i18n.t('errors.emailNotConfirmed');
    case 'Too many requests':
      return i18n.t('errors.tooManyAttempts');
    default:
      if (error.message.includes('invalid_credentials')) {
        return i18n.t('errors.invalidCredentials');
      } else if (error.message.includes('email_not_confirmed')) {
        return i18n.t('errors.emailNotConfirmed');
      }
      return errorMessage;
  }
};

// Handle signup-specific errors
export const handleSignupError = (error: any): string => {
  let errorMessage = i18n.t('errors.signupError');

  if (!error.message) return errorMessage;

  if (error.message.includes('User already registered')) {
    return i18n.t('errors.accountAlreadyExists');
  } else if (error.message.includes('Password should be at least')) {
    return i18n.t('validation.passwordTooShort');
  } else if (error.message.includes('Invalid email')) {
    return i18n.t('validation.invalidEmail');
  }

  return errorMessage;
};
