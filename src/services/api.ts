import { supabase, executeQuery } from '../lib/supabase';
import { Tournament, TournamentPrize, UserRelationship, FriendRequest, UserGamePublisherAccount } from '../types';
import { APP_CONFIG, DEFAULT_IMAGES } from '../constants';
import toast from 'react-hot-toast';
import { calculateTotalPrizePool, formatMonetaryPrize } from '../utils/prizePoolUtils';

export const fetchTournaments = async (status?: string, userCountry?: string) => {
  try {
    const isWhitelisted = false;
    console.log('[fetchTournaments] User whitelist status:', isWhitelisted);

    const requestBody = {
      status: status || 'all',
      user_country: userCountry,
      is_whitelisted: isWhitelisted,
      limit: APP_CONFIG.TOURNAMENTS_PER_PAGE,
      offset: 0
    };
    console.log('[fetchTournaments] Request body:', requestBody);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-filtered-tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('[fetchTournaments] Edge Function result:', result);

      if (result.success && result.data) {
        console.log('[fetchTournaments] Returning data:', result.data.length, 'tournaments');
        return result.data;
      }

      console.warn('[fetchTournaments] Edge Function failed, using fallback:', result.error);
      throw new Error(result.error || 'Edge Function failed');
    } catch (edgeFunctionError) {
      console.warn('[fetchTournaments] Edge Function error, using direct API fallback:', edgeFunctionError);

      let query = supabase
        .from('tournaments')
        .select(`
          id,
          title,
          description,
          type,
          start_date,
          end_date,
          registration_start_date,
          registration_end_date,
          status,
          main_prize,
          full_prize,
          prize_currency,
          header_url,
          icon_url,
          twitch_url,
          is_twitch_live,
          discord_url,
          tournament_format,
          location_type,
          location_name,
          eligible_countries,
          minimum_age,
          max_players_per_team,
          max_nb_players,
          allow_backups,
          max_backup_players,
          game_id,
          games:game_id (
            id,
            name,
            publisher,
            image_url
          )
        `)
        .order('start_date', { ascending: false })
        .limit(APP_CONFIG.TOURNAMENTS_PER_PAGE);

      if (userCountry) {
        query = query.or(`eligible_countries.is.null,eligible_countries.ilike.%${userCountry}%`);
      }

      const now = new Date().toISOString();
      if (status === 'ongoing') {
        query = query.lte('start_date', now).gte('end_date', now);
      } else if (status === 'upcoming') {
        query = query.gt('start_date', now);
      } else if (status === 'completed') {
        query = query.lt('end_date', now);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[fetchTournaments] Fallback query error:', error);
        throw error;
      }

      const transformedData = (data || []).map(tournament => ({
        id: tournament.id,
        title: tournament.title,
        game: tournament.games?.name || 'Unknown Game',
        description: tournament.description || '',
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        registrationStartDate: tournament.registration_start_date,
        registrationEndDate: tournament.registration_end_date,
        mode: tournament.type,
        format: tournament.tournament_format,
        maxParticipants: tournament.max_nb_players || 0,
        currentParticipants: 0,
        cashPrize: 0,
        currency: tournament.prize_currency || APP_CONFIG.DEFAULT_CURRENCY,
        status: tournament.status as 'ongoing' | 'upcoming' | 'completed',
        image: tournament.header_url,
        header_url: tournament.header_url,
        streamLink: tournament.twitch_url,
        twitch_url: tournament.twitch_url,
        is_twitch_live: tournament.is_twitch_live,
        discord_url: tournament.discord_url,
        main_prize: tournament.main_prize,
        full_prize: tournament.full_prize,
        prize_currency: tournament.prize_currency,
        locationType: tournament.location_type,
        locationName: tournament.location_name,
        eligible_countries: tournament.eligible_countries,
        minimum_age: tournament.minimum_age,
        max_players_per_team: tournament.max_players_per_team,
        max_nb_players: tournament.max_nb_players,
        allow_backups: tournament.allow_backups,
        max_backup_players: tournament.max_backup_players,
        game_id: tournament.game_id
      }));

      console.log('[fetchTournaments] Fallback returning data:', transformedData.length, 'tournaments');
      return transformedData;
    }
  } catch (error) {
    console.error('[fetchTournaments] Critical error:', error);
    throw error;
  }
};

