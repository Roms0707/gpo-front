import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { User } from '../types';
import { toastSuccess, toastError } from '../utils/toastHelper';
import { createUserFromData, saveUserData, validateCountryCode } from './userDataService';
import { handleSignupError } from '../utils/authErrorHandler';
import { calculateAge, checkUserExists } from '../utils/authValidation';
import { uploadParentalConsent } from './fileUploadService';

export interface SignupData {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  country: string;
  parentalConsent?: File;
}

export interface AuthResult {
  user: User | null;
  error: string | null;
}

// Handle country detection for signup
const detectCountry = async (providedCountry: string): Promise<string> => {
  if (providedCountry) return providedCountry;

  return 'TN';
};

// Create user record in database
const createUserRecord = async (authUserId: string, signupData: SignupData, isUnder18: boolean, parentalConsentUrl: string | null, detectedCountry: string) => {
  const { error: insertError } = await supabase
    .from('users')
    .insert([
      {
        id: authUserId,
        email: signupData.email,
        username: signupData.username,
        type: 'gamer',
        date_of_birth: signupData.dateOfBirth,
        has_parental_consent: isUnder18 ? !!parentalConsentUrl : null,
        parental_consent_url: parentalConsentUrl,
        country: detectedCountry
      }
    ]);

  if (insertError) {
    console.warn('User creation error:', insertError);
  }
};

// Create and fetch complete user data
const createCompleteUser = async (authUserId: string, signupData: SignupData, isUnder18: boolean, parentalConsentUrl: string | null, detectedCountry: string): Promise<User> => {
  // Create user object
  const newUser = createUserFromData({
    id: authUserId,
    email: signupData.email,
    username: signupData.username,
    type: 'gamer',
    date_of_birth: signupData.dateOfBirth,
    has_parental_consent: isUnder18 ? !!parentalConsentUrl : null,
    parental_consent_url: parentalConsentUrl,
    country: detectedCountry
  });

  // For new signups, fetch the complete user record to get all defaults
  const { data: completeUserData, error: fetchUserError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUserId)
    .single();

  return fetchUserError ? newUser : createUserFromData(completeUserData);
};

export const signupUser = async (signupData: SignupData): Promise<AuthResult> => {
  try {
    console.log('Starting signup process for:', signupData.email);

    // Check if user already exists
    const userExists = await checkUserExists(signupData.email);
    if (userExists) {
      toastError('accountExistsError');
      return { user: null, error: 'User already exists' };
    }

    // Get country from GeoIP if not provided
    const detectedCountry = await detectCountry(signupData.country);

    // Calculate age and check if under 18
    const age = calculateAge(signupData.dateOfBirth);
    const isUnder18 = age < 18;

    // Upload parental consent if needed
    let parentalConsentUrl: string | null = null;

    if (isUnder18 && signupData.parentalConsent) {
      parentalConsentUrl = await uploadParentalConsent(signupData.parentalConsent);
    }

    // Sign up with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: {
          username: signupData.username
        }
      }
    });

    if (authError) {
      console.warn('Signup error:', authError);
      const errorMessage = handleSignupError(authError);
      toast.error(errorMessage);
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      toastError('registrationError');
      return { user: null, error: 'No user returned from signup' };
    }

    // Insert user data into database
    await createUserRecord(authData.user.id, signupData, isUnder18, parentalConsentUrl, detectedCountry);

    if (authData.session) {
      console.log('Signup successful with session');

      const finalUser = await createCompleteUser(authData.user.id, signupData, isUnder18, parentalConsentUrl, detectedCountry);

      saveUserData(finalUser);

      toastSuccess('registrationSuccess');
      return { user: finalUser, error: null };
    } else {
      toastSuccess('registrationSuccessEmail');
      return { user: null, error: null };
    }

  } catch (error) {
    console.warn('Signup error:', error);
    toastError('unexpectedRegistrationError');
    return {
      user: null,
      error: error instanceof Error ? error.message : 'An error occurred during signup'
    };
  }
};
