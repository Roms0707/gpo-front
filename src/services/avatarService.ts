import { supabase } from '../lib/supabase';
import type { ProfileAvatar, ProfileAvatarWithUnlockStatus, AvatarGameAffinity } from '../types';

export const fetchAllAvatars = async (): Promise<ProfileAvatar[]> => {
  const { data, error } = await supabase
    .from('profile_avatars')
    .select('*')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching avatars:', error);
    throw error;
  }

  return data || [];
};

export const fetchAvatarsWithUnlockStatus = async (
  userId?: string,
  userXp?: number
): Promise<ProfileAvatarWithUnlockStatus[]> => {
  const { data: avatars, error } = await supabase
    .from('profile_avatars')
    .select('*')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching avatars:', error);
    throw error;
  }

  if (!avatars) return [];

  let unlockedAvatarIds: string[] = [];

  if (userId) {
    const { data: unlockedItems } = await supabase
      .from('user_unlocked_items')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'avatar');

    unlockedAvatarIds = unlockedItems?.map(item => item.item_id) || [];
  }

  return avatars.map(avatar => {
    const requiredXp = avatar.unlock_requirement?.xp || 0;
    const hasEnoughXp = (userXp || 0) >= requiredXp;
    const isExplicitlyUnlocked = unlockedAvatarIds.includes(avatar.id);

    return {
      ...avatar,
      is_unlocked: avatar.unlock_type === 'free' || isExplicitlyUnlocked || hasEnoughXp,
    };
  });
};

export const fetchAvatarsByGameAffinity = async (
  gameAffinity: AvatarGameAffinity,
  userId?: string,
  userXp?: number
): Promise<ProfileAvatarWithUnlockStatus[]> => {
  const { data: avatars, error } = await supabase
    .from('profile_avatars')
    .select('*')
    .eq('is_available', true)
    .eq('game_affinity', gameAffinity)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching avatars by game:', error);
    throw error;
  }

  if (!avatars) return [];

  let unlockedAvatarIds: string[] = [];

  if (userId) {
    const { data: unlockedItems } = await supabase
      .from('user_unlocked_items')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'avatar');

    unlockedAvatarIds = unlockedItems?.map(item => item.item_id) || [];
  }

  return avatars.map(avatar => {
    const requiredXp = avatar.unlock_requirement?.xp || 0;
    const hasEnoughXp = (userXp || 0) >= requiredXp;
    const isExplicitlyUnlocked = unlockedAvatarIds.includes(avatar.id);

    return {
      ...avatar,
      is_unlocked: avatar.unlock_type === 'free' || isExplicitlyUnlocked || hasEnoughXp,
    };
  });
};

export const selectPresetAvatar = async (
  userId: string,
  avatarId: string | null
): Promise<void> => {
  const { error } = await supabase
    .from('user_profile_customizations')
    .upsert({
      user_id: userId,
      selected_avatar_id: avatarId,
      use_preset_avatar: avatarId !== null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error selecting avatar:', error);
    throw error;
  }
};

export const toggleAvatarMode = async (
  userId: string,
  usePreset: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('user_profile_customizations')
    .upsert({
      user_id: userId,
      use_preset_avatar: usePreset,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error toggling avatar mode:', error);
    throw error;
  }
};

export const getSelectedAvatar = async (
  userId: string
): Promise<ProfileAvatar | null> => {
  const { data, error } = await supabase
    .from('user_profile_customizations')
    .select(`
      selected_avatar_id,
      use_preset_avatar,
      selected_avatar:profile_avatars(*)
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching selected avatar:', error);
    return null;
  }

  if (!data?.use_preset_avatar || !data?.selected_avatar) {
    return null;
  }

  return data.selected_avatar as ProfileAvatar;
};

export const getAvatarById = async (avatarId: string): Promise<ProfileAvatar | null> => {
  const { data, error } = await supabase
    .from('profile_avatars')
    .select('*')
    .eq('id', avatarId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching avatar:', error);
    return null;
  }

  return data;
};

export const unlockAvatar = async (
  userId: string,
  avatarId: string,
  unlockSource: string
): Promise<void> => {
  const { error } = await supabase
    .from('user_unlocked_items')
    .insert({
      user_id: userId,
      item_type: 'avatar',
      item_id: avatarId,
      unlock_source: unlockSource,
    });

  if (error && error.code !== '23505') {
    console.error('Error unlocking avatar:', error);
    throw error;
  }
};

export const checkAvatarUnlocked = async (
  userId: string,
  avatarId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_unlocked_items')
    .select('id')
    .eq('user_id', userId)
    .eq('item_type', 'avatar')
    .eq('item_id', avatarId)
    .maybeSingle();

  if (error) {
    console.error('Error checking avatar unlock status:', error);
    return false;
  }

  return !!data;
};

export const getUserAvatarCustomization = async (
  userId: string
): Promise<{ selectedAvatarId: string | null; usePresetAvatar: boolean; avatar: ProfileAvatar | null }> => {
  const { data, error } = await supabase
    .from('user_profile_customizations')
    .select(`
      selected_avatar_id,
      use_preset_avatar,
      selected_avatar:profile_avatars(*)
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching avatar customization:', error);
    return { selectedAvatarId: null, usePresetAvatar: false, avatar: null };
  }

  return {
    selectedAvatarId: data?.selected_avatar_id || null,
    usePresetAvatar: data?.use_preset_avatar || false,
    avatar: data?.selected_avatar as ProfileAvatar | null,
  };
};
