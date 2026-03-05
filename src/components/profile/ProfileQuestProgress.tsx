import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ChevronRight,
  CheckCircle,
  Zap,
  Target,
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { useUserQuests } from '../../hooks/useUserQuests';
import {
  getQuestTypeIcon,
  getQuestProgressPercent,
} from '../../utils/questUtils';

interface ProfileQuestProgressProps {
  theme: GameTheme;
}

const ProfileQuestProgress: React.FC<ProfileQuestProgressProps> = ({ theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeQuests, completedQuests, totalXpEarned, isLoading } = useUserQuests();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-200/50 p-5 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-dark-400 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 dark:bg-dark-400 rounded" />
          <div className="h-12 bg-gray-200 dark:bg-dark-400 rounded" />
        </div>
      </div>
    );
  }

  const closestQuests = [...activeQuests]
    .sort((a, b) => {
      const pA = getQuestProgressPercent(a.progress, a.quest.target_value);
      const pB = getQuestProgressPercent(b.progress, b.quest.target_value);
      return pB - pA;
    })
    .slice(0, 3);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-200/50 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: theme.colors.primary }} />
            <h3 className="font-bold text-gray-900 dark:text-white">{t('quests.questProgress')}</h3>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg bg-gray-50 dark:bg-dark-300/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{activeQuests.length}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('quests.active')}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-dark-300/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-success-400" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{completedQuests.length}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('quests.done')}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-dark-300/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{totalXpEarned}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">XP</p>
          </div>
        </div>

        {closestQuests.length > 0 && (
          <div className="space-y-2.5">
            {closestQuests.map(uq => {
              const Icon = getQuestTypeIcon(uq.quest.quest_type);
              const percent = getQuestProgressPercent(uq.progress, uq.quest.target_value);
              return (
                <div
                  key={uq.quest_id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-300/30"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${theme.colors.primary}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {uq.quest.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-400 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%`, backgroundColor: theme.colors.primary }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                        {percent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/grind-zone')}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-dark-300/30"
        style={{ color: theme.colors.primary }}
      >
        {t('quests.viewAllQuests')}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ProfileQuestProgress;
