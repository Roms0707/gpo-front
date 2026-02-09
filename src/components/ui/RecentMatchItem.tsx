import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Users, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface RecentMatch {
  id: string;
  date: string;
  type: 'Team' | 'Solo' | 'Tournament';
  player1: string;
  player1_id: string;
  player2: string;
  player2_id: string;
  score: string;
  elo_change: number;
  is_tournament: boolean;
}

interface RecentMatchItemProps {
  match: RecentMatch;
  onPlayerClick?: (playerId: string) => void;
  onTeamClick?: (teamId: string) => void;
}

const RecentMatchItem: React.FC<RecentMatchItemProps> = ({
  match,
  onPlayerClick,
  onTeamClick
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return t('common.daysAgo', { count: diffDays });
    } else if (diffHours > 0) {
      return t('common.hoursAgo', { count: diffHours });
    } else {
      return t('common.now');
    }
  };

  const handleWinnerClick = () => {
    if (match.type === 'Team' && onTeamClick) {
      onTeamClick(match.player1_id);
    } else if (onPlayerClick) {
      onPlayerClick(match.player1_id);
    }
  };

  const handleLoserClick = () => {
    if (match.type === 'Team' && onTeamClick) {
      onTeamClick(match.player2_id);
    } else if (onPlayerClick) {
      onPlayerClick(match.player2_id);
    }
  };

  return (
    <div className="p-3 hover:bg-gray-50 dark:hover:bg-dark-200/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Header with type and time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          {match.type === 'Team' ? (
            <Users className="h-3 w-3 mr-1" />
          ) : (
            <User className="h-3 w-3 mr-1" />
          )}
          <span>{t(`common.${match.type.toLowerCase()}`)}</span>
          {match.is_tournament && (
            <>
              <Trophy className="h-3 w-3 ml-2 mr-1 text-warning-400" />
              <span className="text-warning-400">{t('common.tournament')}</span>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatDate(match.date)}</span>
      </div>

      {/* Match result - compact layout */}
      <div className="space-y-1">
        {/* Winner */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleWinnerClick}
            className="flex items-center flex-1 min-w-0 hover:text-success-400 transition-colors"
          >
            <div className="w-2 h-2 bg-success-400 rounded-full mr-2 flex-shrink-0"></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {match.player1}
            </span>
          </button>
          <div className="flex items-center ml-2">
            <TrendingUp className="h-3 w-3 text-success-400 mr-1" />
            <span className="text-xs font-medium text-success-400">+{match.elo_change}</span>
          </div>
        </div>

        {/* Loser */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleLoserClick}
            className="flex items-center flex-1 min-w-0 hover:text-error-400 transition-colors"
          >
            <div className="w-2 h-2 bg-error-400 rounded-full mr-2 flex-shrink-0"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {match.player2}
            </span>
          </button>
          <div className="flex items-center ml-2">
            <TrendingDown className="h-3 w-3 text-error-400 mr-1" />
            <span className="text-xs font-medium text-error-400">-{match.elo_change}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentMatchItem;
