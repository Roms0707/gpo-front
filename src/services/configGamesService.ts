import { supabase } from '../lib/supabase';
import { fetchGames } from './api';

export interface ConfigGame {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
  slug: string;
  twitch_cover_url?: string;
  igdb_artwork_url?: string;
  trailer_url?: string;
  is_collection?: boolean;
  sort_order: number;
}

export const fetchConfigGames = async (projectConfigUuid: string): Promise<ConfigGame[]> => {
  try {
    if (!projectConfigUuid) {
      console.warn('[configGamesService] No projectConfigUuid provided, falling back to all games');
      return fallbackToAllGames();
    }

    const { data, error } = await supabase
      .from('project_config_games')
      .select(`
        sort_order,
        games:game_id (
          id,
          name,
          publisher,
          image_url,
          slug,
          twitch_cover_url,
          igdb_artwork_url,
          trailer_url,
          is_collection
        )
      `)
      .eq('project_config_id', projectConfigUuid)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[configGamesService] Error fetching config games:', error);
      return fallbackToAllGames();
    }

    if (!data || data.length === 0) {
      console.warn('[configGamesService] No config games found, falling back to all games');
      return fallbackToAllGames();
    }

    const games: ConfigGame[] = data
      .filter((row: any) => row.games)
      .map((row: any) => ({
        ...row.games,
        sort_order: row.sort_order ?? 0,
      }));

    games.sort((a, b) => {
      const aIsOther = a.slug === 'other-games' || a.is_collection;
      const bIsOther = b.slug === 'other-games' || b.is_collection;
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return a.sort_order - b.sort_order;
    });

    return games;
  } catch (err) {
    console.error('[configGamesService] Unexpected error:', err);
    return fallbackToAllGames();
  }
};

const fallbackToAllGames = async (): Promise<ConfigGame[]> => {
  try {
    const allGames = await fetchGames();
    return (allGames || []).map((g: any, index: number) => ({
      ...g,
      sort_order: index,
    }));
  } catch {
    return [];
  }
};
