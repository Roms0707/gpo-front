import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { updateUserProfileVisibility } from '../services/api';
import toast from 'react-hot-toast';
import i18n from '../locales/i18n';

export const useProfileVisibility = () => {
  const { user } = useAuth();
  const [isProfilePublic, setIsProfilePublic] = useState<boolean>(user?.is_profile_public ?? true);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState<boolean>(false);
  const [hasTriedRefresh, setHasTriedRefresh] = useState<boolean>(false);

  // Initialize profile visibility when user data loads
  useEffect(() => {
    console.log('[ProfileVisibility] User data changed:', user);
    console.log('[ProfileVisibility] User is_profile_public value:', user?.is_profile_public);

    if (user?.is_profile_public !== undefined) {
      console.log('[ProfileVisibility] Setting isProfilePublic to:', user.is_profile_public);
      setIsProfilePublic(user.is_profile_public);
      setHasTriedRefresh(false); // Reset the flag if we have the field
    } else if (user?.id && !hasTriedRefresh) {
      console.log('[ProfileVisibility] is_profile_public is undefined, forcing refresh of user data');
      setHasTriedRefresh(true); // Prevent infinite loop
      // Force refresh user data if is_profile_public is missing (stale cache)
      const checkSession = useAuthStore.getState().checkSession;
      checkSession();
    }
  }, [user?.is_profile_public, user?.id, hasTriedRefresh]);

  // Handle profile visibility toggle
  const handleVisibilityToggle = async () => {
    if (!user?.id) return;

    try {
      setIsUpdatingVisibility(true);
      const newVisibility = !isProfilePublic;

      const result = await updateUserProfileVisibility(user.id, newVisibility);

      if (result.success) {
        setIsProfilePublic(newVisibility);

        // Update the user state in the auth store and localStorage
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            is_profile_public: newVisibility
          };

          useAuthStore.setState({
            user: updatedUser
          });

          // Save to localStorage to persist across sessions
          localStorage.setItem('esport_user_data', JSON.stringify(updatedUser));
        }

        toast.success(
          newVisibility
            ? i18n.t('profile.profileNowPublic')
            : i18n.t('profile.profileNowPrivate')
        );
      } else {
        toast.error(result.error || i18n.t('toast.visibilityUpdateError'));
      }
    } catch (error) {
      console.error('Error updating profile visibility:', error);
      toast.error(i18n.t('toast.visibilityUpdateError'));
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  return {
    isProfilePublic,
    isUpdatingVisibility,
    handleVisibilityToggle
  };
};
