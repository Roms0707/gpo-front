import { supabase } from '../lib/supabase';
import { toastSuccess } from '../utils/toastHelper';

export const logoutUser = async (): Promise<void> => {
  try {
    console.log('Initiating logout...');

    // Sign out from Supabase
    await supabase.auth.signOut();

    toastSuccess('disconnectionSuccess');

  } catch (error) {
    console.warn('Logout error:', error);
    toastSuccess('disconnectionSuccess');
  }
};