export const fetchTournamentsByGameId = async (gameId: string, status?: string, userCountry?: string) => {
  try {
    const isWhitelisted = false;
    console.log('[fetchTournamentsByGameId] User whitelist status:', isWhitelisted);

    const requestBody = {
      status: status || 'all',
      game_id: gameId,
      user_country: userCountry,
      is_whitelisted: isWhitelisted,
      limit: APP_CONFIG.TOURNAMENTS_PER_PAGE,
      offset: 0
    };
    console.log('[fetchTournamentsByGameId] Request body:', requestBody);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-filtered-tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('[fetchTournamentsByGameId] Edge Function result:', result);

      if (result.success && result.data) {
        console.log('[fetchTournamentsByGameId] Returning data:', result.data.length, 'tournaments');
        return {
          data: result.data,
          query: `Edge Function call with game_id=${gameId}, status=${status}, country=${userCountry}`
        };
      }

      console.warn('[fetchTournamentsByGameId] Edge Function failed, using fallback:', result.error);
      throw new Error(result.error || 'Edge Function failed');
    } catch (edgeFunctionError) {
      console.warn('[fetchTournamentsByGameId] Using direct API fallback:', edgeFunctionError);

      let query = supabase
        .from('tournaments')
        .select(`
          id,
          title,
          description,
          type,
          start_date,
          end_date,
          registration_start_date,
          registration_end_date,
          status,
          main_prize,
          full_prize,
          prize_currency,
          header_url,
          icon_url,
          twitch_url,
          is_twitch_live,
          discord_url,
          tournament_format,
          location_type,
          location_name,
          eligible_countries,
          minimum_age,
          max_players_per_team,
          max_nb_players,
          allow_backups,
          max_backup_players,
          game_id,
          games:game_id (
            id,
            name,
            publisher,
            image_url
          )
        `)
        .eq('game_id', gameId)
        .order('start_date', { ascending: false })
        .limit(APP_CONFIG.TOURNAMENTS_PER_PAGE);

      if (userCountry) {
        query = query.or(`eligible_countries.is.null,eligible_countries.ilike.%${userCountry}%`);
      }

      const now = new Date().toISOString();
      if (status === 'ongoing') {
        query = query.lte('start_date', now).gte('end_date', now);
      } else if (status === 'upcoming') {
        query = query.gt('start_date', now);
      } else if (status === 'completed') {
        query = query.lt('end_date', now);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[fetchTournamentsByGameId] Fallback query error:', error);
        throw error;
      }

      const transformedData = (data || []).map(tournament => ({
        id: tournament.id,
        title: tournament.title,
        game: tournament.games?.name || 'Unknown Game',
        description: tournament.description || '',
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        registrationStartDate: tournament.registration_start_date,
        registrationEndDate: tournament.registration_end_date,
        mode: tournament.type,
        format: tournament.tournament_format,
        maxParticipants: tournament.max_nb_players || 0,
        currentParticipants: 0,
        cashPrize: 0,
        currency: tournament.prize_currency || APP_CONFIG.DEFAULT_CURRENCY,
        status: tournament.status as 'ongoing' | 'upcoming' | 'completed',
        image: tournament.header_url,
        header_url: tournament.header_url,
        streamLink: tournament.twitch_url,
        twitch_url: tournament.twitch_url,
        is_twitch_live: tournament.is_twitch_live,
        discord_url: tournament.discord_url,
        main_prize: tournament.main_prize,
        full_prize: tournament.full_prize,
        prize_currency: tournament.prize_currency,
        locationType: tournament.location_type,
        locationName: tournament.location_name,
        eligible_countries: tournament.eligible_countries,
        minimum_age: tournament.minimum_age,
        max_players_per_team: tournament.max_players_per_team,
        max_nb_players: tournament.max_nb_players,
        allow_backups: tournament.allow_backups,
        max_backup_players: tournament.max_backup_players,
        game_id: tournament.game_id
      }));

      console.log('[fetchTournamentsByGameId] Fallback returning data:', transformedData.length, 'tournaments');
      return {
        data: transformedData,
        query: `Fallback query with game_id=${gameId}, status=${status}, country=${userCountry}`
      };
    }
  } catch (error) {
    console.error('[fetchTournamentsByGameId] Critical error:', error);
    throw error;
  }
};

