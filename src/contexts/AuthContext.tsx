import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../types';

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
  
  // Initialize authentication on app start
  useEffect(() => {
    console.log('[AuthContext] Initializing authentication system...');
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_OUT') {
        // Handle sign out
        console.log('[AuthContext] User signed out, clearing configuration');
        useAuthStore.setState({ user: null, isLoading: false });
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed, no need to refetch user data
        console.log('[AuthContext] Token refreshed successfully for user:', session?.user?.id);
      } else if (event === 'SIGNED_IN' && session) {
        // This will be handled by the login function
        console.log('[AuthContext] User signed in via auth state change:', session.user.id, session.user.email);
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