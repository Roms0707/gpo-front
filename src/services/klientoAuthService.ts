import { supabase } from '../lib/supabase';
import { User, KlientoLoginResponse, KlientoAccountInfo, BillingInfo } from '../types';
import { normalizePhoneToE164 } from '../utils/phoneValidation';

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

interface TransactionVerifyResponse {
  success: boolean;
  user_id?: string;
  msisdn?: string;
  account_info?: KlientoAccountInfo;
  error?: string;
  status?: string;
}

interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  expires_in_seconds?: number;
}

interface VerifyOtpResponse {
  success: boolean;
  user_id?: string;
  error?: string;
  remaining_attempts?: number;
}

export const formatPhoneNumber = (phone: string): string => {
  return normalizePhoneToE164(phone);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 9 && cleaned.length <= 15;
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
        login: phone,
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        user: null,
        error: 'Application configuration error',
      };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/kliento-verify-transaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billing_transaction_id: operationId,
        bizoffer_id: offerId,
      }),
    });

    const data: TransactionVerifyResponse = await response.json();

    if (!data.success) {
      return {
        user: null,
        error: data.error || 'pending',
      };
    }

    const klientoUserId = data.user_id!;
    const phone = data.msisdn || '';
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
    console.error('[klientoAuthService] Transaction verification error:', error);
    return {
      user: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

interface SendOtpResult {
  success: boolean;
  error: string | null;
  expiresInSeconds?: number;
}

export const sendKlientoOtp = async (
  phone: string,
  projectConfigId: string,
  billingInfo?: BillingInfo | null,
  defaultCountryCode?: string | null
): Promise<SendOtpResult> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: 'Application configuration error',
      };
    }

    const normalizedPhone = normalizePhoneToE164(phone, defaultCountryCode || undefined);

    const requestBody: {
      phone_number: string;
      project_config_id: string;
      billing_info?: BillingInfo;
    } = {
      phone_number: normalizedPhone,
      project_config_id: projectConfigId,
    };

    if (billingInfo) {
      requestBody.billing_info = billingInfo;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/kliento-send-otp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: SendOtpResponse = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to send OTP',
      };
    }

    return {
      success: true,
      error: null,
      expiresInSeconds: data.expires_in_seconds,
    };
  } catch (error) {
    console.error('[klientoAuthService] Send OTP error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

interface VerifyOtpResult {
  user: User | null;
  error: string | null;
  remainingAttempts?: number;
}

interface CheckSubscriptionResponse {
  success: boolean;
  isSubscribed?: boolean;
  phoneNumber?: string;
  userId?: string;
  redirectUrl?: string;
  billingInfo?: BillingInfo;
  error?: string;
}

export interface CheckSubscriptionResult {
  success: boolean;
  isSubscribed: boolean;
  isSuspended: boolean;
  phoneNumber: string | null;
  userId: string | null;
  redirectUrl: string | null;
  billingInfo: BillingInfo | null;
  error: string | null;
}

export const verifyKlientoOtp = async (
  phone: string,
  otpCode: string,
  projectConfigId: string,
  defaultCountryCode?: string | null,
  klientoUserId?: string | null
): Promise<VerifyOtpResult> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        user: null,
        error: 'Application configuration error',
      };
    }

    const normalizedPhone = normalizePhoneToE164(phone, defaultCountryCode || undefined);

    const requestBody: {
      phone_number: string;
      otp_code: string;
      project_config_id: string;
      kliento_user_id?: string;
    } = {
      phone_number: normalizedPhone,
      otp_code: otpCode,
      project_config_id: projectConfigId,
    };

    if (klientoUserId) {
      requestBody.kliento_user_id = klientoUserId;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/kliento-verify-otp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: VerifyOtpResponse = await response.json();

    if (!data.success || !data.user_id) {
      return {
        user: null,
        error: data.error || 'Verification failed',
        remainingAttempts: data.remaining_attempts,
      };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user_id)
      .single();

    if (userError || !userData) {
      console.error('[klientoAuthService] Error fetching user after OTP verification:', userError);
      return {
        user: null,
        error: 'Failed to retrieve user data',
      };
    }

    return {
      user: mapDatabaseUserToUser(userData),
      error: null,
    };
  } catch (error) {
    console.error('[klientoAuthService] Verify OTP error:', error);
    return {
      user: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

export const checkKlientoSubscription = async (
  login: string,
  projectConfigId: string
): Promise<CheckSubscriptionResult> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        isSubscribed: false,
        phoneNumber: null,
        userId: null,
        redirectUrl: null,
        billingInfo: null,
        error: 'Application configuration error',
      };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/kliento-check-subscription-by-login`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login,
        project_config_id: projectConfigId,
      }),
    });

    const data: CheckSubscriptionResponse = await response.json();

    const isSuspended = data.error === 'Account is suspended';

    if (!data.success) {
      return {
        success: false,
        isSubscribed: false,
        isSuspended,
        phoneNumber: null,
        userId: null,
        redirectUrl: data.redirectUrl || null,
        billingInfo: null,
        error: data.error || 'Failed to check subscription',
      };
    }

    return {
      success: true,
      isSubscribed: data.isSubscribed ?? false,
      isSuspended,
      phoneNumber: data.phoneNumber || null,
      userId: data.userId || null,
      redirectUrl: data.redirectUrl || null,
      billingInfo: data.billingInfo || null,
      error: data.isSubscribed ? null : (data.error || 'Subscription required'),
    };
  } catch (error) {
    console.error('[klientoAuthService] Check subscription error:', error);
    return {
      success: false,
      isSubscribed: false,
      isSuspended: false,
      phoneNumber: null,
      userId: null,
      redirectUrl: null,
      billingInfo: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};
