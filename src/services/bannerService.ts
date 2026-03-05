import { supabase } from '../lib/supabase';
import type { ProfileBanner, ProfileBannerWithUnlockStatus, AvatarGameAffinity } from '../types';

export const fetchAllBanners = async (): Promise<ProfileBanner[]> => {
  const { data, error } = await supabase
    .from('profile_banners')
    .select('*')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching banners:', error);
    throw error;
  }

  return data || [];
};

export const fetchBannersWithUnlockStatus = async (
  userId?: string,
  userXp?: number
): Promise<ProfileBannerWithUnlockStatus[]> => {
  const { data: banners, error } = await supabase
    .from('profile_banners')
    .select('*')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching banners:', error);
    throw error;
  }

  if (!banners) return [];

  let unlockedBannerIds: string[] = [];

  if (userId) {
    const { data: unlockedItems } = await supabase
      .from('user_unlocked_items')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'banner');

    unlockedBannerIds = unlockedItems?.map(item => item.item_id) || [];
  }

  return banners.map(banner => {
    const requiredXp = banner.unlock_requirement?.xp || 0;
    const hasEnoughXp = (userXp || 0) >= requiredXp;
    const isExplicitlyUnlocked = unlockedBannerIds.includes(banner.id);

    return {
      ...banner,
      is_unlocked: banner.unlock_type === 'free' || isExplicitlyUnlocked || hasEnoughXp,
    };
  });
};

export const fetchBannersByGameAffinity = async (
  gameAffinity: AvatarGameAffinity,
  userId?: string,
  userXp?: number
): Promise<ProfileBannerWithUnlockStatus[]> => {
  const { data: banners, error } = await supabase
    .from('profile_banners')
    .select('*')
    .eq('is_available', true)
    .eq('game_affinity', gameAffinity)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching banners by game:', error);
    throw error;
  }

  if (!banners) return [];

  let unlockedBannerIds: string[] = [];

  if (userId) {
    const { data: unlockedItems } = await supabase
      .from('user_unlocked_items')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'banner');

    unlockedBannerIds = unlockedItems?.map(item => item.item_id) || [];
  }

  return banners.map(banner => {
    const requiredXp = banner.unlock_requirement?.xp || 0;
    const hasEnoughXp = (userXp || 0) >= requiredXp;
    const isExplicitlyUnlocked = unlockedBannerIds.includes(banner.id);

    return {
      ...banner,
      is_unlocked: banner.unlock_type === 'free' || isExplicitlyUnlocked || hasEnoughXp,
    };
  });
};

export const getBannerById = async (bannerId: string): Promise<ProfileBanner | null> => {
  const { data, error } = await supabase
    .from('profile_banners')
    .select('*')
    .eq('id', bannerId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching banner:', error);
    return null;
  }

  return data;
};
