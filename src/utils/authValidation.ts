import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

// Check if user already exists by email
export const checkUserExists = async (email: string): Promise<boolean> => {
  const { data: existingUsers, error: queryError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1);

  if (queryError) {
    console.warn('Error checking user existence:', queryError);
    return false;
  }

  return existingUsers && existingUsers.length > 0;
};
