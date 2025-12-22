import React from 'react';
import { Crown, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Match {
  id: string;
  round: number;
  position: number;
  player1_id: string | null;
  player2_id: string | null;
  player1_name: string | null;
  player2_name: string | null;
  winner_id: string | null;
  is_draw: boolean;
}

interface CompactMatchCardProps {
  match: Match;
  isTeamTournament: boolean;
  isUserMatch: boolean;
  onPlayerClick: (playerId: string | null, e?: React.MouseEvent) => void;
  onTeamClick: (teamId: string | null, e?: React.MouseEvent) => void;
  matchRef?: (el: HTMLDivElement | null) => void;
}

const CompactMatchCard: React.FC<CompactMatchCardProps> = ({
  match,
  isTeamTournament,
  isUserMatch,
  onPlayerClick,
  onTeamClick,
  matchRef
}) => {
  const { t } = useTranslation();

  const isPlayer1Winner = match.winner_id === match.player1_id;
  const isPlayer2Winner = match.winner_id === match.player2_id;
  const isCompleted = !!match.winner_id || match.is_draw;
  const isOngoing = !isCompleted && match.player1_id && match.player2_id;
  const isPending = !isCompleted && (!match.player1_id || !match.player2_id);

  const getStatusDot = () => {
    if (isCompleted) return 'bg-green-500';
    if (isOngoing) return 'bg-yellow-500 animate-pulse';
    return 'bg-gray-400';
  };

  const handleClick = (playerId: string | null, playerName: string | null, e: React.MouseEvent) => {
    if (!playerId || playerName === 'Bye' || playerName === 'TBD') return;
    e.stopPropagation();
    if (isTeamTournament) {
      onTeamClick(playerId, e);
    } else {
      onPlayerClick(playerId, e);
    }
  };

  return (
    <div
      ref={matchRef ? (el) => matchRef(el) : undefined}
      className={`relative bg-white dark:bg-dark-200 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
        isUserMatch
          ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      style={{ width: '200px' }}
    >
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white dark:border-dark-100 z-10" style={{ backgroundColor: getStatusDot().includes('green') ? '#22c55e' : getStatusDot().includes('yellow') ? '#eab308' : '#9ca3af' }} />

      <div className="p-2">
        <div
          className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
            isPlayer1Winner
              ? 'bg-green-50 dark:bg-green-900/20'
              : isCompleted && !match.is_draw
                ? 'opacity-60'
                : 'hover:bg-gray-50 dark:hover:bg-dark-300'
          } ${match.player1_id && match.player1_name !== 'Bye' ? 'cursor-pointer' : ''}`}
          onClick={(e) => handleClick(match.player1_id, match.player1_name, e)}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isTeamTournament && <Users className="h-3 w-3 text-gray-400 flex-shrink-0" />}
            <span className={`text-sm truncate ${
              isPlayer1Winner ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {match.player1_name || t('tournamentBracket.tbd')}
            </span>
          </div>
          {isPlayer1Winner && <Crown className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />}
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        <div
          className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
            isPlayer2Winner
              ? 'bg-green-50 dark:bg-green-900/20'
              : isCompleted && !match.is_draw
                ? 'opacity-60'
                : 'hover:bg-gray-50 dark:hover:bg-dark-300'
          } ${match.player2_id && match.player2_name !== 'Bye' ? 'cursor-pointer' : ''}`}
          onClick={(e) => handleClick(match.player2_id, match.player2_name, e)}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isTeamTournament && <Users className="h-3 w-3 text-gray-400 flex-shrink-0" />}
            <span className={`text-sm truncate ${
              isPlayer2Winner ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {match.player2_name || t('tournamentBracket.tbd')}
            </span>
          </div>
          {isPlayer2Winner && <Crown className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />}
        </div>
      </div>

      {match.is_draw && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full border border-yellow-200 dark:border-yellow-800">
          {t('tournamentBracket.draw')}
        </div>
      )}
    </div>
  );
};

export default CompactMatchCard;
