import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  ChevronRight,
  Plus,
  Check,
  Lightbulb,
  Brain
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface GrindZoneActiveQuestsProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
  onOpenCoach?: (prompt?: string) => void;
}

interface CoachingQuest {
  id: string;
  quest_type: string;
  title: string;
  description: string;
  target_count: number;
  progress_count: number;
  status: 'active' | 'completed' | 'abandoned';
  ai_reasoning: string | null;
}

const QUEST_TYPE_ICONS: Record<string, React.ElementType> = {
  positioning: Target,
  farming: Target,
  communication: Lightbulb,
  mechanics: Target,
  default: Target,
};

const GrindZoneActiveQuests: React.FC<GrindZoneActiveQuestsProps> = ({
  gameId,
  gameName,
  theme,
  onOpenCoach,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [quests, setQuests] = useState<CoachingQuest[]>([]);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      try {
        const [activeResult, completedResult] = await Promise.all([
          supabase
            .from('coaching_quests')
            .select('*')
            .eq('user_id', user.id)
            .eq('game_id', gameId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('coaching_quests')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('game_id', gameId)
            .eq('status', 'completed')
            .gte('completed_at', weekStart.toISOString()),
        ]);

        if (!activeResult.error) setQuests(activeResult.data || []);
        if (!completedResult.error) setCompletedThisWeek(completedResult.count || 0);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuests();
  }, [user, gameId]);

  const handleAddProgress = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const newProgress = quest.progress_count + 1;
    const updates: Record<string, unknown> = { progress_count: newProgress };
    if (newProgress >= quest.target_count) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    try {
      const { error } = await supabase
        .from('coaching_quests')
        .update(updates)
        .eq('id', questId);

      if (error) throw error;

      if (updates.status === 'completed') {
        setQuests(prev => prev.filter(q => q.id !== questId));
        toast.success(t('coaching.questCompleted'));
      } else {
        setQuests(prev => prev.map(q =>
          q.id === questId ? { ...q, progress_count: newProgress } : q
        ));
      }
    } catch {
      toast.error(t('coaching.questUpdateError'));
    }
  };

  if (!user || isLoading) return null;

  if (quests.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('coaching.activeQuests')}</h3>
        </div>
        <button
          onClick={() => onOpenCoach?.(t('coaching.generateQuestsPrompt', { gameName }))}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors group"
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${theme.colors.primary}15` }}
          >
            <Brain className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('coaching.noActiveQuests')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('coaching.askCoachForQuest')}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('coaching.activeQuests')}</h3>
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
          >
            {quests.length}
          </span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {quests.map(quest => {
          const IconComponent = QUEST_TYPE_ICONS[quest.quest_type] || QUEST_TYPE_ICONS.default;
          const progressPercent = quest.target_count > 0
            ? Math.round((quest.progress_count / quest.target_count) * 100)
            : 0;

          return (
            <div
              key={quest.id}
              className="flex-shrink-0 w-64 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-200/50 p-3"
            >
              <div className="flex items-start gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}15` }}
                >
                  <IconComponent className="w-4 h-4" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">{quest.title}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{quest.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-400 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%`, backgroundColor: theme.colors.primary }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {quest.progress_count}/{quest.target_count}
                </span>
              </div>

              <button
                onClick={() => handleAddProgress(quest.id)}
                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${theme.colors.primary}15`,
                  color: theme.colors.primary
                }}
              >
                {quest.progress_count + 1 >= quest.target_count ? (
                  <>
                    <Check className="w-3 h-3" />
                    {t('coaching.complete')}
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    {t('coaching.addProgress')}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {completedThisWeek > 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold" style={{ color: theme.colors.primary }}>{completedThisWeek}</span>
          {' '}{t('coaching.completedThisWeek', { count: completedThisWeek })}
        </p>
      )}
    </div>
  );
};

export default GrindZoneActiveQuests;