export const fetchTournamentById = async (id: string) => {
  const result = await executeQuery(
    () => supabase
      .from('tournaments')
      .select(`
        id,
        title,
        description,
        type,
        start_date,
        end_date,
        registration_start_date,
        registration_end_date,
        status,
        main_prize,
        full_prize,
        prize_currency,
        header_url,
        icon_url,
        announcement_url,
        twitch_url,
        compatible_devices,
        discord_url,
        tournament_format,
        location_type,
        location_name,
        eligible_countries,
        minimum_age,
        required_documents_under_18,
        max_players_per_team,
        max_nb_players,
        allow_backups,
        max_backup_players,
        rules,
        private_server_code,
        game_id,
        created_at,
        games:game_id (
          id,
          name,
          publisher,
          image_url
        )
      `)
      .eq('id', id)
      .single()
  );

  if (result.error) {
    console.error('Error fetching tournament:', result.error);
    throw new Error('Failed to fetch tournament');
  }

  if (!result.data) {
    return { data: null };
  }

  const tournament = result.data;
  const transformedTournament: Tournament = {
    id: tournament.id,
    title: tournament.title,
    game: tournament.games?.name || 'Unknown Game',
    description: tournament.description || '',
    startDate: tournament.start_date,
    endDate: tournament.end_date,
    registrationStartDate: tournament.registration_start_date,
    registrationEndDate: tournament.registration_end_date,
    mode: tournament.type,
    format: tournament.tournament_format,
    maxParticipants: tournament.max_nb_players || 0,
    currentParticipants: 0,
    cashPrize: 0,
    currency: APP_CONFIG.DEFAULT_CURRENCY,
    status: tournament.status as 'ongoing' | 'upcoming' | 'completed',
    image: tournament.header_url,
    header_url: tournament.header_url,
    streamLink: tournament.twitch_url,
    main_prize: tournament.main_prize,
    full_prize: tournament.full_prize,
    prize_currency: tournament.prize_currency,
    locationType: tournament.location_type,
    locationName: tournament.location_name,
    eligible_countries: tournament.eligible_countries,
    minimum_age: tournament.minimum_age,
    max_players_per_team: tournament.max_players_per_team,
    max_nb_players: tournament.max_nb_players,
    game_id: tournament.game_id,
    discord_url: tournament.discord_url,
    twitch_url: tournament.twitch_url,
    created_at: tournament.created_at
  };

  return { data: transformedTournament };
};

export const fetchTournamentPrizes = async (tournamentId: string): Promise<TournamentPrize[]> => {
  const result = await executeQuery(
    () => supabase
      .from('tournament_prizes')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('position', { ascending: true })
  );

  if (result.error) {
    console.error('Error fetching tournament prizes:', result.error);
    return [];
  }

  return result.data || [];
};

export const syncTournamentPrizePool = async (tournamentId: string): Promise<{ success: boolean; fullPrize?: string; currency?: string; error?: string }> => {
  try {
    const prizes = await fetchTournamentPrizes(tournamentId);

    if (!prizes || prizes.length === 0) {
      return {
        success: true,
        fullPrize: null,
        currency: 'FCFA'
      };
    }

    const calculation = calculateTotalPrizePool(prizes);

    if (!calculation.isNumeric || calculation.total === 0) {
      await supabase
        .from('tournaments')
        .update({
          full_prize: null,
          prize_currency: 'FCFA'
        })
        .eq('id', tournamentId);

      return {
        success: true,
        fullPrize: null,
        currency: 'FCFA'
      };
    }

    const fullPrizeFormatted = formatMonetaryPrize(calculation.total, calculation.currency, false);

    const { error } = await supabase
      .from('tournaments')
      .update({
        full_prize: fullPrizeFormatted,
        prize_currency: calculation.currency
      })
      .eq('id', tournamentId);

    if (error) {
      console.error('Error updating tournament prize pool:', error);
      return {
        success: false,
        error: 'Failed to update prize pool'
      };
    }

    return {
      success: true,
      fullPrize: fullPrizeFormatted,
      currency: calculation.currency
    };
  } catch (error) {
    console.error('Error syncing tournament prize pool:', error);
    return {
      success: false,
      error: 'Failed to sync prize pool'
    };
  }
};

