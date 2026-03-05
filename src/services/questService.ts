import { supabase } from '../lib/supabase';
import type { Quest, UserQuest, UserQuestWithDetails } from '../types/quest';

export async function fetchActiveQuests(): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('is_active', true)
    .order('quest_type', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchUserQuests(userId: string): Promise<UserQuestWithDetails[]> {
  const { data, error } = await supabase
    .from('user_quests')
    .select('*, quest:quest_id(*)')
    .eq('user_id', userId);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    user_id: row.user_id,
    quest_id: row.quest_id,
    progress: row.progress,
    status: row.status,
    started_at: row.started_at,
    completed_at: row.completed_at,
    quest: row.quest,
  }));
}

export async function updateQuestProgress(
  userId: string,
  questId: string,
  newProgress: string
): Promise<void> {
  const { error } = await supabase
    .from('user_quests')
    .update({ progress: newProgress })
    .eq('user_id', userId)
    .eq('quest_id', questId);

  if (error) throw error;
}

export async function completeQuest(
  userId: string,
  questId: string,
  targetValue: string
): Promise<void> {
  const { error } = await supabase
    .from('user_quests')
    .update({
      status: 'completed',
      progress: targetValue,
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('quest_id', questId);

  if (error) throw error;
}

export async function assignQuestsToUser(
  userId: string,
  existingQuestIds: string[],
  activeQuests: Quest[]
): Promise<UserQuest[]> {
  const missing = activeQuests.filter(q => !existingQuestIds.includes(q.id));
  if (missing.length === 0) return [];

  const rows = missing.map(q => ({
    user_id: userId,
    quest_id: q.id,
    progress: '0',
    status: 'active' as const,
  }));

  const { data, error } = await supabase
    .from('user_quests')
    .insert(rows)
    .select();

  if (error) throw error;
  return data || [];
}
