import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  BookOpen,
  CheckCircle2,
  Flame,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { GalaxyRubric } from '../../types/galaxy';
import { useAuth } from '../../contexts/AuthContext';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { supabase } from '../../lib/supabase';
import GrindLevelBadge from './GrindLevelBadge';
import type { CardQuizStatus } from './GrindPlaylistCard';

interface GrindZoneMyTrainingProps {
  theme: GameTheme;
  gameId: string;
  rubrics: GalaxyRubric[];
  quizStatusMap: Map<string, { status: string; submission?: { score?: number; total_questions?: number; is_completed?: boolean } }>;
  onSelectRubric: (rubric: GalaxyRubric) => void;
}

interface TrainingStats {
  playlistsCompleted: number;
  quizzesPassed: number;
  totalVideosWatched: number;
  streak: number;
}

const GrindZoneMyTraining: React.FC<GrindZoneMyTrainingProps> = ({
  theme,
  gameId,
  rubrics,
  quizStatusMap,
  onSelectRubric,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { projectConfigUuid } = useAppConfig();
  const [stats, setStats] = useState<TrainingStats>({
    playlistsCompleted: 0,
    quizzesPassed: 0,
    totalVideosWatched: 0,
    streak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !projectConfigUuid) {
        setIsLoading(false);
        return;
      }
      try {
        const { data: submissions } = await supabase
          .from('grind_zone_quiz_submissions')
          .select('id, is_completed, score, total_questions')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        const completed = submissions?.length || 0;
        const passed = submissions?.filter(s => {
          if (!s.score || !s.total_questions) return false;
          return (s.score / s.total_questions) >= 0.8;
        }).length || 0;

        const { data: loginData } = await supabase
          .from('daily_login_tracker')
          .select('streak_count')
          .eq('user_id', user.id)
          .maybeSingle();

        setStats({
          playlistsCompleted: completed,
          quizzesPassed: passed,
          totalVideosWatched: completed * 5,
          streak: loginData?.streak_count || 0,
        });
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user, projectConfigUuid, gameId]);

  const inProgressRubric = React.useMemo(() => {
    for (const r of rubrics) {
      const qs = quizStatusMap.get(r.rubric_id);
      if (qs && qs.status === 'in_progress') return r;
    }
    for (const r of rubrics) {
      const qs = quizStatusMap.get(r.rubric_id);
      if (!qs || qs.status === 'no_quiz' || qs.status === 'available') return r;
    }
    return rubrics[0] || null;
  }, [rubrics, quizStatusMap]);

  if (!user || isLoading) return null;

  const statItems = [
    {
      icon: CheckCircle2,
      value: stats.playlistsCompleted,
      label: t('grindZone.stats.completed'),
      color: '#10B981',
    },
    {
      icon: BookOpen,
      value: stats.quizzesPassed,
      label: t('grindZone.stats.quizzes'),
      color: theme.colors.primary,
    },
    {
      icon: Play,
      value: stats.totalVideosWatched,
      label: t('grindZone.stats.watched'),
      color: '#3B82F6',
    },
    {
      icon: Flame,
      value: stats.streak,
      label: 'Streak',
      color: '#F59E0B',
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <GrindLevelBadge
          playlistsCompleted={stats.playlistsCompleted}
          showProgress
        />
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 flex-shrink-0"
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {inProgressRubric && (
        <button
          onClick={() => onSelectRubric(inProgressRubric)}
          className="w-full group flex items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-200/30 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-dark-300">
            {inProgressRubric.thumbnail_url ? (
              <img
                src={inProgressRubric.thumbnail_url}
                alt={inProgressRubric.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}20)` }}
              >
                <Play className="w-6 h-6" style={{ color: theme.colors.primary }} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
              <span className="text-xs font-medium" style={{ color: theme.colors.primary }}>
                {t('grindZone.continueGrinding')}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {inProgressRubric.name}
            </h3>
            {inProgressRubric.content_count != null && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {inProgressRubric.content_count} videos
              </p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
        </button>
      )}
    </div>
  );
};

export default GrindZoneMyTraining;
