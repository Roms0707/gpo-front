import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { User } from '../types';
import { createUserFromData, saveUserData } from './userDataService';
import { handleAuthError } from '../utils/authErrorHandler';
import { toastSuccess, toastError } from '../utils/toastHelper';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  user: User | null;
  error: string | null;
}

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResult> => {
  try {
    console.log('Starting login process for:', credentials.email, 'Remember me:', credentials.rememberMe);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
      options: {
        data: {
          remember_me: credentials.rememberMe || false
        }
      }
    });

    if (authError) {
      console.warn('Login error:', authError);
      const errorMessage = handleAuthError(authError);
      toast.error(errorMessage);
      return { user: null, error: authError.message };
    }

    if (!authData.user || !authData.session) {
      toastError('connectionError');
      throw new Error('No user or session returned');
    }

    console.log('Login successful, fetching user data...');

    // Get user data from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    let user: User;
    if (userError || !userData) {
      console.warn('User data fetch failed, using session data:', userError);
      user = createUserFromData({}, authData.user);
    } else {
      user = createUserFromData(userData);
    }

    // Save user data
    saveUserData(user);

    toastSuccess('connectionSuccess');
    console.log('Login completed successfully');

    return { user, error: null };

  } catch (error) {
    console.warn('Login process error:', error);

    if (!error.message?.includes('Invalid login credentials')) {
      toastError('unexpectedError');
    }

    return {
      user: null,
      error: error instanceof Error ? error.message : 'An error occurred during login'
    };
  }
};