export const fetchGames = async () => {
  try {
    console.log('[fetchGames] Starting to fetch games...');

    // Direct query without executeQuery wrapper to avoid session check overhead
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[fetchGames] Error fetching games:', error);
      // Return empty array instead of throwing to prevent page crashes
      return [];
    }

    console.log('[fetchGames] Successfully fetched', data?.length || 0, 'games');
    return data || [];
  } catch (error) {
    console.error('[fetchGames] Unexpected error:', error);
    // Return empty array as fallback
    return [];
  }
};

export const fetchGameById = async (id: string) => {
  const result = await executeQuery(
    () => supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single()
  );

  if (result.error) {
    console.error('Error fetching game:', result.error);
    throw new Error('Failed to fetch game');
  }

  return result.data;
};

export const fetchLeaderboardByGameId = async (gameId: string) => {
  try {
    // Call the new aggregated Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-game-leaderboard-aggregated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        game_id: gameId,
        leaderboard_type: 'both',
        limit: 100,
        offset: 0
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch leaderboard data');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

// User and authentication functions
export const fetchUserProfile = async (userId: string) => {
  try {
    // Call the new aggregated Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-user-profile-aggregated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch user profile');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfileVisibility = async (userId: string, isPublic: boolean) => {
  const result = await executeQuery(
    () => supabase
      .from('users')
      .update({ is_profile_public: isPublic })
      .eq('id', userId)
      .select('*')
      .single()
  );

  if (result.error) {
    console.error('Error updating profile visibility:', result.error);
    return { success: false, error: 'Failed to update profile visibility' };
  }

  return { success: true, data: result.data };
};

export const fetchUserTournamentRegistrations = async (userId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('tournament_registrations')
      .select(`
        id,
        status,
        created_at,
        tournament_id,
        tournaments:tournament_id (
          id,
          title,
          start_date,
          end_date,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );

  if (result.error) {
    console.error('Error fetching user tournament registrations:', result.error);
    throw new Error('Failed to fetch tournament registrations');
  }

  return result.data || [];
};

// Tournament registration functions
export const checkTournamentRegistration = async (tournamentId: string, userId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('tournament_registrations')
      .select('id, status')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .maybeSingle()
  );

  if (result.error) {
    console.error('Error checking tournament registration:', result.error);
    return { registered: false, status: null };
  }

  return {
    registered: !!result.data,
    status: result.data?.status || null
  };
};

export const registerForTournament = async (
  tournamentId: string,
  userId: string,
  teamId?: string,
  teamName?: string
) => {
  try {
    console.log('Registering for tournament...');

    // If teamName is provided, create a new team
    let finalTeamId = teamId;
    if (teamName && !teamId) {
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            name: teamName,
            tournament_id: tournamentId,
            captain_id: userId
          }
        ])
        .select('id')
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        throw new Error('Failed to create team');
      }

      finalTeamId = newTeam.id;

      // Add the user as a team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            team_id: finalTeamId,
            user_id: userId,
            role: 'captain',
            status: 'accepted'
          }
        ]);

      if (memberError) {
        console.error('Error adding team member:', memberError);
        throw new Error('Failed to add team member');
      }
    }

    // Register for the tournament
    const { data, error } = await supabase
      .from('tournament_registrations')
      .insert([
        {
          tournament_id: tournamentId,
          user_id: userId,
          team_id: finalTeamId,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error registering for tournament:', error);
      throw new Error('Failed to register for tournament');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in registerForTournament:', error);
    throw error;
  }
};

export const cancelTournamentRegistration = async (tournamentId: string, userId: string) => {
  try {
    // Get the registration to check if user has a team
    const { data: registration, error: getError } = await supabase
      .from('tournament_registrations')
      .select('id, team_id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (getError) {
      console.error('Error getting registration:', getError);
      throw new Error('Registration not found');
    }

    // If user has a team, check if they are the captain
    if (registration.team_id) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('captain_id')
        .eq('id', registration.team_id)
        .single();

      if (teamError) {
        console.error('Error getting team info:', teamError);
        throw new Error('Failed to get team information');
      }

      // If user is the captain, delete the entire team
      if (team.captain_id === userId) {
        // First, delete all team members
        const { error: membersError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', registration.team_id);

        if (membersError) {
          console.error('Error deleting team members:', membersError);
          throw new Error('Failed to delete team members');
        }

        // Then delete the team
        const { error: teamDeleteError } = await supabase
          .from('teams')
          .delete()
          .eq('id', registration.team_id);

        if (teamDeleteError) {
          console.error('Error deleting team:', teamDeleteError);
          throw new Error('Failed to delete team');
        }
      } else {
        // If user is not the captain, just remove them from the team
        const { error: memberError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', registration.team_id)
          .eq('user_id', userId);

        if (memberError) {
          console.error('Error removing team member:', memberError);
          throw new Error('Failed to remove from team');
        }
      }
    }

    // Delete the tournament registration
    const { error: deleteError } = await supabase
      .from('tournament_registrations')
      .delete()
      .eq('id', registration.id);

    if (deleteError) {
      console.error('Error deleting registration:', deleteError);
      throw new Error('Failed to cancel registration');
    }

    return { success: true };
  } catch (error) {
    console.error('Error cancelling tournament registration:', error);
    throw error;
  }
};

// Friends and relationships functions
export const fetchFriends = async (userId: string): Promise<UserRelationship[]> => {
  const result = await executeQuery(
    () => supabase
      .from('user_relationships')
      .select(`
        id,
        user_id_1,
        user_id_2,
        status,
        created_at,
        updated_at,
        related_user:user_id_2 (
          id,
          username,
          avatar_url,
          country,
          bio
        )
      `)
      .eq('user_id_1', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
  );

  if (result.error) {
    console.error('Error fetching friends:', result.error);
    throw new Error('Failed to fetch friends');
  }

  return result.data || [];
};

export const fetchUserRelationships = async (userId: string): Promise<UserRelationship[]> => {
  const result = await executeQuery(
    () => supabase
      .from('user_relationships')
      .select(`
        id,
        user_id_1,
        user_id_2,
        status,
        created_at,
        updated_at,
        related_user:user_id_2 (
          id,
          username,
          avatar_url,
          country,
          bio
        )
      `)
      .eq('user_id_1', userId)
      .order('created_at', { ascending: false })
  );

  if (result.error) {
    console.error('Error fetching user relationships:', result.error);
    throw new Error('Failed to fetch user relationships');
  }

  return result.data || [];
};

export const fetchPendingFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  const result = await executeQuery(
    () => supabase
      .from('user_relationships')
      .select(`
        id,
        user_id_1,
        user_id_2,
        status,
        created_at,
        sender:user_id_1 (
          id,
          username,
          avatar_url
        )
      `)
      .eq('user_id_2', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
  );

  if (result.error) {
    console.error('Error fetching pending friend requests:', result.error);
    throw new Error('Failed to fetch pending friend requests');
  }

  return (result.data || []).map(item => ({
    id: item.id,
    sender_id: item.user_id_1,
    sender_username: item.sender?.username || 'Unknown',
    sender_avatar: item.sender?.avatar_url,
    receiver_id: item.user_id_2,
    created_at: item.created_at,
    status: item.status as 'pending' | 'accepted' | 'rejected'
  }));
};

export const fetchSentFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  const result = await executeQuery(
    () => supabase
      .from('user_relationships')
      .select(`
        id,
        user_id_1,
        user_id_2,
        status,
        created_at,
        receiver:user_id_2 (
          id,
          username,
          avatar_url
        )
      `)
      .eq('user_id_1', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
  );

  if (result.error) {
    console.error('Error fetching sent friend requests:', result.error);
    throw new Error('Failed to fetch sent friend requests');
  }

  return (result.data || []).map(item => ({
    id: item.id,
    sender_id: item.user_id_1,
    sender_username: 'You',
    receiver_id: item.user_id_2,
    receiver_username: item.receiver?.username || 'Unknown',
    receiver_avatar: item.receiver?.avatar_url,
    created_at: item.created_at,
    status: item.status as 'pending' | 'accepted' | 'rejected'
  }));
};

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('user_relationships')
      .insert([
        {
          user_id_1: senderId,
          user_id_2: receiverId,
          status: 'pending'
        }
      ])
  );

  if (result.error) {
    console.error('Error sending friend request:', result.error);
    throw new Error('Failed to send friend request');
  }

  return result.data;
};

export const acceptFriendRequest = async (requestId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('user_relationships')
      .update({ status: 'accepted' })
      .eq('id', requestId)
  );

  if (result.error) {
    console.error('Error accepting friend request:', result.error);
    throw new Error('Failed to accept friend request');
  }

  return result.data;
};

export const rejectFriendRequest = async (requestId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('user_relationships')
      .delete()
      .eq('id', requestId)
  );

  if (result.error) {
    console.error('Error rejecting friend request:', result.error);
    throw new Error('Failed to reject friend request');
  }

  return result.data;
};

export const removeRelationship = async (relationshipId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('user_relationships')
      .delete()
      .eq('id', relationshipId)
  );

  if (result.error) {
    console.error('Error removing relationship:', result.error);
    throw new Error('Failed to remove relationship');
  }

  return result.data;
};

// Gaming accounts functions
export const fetchUserGamingAccounts = async (userId: string): Promise<UserGamePublisherAccount[]> => {
  const result = await executeQuery(
    () => supabase
      .from('game_publisher_id_for_users')
      .select(`
        id,
        user_id,
        game_id,
        game_publisher_id,
        value,
        created_at,
        is_validated,
        validation_date,
        validation_data,
        game_publisher_ids:game_publisher_id (
          id,
          label,
          id_name,
          games:game_id (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );

  if (result.error) {
    console.error('Error fetching user gaming accounts:', result.error);
    throw new Error('Failed to fetch gaming accounts');
  }

  return result.data || [];
};

// Riot Games API functions
export const validateRiotId = async (gameName: string, tagline: string, region: string = 'euw1') => {
  try {
    console.log('Calling Riot ID validation Edge Function...');
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-riot-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        gameName,
        tagline,
        region
      })
    });
    
    const result = await response.json();
    console.log('Riot ID validation result:', result);
    
    return result;
  } catch (error) {
    console.error('Error validating Riot ID:', error);
    throw error;
  }
};

export const validateUserProfile = async (userId: string, profileData: any) => {
  try {
    console.log('Calling user profile validation Edge Function...');
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        ...profileData
      })
    });
    
    const result = await response.json();
    console.log('User profile validation result:', result);
    
    return result;
  } catch (error) {
    console.error('Error validating user profile:', error);
    throw error;
  }
};

