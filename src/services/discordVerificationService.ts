import { supabase } from '../lib/supabase';
import { DiscordVerificationStatus, TournamentDiscordVerification } from '../types';

export const discordVerificationService = {
  /**
   * Check Discord verification status for a user in a specific tournament
   */
  async checkVerificationStatus(
    userId: string,
    tournamentId: string
  ): Promise<DiscordVerificationStatus> {
    try {
      const { data, error } = await supabase
        .from('tournament_discord_verification')
        .select('*')
        .eq('user_id', userId)
        .eq('tournament_id', tournamentId)
        .maybeSingle();

      if (error) {
        console.error('Error checking Discord verification:', error);
        return {
          isConnected: false,
          isMember: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          isConnected: false,
          isMember: false,
        };
      }

      return {
        isConnected: true,
        isMember: data.is_member,
        discordUsername: data.discord_username,
        lastVerified: data.last_verified_at,
      };
    } catch (err) {
      console.error('Unexpected error checking Discord verification:', err);
      return {
        isConnected: false,
        isMember: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Verify Discord membership by calling the Edge Function
   */
  async verifyDiscordMembership(
    userId: string,
    tournamentId: string
  ): Promise<{ success: boolean; error?: string; data?: TournamentDiscordVerification }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData?.session) {
        return {
          success: false,
          error: 'No active session',
        };
      }

      const { data, error } = await supabase.functions.invoke('verify-discord-membership', {
        body: {
          userId,
          tournamentId,
        },
      });

      if (error) {
        console.error('Error calling verify-discord-membership:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Verification failed',
        };
      }

      return {
        success: true,
        data: data.verification,
      };
    } catch (err) {
      console.error('Unexpected error verifying Discord membership:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Subscribe to real-time updates for Discord verification status
   */
  subscribeToVerificationUpdates(
    userId: string,
    tournamentId: string,
    callback: (status: DiscordVerificationStatus) => void
  ) {
    const channel = supabase
      .channel(`discord_verification:${userId}:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_discord_verification',
          filter: `user_id=eq.${userId},tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          const record = payload.new as TournamentDiscordVerification;

          if (payload.eventType === 'DELETE') {
            callback({
              isConnected: false,
              isMember: false,
            });
          } else {
            callback({
              isConnected: true,
              isMember: record.is_member,
              discordUsername: record.discord_username,
              lastVerified: record.last_verified_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Get Discord OAuth URL for linking account
   */
  async getDiscordOAuthUrl(): Promise<{ url: string | null; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          scopes: 'identify',
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('Error getting Discord OAuth URL:', error);
        return {
          url: null,
          error: error.message,
        };
      }

      return {
        url: data.url,
      };
    } catch (err) {
      console.error('Unexpected error getting Discord OAuth URL:', err);
      return {
        url: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Check if user has Discord linked (via Supabase identities)
   */
  async isDiscordLinked(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      const discordIdentity = user.identities?.find(
        (identity) => identity.provider === 'discord'
      );

      return !!discordIdentity;
    } catch (err) {
      console.error('Error checking Discord link status:', err);
      return false;
    }
  },

  /**
   * Get Discord identity information
   */
  async getDiscordIdentity(): Promise<{ username?: string; id?: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const discordIdentity = user.identities?.find(
        (identity) => identity.provider === 'discord'
      );

      if (!discordIdentity) {
        return null;
      }

      return {
        username: discordIdentity.identity_data?.username,
        id: discordIdentity.identity_data?.id,
      };
    } catch (err) {
      console.error('Error getting Discord identity:', err);
      return null;
    }
  },

  /**
   * Initiate Discord OAuth from registration modal with redirect back to tournament page
   */
  async initiateDiscordOAuthFromModal(
    tournamentId: string,
    teamId?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[DiscordVerificationService] Initiating Discord OAuth from modal', {
        tournamentId,
        teamId,
      });

      const baseUrl = window.location.origin;
      const tournamentUrl = `${baseUrl}/tournaments/${tournamentId}`;

      const urlParams = new URLSearchParams();
      urlParams.set('fromDiscordOAuth', 'true');
      urlParams.set('openModal', 'true');
      if (teamId) {
        urlParams.set('teamId', teamId);
      }

      const redirectTo = `${tournamentUrl}?${urlParams.toString()}`;

      console.log('[DiscordVerificationService] Redirect URL:', redirectTo);

      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'discord',
        options: {
          scopes: 'identify',
          redirectTo: redirectTo,
        },
      });

      if (error) {
        console.error('[DiscordVerificationService] Error initiating Discord OAuth:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (data?.url) {
        console.log('[DiscordVerificationService] Redirecting to Discord OAuth URL');
        window.location.href = data.url;
        return { success: true };
      }

      return {
        success: false,
        error: 'No OAuth URL returned',
      };
    } catch (err) {
      console.error('[DiscordVerificationService] Unexpected error initiating Discord OAuth:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Initiate Discord OAuth for Kliento users via popup window
   * This method opens a popup for Discord authorization without disrupting the Kliento session
   */
  async initiateKlientoDiscordOAuth(
    userId: string
  ): Promise<{ success: boolean; error?: string; discord_user?: { id: string; username: string; handle: string } }> {
    return new Promise(async (resolve) => {
      try {
        console.log('[DiscordVerificationService] Initiating Kliento Discord OAuth for user:', userId);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const clientIdResponse = await fetch(`${supabaseUrl}/functions/v1/get-discord-client-id`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
        });

        const clientIdResult = await clientIdResponse.json();

        if (!clientIdResult.success || !clientIdResult.client_id) {
          console.error('[DiscordVerificationService] Failed to get Discord client_id');
          resolve({
            success: false,
            error: clientIdResult.error || 'Failed to get Discord configuration',
          });
          return;
        }

        const clientId = clientIdResult.client_id;
        const redirectUri = `${supabaseUrl}/functions/v1/discord-oauth-callback`;
        const state = encodeURIComponent(JSON.stringify({
          user_id: userId,
          timestamp: Date.now(),
          origin_url: window.location.origin,
        }));

        const discordOAuthUrl = new URL('https://discord.com/oauth2/authorize');
        discordOAuthUrl.searchParams.set('client_id', clientId);
        discordOAuthUrl.searchParams.set('redirect_uri', redirectUri);
        discordOAuthUrl.searchParams.set('response_type', 'code');
        discordOAuthUrl.searchParams.set('scope', 'identify');
        discordOAuthUrl.searchParams.set('state', state);

        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          discordOAuthUrl.toString(),
          'discord_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
        );

        if (!popup) {
          console.error('[DiscordVerificationService] Failed to open popup - likely blocked');
          resolve({
            success: false,
            error: 'Popup blocked. Please allow popups and try again.',
          });
          return;
        }

        const handleMessage = (event: MessageEvent) => {
          const supabaseOrigin = new URL(import.meta.env.VITE_SUPABASE_URL).origin;
          const allowedOrigins = [window.location.origin, supabaseOrigin];

          if (!allowedOrigins.includes(event.origin)) {
            console.log('[DiscordVerificationService] Ignoring message from unknown origin:', event.origin);
            return;
          }
          if (event.data?.type !== 'DISCORD_OAUTH_RESULT') return;

          console.log('[DiscordVerificationService] Received OAuth result:', event.data);

          window.removeEventListener('message', handleMessage);
          clearInterval(popupCheckInterval);

          if (event.data.success) {
            resolve({
              success: true,
              discord_user: event.data.discord_user,
            });
          } else {
            resolve({
              success: false,
              error: event.data.error || 'OAuth failed',
            });
          }
        };

        window.addEventListener('message', handleMessage);

        const popupCheckInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupCheckInterval);
            window.removeEventListener('message', handleMessage);
            resolve({
              success: false,
              error: 'Authorization window was closed',
            });
          }
        }, 500);

        setTimeout(() => {
          clearInterval(popupCheckInterval);
          window.removeEventListener('message', handleMessage);
          if (!popup.closed) {
            popup.close();
          }
          resolve({
            success: false,
            error: 'Authorization timed out',
          });
        }, 300000);
      } catch (err) {
        console.error('[DiscordVerificationService] Unexpected error in Kliento Discord OAuth:', err);
        resolve({
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    });
  },

  /**
   * Check if user is authenticated via Kliento (non-Supabase auth)
   */
  isKlientoUser(user?: { auth_provider?: string } | null): boolean {
    if (user?.auth_provider === 'kliento') {
      return true;
    }

    try {
      const klientoUserJson = sessionStorage.getItem('kliento_user');
      if (klientoUserJson) {
        const klientoUser = JSON.parse(klientoUserJson);
        return klientoUser?.auth_provider === 'kliento';
      }
    } catch {
      // Ignore parse errors
    }

    return false;
  },

  /**
   * Record when the Discord join modal was shown to start the 24-hour countdown
   */
  async recordDiscordJoinShown(
    tournamentId: string,
    userId: string
  ): Promise<{ success: boolean; deadlineAt?: Date; error?: string }> {
    try {
      const now = new Date();
      const deadlineAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: existingReg } = await supabase
        .from('tournament_registrations')
        .select('discord_join_shown_at')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingReg?.discord_join_shown_at) {
        const existingDeadline = new Date(
          new Date(existingReg.discord_join_shown_at).getTime() + 24 * 60 * 60 * 1000
        );
        return { success: true, deadlineAt: existingDeadline };
      }

      const { error } = await supabase
        .from('tournament_registrations')
        .update({ discord_join_shown_at: now.toISOString() })
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error recording discord join shown:', error);
        return { success: false, error: error.message };
      }

      return { success: true, deadlineAt };
    } catch (err) {
      console.error('Unexpected error recording discord join shown:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Get Discord join deadline status for a registration
   */
  async getDiscordJoinDeadline(
    tournamentId: string,
    userId: string
  ): Promise<{ hasDeadline: boolean; deadlineAt?: Date; discordJoinShownAt?: string }> {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('discord_join_shown_at')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data?.discord_join_shown_at) {
        return { hasDeadline: false };
      }

      const deadlineAt = new Date(
        new Date(data.discord_join_shown_at).getTime() + 24 * 60 * 60 * 1000
      );

      return {
        hasDeadline: true,
        deadlineAt,
        discordJoinShownAt: data.discord_join_shown_at,
      };
    } catch (err) {
      console.error('Error getting discord join deadline:', err);
      return { hasDeadline: false };
    }
  },

  /**
   * Unlink Discord account from user profile
   * Removes discord_user_id and discord_handle from the users table
   */
  async unlinkDiscordAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[DiscordVerificationService] Unlinking Discord account for user:', userId);

      const { error } = await supabase
        .from('users')
        .update({
          discord_user_id: null,
          discord_handle: null,
        })
        .eq('id', userId);

      if (error) {
        console.error('[DiscordVerificationService] Error unlinking Discord account:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('[DiscordVerificationService] Discord account unlinked successfully');
      return { success: true };
    } catch (err) {
      console.error('[DiscordVerificationService] Unexpected error unlinking Discord account:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
};
