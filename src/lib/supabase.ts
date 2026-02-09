import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with better error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is missing from environment variables');
  throw new Error('Supabase URL is required');
}

if (!supabaseKey) {
  console.error('VITE_SUPABASE_ANON_KEY is missing from environment variables');
  throw new Error('Supabase anon key is required');
}

// Create and export the Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'esports-tournament-platform'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Connection health monitoring
let isConnected = true;
let connectionMonitor: NodeJS.Timeout | null = null;

// Helper function to create a timeout promise that can be cancelled
const createTimeoutPromise = (ms: number): { promise: Promise<never>, cancel: () => void } => {
  let timeoutId: NodeJS.Timeout;

  const promise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Query timeout after ${ms}ms`));
    }, ms);
  });

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return { promise, cancel };
};

// Enhanced query wrapper with proper session handling
export const executeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 0,
  timeoutMs = 8000
): Promise<{ data: T | null; error: any }> => {
  const { promise: timeoutPromise, cancel: cancelTimeout } = createTimeoutPromise(timeoutMs);

  try {
    // Check if we have a valid session before making queries that require auth
    const { data: { session } } = await supabase.auth.getSession();

    // Execute query with timeout
    const result = await Promise.race([queryFn(), timeoutPromise]);

    // Clear timeout since query completed
    cancelTimeout();

    // Mark connection as healthy on success
    if (!result.error) {
      isConnected = true;
    } else {
      // Only log actual errors, not missing data
      if (result.error.code !== 'PGRST116') { // PGRST116 is "not found" which is normal
        console.warn('Query returned error:', result.error);
      }
    }

    return result;
  } catch (error) {
    // Always clear timeout when catching errors
    cancelTimeout();

    // Handle timeout errors specifically
    if (error instanceof Error && error.message.includes('timeout')) {
      console.warn(`Query timeout after ${timeoutMs}ms`);
      isConnected = false;

      // Return a specific timeout error
      return {
        data: null,
        error: {
          message: 'Query timeout',
          code: 'TIMEOUT',
          details: `Query timed out after ${timeoutMs}ms`
        }
      };
    } else {
      console.warn('Query error:', error);
    }

    isConnected = false;

    // Retry logic for timeout errors only
    if (retries > 0 && (error instanceof Error && error.message.includes('timeout'))) {
      console.log(`Retrying query... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return executeQuery(queryFn, retries - 1, timeoutMs);
    }

    return { data: null, error };
  }
};

// Minimal connection monitoring
export const startConnectionMonitoring = () => {
  if (connectionMonitor) {
    clearInterval(connectionMonitor);
  }

  // Mark as connected initially
  isConnected = true;

  // Minimal monitoring - just reset connection state periodically
  connectionMonitor = setInterval(() => {
    // Reset connection state to allow fresh attempts
    isConnected = true;
  }, 300000); // Reset every 5 minutes
};

export const stopConnectionMonitoring = () => {
  if (connectionMonitor) {
    clearInterval(connectionMonitor);
    connectionMonitor = null;
  }
};

// Start monitoring when module loads
startConnectionMonitoring();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', stopConnectionMonitoring);
}
