import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, TrendingUp, TrendingDown, BarChart3, RefreshCw, Zap } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TournamentWLStatsCardProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

interface TournamentStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentForm: ('W' | 'L')[];
  currentStreak: { type: 'win' | 'loss'; count: number };
}

const TournamentWLStatsCard: React.FC<TournamentWLStatsCardProps> = ({
  gameId,
  gameName,
  theme
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: tournaments, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('game_id', gameId);

      if (tournamentError || !tournaments || tournaments.length === 0) {
        setStats(null);
        return;
      }

      const tournamentIds = tournaments.map(t => t.id);

      const { data: matches, error: matchError } = await supabase
        .from('tournament_matches')
        .select('winner_id, player1_id, player2_id, created_at')
        .in('tournament_id', tournamentIds)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .not('winner_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (matchError || !matches || matches.length === 0) {
        setStats(null);
        return;
      }

      const wins = matches.filter(m => m.winner_id === user.id).length;
      const totalMatches = matches.length;
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      const recentForm = matches.slice(0, 5).map(m =>
        m.winner_id === user.id ? 'W' : 'L'
      ) as ('W' | 'L')[];

      let currentStreak = { type: 'win' as 'win' | 'loss', count: 0 };
      if (recentForm.length > 0) {
        const firstResult = recentForm[0];
        currentStreak.type = firstResult === 'W' ? 'win' : 'loss';
        for (const result of recentForm) {
          if ((result === 'W' && currentStreak.type === 'win') ||
              (result === 'L' && currentStreak.type === 'loss')) {
            currentStreak.count++;
          } else {
            break;
          }
        }
      }

      setStats({
        totalMatches,
        wins,
        losses,
        winRate,
        recentForm,
        currentStreak
      });
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
      setStats(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchStats();
  }, [user, gameId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-dark-300 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 dark:bg-dark-300 rounded" />
          <div className="h-10 bg-gray-200 dark:bg-dark-300 rounded" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('coaching.tournamentStats')}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('coaching.noTournamentData')}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('coaching.playTournamentsToSeeStats')}</p>
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
            <Trophy className="w-4 h-4" style={{ color: theme.colors.primary }} />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('coaching.tournamentStats')}</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMatches}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{t('coaching.matches')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success-400">{stats.wins}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{t('coaching.wins')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-error-400">{stats.losses}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{t('coaching.losses')}</div>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-dark-300/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('coaching.winRate')}</span>
          <div className="flex items-center gap-1">
            {stats.winRate >= 50 ? (
              <TrendingUp className="w-4 h-4 text-success-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-error-400" />
            )}
            <span
              className="text-lg font-bold"
              style={{ color: stats.winRate >= 50 ? '#22c55e' : '#ef4444' }}
            >
              {stats.winRate}%
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-dark-400 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stats.winRate}%`,
              backgroundColor: stats.winRate >= 50 ? '#22c55e' : '#ef4444'
            }}
          />
        </div>
      </div>

      {stats.recentForm.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">{t('coaching.recentForm')}</span>
            {stats.currentStreak.count >= 2 && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: stats.currentStreak.type === 'win'
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                  color: stats.currentStreak.type === 'win' ? '#22c55e' : '#ef4444'
                }}
              >
                <Zap className="w-3 h-3" />
                {stats.currentStreak.count} {stats.currentStreak.type === 'win' ? t('coaching.winStreak') : t('coaching.lossStreak')}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {stats.recentForm.map((result, index) => (
              <div
                key={index}
                className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold ${
                  result === 'W'
                    ? 'bg-success-500/20 text-success-400'
                    : 'bg-error-500/20 text-error-400'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentWLStatsCard;
