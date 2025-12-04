import { create } from 'zustand';
import { User } from '../types';
import { loginUser, signupUser, logoutUser, LoginCredentials, SignupData } from '../services/authService';
import { checkUserSession } from '../services/sessionService';
import { clearStoredCredentials, getSavedUserData } from '../services/userDataService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  showGamingStatsModal: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
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

    // Clear stored data
    clearStoredCredentials();

    await logoutUser();

    set({ user: null, isLoading: false, error: null });
  },

  checkSession: async () => {
    set({ isLoading: true, error: null });

    // First, try to load saved user data for immediate display
    const savedUser = getSavedUserData();
    if (savedUser) {
      console.log('[AuthStore] Found saved user data, setting user immediately:', savedUser.username, '(ID:', savedUser.id + ')');
      set({ user: savedUser, isLoading: false });
    }

    const result = await checkUserSession();

    // Always update the user state with fresh data from session check
    if (result.user) {
      console.log('[AuthStore] ✓ Session check complete - User authenticated:', result.user.username, '(ID:', result.user.id + ')');
      console.log('[AuthStore] → User configuration will be loaded for:', result.user.country || 'auto-detect');
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