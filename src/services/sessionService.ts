import { supabase } from '../lib/supabase';
import { User } from '../types';
import {
  createUserFromData,
  saveUserData,
  getSavedUserData,
  clearStoredCredentials,
  validateCountryCode
} from './userDataService';

export interface SessionCheckResult {
  user: User | null;
  error: string | null;
}

const extractDiscordUserId = (sessionUser: any): string | null => {
  let discordUserId: string | null = null;
  let source = '';

  const discordIdentity = sessionUser.identities?.find(
    (identity: any) => identity.provider === 'discord'
  );

  if (discordIdentity?.identity_data?.id) {
    discordUserId = discordIdentity.identity_data.id;
    source = 'identities[].identity_data.id';
  } else if (discordIdentity?.id) {
    discordUserId = discordIdentity.id;
    source = 'identities[].id (fallback 1)';
    console.warn('[SessionService] Discord user ID extracted from identity.id instead of identity_data.id');
  } else if (sessionUser.user_metadata?.provider_id) {
    discordUserId = sessionUser.user_metadata.provider_id;
    source = 'user_metadata.provider_id (fallback 2)';
    console.warn('[SessionService] Discord user ID extracted from user_metadata.provider_id - identity_data not available');
  }

  if (discordUserId) {
    console.log('[SessionService] Discord user ID extracted:', { discordUserId, source });
  } else {
    console.warn('[SessionService] Could not extract Discord user ID from session user', {
      hasIdentities: !!sessionUser.identities,
      identitiesCount: sessionUser.identities?.length || 0,
      hasDiscordIdentity: !!discordIdentity,
      hasUserMetadata: !!sessionUser.user_metadata,
      hasProviderIdInMetadata: !!sessionUser.user_metadata?.provider_id
    });
  }

  return discordUserId;
};

const createDiscordUser = async (sessionUser: any): Promise<User> => {
  const discordUsername = sessionUser.user_metadata.full_name ||
                         sessionUser.user_metadata.name ||
                         sessionUser.user_metadata.preferred_username ||
                         sessionUser.user_metadata.username;

  const discordUserId = extractDiscordUserId(sessionUser);

  console.log('Creating new user from Discord OAuth with username:', discordUsername, 'discord_user_id:', discordUserId);

  let discordCountry = 'TN';

  const { error: insertError } = await supabase
    .from('users')
    .insert([
      {
        id: sessionUser.id,
        email: sessionUser.email || '',
        username: discordUsername || sessionUser.email?.split('@')[0] || 'User',
        type: 'gamer',
        discord_handle: discordUsername || '',
        discord_user_id: discordUserId,
        avatar_url: sessionUser.user_metadata.avatar_url || null,
        country: discordCountry,
        is_profile_completed: false
      }
    ]);

  if (insertError) {
    console.warn('Error creating user from Discord OAuth:', insertError);
    return createUserFromData({}, sessionUser);
  }

  return createUserFromData({
    id: sessionUser.id,
    email: sessionUser.email || '',
    username: discordUsername || sessionUser.email?.split('@')[0] || 'User',
    type: 'gamer',
    discord_handle: discordUsername || '',
    discord_user_id: discordUserId || undefined,
    avatar_url: sessionUser.user_metadata.avatar_url || null,
    country: discordCountry,
    is_profile_completed: false
  });
};

