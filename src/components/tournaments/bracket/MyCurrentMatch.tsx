import React, { useState, useEffect } from 'react';
import { Swords, Clock, CheckCircle, User, Users, ArrowRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { BracketRoundTimer } from '../../../hooks/useBracketRoundTimers';

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

interface MyCurrentMatchProps {
  tournamentId: string;
  matches: Match[];
  activeRound: number | null;
  roundTimer: BracketRoundTimer | undefined;
  isTeamTournament: boolean;
  onJumpToMatch: (matchId: string) => void;
  onPlayerClick: (playerId: string) => void;
  onTeamClick: (teamId: string) => void;
}

const MyCurrentMatch: React.FC<MyCurrentMatchProps> = ({
  tournamentId,
  matches,
  activeRound,
  roundTimer,
  isTeamTournament,
  onJumpToMatch,
  onPlayerClick,
  onTeamClick
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!user?.id || !isTeamTournament) return;

      const { data } = await supabase
        .from('tournament_registrations')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('tournament_id', tournamentId)
        .eq('status', 'validated')
        .not('team_id', 'is', null)
        .maybeSingle();

      setUserTeamId(data?.team_id || null);
    };

    fetchUserTeam();
  }, [user?.id, tournamentId, isTeamTournament]);

  useEffect(() => {
    if (!roundTimer || roundTimer.status === 'finished') {
      setRemainingTime(null);
      return;
    }

    const calculateRemaining = () => {
      if (roundTimer.status === 'paused' && roundTimer.paused_remaining_seconds !== null) {
        return roundTimer.paused_remaining_seconds;
      }

      if (roundTimer.status === 'active' && roundTimer.end_time) {
        const endTime = new Date(roundTimer.end_time).getTime();
        const now = Date.now();
        return Math.max(0, Math.floor((endTime - now) / 1000));
      }

      if (roundTimer.status === 'pending') {
        return roundTimer.duration_minutes * 60;
      }

      return null;
    };

    setRemainingTime(calculateRemaining());

    if (roundTimer.status === 'active') {
      const interval = setInterval(() => {
        setRemainingTime(calculateRemaining());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roundTimer]);

  const findUserMatch = (): Match | null => {
    if (!user?.id) return null;

    const participantId = isTeamTournament ? userTeamId : user.id;
    if (!participantId) return null;

    const roundToCheck = activeRound || Math.max(...matches.map(m => m.round), 1);

    const userMatch = matches.find(match =>
      match.round === roundToCheck &&
      (match.player1_id === participantId || match.player2_id === participantId)
    );

    if (userMatch) return userMatch;

    return matches.find(match =>
      !match.winner_id &&
      !match.is_draw &&
      (match.player1_id === participantId || match.player2_id === participantId)
    ) || null;
  };

  const userMatch = findUserMatch();

  if (!userMatch || !user?.id) {
    return null;
  }

  const participantId = isTeamTournament ? userTeamId : user.id;
  const isPlayer1 = userMatch.player1_id === participantId;
  const opponentId = isPlayer1 ? userMatch.player2_id : userMatch.player1_id;
  const opponentName = isPlayer1 ? userMatch.player2_name : userMatch.player1_name;
  const isCompleted = !!userMatch.winner_id || userMatch.is_draw;
  const isWinner = userMatch.winner_id === participantId;
  const isLoser = isCompleted && !isWinner && !userMatch.is_draw;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isCompleted) {
      if (isWinner) return 'from-green-600 to-emerald-600';
      if (isLoser) return 'from-red-600 to-rose-600';
      return 'from-yellow-600 to-amber-600';
    }
    if (roundTimer?.status === 'active') return 'from-primary-600 to-primary-700';
    return 'from-gray-600 to-gray-700';
  };

  const getStatusText = () => {
    if (isCompleted) {
      if (isWinner) return t('tournamentBracket.victory');
      if (isLoser) return t('tournamentBracket.defeat');
      return t('tournamentBracket.draw');
    }
    if (roundTimer?.status === 'active') return t('tournamentBracket.ongoing');
    if (roundTimer?.status === 'paused') return t('tournamentBracket.paused');
    return t('tournamentBracket.pending');
  };

  return (
    <div className={`mb-6 bg-gradient-to-r ${getStatusColor()} rounded-xl p-1 shadow-lg`}>
      <div className="bg-white dark:bg-dark-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary-500" />
            <span className="font-bold text-gray-900 dark:text-white">
              {t('tournamentBracket.yourMatch')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('tournamentBracket.round')} {userMatch.round}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {remainingTime !== null && roundTimer?.status === 'active' && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                remainingTime < 300
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
                  : 'bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-300'
              }`}>
                <Clock className="h-4 w-4" />
                {formatTime(remainingTime)}
              </div>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isCompleted
                ? isWinner
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : isLoser
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : roundTimer?.status === 'active'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400'
            }`}>
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 inline mr-1" />
              ) : roundTimer?.status === 'active' ? (
                <Zap className="h-4 w-4 inline mr-1" />
              ) : null}
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div className={`p-2 rounded-lg ${isWinner ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-dark-300'}`}>
                {isTeamTournament ? (
                  <Users className="h-5 w-5 text-primary-500" />
                ) : (
                  <User className="h-5 w-5 text-primary-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('tournamentBracket.you')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {isPlayer1 ? userMatch.player1_name : userMatch.player2_name}
                </p>
              </div>
            </div>

            <div className="px-4">
              <span className="text-lg font-bold text-gray-400 dark:text-gray-500">VS</span>
            </div>

            <div
              className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => opponentId && (isTeamTournament ? onTeamClick(opponentId) : onPlayerClick(opponentId))}
            >
              <div className={`p-2 rounded-lg ${isLoser ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-dark-300'}`}>
                {isTeamTournament ? (
                  <Users className="h-5 w-5 text-gray-500" />
                ) : (
                  <User className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('tournamentBracket.opponent')}</p>
                <p className="font-semibold text-gray-900 dark:text-white hover:underline">
                  {opponentName || t('tournamentBracket.tbd')}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onJumpToMatch(userMatch.id)}
            className="ml-4 flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {t('tournamentBracket.viewInBracket')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyCurrentMatch;
