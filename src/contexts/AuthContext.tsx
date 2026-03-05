import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../types';
import { translationService } from '../services/translationService';
import { trackDvLogin } from '../services/snowplowService';

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => {
  const store = useAuthStore();

  return {
    user: store.user,
    login: store.login,
    signup: store.signup,
    logout: store.logout,
    isLoading: store.isLoading,
    error: store.error,
    clearError: store.clearError
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const checkSession = useAuthStore(state => state.checkSession);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user?.preferred_language) {
      translationService.changeLanguage(user.preferred_language);
    }
  }, [user?.id, user?.preferred_language]);

  // Initialize authentication on app start
  useEffect(() => {
    console.log('[AuthContext] Initializing authentication system...');
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out, clearing configuration');
        useAuthStore.setState({ user: null, isLoading: false });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthContext] Token refreshed successfully for user:', session?.user?.id);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('[AuthContext] User signed in via auth state change:', session.user.id, session.user.email);
        translationService.applyUserLanguagePreference(session.user.id);

        if (session.user.app_metadata?.provider === 'discord') {
          trackDvLogin({ type_of_action: 'login', method: 'manual', status: 'ok', type: 'login' });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession]);

  const store = useAuthStore();

  const value = {
    user: store.user,
    login: store.login,
    signup: store.signup,
    logout: store.logout,
    isLoading: store.isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
