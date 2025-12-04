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

// Handle Discord user creation
const createDiscordUser = async (sessionUser: any): Promise<User> => {
  const discordUsername = sessionUser.user_metadata.full_name ||
                         sessionUser.user_metadata.name ||
                         sessionUser.user_metadata.preferred_username ||
                         sessionUser.user_metadata.username;

  console.log('Creating new user from Discord OAuth with username:', discordUsername);

  let discordCountry = 'TN';

  // Create user record in database with Discord info
  const { error: insertError } = await supabase
    .from('users')
    .insert([
      {
        id: sessionUser.id,
        email: sessionUser.email || '',
        username: discordUsername || sessionUser.email?.split('@')[0] || 'User',
        type: 'gamer',
        discord_handle: discordUsername || '',
        avatar_url: sessionUser.user_metadata.avatar_url || null,
        country: discordCountry,
        is_profile_completed: false
      }
    ]);

  if (insertError) {
    console.warn('Error creating user from Discord OAuth:', insertError);
    // Return basic user even if database insert fails
    return createUserFromData({}, sessionUser);
  }

  // Return user with Discord info
  return createUserFromData({
    id: sessionUser.id,
    email: sessionUser.email || '',
    username: discordUsername || sessionUser.email?.split('@')[0] || 'User',
    type: 'gamer',
    discord_handle: discordUsername || '',
    avatar_url: sessionUser.user_metadata.avatar_url || null,
    country: discordCountry,
    is_profile_completed: false
  });
};

// Update existing Discord user
const updateDiscordUser = async (sessionUser: any, userData: any): Promise<User> => {
  let shouldUpdateCountry = false;
  let detectedCountry = userData.country;

  if (!userData.country) {
    detectedCountry = 'TN';
    shouldUpdateCountry = true;
  }

  // Check if we need to update Discord info
  const discordUsername = sessionUser.user_metadata.full_name ||
                         sessionUser.user_metadata.name ||
                         sessionUser.user_metadata.preferred_username ||
                         sessionUser.user_metadata.username;

  const needsUpdate = !userData.discord_handle ||
                     !userData.username ||
                     userData.username === userData.email?.split('@')[0] ||
                     shouldUpdateCountry;

  if (discordUsername && needsUpdate) {
    console.log('Updating existing user with Discord info - username and handle:', discordUsername);

    const updateData: any = {
      username: discordUsername,
      discord_handle: discordUsername,
      avatar_url: sessionUser.user_metadata.avatar_url || userData.avatar_url
    };

    // Include country if we detected it
    if (shouldUpdateCountry && detectedCountry) {
      updateData.country = detectedCountry;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', sessionUser.id);

    if (updateError) {
      console.warn('Error updating Discord user info:', updateError);
      return createUserFromData(userData);
    }

    // Fetch the complete user record with all defaults from database
    const { data: newUserData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (fetchError) {
      console.warn('Error fetching new Discord user data:', fetchError);
      // Fallback to basic user object
      const user = createUserFromData({
        id: sessionUser.id,
        email: sessionUser.email || '',
        username: discordUsername || sessionUser.email?.split('@')[0] || 'User',
        type: 'gamer',
        discord_handle: discordUsername || '',
        avatar_url: sessionUser.user_metadata.avatar_url || null
      });

      // If we updated the country, ensure it's reflected
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