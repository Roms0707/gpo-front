import { useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface UseSubscriptionGuardResult {
  checkAccess: () => Promise<boolean>;
  guardAction: <T>(action: () => T | Promise<T>) => Promise<T | null>;
  isActive: boolean;
  isKliento: boolean;
  isLoading: boolean;
}

export const useSubscriptionGuard = (): UseSubscriptionGuardResult => {
  const {
    subscriptionStatus,
    isKliento,
    checkSubscription,
    setShowSubscriptionModal,
  } = useSubscription();

  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!isKliento) {
      return true;
    }

    const status = await checkSubscription();

    if (!status.isActive) {
      setShowSubscriptionModal(true);
      return false;
    }

    return true;
  }, [isKliento, checkSubscription, setShowSubscriptionModal]);

  const guardAction = useCallback(async <T>(
    action: () => T | Promise<T>
  ): Promise<T | null> => {
    const hasAccess = await checkAccess();

    if (!hasAccess) {
      return null;
    }

    return action();
  }, [checkAccess]);

  return {
    checkAccess,
    guardAction,
    isActive: subscriptionStatus.isActive,
    isKliento,
    isLoading: subscriptionStatus.isLoading,
  };
};
