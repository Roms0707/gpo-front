import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Trophy,
  Users,
  Clock,
  ChevronRight,
  UserPlus,
  UserCheck,
  MessageSquare,
  Copy,
  Check,
  Loader,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlayerMatchNotification, OpponentGameIds } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  checkFriendshipStatus,
  getOpponentUserProfile,
  FriendshipStatus
} from '../../services/matchFriendshipService';
import { sendFriendRequest, acceptFriendRequest } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { countries } from '../../utils/countries';
import ChatModal from '../chat/ChatModal';
import toast from 'react-hot-toast';

interface OpponentProfile {
  id: string;
  username: string;
  avatar_url?: string;
  country?: string;
  bio?: string;
}

interface BracketReadyModalProps {
  notification: PlayerMatchNotification;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}

const BracketReadyModal: React.FC<BracketReadyModalProps> = ({
  notification,
  onClose,
  onMarkAsRead
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState<string>('');
  const navigate = useNavigate();

  const [opponent, setOpponent] = useState<OpponentProfile | null>(null);
  const [opponentGameIds, setOpponentGameIds] = useState<OpponentGameIds | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [isLoadingOpponent, setIsLoadingOpponent] = useState(false);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  }, []);

  useEffect(() => {
    const loadOpponentData = async () => {
      if (!user?.id || !notification.tournament_id) return;

      setIsLoadingOpponent(true);
      try {
        const opponentId = notification.metadata?.opponent_id || notification.opponent_user_id;

        if (opponentId) {
          const profile = await getOpponentUserProfile(opponentId);
          if (profile) {
            setOpponent(profile);

            const status = await checkFriendshipStatus(user.id, opponentId);
            setFriendshipStatus(status);

            const { data: gameIds } = await supabase
              .from('users')
              .select('discord_handle, riot_game_name, riot_tagline, fortnite_epic_id')
              .eq('id', opponentId)
              .maybeSingle();

            if (gameIds) {
              setOpponentGameIds({
                discord_handle: gameIds.discord_handle,
                riot_game_name: gameIds.riot_game_name,
                riot_tagline: gameIds.riot_tagline,
                epic_games_id: gameIds.fortnite_epic_id
              });
            }
          }
        } else {
          const { data: bracketData } = await supabase
            .from('tournament_brackets')
            .select('player1_id, player2_id, team1_id, team2_id')
            .eq('tournament_id', notification.tournament_id)
            .eq('round', 1)
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},team1_id.eq.${notification.team_id},team2_id.eq.${notification.team_id}`)
            .maybeSingle();

          if (bracketData) {
            let opponentUserId: string | null = null;

            if (bracketData.player1_id === user.id) {
              opponentUserId = bracketData.player2_id;
            } else if (bracketData.player2_id === user.id) {
              opponentUserId = bracketData.player1_id;
            }

            if (opponentUserId) {
              const profile = await getOpponentUserProfile(opponentUserId);
              if (profile) {
                setOpponent(profile);

                const status = await checkFriendshipStatus(user.id, opponentUserId);
                setFriendshipStatus(status);

                const { data: gameIds } = await supabase
                  .from('users')
                  .select('discord_handle, riot_game_name, riot_tagline, fortnite_epic_id')
                  .eq('id', opponentUserId)
                  .maybeSingle();

                if (gameIds) {
                  setOpponentGameIds({
                    discord_handle: gameIds.discord_handle,
                    riot_game_name: gameIds.riot_game_name,
                    riot_tagline: gameIds.riot_tagline,
                    epic_games_id: gameIds.fortnite_epic_id
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading opponent data:', error);
      } finally {
        setIsLoadingOpponent(false);
      }
    };

    loadOpponentData();
  }, [user?.id, notification.tournament_id, notification.metadata?.opponent_id, notification.opponent_user_id, notification.team_id]);

  useEffect(() => {
    const calculateCountdown = () => {
      if (!notification.metadata?.tournament_start_time) return;

      const startTime = new Date(notification.metadata.tournament_start_time).getTime();
      const now = new Date().getTime();
      const distance = startTime - now;

      if (distance < 0) {
        setCountdown(t('notifications.tournamentStarted'));
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [notification.metadata?.tournament_start_time, t]);

  const handleClose = async () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAccept = async () => {
    await onMarkAsRead(notification.id);
    navigate(`/tournaments/${notification.tournament_id}?tab=bracket`);
    handleClose();
  };

  const handleSendFriendRequest = async () => {
    if (!user?.id || !opponent?.id) return;

    setIsFriendActionLoading(true);
    try {
      await sendFriendRequest(user.id, opponent.id);
      setFriendshipStatus({
        areFriends: false,
        hasPendingRequest: true,
        requestSentByCurrentUser: true,
        requestSentByOpponent: false
      });
      toast.success(t('friends.requestSentSuccess', { username: opponent.username }));
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
      toast.success(t('friends.friendRequestAcceptedSuccess', { username: opponent?.username }));
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

  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode) return null;
    const country = countries.find(c => c.code === countryCode);
    return country?.flag || null;
  };

  const metadata = notification.metadata || {};

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

  return (
    <>
      <div
        className="fixed inset-0 z-[9999]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bracket-ready-title"
      >
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm"
          onClick={handleClose}
        ></div>

        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
          <div
            className={`relative w-full max-w-3xl pointer-events-auto transform transition-all duration-500 my-8 ${
              isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary-500">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnpNNTQgMzZjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6TTE4IDM2YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L2c+PC9zdmc+')] opacity-30"></div>

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              aria-label={t('notifications.close')}
            >
              <X className="h-6 w-6" />
            </button>

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                {isLoadingOpponent ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-8 w-8 animate-spin text-white/60" />
                  </div>
                ) : opponent ? (
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-4 md:gap-8 mb-6">
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 overflow-hidden shadow-xl">
                            {user?.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/60">
                                <User className="h-10 w-10" />
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-2 border-primary-700 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">YOU</span>
                          </div>
                        </div>
                        <span className="mt-2 text-sm font-medium text-white/90 max-w-[100px] truncate">
                          {user?.username}
                        </span>
                        {user?.country && (
                          <span className="text-lg">{getCountryFlag(user.country)}</span>
                        )}
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-warning-500/20 backdrop-blur-sm border-4 border-warning-400 flex items-center justify-center shadow-2xl">
                          <span className="text-2xl md:text-3xl font-black text-warning-400">VS</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 overflow-hidden shadow-xl">
                            {opponent.avatar_url ? (
                              <img
                                src={opponent.avatar_url}
                                alt={opponent.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/60">
                                <User className="h-10 w-10" />
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="mt-2 text-sm font-medium text-white/90 max-w-[100px] truncate">
                          {opponent.username}
                        </span>
                        {opponent.country && (
                          <span className="text-lg">{getCountryFlag(opponent.country)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {friendshipStatus?.areFriends ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-success-500/20 text-success-300 rounded-lg border border-success-500/30">
                          <UserCheck className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('friends.alreadyFriends')}</span>
                        </div>
                      ) : friendshipStatus?.requestSentByCurrentUser ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-warning-500/20 text-warning-300 rounded-lg border border-warning-500/30">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('friends.pendingRequest')}</span>
                        </div>
                      ) : friendshipStatus?.requestSentByOpponent ? (
                        <button
                          onClick={handleAcceptFriendRequest}
                          disabled={isFriendActionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isFriendActionLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">{t('friends.acceptRequest')}</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleSendFriendRequest}
                          disabled={isFriendActionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30 disabled:opacity-50"
                        >
                          {isFriendActionLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">{t('friends.addFriend')}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setShowChatModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('friends.sendMessage')}</span>
                      </button>
                    </div>

                    {gameIdsList.length > 0 && (
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-white/60 uppercase tracking-wide mb-3 font-medium">
                          {t('notifications.opponentGameIds')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {gameIdsList.map((gameId) => (
                            <button
                              key={gameId.key}
                              onClick={() => copyToClipboard(gameId.value!, gameId.key)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                            >
                              <span className="text-xs text-white/70">{gameId.label}:</span>
                              <span className="text-xs font-medium text-white">{gameId.value}</span>
                              {copiedId === gameId.key ? (
                                <Check className="h-3 w-3 text-success-400" />
                              ) : (
                                <Copy className="h-3 w-3 text-white/50 group-hover:text-white/80 transition-colors" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-2xl">
                      <Trophy className="h-12 w-12 md:h-16 md:w-16 text-warning-400" />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      {t('notifications.bracketGenerated')}
                    </span>
                  </div>

                  <h2
                    id="bracket-ready-title"
                    className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-white drop-shadow-lg"
                  >
                    {t('notifications.yourMatchIsReady')}
                  </h2>

                  {metadata.tournament_title && (
                    <p className="text-xl md:text-2xl font-semibold text-white/90">
                      {metadata.tournament_title}
                    </p>
                  )}
                </div>

                {countdown && (
                  <div className="w-full max-w-md">
                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-center space-x-3 mb-2">
                        <Clock className="h-5 w-5 text-warning-300" />
                        <span className="text-sm font-medium text-white/80 uppercase tracking-wide">
                          {t('notifications.startsIn')}
                        </span>
                      </div>
                      <div className="text-4xl md:text-5xl font-black text-white font-mono tabular-nums">
                        {countdown}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-6 w-full max-w-lg">
                  {metadata.total_participants && (
                    <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-md px-6 py-3 rounded-lg border border-white/20">
                      <Users className="h-6 w-6 text-white/90" />
                      <div className="text-left">
                        <div className="text-2xl font-bold text-white">
                          {metadata.total_participants}
                        </div>
                        <div className="text-xs text-white/70 uppercase tracking-wide">
                          {t('notifications.participants')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-md px-6 py-3 rounded-lg border border-white/20">
                    <Trophy className="h-6 w-6 text-warning-400" />
                    <div className="text-left">
                      <div className="text-2xl font-bold text-white">
                        Round 1
                      </div>
                      <div className="text-xs text-white/70 uppercase tracking-wide">
                        {t('notifications.yourRound')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 w-full max-w-2xl">
                  <p className="text-white/90 text-base md:text-lg leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 font-semibold border border-white/30 hover:border-white/50"
                >
                  {t('notifications.later')}
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 px-6 py-4 bg-white hover:bg-gray-100 text-primary-900 rounded-xl transition-all duration-200 font-bold flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  <span>{t('notifications.viewBracket')}</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute -inset-4 bg-gradient-to-r from-primary-500 via-warning-500 to-primary-500 rounded-3xl opacity-20 blur-xl -z-10 animate-pulse"></div>
          </div>
        </div>
      </div>

      {showChatModal && opponent && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          recipientId={opponent.id}
          recipientName={opponent.username}
          recipientAvatar={opponent.avatar_url}
        />
      )}
    </>
  );
};

export default BracketReadyModal;