const updateDiscordUser = async (sessionUser: any, userData: any): Promise<User> => {
  let shouldUpdateCountry = false;
  let detectedCountry = userData.country;

  if (!userData.country) {
    detectedCountry = 'TN';
    shouldUpdateCountry = true;
  }

  const discordUsername = sessionUser.user_metadata.full_name ||
                         sessionUser.user_metadata.name ||
                         sessionUser.user_metadata.preferred_username ||
                         sessionUser.user_metadata.username;

  const discordUserId = extractDiscordUserId(sessionUser);
  const needsDiscordUserIdUpdate = !userData.discord_user_id && discordUserId;

  const needsUpdate = !userData.discord_handle ||
                     !userData.username ||
                     userData.username === userData.email?.split('@')[0] ||
                     shouldUpdateCountry ||
                     needsDiscordUserIdUpdate;

  if (discordUsername && needsUpdate) {
    console.log('Updating existing user with Discord info - username:', discordUsername, 'discord_user_id:', discordUserId);

    const updateData: any = {
      username: discordUsername,
      discord_handle: discordUsername,
      avatar_url: sessionUser.user_metadata.avatar_url || userData.avatar_url
    };

    if (shouldUpdateCountry && detectedCountry) {
      updateData.country = detectedCountry;
    }

    if (needsDiscordUserIdUpdate) {
      updateData.discord_user_id = discordUserId;
      console.log('[SessionService] Updating missing discord_user_id for existing user');
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', sessionUser.id);

    if (updateError) {
      console.warn('Error updating Discord user info:', updateError);
      return createUserFromData(userData);
    }

    const { data: newUserData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (fetchError) {
      console.warn('Error fetching new Discord user data:', fetchError);
      const user = createUserFromData({
        id: sessionUser.id,
        email: sessionUser.email || '',
        username: discordUsername || sessionUser.email?.split('@')[0] || 'User',
        type: 'gamer',
        discord_handle: discordUsername || '',
        discord_user_id: discordUserId || userData.discord_user_id,
        avatar_url: sessionUser.user_metadata.avatar_url || null
      });

      if (shouldUpdateCountry && detectedCountry) {
        user.country = detectedCountry;
      }

      return user;
    }

    return createUserFromData(newUserData);
  }

  return createUserFromData(userData);
};

export const checkUserSession = async (): Promise<SessionCheckResult> => {
  try {
    console.log('[SessionService] Checking session...');

    // First, try to load saved user data for immediate display
    const savedUser = getSavedUserData();
    if (savedUser) {
      console.log('[SessionService] Found saved user data for user:', savedUser.id, savedUser.email || savedUser.username);
      console.log('[SessionService] User will load configuration for country:', savedUser.country || 'Not set');
    }

    // Check for current session
    const { data, error: sessionError } = await supabase.auth.getSession();
    const session = data?.session || null;

    if (sessionError) {
      console.warn('[SessionService] Session check error:', sessionError);

      // Handle specific refresh token errors
      if (sessionError.message?.includes('Invalid Refresh Token') ||
          sessionError.message?.includes('refresh_token_not_found')) {
        console.log('[SessionService] Invalid refresh token detected, clearing stored data');
        clearStoredCredentials();
        return { user: null, error: null };
      }

      return {
        user: null,
        error: 'Erreur lors de la vérification de session'
      };
    }

    if (!session) {
      console.log('[SessionService] No session found - user not authenticated');
      return { user: null, error: null };
    }

    console.log('[SessionService] Found existing session for user:', session.user.id, '(' + session.user.email + ')');

    // Fetch fresh user data from database
    console.log('[SessionService] Fetching fresh user data for ID:', session.user.id);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    console.log('[SessionService] Fresh user data from database:', userData);

    let user: User;

    if (userError || !userData) {
      console.warn('User data fetch failed, using session data:', userError);
      user = createUserFromData({}, session.user);

      // If this is a new user from Discord OAuth, create user record
      if (session.user.app_metadata?.provider === 'discord' && session.user.user_metadata) {
        user = await createDiscordUser(session.user);
      }
    } else {
      // Handle Discord user updates
      if (session.user.app_metadata?.provider === 'discord' && session.user.user_metadata) {
        user = await updateDiscordUser(session.user, userData);
      } else {
        user = createUserFromData(userData);
      }
    }

    saveUserData(user);

    // Log which user is loading the configuration
    console.log('[SessionService] ✓ User loaded successfully:', {
      userId: user.id,
      username: user.username,
      email: user.email,
      country: user.country || 'Not set',
      profileCompleted: user.is_profile_completed
    });
    console.log('[SessionService] → This user will load configuration for country:', user.country || 'DEFAULT (auto-detect)');

    // Note: Profile completion redirect is now handled by ProtectedRoute component
    // This prevents redirect loops and ensures proper routing behavior
    if (!user.is_profile_completed) {
      console.log('[SessionService] ⚠ User needs profile completion (is_profile_completed is false)');
    } else {
      console.log('[SessionService] ✓ User profile is complete');
    }

    return { user, error: null };

  } catch (error) {
    console.warn('Session check error:', error);
    return {
      user: null,
      error: error instanceof Error ? error.message : 'An error occurred checking session'
    };
  }
};