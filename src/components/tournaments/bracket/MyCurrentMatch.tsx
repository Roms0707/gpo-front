import React, { useState, useEffect } from 'react';
import { Swords, Clock, CheckCircle, User, Users, ArrowRight, Zap, Copy, Check, UserPlus, UserCheck, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { BracketRoundTimer } from '../../../hooks/useBracketRoundTimers';
import { checkFriendshipStatus, FriendshipStatus } from '../../../services/matchFriendshipService';
import { sendFriendRequest, acceptFriendRequest } from '../../../services/api';
import toast from 'react-hot-toast';

interface OpponentGameIds {
  discord_handle?: string | null;
  riot_game_name?: string | null;
  riot_tagline?: string | null;
  epic_games_id?: string | null;
  steam_id?: string | null;
  ea_id?: string | null;
  battle_net_id?: string | null;
}

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
  const [opponentGameIds, setOpponentGameIds] = useState<OpponentGameIds | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGameIds, setShowGameIds] = useState(false);
  const [isLoadingGameIds, setIsLoadingGameIds] = useState(false);

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

  const participantId = isTeamTournament ? userTeamId : user?.id;
  const isPlayer1 = userMatch?.player1_id === participantId;
  const opponentId = userMatch ? (isPlayer1 ? userMatch.player2_id : userMatch.player1_id) : null;
  const opponentName = userMatch ? (isPlayer1 ? userMatch.player2_name : userMatch.player1_name) : null;

  useEffect(() => {
    const loadOpponentData = async () => {
      if (!opponentId || !user?.id || isTeamTournament) return;

      setIsLoadingGameIds(true);
      try {
        const { data: gameIds } = await supabase
          .from('users')
          .select('discord_handle, riot_game_name, riot_tagline, fortnite_epic_id, steam_id, ea_id, battle_net_id')
          .eq('id', opponentId)
          .maybeSingle();

        if (gameIds) {
          setOpponentGameIds({
            discord_handle: gameIds.discord_handle,
            riot_game_name: gameIds.riot_game_name,
            riot_tagline: gameIds.riot_tagline,
            epic_games_id: gameIds.fortnite_epic_id,
            steam_id: gameIds.steam_id,
            ea_id: gameIds.ea_id,
            battle_net_id: gameIds.battle_net_id
          });
        }

        const status = await checkFriendshipStatus(user.id, opponentId);
        setFriendshipStatus(status);
      } catch (error) {
        console.error('Error loading opponent data:', error);
      } finally {
        setIsLoadingGameIds(false);
      }
    };

    loadOpponentData();
  }, [user?.id, opponentId, isTeamTournament]);

  if (!userMatch || !user?.id) {
    return null;
  }

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

  const handleSendFriendRequest = async () => {
    if (!user?.id || !opponentId) return;

    setIsFriendActionLoading(true);
    try {
      await sendFriendRequest(user.id, opponentId);
      setFriendshipStatus({
        areFriends: false,
        hasPendingRequest: true,
        requestSentByCurrentUser: true,
        requestSentByOpponent: false
      });
      toast.success(t('friends.requestSentSuccess', { username: opponentName }));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(t('friends.requestSentError'));
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipStatus?.relationshipId) return;

    setIsFriendActionLoading(true);
    try {
      await acceptFriendRequest(friendshipStatus.relationshipId);
      setFriendshipStatus({
        areFriends: true,
        hasPendingRequest: false,
        requestSentByCurrentUser: false,
        requestSentByOpponent: false,
        relationshipId: friendshipStatus.relationshipId
      });
      toast.success(t('friends.friendRequestAcceptedSuccess', { username: opponentName }));
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error(t('friends.friendRequestAcceptedError'));
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const copyToClipboard = async (text: string, idType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(idType);
      toast.success(t('common.copied'));
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const gameIdsList = opponentGameIds ? [
    { key: 'discord', label: 'Discord', value: opponentGameIds.discord_handle },
    { key: 'riot', label: 'Riot ID', value: opponentGameIds.riot_game_name && opponentGameIds.riot_tagline
      ? `${opponentGameIds.riot_game_name}#${opponentGameIds.riot_tagline}`
      : null
    },
    { key: 'epic', label: 'Epic Games', value: opponentGameIds.epic_games_id },
    { key: 'steam', label: 'Steam', value: opponentGameIds.steam_id },
    { key: 'ea', label: 'EA ID', value: opponentGameIds.ea_id },
    { key: 'battlenet', label: 'Battle.net', value: opponentGameIds.battle_net_id },
  ].filter(id => id.value) : [];

  const hasGameIds = gameIdsList.length > 0;

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

        {!isTeamTournament && opponentId && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {friendshipStatus?.areFriends ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm">
                    <UserCheck className="h-4 w-4" />
                    <span className="font-medium">{t('friends.alreadyFriends')}</span>
                  </div>
                ) : friendshipStatus?.requestSentByCurrentUser ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{t('friends.pendingRequest')}</span>
                  </div>
                ) : friendshipStatus?.requestSentByOpponent ? (
                  <button
                    onClick={handleAcceptFriendRequest}
                    disabled={isFriendActionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {isFriendActionLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    <span className="font-medium">{t('friends.acceptRequest')}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={isFriendActionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {isFriendActionLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span className="font-medium">{t('friends.addFriend')}</span>
                  </button>
                )}
              </div>

              {hasGameIds && (
                <button
                  onClick={() => setShowGameIds(!showGameIds)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-lg text-sm transition-colors"
                >
                  <span className="font-medium">{t('notifications.opponentGameIds')}</span>
                  {showGameIds ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {showGameIds && hasGameIds && (
              <div className="mt-3 flex flex-wrap gap-2">
                {gameIdsList.map((gameId) => (
                  <button
                    key={gameId.key}
                    onClick={() => copyToClipboard(gameId.value!, gameId.key)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-dark-300 hover:bg-gray-200 dark:hover:bg-dark-400 rounded-lg transition-colors group"
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400">{gameId.label}:</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{gameId.value}</span>
                    {copiedId === gameId.key ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {isLoadingGameIds && !hasGameIds && (
              <div className="mt-3 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <Loader className="h-4 w-4 animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCurrentMatch;