export const validateTeamApplicationAcceptance = async (applicationId: string, teamId: string, userId: string) => {
  try {
    console.log('Calling team application acceptance validation Edge Function...');
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-team-application-acceptance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        application_id: applicationId,
        team_id: teamId,
        user_id: userId
      })
    });
    
    const result = await response.json();
    console.log('Team application acceptance validation result:', result);
    
    return result;
  } catch (error) {
    console.error('Error validating team application acceptance:', error);
    throw error;
  }
};

// Valorant API functions
export const fetchValorantRankedStats = async (puuid: string, region: string = 'eu') => {
  try {
    console.log('Calling Valorant ranked stats Edge Function...');
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-valorant-ranked-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        puuid,
        region
      })
    });
    
    const result = await response.json();
    console.log('Valorant ranked stats result:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching Valorant ranked stats:', error);
    throw error;
  }
};

export const fetchValorantMatchHistory = async (puuid: string, region: string = 'eu', count: number = 5) => {
  try {
    console.log('Calling Valorant match history Edge Function...');
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-valorant-match-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        puuid,
        region,
        count
      })
    });
    
    const result = await response.json();
    console.log('Valorant match history result:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching Valorant match history:', error);
    throw error;
  }
};

// Fortnite API functions
export const fetchFortniteStats = async (playerIdentifier: string, platform: string = 'epic') => {
  try {
    console.log('Calling Fortnite stats Edge Function...');
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-fortnite-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        playerIdentifier,
        platform
      })
    });
    
    const result = await response.json();
    console.log('Fortnite stats result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch Fortnite stats');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching Fortnite stats:', error);
    throw error;
  }
};

