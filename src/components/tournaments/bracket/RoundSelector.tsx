import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Zap, Clock, Pause, Eye, MoveHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type RoundStatus = 'pending' | 'active' | 'paused' | 'finished' | 'unknown';

interface RoundSelectorProps {
  rounds: number[];
  selectedRound: number | null;
  activeRound: number | null;
  viewAllRounds: boolean;
  getRoundStatus: (round: number) => RoundStatus;
  getRoundName: (round: number) => string;
  onRoundSelect: (round: number) => void;
  onViewAllToggle: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const RoundSelector: React.FC<RoundSelectorProps> = ({
  rounds,
  selectedRound,
  activeRound,
  viewAllRounds,
  getRoundStatus,
  getRoundName,
  onRoundSelect,
  onViewAllToggle,
  onNavigate
}) => {
  const { t } = useTranslation();

  const getStatusIcon = (status: RoundStatus) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'active':
        return <Zap className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-3.5 w-3.5 text-orange-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: RoundStatus) => {
    switch (status) {
      case 'finished':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'active':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'paused':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const currentIndex = rounds.indexOf(selectedRound || activeRound || rounds[0]);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < rounds.length - 1;

  return (
    <div className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('prev')}
            disabled={!canGoPrev || viewAllRounds}
            className={`hidden sm:flex p-2 rounded-lg transition-colors ${
              canGoPrev && !viewAllRounds
                ? 'hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {rounds.map(round => {
              const status = getRoundStatus(round);
              const isSelected = viewAllRounds ? false : selectedRound === round;
              const isActive = round === activeRound;

              return (
                <button
                  key={round}
                  onClick={() => onRoundSelect(round)}
                  disabled={viewAllRounds}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    viewAllRounds
                      ? 'opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'bg-primary-600 text-white shadow-md'
                        : isActive
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500'
                          : 'hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {!isSelected && getStatusIcon(status)}
                  <span>{getRoundName(round)}</span>
                  {isActive && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onNavigate('next')}
            disabled={!canGoNext || viewAllRounds}
            className={`hidden sm:flex p-2 rounded-lg transition-colors ${
              canGoNext && !viewAllRounds
                ? 'hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onViewAllToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            viewAllRounds
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-400'
          }`}
        >
          <Eye className="h-4 w-4" />
          {viewAllRounds ? t('tournamentBracket.showActive') : t('tournamentBracket.viewAll')}
        </button>
      </div>

      {!viewAllRounds && selectedRound && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(getRoundStatus(selectedRound))}`}>
            {getStatusIcon(getRoundStatus(selectedRound))}
            {getRoundStatus(selectedRound) === 'finished' && t('tournamentBracket.completed')}
            {getRoundStatus(selectedRound) === 'active' && t('tournamentBracket.inProgress')}
            {getRoundStatus(selectedRound) === 'paused' && t('tournamentBracket.paused')}
            {getRoundStatus(selectedRound) === 'pending' && t('tournamentBracket.upcoming')}
          </span>
          <div className="sm:hidden flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
            <MoveHorizontal className="h-3 w-3" />
            <span>{t('tournamentBracket.swipeToNavigate')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundSelector;
