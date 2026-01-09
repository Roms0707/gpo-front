import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Check,
  X,
  ChevronRight,
  Trophy,
  Clock,
  Lightbulb,
  Plus
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CoachingQuestPanelProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
  compact?: boolean;
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
  created_at: string;
  completed_at: string | null;
}

const QUEST_TYPE_ICONS: Record<string, React.ElementType> = {
  positioning: Target,
  farming: Trophy,
  communication: Lightbulb,
  mechanics: Target,
  default: Target,
};

const CoachingQuestPanel: React.FC<CoachingQuestPanelProps> = ({
  gameId,
  gameName,
  theme,
  compact = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [quests, setQuests] = useState<CoachingQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);

  const fetchQuests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('coaching_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setQuests(data || []);
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [user, gameId]);

  const handleCompleteQuest = async (questId: string) => {
    try {
      const { error } = await supabase
        .from('coaching_quests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', questId);

      if (error) throw error;

      setQuests(prev => prev.filter(q => q.id !== questId));
      toast.success(t('coaching.questCompleted'));
    } catch (error) {
      console.error('Error completing quest:', error);
      toast.error(t('coaching.questUpdateError'));
    }
  };

  const handleAbandonQuest = async (questId: string) => {
    try {
      const { error } = await supabase
        .from('coaching_quests')
        .update({ status: 'abandoned' })
        .eq('id', questId);

      if (error) throw error;

      setQuests(prev => prev.filter(q => q.id !== questId));
      toast.success(t('coaching.questAbandoned'));
    } catch (error) {
      console.error('Error abandoning quest:', error);
      toast.error(t('coaching.questUpdateError'));
    }
  };

  const handleUpdateProgress = async (questId: string, newProgress: number) => {
    try {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;

      const updates: Partial<CoachingQuest> = {
        progress_count: newProgress
      };

      if (newProgress >= quest.target_count) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('coaching_quests')
        .update(updates)
        .eq('id', questId);

      if (error) throw error;

      if (updates.status === 'completed') {
        setQuests(prev => prev.filter(q => q.id !== questId));
        toast.success(t('coaching.questCompleted'));
      } else {
        setQuests(prev =>
          prev.map(q =>
            q.id === questId ? { ...q, progress_count: newProgress } : q
          )
        );
      }
    } catch (error) {
      console.error('Error updating quest progress:', error);
      toast.error(t('coaching.questUpdateError'));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-dark-300 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-16 bg-gray-200 dark:bg-dark-300 rounded" />
          <div className="h-16 bg-gray-200 dark:bg-dark-300 rounded" />
        </div>
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('coaching.activeQuests')}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('coaching.noActiveQuests')}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('coaching.askCoachForQuest')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('coaching.activeQuests')}</h3>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
          >
            {quests.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {quests.map((quest) => {
          const IconComponent = QUEST_TYPE_ICONS[quest.quest_type] || QUEST_TYPE_ICONS.default;
          const progressPercent = quest.target_count > 0
            ? Math.round((quest.progress_count / quest.target_count) * 100)
            : 0;
          const isExpanded = expandedQuest === quest.id;

          return (
            <div
              key={quest.id}
              className="bg-gray-50 dark:bg-dark-300/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
                className="w-full p-3 flex items-start gap-3 text-left hover:bg-gray-100 dark:hover:bg-dark-300/30 transition-colors"
              >
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <IconComponent className="w-4 h-4" style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{quest.title}</h4>
                  {!compact && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{quest.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: theme.colors.primary
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {quest.progress_count}/{quest.target_count}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{quest.description}</p>

                  {quest.ai_reasoning && (
                    <div className="bg-yellow-50 dark:bg-dark-400/50 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Lightbulb className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-600 dark:text-yellow-500">
                          {t('coaching.whyThisQuest')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{quest.ai_reasoning}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {t('coaching.assignedOn', {
                      date: new Date(quest.created_at).toLocaleDateString()
                    })}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateProgress(quest.id, quest.progress_count + 1);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: `${theme.colors.primary}20`,
                        color: theme.colors.primary
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      {t('coaching.addProgress')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteQuest(quest.id);
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-success-500/20 text-success-400 hover:bg-success-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {t('coaching.complete')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbandonQuest(quest.id);
                      }}
                      className="flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300 hover:text-error-400 transition-colors"
                      title={t('coaching.abandon')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoachingQuestPanel;
