import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAppConfig } from './AppConfigContext';
import {
  SubscriptionStatus,
  checkUserSubscriptionStatus,
  isKlientoUser,
  clearSubscriptionCache,
} from '../services/subscriptionService';

interface SubscriptionContextState {
  subscriptionStatus: SubscriptionStatus;
  isKliento: boolean;
  subscriptionRedirectUrl: string | null;
  checkSubscription: () => Promise<SubscriptionStatus>;
  refreshSubscription: () => Promise<void>;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
}

const defaultSubscriptionStatus: SubscriptionStatus = {
  isActive: true,
  isSubscribed: true,
  isSuspended: false,
  isLoading: false,
  error: null,
};

const SubscriptionContext = createContext<SubscriptionContextState | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { productId, subscriptionRedirectUrl, authMethod } = useAppConfig();

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(defaultSubscriptionStatus);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const isKliento = isKlientoUser(user);

  const checkSubscription = useCallback(async (): Promise<SubscriptionStatus> => {
    if (!isKliento) {
      return defaultSubscriptionStatus;
    }

    setSubscriptionStatus(prev => ({ ...prev, isLoading: true }));

    const status = await checkUserSubscriptionStatus(user, productId);

    setSubscriptionStatus(status);

    return status;
  }, [user, productId, isKliento]);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (user?.kliento_user_id) {
      clearSubscriptionCache(user.kliento_user_id);
    }
    await checkSubscription();
  }, [user, checkSubscription]);

  useEffect(() => {
    if (user && isKliento && authMethod === 'kliento') {
      console.log('[SubscriptionContext] Checking subscription status for Kliento user');
      checkSubscription();
    } else {
      setSubscriptionStatus(defaultSubscriptionStatus);
    }
  }, [user, isKliento, authMethod, checkSubscription]);

  useEffect(() => {
    if (!user) {
      setSubscriptionStatus(defaultSubscriptionStatus);
      setShowSubscriptionModal(false);
    }
  }, [user]);

  const value: SubscriptionContextState = {
    subscriptionStatus,
    isKliento,
    subscriptionRedirectUrl,
    checkSubscription,
    refreshSubscription,
    showSubscriptionModal,
    setShowSubscriptionModal,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextState => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
