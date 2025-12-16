import { User } from '../types';

interface SubscriptionCacheEntry {
  userId: string;
  isSubscribed: boolean;
  isSuspended: boolean;
  lastCheckedAt: number;
}

interface SubscriptionCheckResponse {
  success: boolean;
  isSubscribed?: boolean;
  isSuspended?: boolean;
  error?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isSubscribed: boolean;
  isSuspended: boolean;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION_MS = 60 * 60 * 1000;

const subscriptionCache = new Map<string, SubscriptionCacheEntry>();

const isCacheValid = (entry: SubscriptionCacheEntry): boolean => {
  const now = Date.now();
  return now - entry.lastCheckedAt < CACHE_DURATION_MS;
};

export const getCachedSubscriptionStatus = (userId: string): SubscriptionCacheEntry | null => {
  const cached = subscriptionCache.get(userId);
  if (cached && isCacheValid(cached)) {
    return cached;
  }
  return null;
};

export const clearSubscriptionCache = (userId?: string): void => {
  if (userId) {
    subscriptionCache.delete(userId);
  } else {
    subscriptionCache.clear();
  }
};

export const checkKlientoSubscription = async (
  klientoUserId: string,
  productId: string
): Promise<{ isSubscribed: boolean; isSuspended: boolean; error: string | null }> => {
  try {
    // TEMPORARILY DISABLED FOR TESTING - Remove this comment block to re-enable cache
    // const cached = getCachedSubscriptionStatus(klientoUserId);
    // if (cached) {
    //   return {
    //     isSubscribed: cached.isSubscribed,
    //     isSuspended: cached.isSuspended,
    //     error: null,
    //   };
    // }
    console.log('[subscriptionService] Cache bypassed - making fresh API call');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        isSubscribed: true,
        isSuspended: false,
        error: 'Application configuration error',
      };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/kliento-subscription-check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: klientoUserId,
        product_id: productId,
        service_id: productId,
      }),
    });

    const data: SubscriptionCheckResponse = await response.json();

    if (!data.success) {
      return {
        isSubscribed: data.isSubscribed ?? true,
        isSuspended: data.isSuspended ?? false,
        error: data.error || 'Subscription check failed',
      };
    }

    const isSubscribed = data.isSubscribed === true;
    const isSuspended = data.isSuspended === true;

    subscriptionCache.set(klientoUserId, {
      userId: klientoUserId,
      isSubscribed,
      isSuspended,
      lastCheckedAt: Date.now(),
    });

    return {
      isSubscribed,
      isSuspended,
      error: null,
    };
  } catch (error) {
    console.error('[subscriptionService] Error checking subscription:', error);
    return {
      isSubscribed: true,
      isSuspended: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const isKlientoUser = (user: User | null): boolean => {
  return user?.auth_provider === 'kliento' && !!user.kliento_user_id;
};

export const checkUserSubscriptionStatus = async (
  user: User | null,
  productId: string | null
): Promise<SubscriptionStatus> => {
  if (!user) {
    return {
      isActive: true,
      isSubscribed: true,
      isSuspended: false,
      isLoading: false,
      error: null,
    };
  }

  if (!isKlientoUser(user)) {
    return {
      isActive: true,
      isSubscribed: true,
      isSuspended: false,
      isLoading: false,
      error: null,
    };
  }

  if (!productId) {
    console.warn('[subscriptionService] No product ID configured for Kliento subscription check');
    return {
      isActive: true,
      isSubscribed: true,
      isSuspended: false,
      isLoading: false,
      error: 'No product ID configured',
    };
  }

  const result = await checkKlientoSubscription(user.kliento_user_id!, productId);

  const isActive = result.isSubscribed && !result.isSuspended;

  return {
    isActive,
    isSubscribed: result.isSubscribed,
    isSuspended: result.isSuspended,
    isLoading: false,
    error: result.error,
  };
};
