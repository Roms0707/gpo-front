import { newTracker, trackSelfDescribingEvent, BrowserTracker } from '@snowplow/browser-tracker';

interface SnowplowConfig {
  enabled: boolean;
  collector: string;
  app_id: string;
}

export interface DvLoginEvent {
  type_of_action: 'login' | 'logout' | 'account_creation' | 'change_credentials' | 'remember_credentials';
  method: 'auto_cookie' | 'auto_token' | 'auto_he' | 'auto_sid' | 'manual';
  status: 'ok' | 'ko';
  type: 'email' | 'msisdn' | 'login' | null;
}

const DV_LOGIN_SCHEMA = 'iglu:com.dgp/dv_login/jsonschema/1-0-5';

let tracker: BrowserTracker | null = null;
let initialized = false;
let enabled = false;

export async function initializeSnowplow(configId: string): Promise<void> {
  if (initialized) return;
  initialized = true;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/get-snowplow-config?config_id=${encodeURIComponent(configId)}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('[Snowplow] Failed to fetch config:', response.status);
      return;
    }

    const config: SnowplowConfig = await response.json();

    if (!config.enabled) {
      console.log(`[Snowplow] Tracking disabled for this tenant (config_id: ${configId})`);
      return;
    }

    const namespace = `dv_${configId}`;

    tracker = newTracker(namespace, config.collector, {
      appId: config.app_id,
      eventMethod: 'post',
      protocol: 'https',
      forceSecureTracker: true,
      stateStorageStrategy: 'cookieAndLocalStorage',
      contexts: {
        session: true,
      },
    });

    enabled = true;
    console.log(`[Snowplow] Tracker initialized (namespace: ${namespace}, collector: ${config.collector})`);
  } catch (err) {
    console.warn('[Snowplow] Error initializing tracker:', err);
  }
}

export function trackDvLogin(event: DvLoginEvent): void {
  if (!enabled || !tracker) return;

  trackSelfDescribingEvent({
    event: {
      schema: DV_LOGIN_SCHEMA,
      data: {
        type_of_action: event.type_of_action,
        method: event.method,
        status: event.status,
        ...(event.type !== null && { type: event.type }),
      },
    },
  }, [tracker.id]);

  if (import.meta.env.DEV) {
    console.log('[Snowplow] trackDvLogin:', event);
  }
}

export function isSnowplowReady(): boolean {
  return enabled && tracker !== null;
}