// Tracker.gg API functions
export const fetchTrackerGGProfile = async (gameId: string, playerIdentifier: string, platform: string) => {
  try {
    console.log('Calling Tracker.gg profile Edge Function...');
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-tracker-gg-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        gameId,
        playerIdentifier,
        platform
      })
    });
    
    const result = await response.json();
    console.log('Tracker.gg profile result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch Tracker.gg profile');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching Tracker.gg profile:', error);
    throw error;
  }
};

// Game content functions
export const fetchGameContent = async (gameId: string, options: {
  contentType?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const { contentType, page = 1, limit = 10 } = options;
  
  let query = supabase
    .from('game_contents')
    .select('*')
    .eq('game_id', gameId);

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const result = await executeQuery(() => query);

  if (result.error) {
    console.error('Error fetching game content:', result.error);
    throw new Error('Failed to fetch game content');
  }

  const data = result.data || [];
  const hasMore = data.length === limit;

  return {
    data,
    hasMore,
    totalCount: data.length,
    currentPage: page
  };
};

export const fetchGameContentTypesWithCounts = async (gameId: string) => {
  const result = await executeQuery(
    () => supabase.rpc('execute_sql', {
      query: `
        SELECT 
          content_type,
          COUNT(*) as count
        FROM game_contents 
        WHERE game_id = '${gameId}'
        GROUP BY content_type
        ORDER BY count DESC
      `
    })
  );

  if (result.error) {
    console.error('Error fetching game content types:', result.error);
    return [];
  }

  return (result.data || []).map((item: any) => ({
    type: item.content_type,
    count: parseInt(item.count) || 0
  }));
};

export const fetchVideoContentById = async (contentId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('game_contents')
      .select(`
        *,
        games:game_id (
          id,
          name,
          publisher,
          image_url
        )
      `)
      .eq('id', contentId)
      .single()
  );

  if (result.error) {
    console.error('Error fetching video content:', result.error);
    throw new Error('Failed to fetch video content');
  }

  return result.data;
};

