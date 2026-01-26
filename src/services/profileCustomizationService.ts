import { supabase } from '../lib/supabase';
import type {
  ProfileFrame,
  ProfileBadge,
  UserProfileCustomization,
  UserUnlockedItem,
  ProfileFrameWithUnlockStatus,
  ProfileBadgeWithUnlockStatus,
} from '../types';

export const fetchAvailableFrames = async (
  userId?: string,
  frameType?: 'avatar' | 'modal'
): Promise<ProfileFrameWithUnlockStatus[]> => {
  let query = supabase
    .from('profile_frames')
    .select('*')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (frameType) {
    query = query.eq('frame_type', frameType);
  }

  const { data: frames, error } = await query;

  if (error) {
    console.error('Error fetching frames:', error);
    throw error;
  }

  if (!frames) return [];

  let unlockedItemIds: string[] = [];

  if (userId) {
    const { data: unlockedItems } = await supabase
      .from('user_unlocked_items')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'frame');

    unlockedItemIds = unlockedItems?.map(item => item.item_id) || [];
  }

  return frames.map(frame => ({
    ...frame,
    is_unlocked: frame.unlock_type === 'free' || unlockedItemIds.includes(frame.id),
  }));
};

export const fetchAvailableBadges = async (
  userId?: string
): Promise<ProfileBadgeWithUnlockStatus[]> => {
  const { data: badges, error } = await supabase
    .from('profile_badges')
    .select('*')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }

  if (!badges) return [];

  let unlockedItemIds: string[] = [];

  if (userId) {
    const { data: unlockedItems } = await supabase
      .from('user_unlocked_items')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'badge');

    unlockedItemIds = unlockedItems?.map(item => item.item_id) || [];
  }

  return badges.map(badge => ({
    ...badge,
    is_unlocked: badge.unlock_type === 'free' || unlockedItemIds.includes(badge.id),
  }));
};

export const fetchUserCustomization = async (
  userId: string
): Promise<UserProfileCustomization | null> => {
  const { data, error } = await supabase
    .from('user_profile_customizations')
    .select(`
      *,
      avatar_frame:profile_frames!user_profile_customizations_avatar_frame_id_fkey(*),
      modal_frame:profile_frames!user_profile_customizations_modal_frame_id_fkey(*),
      avatar_badge:profile_badges(*)
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user customization:', error);
    throw error;
  }

  return data;
};

export const saveUserCustomization = async (
  userId: string,
  customization: {
    avatar_frame_id?: string | null;
    modal_frame_id?: string | null;
    avatar_badge_id?: string | null;
  }
): Promise<UserProfileCustomization> => {
  const { data, error } = await supabase
    .from('user_profile_customizations')
    .upsert({
      user_id: userId,
      ...customization,
      updated_at: new Date().toISOString(),
    })
    .select(`
      *,
      avatar_frame:profile_frames!user_profile_customizations_avatar_frame_id_fkey(*),
      modal_frame:profile_frames!user_profile_customizations_modal_frame_id_fkey(*),
      avatar_badge:profile_badges(*)
    `)
    .single();

  if (error) {
    console.error('Error saving customization:', error);
    throw error;
  }

  return data;
};

export const unlockItem = async (
  userId: string,
  itemType: 'frame' | 'badge',
  itemId: string,
  unlockSource: string
): Promise<UserUnlockedItem> => {
  const { data, error } = await supabase
    .from('user_unlocked_items')
    .insert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      unlock_source: unlockSource,
    })
    .select()
    .single();

  if (error) {
    console.error('Error unlocking item:', error);
    throw error;
  }

  return data;
};

export const checkItemUnlocked = async (
  userId: string,
  itemType: 'frame' | 'badge',
  itemId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_unlocked_items')
    .select('id')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();

  if (error) {
    console.error('Error checking item unlock status:', error);
    return false;
  }

  return !!data;
};

export const fetchUserUnlockedItems = async (
  userId: string
): Promise<UserUnlockedItem[]> => {
  const { data, error } = await supabase
    .from('user_unlocked_items')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching unlocked items:', error);
    throw error;
  }

  return data || [];
};

export const getFrameById = async (frameId: string): Promise<ProfileFrame | null> => {
  const { data, error } = await supabase
    .from('profile_frames')
    .select('*')
    .eq('id', frameId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching frame:', error);
    return null;
  }

  return data;
};

export const getBadgeById = async (badgeId: string): Promise<ProfileBadge | null> => {
  const { data, error } = await supabase
    .from('profile_badges')
    .select('*')
    .eq('id', badgeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching badge:', error);
    return null;
  }

  return data;
};
