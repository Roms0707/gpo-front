import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  fetchActiveQuests,
  fetchUserQuests,
  completeQuest,
  assignQuestsToUser,
} from '../services/questService';
import type { Quest, UserQuestWithDetails } from '../types/quest';

interface UseUserQuestsReturn {
  allQuests: Quest[];
  userQuests: UserQuestWithDetails[];
  activeQuests: UserQuestWithDetails[];
  completedQuests: UserQuestWithDetails[];
  availableQuests: Quest[];
  totalXpEarned: number;
  isLoading: boolean;
  error: string | null;
  markAsComplete: (questId: string) => Promise<boolean>;
  refreshQuests: () => Promise<void>;
}

export function useUserQuests(): UseUserQuestsReturn {
  const { user } = useAuth();
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuests = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const [quests, uQuests] = await Promise.all([
        fetchActiveQuests(),
        fetchUserQuests(user.id),
      ]);

      setAllQuests(quests);
      setUserQuests(uQuests);

      const existingIds = uQuests.map(uq => uq.quest_id);
      const missingQuests = quests.filter(q => !existingIds.includes(q.id));
      if (missingQuests.length > 0) {
        try {
          await assignQuestsToUser(user.id, existingIds, quests);
          const refreshed = await fetchUserQuests(user.id);
          setUserQuests(refreshed);
        } catch {
          // assignment may fail if RLS not yet updated -- silent
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load quests');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`user-quests-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_quests',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        loadQuests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, loadQuests]);

  const activeQuests = userQuests.filter(uq => uq.status === 'active');
  const completedQuests = userQuests.filter(uq => uq.status === 'completed');
  const assignedQuestIds = new Set(userQuests.map(uq => uq.quest_id));
  const availableQuests = allQuests.filter(q => !assignedQuestIds.has(q.id));

  const totalXpEarned = completedQuests.reduce(
    (sum, uq) => sum + (uq.quest?.xp_reward || 0),
    0
  );

  const markAsComplete = useCallback(async (questId: string): Promise<boolean> => {
    if (!user?.id) return false;

    const uq = userQuests.find(q => q.quest_id === questId);
    if (!uq || uq.status === 'completed') return false;

    try {
      await completeQuest(user.id, questId, uq.quest.target_value);

      setUserQuests(prev =>
        prev.map(q =>
          q.quest_id === questId
            ? { ...q, status: 'completed' as const, progress: q.quest.target_value, completed_at: new Date().toISOString() }
            : q
        )
      );
      return true;
    } catch {
      return false;
    }
  }, [user?.id, userQuests]);

  return {
    allQuests,
    userQuests,
    activeQuests,
    completedQuests,
    availableQuests,
    totalXpEarned,
    isLoading,
    error,
    markAsComplete,
    refreshQuests: loadQuests,
  };
}
