import { create } from 'zustand';
import { User } from '../types';
import { loginUser, signupUser, logoutUser, LoginCredentials, SignupData } from '../services/authService';
import { checkUserSession } from '../services/sessionService';
import { clearStoredCredentials, getSavedUserData } from '../services/userDataService';
import { loginWithKliento, setKlientoSession, clearKlientoSession, getKlientoSession, verifyTransactionUser, sendKlientoOtp, verifyKlientoOtp } from '../services/klientoAuthService';
import { supabase } from '../lib/supabase';

interface TransactionVerificationResult {
  user: User | null;
  error: string | null;
  isPending: boolean;
}

interface SendOtpResult {
  success: boolean;
  error: string | null;
  expiresInSeconds?: number;
}

interface VerifyOtpResult {
  user: User | null;
  error: string | null;
  remainingAttempts?: number;
}

const mapDatabaseUserToUser = (dbUser: Record<string, unknown>): User => {
  return {
    id: dbUser.id as string,
    username: dbUser.username as string,
    email: dbUser.email as string,
    type: (dbUser.type as string) || 'gamer',
    dateOfBirth: dbUser.date_of_birth as string | undefined,
    hasParentalConsent: dbUser.has_parental_consent as boolean | undefined,
    country: dbUser.country as string | undefined,
    bio: dbUser.bio as string | null | undefined,
    avatar_url: dbUser.avatar_url as string | null | undefined,
    is_profile_public: dbUser.is_profile_public as boolean | undefined,
    is_profile_completed: dbUser.is_profile_completed as boolean | undefined,
    riot_game_name: dbUser.riot_game_name as string | null | undefined,
    riot_tagline: dbUser.riot_tagline as string | null | undefined,
    fortnite_epic_id: dbUser.fortnite_epic_id as string | null | undefined,
    is_fortnite_validated: dbUser.is_fortnite_validated as boolean | undefined,
    fortnite_validation_data: dbUser.fortnite_validation_data as Record<string, unknown> | null | undefined,
    discord_handle: dbUser.discord_handle as string | null | undefined,
    twitter_handle: dbUser.twitter_handle as string | null | undefined,
    level: dbUser.level as number | undefined,
    xp: dbUser.xp as number | undefined,
    current_avatar_id: dbUser.current_avatar_id as string | null | undefined,
    msisdn: dbUser.msisdn as string | undefined,
    phone_number: dbUser.phone_number as string | undefined,
    kliento_user_id: dbUser.kliento_user_id as string | undefined,
    auth_provider: dbUser.auth_provider as string | undefined,
  };
};

