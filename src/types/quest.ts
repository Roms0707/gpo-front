export type QuestType =
  | 'profile_completion'
  | 'tournament_participation'
  | 'social_share'
  | 'win_match'
  | 'play_game'
  | 'daily'
  | 'weekly'
  | 'custom';

export type QuestStatus = 'active' | 'completed' | 'failed';

export interface Quest {
  id: string;
  name: string;
  description: string | null;
  xp_reward: number;
  quest_type: QuestType;
  target_value: string;
  is_repeatable: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserQuest {
  user_id: string;
  quest_id: string;
  progress: string;
  status: QuestStatus;
  started_at: string;
  completed_at: string | null;
}

export interface UserQuestWithDetails extends UserQuest {
  quest: Quest;
}
