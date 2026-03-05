import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { GameTheme } from '../../utils/gameThemes';
import { useUserQuests } from '../../hooks/useUserQuests';
import {
  getQuestTypeIcon,
  getQuestXpTier,
  getQuestProgressPercent,
  getXpTierColors,
} from '../../utils/questUtils';
import type { UserQuestWithDetails } from '../../types/quest';

interface GrindZoneQuestBoardProps {
  theme: GameTheme;
}

const QuestCard: React.FC<{
  uq: UserQuestWithDetails;
  theme: GameTheme;
  onComplete: (questId: string) => void;
  isCompleting: string | null;
}> = ({ uq, theme, onComplete, isCompleting }) => {
  const { t } = useTranslation();
  const Icon = getQuestTypeIcon(uq.quest.quest_type);
  const tier = getQuestXpTier(uq.quest.xp_reward);
  const tierColors = getXpTierColors(tier);
  const percent = getQuestProgressPercent(uq.progress, uq.quest.target_value);
  const isComplete = uq.status === 'completed';
  const isCurrentlyCompleting = isCompleting === uq.quest_id;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        isComplete
          ? 'border-gray-700/50 bg-dark-200/30 opacity-70'
          : 'border-gray-700 bg-dark-200/60 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.colors.primary}15` }}
        >
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-success-400" />
          ) : (
            <Icon className="w-5 h-5" style={{ color: theme.colors.primary }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className={`text-sm font-semibold ${isComplete ? 'text-gray-500 line-through' : 'text-white'}`}>
                {uq.quest.name}
              </h4>
              {uq.quest.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{uq.quest.description}</p>
              )}
            </div>

            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${tierColors.bg} ${tierColors.text} ${tierColors.glow}`}>
              <Zap className="w-3 h-3" />
              {uq.quest.xp_reward} XP
            </div>
          </div>

          {!isComplete && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-2 bg-dark-400 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 font-mono">
                  {uq.progress}/{uq.quest.target_value}
                </span>
              </div>

              <button
                onClick={() => onComplete(uq.quest_id)}
                disabled={isCurrentlyCompleting}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  color: theme.colors.primary,
                }}
              >
                {isCurrentlyCompleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('quests.markComplete')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GrindZoneQuestBoard: React.FC<GrindZoneQuestBoardProps> = ({ theme }) => {
  const { t } = useTranslation();
  const {
    activeQuests,
    completedQuests,
    isLoading,
    markAsComplete,
    refreshQuests,
  } = useUserQuests();

  const [showCompleted, setShowCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [confirmQuestId, setConfirmQuestId] = useState<string | null>(null);

  const dailyQuests = activeQuests.filter(uq => uq.quest.quest_type === 'daily');
  const weeklyQuests = activeQuests.filter(uq => uq.quest.quest_type === 'weekly');
  const progressQuests = activeQuests.filter(
    uq => uq.quest.quest_type !== 'daily' && uq.quest.quest_type !== 'weekly'
  );

  const handleCompleteClick = (questId: string) => {
    setConfirmQuestId(questId);
  };

  const handleConfirmComplete = async () => {
    if (!confirmQuestId) return;

    setIsCompleting(confirmQuestId);
    setConfirmQuestId(null);

    const success = await markAsComplete(confirmQuestId);
    if (success) {
      const quest = activeQuests.find(q => q.quest_id === confirmQuestId);
      toast.success(
        `${t('quests.questCompleted')} +${quest?.quest.xp_reward || 0} XP`,
        { icon: '⚡', duration: 3000 }
      );
    } else {
      toast.error(t('quests.questUpdateError'));
    }

    setIsCompleting(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-xl bg-dark-200/50 h-24" />
        ))}
      </div>
    );
  }

  if (activeQuests.length === 0 && completedQuests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${theme.colors.primary}15` }}
        >
          <Target className="w-8 h-8" style={{ color: theme.colors.primary }} />
        </div>
        <p className="text-gray-400 text-sm text-center">{t('quests.noQuests')}</p>
      </div>
    );
  }

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    quests: UserQuestWithDetails[],
    badge?: string
  ) => {
    if (quests.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {badge && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {quests.map(uq => (
            <QuestCard
              key={uq.quest_id}
              uq={uq}
              theme={theme}
              onComplete={handleCompleteClick}
              isCompleting={isCompleting}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: theme.colors.primary }} />
          <h2 className="font-bold text-white text-lg">{t('quests.title')}</h2>
        </div>
        <button
          onClick={refreshQuests}
          className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
          title={t('quests.refresh')}
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {renderSection(
        t('quests.dailyQuests'),
        <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />,
        dailyQuests,
        dailyQuests.length.toString()
      )}

      {renderSection(
        t('quests.weeklyMissions'),
        <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />,
        weeklyQuests,
        weeklyQuests.length.toString()
      )}

      {renderSection(
        t('quests.activeQuests'),
        <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />,
        progressQuests,
        progressQuests.length.toString()
      )}

      {completedQuests.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 w-full text-left mb-3 group"
          >
            <CheckCircle className="w-4 h-4 text-success-400" />
            <span className="text-sm font-bold text-gray-400 group-hover:text-gray-300 transition-colors">
              {t('quests.completedQuests')}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-success-500/20 text-success-400">
              {completedQuests.length}
            </span>
            {showCompleted ? (
              <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
            )}
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden"
              >
                {completedQuests.map(uq => (
                  <QuestCard
                    key={uq.quest_id}
                    uq={uq}
                    theme={theme}
                    onComplete={() => {}}
                    isCompleting={null}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {confirmQuestId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmQuestId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-100 border border-gray-700 rounded-xl p-6 max-w-sm mx-4 w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}15` }}
                >
                  <CheckCircle className="w-5 h-5" style={{ color: theme.colors.primary }} />
                </div>
                <h3 className="font-bold text-white">{t('quests.confirmTitle')}</h3>
              </div>
              <p className="text-sm text-gray-400 mb-6">{t('quests.confirmMessage')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmQuestId(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-dark-300 text-gray-300 hover:bg-dark-400 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleConfirmComplete}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrindZoneQuestBoard;
