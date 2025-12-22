import React, { useState, useEffect } from 'react';
import { Clock, Pause, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BracketRoundTimer } from '../../../hooks/useBracketRoundTimers';

interface RoundTimerProps {
  timer: BracketRoundTimer | undefined;
  roundName: string;
  completedMatches: number;
  totalMatches: number;
}

const RoundTimer: React.FC<RoundTimerProps> = ({
  timer,
  roundName,
  completedMatches,
  totalMatches
}) => {
  const { t } = useTranslation();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!timer) {
      setRemainingSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      if (timer.status === 'finished') return 0;

      if (timer.status === 'paused' && timer.paused_remaining_seconds !== null) {
        return timer.paused_remaining_seconds;
      }

      if (timer.status === 'active' && timer.end_time) {
        const endTime = new Date(timer.end_time).getTime();
        const now = Date.now();
        return Math.max(0, Math.floor((endTime - now) / 1000));
      }

      if (timer.status === 'pending') {
        return timer.duration_minutes * 60;
      }

      return null;
    };

    setRemainingSeconds(calculateRemaining());

    if (timer.status === 'active') {
      const interval = setInterval(() => {
        const remaining = calculateRemaining();
        setRemainingSeconds(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  if (!timer) return null;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = remainingSeconds !== null && remainingSeconds < 300 && timer.status === 'active';
  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <div className={`rounded-xl p-4 mb-4 transition-all ${
      timer.status === 'finished'
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
        : timer.status === 'paused'
          ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
          : isUrgent
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-pulse'
            : 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {timer.status === 'finished' ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : timer.status === 'paused' ? (
            <Pause className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          ) : isUrgent ? (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          )}
          <span className="font-bold text-gray-900 dark:text-white">{roundName}</span>
        </div>

        {remainingSeconds !== null && timer.status !== 'finished' && (
          <div className={`text-2xl font-mono font-bold ${
            isUrgent
              ? 'text-red-600 dark:text-red-400'
              : timer.status === 'paused'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-primary-600 dark:text-primary-400'
          }`}>
            {formatTime(remainingSeconds)}
          </div>
        )}

        {timer.status === 'finished' && (
          <span className="text-green-600 dark:text-green-400 font-semibold">
            {t('tournamentBracket.roundComplete')}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {t('tournamentBracket.matchProgress')}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {completedMatches}/{totalMatches} {t('tournamentBracket.matchesCompleted')}
          </span>
        </div>

        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              timer.status === 'finished'
                ? 'bg-green-500'
                : timer.status === 'paused'
                  ? 'bg-orange-500'
                  : 'bg-primary-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {timer.status === 'paused' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <Pause className="h-4 w-4" />
          <span>{t('tournamentBracket.roundPaused')}</span>
        </div>
      )}

      {isUrgent && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('tournamentBracket.timeRunningLow')}</span>
        </div>
      )}
    </div>
  );
};

export default RoundTimer;
