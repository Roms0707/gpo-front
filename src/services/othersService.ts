import { supabase } from '../lib/supabase';
import { GameContent } from '../types';

export interface RubricInfo {
  rubric_id: string;
  rubric_name: string | null;
  game_id: string;
}

export interface VideoGroup {
  seriesName: string;
  videos: GameContent[];
}

export const fetchRubricsForGame = async (gameId: string): Promise<RubricInfo[]> => {
  const { data, error } = await supabase
    .from('galaxy_rubric_mappings')
    .select('rubric_id, rubric_name, game_id')
    .eq('game_id', gameId)
    .order('rubric_name', { ascending: true });

  if (error) {
    console.error('[othersService] Error fetching rubrics:', error);
    return [];
  }

  const seen = new Set<string>();
  const uniqueRubrics = (data || []).filter((rubric) => {
    if (seen.has(rubric.rubric_id)) {
      return false;
    }
    seen.add(rubric.rubric_id);
    return true;
  });

  return uniqueRubrics;
};

export const fetchContentByRubricId = async (
  gameId: string,
  rubricId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ data: GameContent[]; hasMore: boolean; totalCount: number }> => {
  const { page = 1, limit = 20 } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('game_contents')
    .select('*', { count: 'exact' })
    .eq('game_id', gameId)
    .eq('galaxy_rubric_id', rubricId)
    .order('title', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('[othersService] Error fetching content by rubric:', error);
    return { data: [], hasMore: false, totalCount: 0 };
  }

  const totalCount = count || 0;
  const hasMore = to < totalCount - 1;

  return { data: data || [], hasMore, totalCount };
};

export const fetchAllContentForRubric = async (
  gameId: string,
  rubricId: string
): Promise<GameContent[]> => {
  const { data, error } = await supabase
    .from('game_contents')
    .select('*')
    .eq('game_id', gameId)
    .eq('galaxy_rubric_id', rubricId)
    .order('title', { ascending: true });

  if (error) {
    console.error('[othersService] Error fetching all content for rubric:', error);
    return [];
  }

  return data || [];
};

export const fetchGamesOrdered = async () => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('[othersService] Error fetching ordered games:', error);
    return [];
  }

  return data || [];
};

export const isOthersGame = (game: { slug?: string; is_collection?: boolean }): boolean => {
  return game.slug === 'other-games' || game.is_collection === true;
};
