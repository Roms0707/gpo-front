// Handle authentication errors with user-friendly messages
export const handleAuthError = (error: any): string => {
  let errorMessage = 'Erreur de connexion. Veuillez réessayer.';

  if (!error.message) return errorMessage;

  switch (error.message) {
    case 'Invalid login credentials':
    case 'Invalid email or password':
      return 'Email ou mot de passe incorrect.';
    case 'Email not confirmed':
      return 'Veuillez confirmer votre email avant de vous connecter.';
    case 'Too many requests':
      return 'Trop de tentatives. Veuillez attendre quelques minutes.';
    default:
      if (error.message.includes('invalid_credentials')) {
        return 'Email ou mot de passe incorrect.';
      } else if (error.message.includes('email_not_confirmed')) {
        return 'Veuillez confirmer votre email avant de vous connecter.';
      }
      return errorMessage;
  }
};

// Handle signup-specific errors
export const handleSignupError = (error: any): string => {
  let errorMessage = "Erreur lors de l'inscription";

  if (!error.message) return errorMessage;

  if (error.message.includes('User already registered')) {
    return 'Un compte avec cet email existe déjà';
  } else if (error.message.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères';
  } else if (error.message.includes('Invalid email')) {
    return 'Adresse email invalide';
  }

  return errorMessage;
};