export const fetchRelatedGameContent = async (gameId: string, rubricId: string, excludeContentId: string, page: number = 1, limit: number = 4) => {
  const result = await executeQuery(
    () => supabase
      .from('game_contents')
      .select('*')
      .eq('game_id', gameId)
      .eq('galaxy_rubric_id', rubricId)
      .neq('id', excludeContentId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
  );

  if (result.error) {
    console.error('Error fetching related game content:', result.error);
    return {
      data: [],
      hasMore: false,
      totalCount: 0,
      currentPage: page
    };
  }

  const data = result.data || [];
  const hasMore = data.length === limit;

  // Get total count for this rubric (excluding current content)
  const { count: totalCount } = await supabase
    .from('game_contents')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('galaxy_rubric_id', rubricId)
    .neq('id', excludeContentId);

  return {
    data,
    hasMore,
    totalCount: totalCount || 0,
    currentPage: page
  };
};

export const syncGalaxyContent = async (configId?: string) => {
  try {
    const config_id = configId || 'default';
    console.log('Calling Galaxy content sync Edge Function with config_id:', config_id);

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-galaxy-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ config_id })
    });

    const result = await response.json();
    console.log('Galaxy content sync result:', result);

    if (!result.success) {
      throw new Error(result.error || 'Failed to sync Galaxy content');
    }

    return result;
  } catch (error) {
    console.error('Error syncing Galaxy content:', error);
    throw error;
  }
};

