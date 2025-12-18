import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Swords,
  Trophy,
  RefreshCw
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface PerformanceStats {
  winRate: number;
  avgKDA: number;
  avgCSPerMin: number;
  totalGames: number;
  wins: number;
  losses: number;
  mostPlayedChampions: { name: string; games: number; winRate: number }[];
  recentTrend: 'improving' | 'stable' | 'declining';
}

interface PerformanceContextCardProps {
  stats: PerformanceStats;
  riotId?: string;
  theme: GameTheme;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const PerformanceContextCard: React.FC<PerformanceContextCardProps> = ({
  stats,
  riotId,
  theme,
  onRefresh,
  isRefreshing
}) => {
  const { t } = useTranslation();

  const getTrendIcon = () => {
    switch (stats.recentTrend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-success-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendLabel = () => {
    switch (stats.recentTrend) {
      case 'improving':
        return t('coaching.trendImproving');
      case 'declining':
        return t('coaching.trendDeclining');
      default:
        return t('coaching.trendStable');
    }
  };

  return (
    <div className="bg-dark-200/50 rounded-xl border border-gray-800 overflow-hidden">
      <div
        className="px-4 py-3 border-b border-gray-800 flex items-center justify-between"
        style={{ backgroundColor: `${theme.colors.primary}10` }}
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
          <span className="text-sm font-medium text-white">
            {t('coaching.performanceOverview')}
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-dark-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {riotId && (
          <div className="text-center pb-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {t('coaching.playingAs')}
            </p>
            <p className="text-white font-bold">{riotId}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4" style={{ color: theme.colors.primary }} />
            </div>
            <p className="text-lg font-bold text-white">{stats.winRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">{t('coaching.winRate')}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Swords className="w-4 h-4" style={{ color: theme.colors.primary }} />
            </div>
            <p className="text-lg font-bold text-white">{stats.avgKDA.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{t('coaching.avgKDA')}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
            </div>
            <p className="text-lg font-bold text-white">{stats.avgCSPerMin.toFixed(1)}</p>
            <p className="text-xs text-gray-500">{t('coaching.csPerMin')}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div>
            <p className="text-xs text-gray-500">{t('coaching.last10Games')}</p>
            <p className="text-sm text-white">
              <span className="text-success-400">{stats.wins}W</span>
              {' - '}
              <span className="text-red-400">{stats.losses}L</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-xs text-gray-400">{getTrendLabel()}</span>
          </div>
        </div>

        {stats.mostPlayedChampions.length > 0 && (
          <div className="pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">{t('coaching.mostPlayed')}</p>
            <div className="flex flex-wrap gap-2">
              {stats.mostPlayedChampions.slice(0, 3).map((champ) => (
                <div
                  key={champ.name}
                  className="px-2 py-1 rounded-md bg-dark-300 text-xs"
                >
                  <span className="text-white">{champ.name}</span>
                  <span className="text-gray-500 ml-1">({champ.games})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceContextCard;
