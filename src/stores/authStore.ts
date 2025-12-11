import { create } from 'zustand';
import { User } from '../types';
import { loginUser, signupUser, logoutUser, LoginCredentials, SignupData } from '../services/authService';
import { checkUserSession } from '../services/sessionService';
import { clearStoredCredentials, getSavedUserData } from '../services/userDataService';
import { loginWithKliento, setKlientoSession, clearKlientoSession, getKlientoSession, verifyTransactionUser } from '../services/klientoAuthService';

interface TransactionVerificationResult {
  user: User | null;
  error: string | null;
  isPending: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  showGamingStatsModal: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginKliento: (phone: string, password: string, productId: string) => Promise<void>;
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
    if (klientoUser) {
      console.log('[AuthStore] Found Kliento session, setting user:', klientoUser.username, '(ID:', klientoUser.id + ')');
      set({ user: klientoUser, isLoading: false, error: null });
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