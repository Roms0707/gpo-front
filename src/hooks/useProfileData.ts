import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { fetchFriends, getUserSupportTickets } from '../services/api';
import { UserRelationship } from '../types';
import i18n from '../locales/i18n';

export const useProfileData = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [friends, setFriends] = useState<UserRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get gaming accounts from userProfile
  const gamingAccounts = useMemo(() => {
    const accounts = [];

    // Add Fortnite account if exists
    if (userProfile?.fortnite_epic_id) {
      accounts.push({
        id: 'fortnite',
        value: userProfile.fortnite_epic_id,
        is_validated: userProfile.is_fortnite_validated || false,
        validation_date: userProfile.fortnite_validation_data?.validation_date,
        validation_data: userProfile.fortnite_validation_data,
        game_publisher_ids: {
          label: 'Epic Games ID',
          games: { name: 'Fortnite' }
        }
      });
    }

    // Add other gaming accounts
    if (userProfile?.gaming_accounts) {
      accounts.push(...userProfile.gaming_accounts);
    }

    return accounts;
  }, [userProfile]);

  useEffect(() => {
    const loadAggregatedProfileData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Call the new aggregated Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-user-profile-aggregated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            user_id: user.id
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch profile data');
        }

        const profileData = result.data;
        setUserProfile(profileData);

        // Set registrations from aggregated data
        setRegistrations(profileData.tournament_registrations || []);
      } catch (err) {
        console.error('Error loading tournament registrations:', err);
        setError(i18n.t('errors.tournamentsLoadError'));
      } finally {
        setIsLoading(false);
      }
    };

    const loadFriends = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingFriends(true);
        const data = await fetchFriends(user.id);
        setFriends(data);
      } catch (err) {
        console.error('Error loading friends:', err);
      } finally {
        setIsLoadingFriends(false);
      }
    };

    const loadTickets = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingTickets(true);
        const data = await getUserSupportTickets(user.id);
        setTickets(data);
      } catch (error) {
        console.error('Error loading support tickets:', error);
      } finally {
        setIsLoadingTickets(false);
      }
    };

    loadAggregatedProfileData();
    loadFriends();
    loadTickets();
  }, [user?.id]);

  return {
    user,
    userProfile,
    registrations,
    friends,
    tickets,
    gamingAccounts,
    isLoading,
    isLoadingFriends,
    isLoadingTickets,
    error
  };
};
