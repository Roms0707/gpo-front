import { supabase } from '../lib/supabase';
import { Masterclass, MasterclassEpisode } from '../types';

export const fetchAllMasterclasses = async (themeFilter?: string): Promise<Masterclass[]> => {
  let query = supabase
    .from('masterclasses')
    .select('*')
    .order('sort_order', { ascending: true });

  if (themeFilter && themeFilter !== 'all') {
    query = query.eq('theme_tag', themeFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching masterclasses:', error);
    throw error;
  }

  return data || [];
};

export const fetchMasterclassBySlug = async (slug: string): Promise<Masterclass | null> => {
  const { data, error } = await supabase
    .from('masterclasses')
    .select(`
      *,
      masterclass_episodes (*)
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching masterclass by slug:', error);
    throw error;
  }

  if (data && data.masterclass_episodes) {
    data.masterclass_episodes.sort(
      (a: MasterclassEpisode, b: MasterclassEpisode) => a.episode_number - b.episode_number
    );
  }

  return data;
};

export const fetchFeaturedMasterclass = async (): Promise<Masterclass | null> => {
  const { data, error } = await supabase
    .from('masterclasses')
    .select('*')
    .eq('is_featured', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching featured masterclass:', error);
    throw error;
  }

  return data;
};

export const fetchAvailableThemes = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('masterclasses')
    .select('theme_tag');

  if (error) {
    console.error('Error fetching themes:', error);
    throw error;
  }

  const uniqueThemes = [...new Set((data || []).map(d => d.theme_tag).filter(Boolean))];
  return uniqueThemes;
};