const fetchFreshKlientoUserData = async (klientoUserId: string): Promise<User | null> => {
  try {
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('kliento_user_id', klientoUserId)
      .maybeSingle();

    if (error || !dbUser) {
      console.error('[AuthStore] Error fetching fresh Kliento user data:', error);
      return null;
    }

    return mapDatabaseUserToUser(dbUser);
  } catch (err) {
    console.error('[AuthStore] Exception fetching fresh Kliento user data:', err);
    return null;
  }
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  showGamingStatsModal: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginKliento: (phone: string, password: string, productId: string) => Promise<void>;
  sendOtp: (phone: string, projectConfigId: string, countryCode?: string) => Promise<SendOtpResult>;
  verifyOtp: (phone: string, otpCode: string, projectConfigId: string) => Promise<VerifyOtpResult>;
  loginTransactionUser: (operationId: string, offerId: string) => Promise<TransactionVerificationResult>;
  signup: (username: string, email: string, password: string, dateOfBirth: string, country: string, parentalConsent?: File) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  openGamingStatsModal: () => void;
  closeGamingStatsModal: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  showGamingStatsModal: false,

  clearError: () => set({ error: null }),

  openGamingStatsModal: () => set({ showGamingStatsModal: true }),

  closeGamingStatsModal: () => set({ showGamingStatsModal: false }),

  login: async (email: string, password: string, rememberMe: boolean = false) => {
    set({ isLoading: true, error: null });

    const credentials: LoginCredentials = {
      email,
      password,
      rememberMe
    };

    const result = await loginUser(credentials);

    set({
      user: result.user,
      error: result.error,
      isLoading: false
    });
  },

  loginKliento: async (phone: string, password: string, productId: string) => {
    set({ isLoading: true, error: null });

    const result = await loginWithKliento(phone, password, productId);

    if (result.user) {
      setKlientoSession(result.user);
    }

    set({
      user: result.user,
      error: result.error,
      isLoading: false
    });
  },

  sendOtp: async (phone: string, projectConfigId: string, countryCode?: string): Promise<SendOtpResult> => {
    const result = await sendKlientoOtp(phone, projectConfigId, countryCode);
    return {
      success: result.success,
      error: result.error,
      expiresInSeconds: result.expiresInSeconds,
    };
  },

  verifyOtp: async (phone: string, otpCode: string, projectConfigId: string): Promise<VerifyOtpResult> => {
    set({ isLoading: true, error: null });

    const result = await verifyKlientoOtp(phone, otpCode, projectConfigId);

    if (result.user) {
      setKlientoSession(result.user);
    }

    set({
      user: result.user,
      error: result.error,
      isLoading: false,
    });

    return {
      user: result.user,
      error: result.error,
      remainingAttempts: result.remainingAttempts,
    };
  },

  loginTransactionUser: async (operationId: string, offerId: string): Promise<TransactionVerificationResult> => {
    const result = await verifyTransactionUser(operationId, offerId);

    if (result.error === 'pending') {
      return {
        user: null,
        error: null,
        isPending: true,
      };
    }

    if (result.user) {
      setKlientoSession(result.user);
      set({
        user: result.user,
        error: null,
        isLoading: false,
      });
    }

    return {
      user: result.user,
      error: result.error,
      isPending: false,
    };
  },

  signup: async (username: string, email: string, password: string, dateOfBirth: string, country: string, parentalConsent?: File) => {
    set({ isLoading: true, error: null });

    const signupData: SignupData = {
      username,
      email,
      password,
      dateOfBirth,
      country,
      parentalConsent
    };

    const result = await signupUser(signupData);

    set({
      user: result.user,
      error: result.error,
      isLoading: false
    });
  },

  logout: async () => {
    set({ isLoading: true });

    clearStoredCredentials();
    clearKlientoSession();

    await logoutUser();

    set({ user: null, isLoading: false, error: null });
  },

  checkSession: async () => {
    set({ isLoading: true, error: null });

    const savedUser = getSavedUserData();
    if (savedUser) {
      console.log('[AuthStore] Found saved user data, setting user immediately:', savedUser.username, '(ID:', savedUser.id + ')');
      set({ user: savedUser, isLoading: false });
    }

    const klientoUser = getKlientoSession();
    if (klientoUser && klientoUser.kliento_user_id) {
      console.log('[AuthStore] Found Kliento session, fetching fresh data for user:', klientoUser.username, '(ID:', klientoUser.id + ')');

      const freshUser = await fetchFreshKlientoUserData(klientoUser.kliento_user_id);

      if (freshUser) {
        console.log('[AuthStore] Fresh Kliento user data retrieved:', freshUser.username, 'is_profile_completed:', freshUser.is_profile_completed);
        setKlientoSession(freshUser);
        set({ user: freshUser, isLoading: false, error: null });
      } else {
        console.log('[AuthStore] Could not fetch fresh data, using cached Kliento session');
        set({ user: klientoUser, isLoading: false, error: null });
      }
      return;
    }

    const result = await checkUserSession();

    if (result.user) {
      console.log('[AuthStore] Session check complete - User authenticated:', result.user.username, '(ID:', result.user.id + ')');
      console.log('[AuthStore] User configuration will be loaded for:', result.user.country || 'auto-detect');
    } else {
      console.log('[AuthStore] Session check complete - No authenticated user');
    }

    set({
      user: result.user,
      error: result.error,
      isLoading: false
    });
  }
}));