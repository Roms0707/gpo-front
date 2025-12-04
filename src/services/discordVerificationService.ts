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

      // Construct the redirect URL to return to the tournament page
      const baseUrl = window.location.origin;
      const tournamentUrl = `${baseUrl}/tournaments/${tournamentId}`;

      // Add query parameters to indicate OAuth return and reopen modal
      const urlParams = new URLSearchParams();
      urlParams.set('fromDiscordOAuth', 'true');
      urlParams.set('openModal', 'true');
      if (teamId) {
        urlParams.set('teamId', teamId);
      }

      const redirectTo = `${tournamentUrl}?${urlParams.toString()}`;

      console.log('[DiscordVerificationService] Redirect URL:', redirectTo);

      // Initiate OAuth with linkIdentity for existing users
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
        // Redirect to Discord OAuth
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
};
