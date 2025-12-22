import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Crown, Users, CheckCircle, Zap, Clock } from 'lucide-react';
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
  group_id: string | null;
}

type RoundStatus = 'pending' | 'active' | 'paused' | 'finished' | 'unknown';

interface CompactMatchTableProps {
  matchesByRound: Record<number, Match[]>;
  rounds: number[];
  selectedRound: number | null;
  viewAllRounds: boolean;
  activeRound: number | null;
  isTeamTournament: boolean;
  isUserParticipant: (player1Id: string | null, player2Id: string | null) => boolean;
  getRoundStatus: (round: number) => RoundStatus;
  getRoundName: (round: number) => string;
  onPlayerClick: (playerId: string | null) => void;
  onTeamClick: (teamId: string | null) => void;
}

const CompactMatchTable: React.FC<CompactMatchTableProps> = ({
  matchesByRound,
  rounds,
  selectedRound,
  viewAllRounds,
  activeRound,
  isTeamTournament,
  isUserParticipant,
  getRoundStatus,
  getRoundName,
  onPlayerClick,
  onTeamClick
}) => {
  const { t } = useTranslation();
  const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(new Set());

  const toggleRoundCollapse = (round: number) => {
    setCollapsedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(round)) {
        newSet.delete(round);
      } else {
        newSet.add(round);
      }
      return newSet;
    });
  };

  const roundsToShow = viewAllRounds
    ? rounds
    : selectedRound
      ? [selectedRound]
      : activeRound
        ? [activeRound]
        : rounds.slice(0, 1);

  const getStatusBadge = (match: Match) => {
    const isCompleted = !!match.winner_id || match.is_draw;
    const isOngoing = !isCompleted && match.player1_id && match.player2_id;

    if (isCompleted) {
      if (match.is_draw) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            {t('tournamentBracket.draw')}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          {t('tournamentBracket.completed')}
        </span>
      );
    }

    if (isOngoing) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
          <Zap className="h-3 w-3" />
          {t('tournamentBracket.ongoing')}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        <Clock className="h-3 w-3" />
        {t('tournamentBracket.pending')}
      </span>
    );
  };

  const handleParticipantClick = (id: string | null, name: string | null) => {
    if (!id || name === 'TBD' || name === 'Bye') return;
    if (isTeamTournament) {
      onTeamClick(id);
    } else {
      onPlayerClick(id);
    }
  };

  return (
    <div className="space-y-4">
      {roundsToShow.map(round => {
        const matches = matchesByRound[round] || [];
        const isCollapsed = collapsedRounds.has(round);
        const status = getRoundStatus(round);
        const isActive = round === activeRound;
        const completedCount = matches.filter(m => m.winner_id || m.is_draw).length;

        return (
          <div
            key={round}
            className={`bg-white dark:bg-dark-200 rounded-xl border overflow-hidden transition-all ${
              isActive
                ? 'border-primary-500 ring-2 ring-primary-500/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <button
              onClick={() => toggleRoundCollapse(round)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
                <span className="font-bold text-gray-900 dark:text-white">
                  {getRoundName(round)}
                </span>
                {isActive && (
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {completedCount}/{matches.length} {t('tournamentBracket.matchesShort')}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  status === 'finished'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : status === 'active'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : status === 'paused'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {status === 'finished' && t('tournamentBracket.completed')}
                  {status === 'active' && t('tournamentBracket.inProgress')}
                  {status === 'paused' && t('tournamentBracket.paused')}
                  {status === 'pending' && t('tournamentBracket.upcoming')}
                  {status === 'unknown' && t('tournamentBracket.pending')}
                </span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-dark-300 border-t border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400 w-16">
                        #
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                        {isTeamTournament ? t('tournamentBracket.team1') : t('tournamentBracket.player1')}
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-12">

                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                        {isTeamTournament ? t('tournamentBracket.team2') : t('tournamentBracket.player2')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                        {t('tournamentBracket.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {matches.map(match => {
                      const isUserMatch = isUserParticipant(match.player1_id, match.player2_id);
                      const isPlayer1Winner = match.winner_id === match.player1_id;
                      const isPlayer2Winner = match.winner_id === match.player2_id;

                      return (
                        <tr
                          key={match.id}
                          className={`transition-colors ${
                            isUserMatch
                              ? 'bg-primary-50 dark:bg-primary-900/10'
                              : 'hover:bg-gray-50 dark:hover:bg-dark-300/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">
                            {match.position}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleParticipantClick(match.player1_id, match.player1_name)}
                              className={`flex items-center gap-2 ${
                                match.player1_id && match.player1_name !== 'TBD' && match.player1_name !== 'Bye'
                                  ? 'hover:underline cursor-pointer'
                                  : ''
                              }`}
                            >
                              {isTeamTournament && <Users className="h-4 w-4 text-gray-400" />}
                              <span className={`${
                                isPlayer1Winner
                                  ? 'font-bold text-green-600 dark:text-green-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {match.player1_name || t('tournamentBracket.tbd')}
                              </span>
                              {isPlayer1Winner && <Crown className="h-4 w-4 text-yellow-500" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-400 font-medium">
                            vs
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleParticipantClick(match.player2_id, match.player2_name)}
                              className={`flex items-center gap-2 ${
                                match.player2_id && match.player2_name !== 'TBD' && match.player2_name !== 'Bye'
                                  ? 'hover:underline cursor-pointer'
                                  : ''
                              }`}
                            >
                              {isTeamTournament && <Users className="h-4 w-4 text-gray-400" />}
                              <span className={`${
                                isPlayer2Winner
                                  ? 'font-bold text-green-600 dark:text-green-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {match.player2_name || t('tournamentBracket.tbd')}
                              </span>
                              {isPlayer2Winner && <Crown className="h-4 w-4 text-yellow-500" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {getStatusBadge(match)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CompactMatchTable;
