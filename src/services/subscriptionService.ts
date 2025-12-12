import { User } from '../types';

interface SubscriptionCacheEntry {
  userId: string;
  isSubscribed: boolean;
  isSuspended: boolean;
  lastCheckedAt: number;
}

interface KlientoAccountInfoResponse {
  code: number;
  error: number;
  data: Array<{
    user_id: string;
    msisdn?: string;
    subscribed: boolean;
    suspended: boolean;
    status?: string;
  }>;
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
    const cached = getCachedSubscriptionStatus(klientoUserId);
    if (cached) {
      return {
        isSubscribed: cached.isSubscribed,
        isSuspended: cached.isSuspended,
        error: null,
      };
    }

    const formData = new URLSearchParams();
    formData.append('user_id', klientoUserId);
    formData.append('product_id', productId);
    formData.append('service_id', productId);

    const response = await fetch('https://userv1.dv-content.io/accountinfo/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error('[subscriptionService] API error:', response.status);
      return {
        isSubscribed: true,
        isSuspended: false,
        error: `API error: ${response.status}`,
      };
    }

    const data: KlientoAccountInfoResponse = await response.json();

    if (data.code !== 200 || data.error !== 0 || !data.data || data.data.length === 0) {
      console.warn('[subscriptionService] Invalid response format or no data');
      return {
        isSubscribed: true,
        isSuspended: false,
        error: 'Invalid response from subscription service',
      };
    }

    const accountInfo = data.data[0];
    const isSubscribed = accountInfo.subscribed === true;
    const isSuspended = accountInfo.suspended === true;

    subscriptionCache.set(klientoUserId, {
      userId: klientoUserId,
      isSubscribed,
      isSuspended,
      lastCheckedAt: Date.now(),
    });

    console.log('[subscriptionService] Subscription status:', {
      userId: klientoUserId,
      isSubscribed,
      isSuspended,
      isActive: isSubscribed && !isSuspended,
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
