import { supabase } from '../lib/supabase';
import { User, KlientoLoginResponse, KlientoAccountInfo } from '../types';

interface KlientoAuthResult {
  user: User | null;
  error: string | null;
}

interface KlientoEdgeFunctionResponse {
  success: boolean;
  user_id?: string;
  account_info?: KlientoAccountInfo;
  error?: string;
  message?: string;
}

export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  const cleanedCountryCode = countryCode.replace(/\D/g, '');

  return `${cleanedCountryCode}${cleaned}`;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
};

export const loginWithKliento = async (
  phone: string,
  password: string,
  productId: string
): Promise<KlientoAuthResult> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        user: null,
        error: 'Application configuration error',
      };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/kliento-auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msisdn: phone,
        password,
        product_id: productId,
      }),
    });

    const data: KlientoEdgeFunctionResponse = await response.json();

    if (!data.success || !data.user_id) {
      return {
        user: null,
        error: data.error || data.message || 'Authentication failed',
      };
    }

    const klientoUserId = String(data.user_id);
    const localUser = await findOrCreateKlientoUser(klientoUserId, phone, data.account_info);

    if (!localUser) {
      return {
        user: null,
        error: 'Failed to create local user account',
      };
    }

    return {
      user: localUser,
      error: null,
    };
  } catch (error) {
    console.error('[klientoAuthService] Login error:', error);
    return {
      user: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

const findOrCreateKlientoUser = async (
  klientoUserId: string,
  phone: string,
  accountInfo?: KlientoAccountInfo
): Promise<User | null> => {
  try {
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('kliento_user_id', klientoUserId)
      .maybeSingle();

    if (findError) {
      console.error('[klientoAuthService] Error finding user:', findError);
      return null;
    }

    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone_number: phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.warn('[klientoAuthService] Failed to update user phone:', updateError);
      }

      return mapDatabaseUserToUser(existingUser);
    }

    const username = `user_${klientoUserId.substring(0, 8)}`;
    const email = `${klientoUserId}@kliento.local`;

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        type: 'gamer',
        kliento_user_id: klientoUserId,
        phone_number: phone,
        auth_provider: 'kliento',
        is_profile_public: true,
        is_profile_completed: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('[klientoAuthService] Error creating user:', createError);
      return null;
    }

    return mapDatabaseUserToUser(newUser);
  } catch (error) {
    console.error('[klientoAuthService] findOrCreateKlientoUser error:', error);
    return null;
  }
};

const mapDatabaseUserToUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    type: dbUser.type || 'gamer',
    dateOfBirth: dbUser.date_of_birth,
    hasParentalConsent: dbUser.has_parental_consent,
    country: dbUser.country,
    bio: dbUser.bio,
    avatar_url: dbUser.avatar_url,
    is_profile_public: dbUser.is_profile_public,
    is_profile_completed: dbUser.is_profile_completed,
    riot_game_name: dbUser.riot_game_name,
    riot_tagline: dbUser.riot_tagline,
    fortnite_epic_id: dbUser.fortnite_epic_id,
    is_fortnite_validated: dbUser.is_fortnite_validated,
    fortnite_validation_data: dbUser.fortnite_validation_data,
    discord_handle: dbUser.discord_handle,
    twitter_handle: dbUser.twitter_handle,
    level: dbUser.level,
    xp: dbUser.xp,
    current_avatar_id: dbUser.current_avatar_id,
    msisdn: dbUser.msisdn,
    phone_number: dbUser.phone_number,
    kliento_user_id: dbUser.kliento_user_id,
    auth_provider: dbUser.auth_provider,
  };
};

export const getKlientoSession = (): User | null => {
  const sessionData = sessionStorage.getItem('kliento_user');
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }
  return null;
};

export const setKlientoSession = (user: User): void => {
  sessionStorage.setItem('kliento_user', JSON.stringify(user));
};

export const clearKlientoSession = (): void => {
  sessionStorage.removeItem('kliento_user');
};

export const verifyTransactionUser = async (
  operationId: string,
  offerId: string
): Promise<KlientoAuthResult> => {
  try {
    const response = await fetch('https://userv1.dv-content.io/accountinfo/getuserbytransaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billing_transaction_id: operationId,
        bizoffer_id: offerId,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          user: null,
          error: 'pending',
        };
      }
      return {
        user: null,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.user_id) {
      return {
        user: null,
        error: 'pending',
      };
    }

    const klientoUserId = String(data.user_id);
    const phone = data.msisdn || '';
    const localUser = await findOrCreateKlientoUser(klientoUserId, phone, data);

    if (!localUser) {
      return {
        user: null,
        error: 'Failed to create local user account',
      };
    }

    return {
      user: localUser,
      error: null,
    };
  } catch (error) {
    console.error('[klientoAuthService] Transaction verification error:', error);
    return {
      user: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};