// Support ticket functions
export const getUserSupportTickets = async (userId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('support_tickets')
      .select(`
        id,
        subject,
        status,
        created_at,
        updated_at,
        tournament_id,
        tournaments:tournament_id (
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );

  if (result.error) {
    console.error('Error fetching user support tickets:', result.error);
    throw new Error('Failed to fetch support tickets');
  }

  return result.data || [];
};

export const getSupportTicketWithMessages = async (ticketId: string) => {
  const result = await executeQuery(
    () => supabase
      .from('support_tickets')
      .select(`
        id,
        subject,
        description,
        status,
        created_at,
        updated_at,
        user_id,
        tournament_id,
        users:user_id (
          username,
          avatar_url
        ),
        tournaments:tournament_id (
          title
        ),
        messages:ticket_messages (
          id,
          message,
          created_at,
          is_admin_message,
          user_id,
          users:user_id (
            username,
            avatar_url,
            type
          )
        )
      `)
      .eq('id', ticketId)
      .single()
  );

  if (result.error) {
    console.error('Error fetching support ticket:', result.error);
    throw new Error('Failed to fetch support ticket');
  }

  return result.data;
};

export const createSupportTicket = async (
  userId: string,
  subject: string,
  description: string,
  tournamentId?: string
) => {
  const result = await executeQuery(
    () => supabase
      .from('support_tickets')
      .insert([
        {
          user_id: userId,
          subject,
          description,
          tournament_id: tournamentId,
          status: 'open'
        }
      ])
      .select()
      .single()
  );

  if (result.error) {
    console.error('Error creating support ticket:', result.error);
    return { success: false, error: 'Failed to create support ticket' };
  }

  return { success: true, data: result.data };
};

export const addTicketMessage = async (
  ticketId: string,
  userId: string,
  message: string,
  isAdminMessage: boolean = false
) => {
  const result = await executeQuery(
    () => supabase
      .from('ticket_messages')
      .insert([
        {
          ticket_id: ticketId,
          user_id: userId,
          message,
          is_admin_message: isAdminMessage
        }
      ])
      .select()
      .single()
  );

  if (result.error) {
    console.error('Error adding ticket message:', result.error);
    return { success: false, error: 'Failed to add message' };
  }

  return { success: true, data: result.data };
};

export const updateTicketStatus = async (ticketId: string, status: string) => {
  const result = await executeQuery(
    () => supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', ticketId)
  );

  if (result.error) {
    console.error('Error updating ticket status:', result.error);
    return { success: false, error: 'Failed to update ticket status' };
  }

  return { success: true };
};

// Utility functions
export const fetchUnreadMessageCount = async (userId: string): Promise<number> => {
  const result = await executeQuery(
    () => supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false)
  );

  if (result.error) {
    console.error('Error fetching unread message count:', result.error);
    return 0;
  }

  return result.count || 0;
};

// Function to get live status from tournament data (now comes from database)
export const getTwitchLiveStatusFromTournament = (tournament: any): boolean => {
  return tournament.is_twitch_live || false;
};

export const checkTwitchChannelLiveStatus = async (channelName: string): Promise<boolean> => {
  try {
    const result = await executeQuery(
      () => supabase
        .from('tournaments')
        .select('is_twitch_live')
        .ilike('twitch_url', `%${channelName}%`)
        .eq('status', 'active')
        .maybeSingle()
    );

    if (result.error) {
      console.error('Error checking Twitch channel live status:', result.error);
      return false;
    }

    return result.data?.is_twitch_live || false;
  } catch (error) {
    console.error('Error in checkTwitchChannelLiveStatus:', error);
    return false;
  }
};

export const extractTwitchChannelName = (twitchUrl: string): string | null => {
  try {
    const url = new URL(twitchUrl);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);

    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1];
    }

    return null;
  } catch (error) {
    console.error('Error extracting Twitch channel name:', error);
    return null;
  }
};

export const fetchDefaultTrailer = async () => {
  try {
    const { data, error } = await supabase
      .from('game_trailers')
      .select('*')
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching default trailer:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchDefaultTrailer:', error);
    return null;
  }
};

export const fetchFeaturedTournamentTrailers = async (limit: number = 2) => {
  try {
    const { data, error } = await supabase
      .from('game_trailers')
      .select(`
        *,
        tournament:tournament_id (
          id,
          title,
          description,
          start_date,
          end_date,
          header_url,
          status,
          game_id
        ),
        game:game_id (
          id,
          name,
          publisher,
          image_url
        )
      `)
      .eq('is_featured', true)
      .not('tournament_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured tournament trailers:', error);
      return [];
    }

    const transformedData = (data || []).map(trailer => ({
      ...trailer,
      tournament: trailer.tournament ? {
        id: trailer.tournament.id,
        title: trailer.tournament.title,
        description: trailer.tournament.description,
        startDate: trailer.tournament.start_date,
        endDate: trailer.tournament.end_date,
        header_url: trailer.tournament.header_url,
        status: trailer.tournament.status,
        game_id: trailer.tournament.game_id
      } : null
    }));

    return transformedData;
  } catch (error) {
    console.error('Error in fetchFeaturedTournamentTrailers:', error);
    return [];
  }
};

export const fetchHeroCarouselData = async () => {
  try {
    const [defaultTrailer, featuredTrailers] = await Promise.all([
      fetchDefaultTrailer(),
      fetchFeaturedTournamentTrailers(2)
    ]);

    return {
      defaultTrailer,
      featuredTrailers,
      success: true
    };
  } catch (error) {
    console.error('Error fetching hero carousel data:', error);
    return {
      defaultTrailer: null,
      featuredTrailers: [],
      success: false
    };
  }
};