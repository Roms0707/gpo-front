import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, User, MapPin, Calendar, Trophy, Gamepad2,
  CheckCircle, XCircle, Loader, AlertTriangle,
  UserPlus, MessageSquare, Crosshair, Copy, Check
} from 'lucide-react';
import { fetchUserProfile, sendFriendRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';
import { countries } from '../../utils/countries';
import { fetchUserCustomization } from '../../services/profileCustomizationService';
import { getGameTheme } from '../../utils/gameThemes';
import AvatarWithFrame from '../profile/AvatarWithFrame';
import ProfileModalFrame from '../profile/ProfileModalFrame';
import toast from 'react-hot-toast';
import ChatModal from '../chat/ChatModal';
import type { UserProfileCustomization } from '../../types';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  gameId?: string | null;
}

const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  gameId
}) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tournaments'>('overview');
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [userCustomization, setUserCustomization] = useState<UserProfileCustomization | null>(null);
  const [discordCopied, setDiscordCopied] = useState(false);

  const theme = useMemo(() => {
    const gameName = userProfile?.favorite_game?.name
      || userProfile?.game_rankings?.[0]?.game_name;
    return getGameTheme(gameName);
  }, [userProfile]);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isOpen || !userId) {
        if (isOpen && !userId) setError(t('profile.invalidUserId'));
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setUserProfile(null);
        setUserCustomization(null);

        const [profileData, customizationData] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserCustomization(userId).catch(() => null)
        ]);

        if (!profileData) throw new Error(t('profile.noProfileData'));

        setUserProfile(profileData);
        setUserCustomization(customizationData);
      } catch (error: any) {
        setError(error?.message || t('profile.errorLoadingProfile'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [isOpen, userId]);

  const handleSendFriendRequest = async () => {
    if (!currentUser?.id || !userId) return;
    try {
      setIsSendingFriendRequest(true);
      await sendFriendRequest(currentUser.id, userId);
      setFriendRequestSent(true);
      toast.success(t('profile.friendRequestSent'));
    } catch {
      toast.error(t('profile.friendRequestError'));
    } finally {
      setIsSendingFriendRequest(false);
    }
  };

  const bestAimScore = useMemo(() => {
    if (!userProfile?.aim_trainer_scores?.length) return null;
    return Math.max(...userProfile.aim_trainer_scores.map((s: any) => s?.score || 0));
  }, [userProfile?.aim_trainer_scores]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => { document.body.classList.remove('modal-open'); };
  }, [isOpen]);

  if (!isOpen) return null;

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const getCountryName = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  const bannerUrl = userProfile?.banner_url
    || userCustomization?.selected_banner?.image_url;

  const isOtherPlayer = currentUser && currentUser.id !== userId;

  const handleCopyDiscord = () => {
    if (!userProfile?.discord_handle) return;
    navigator.clipboard.writeText(userProfile.discord_handle);
    setDiscordCopied(true);
    setTimeout(() => setDiscordCopied(false), 2000);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        <ProfileModalFrame
          frame={userCustomization?.modal_frame}
          themeColor={theme.colors.primary}
          className="bg-white dark:bg-dark-100 w-full max-w-lg max-h-[90vh] overflow-hidden relative z-50"
        >
          <div onClick={stopPropagation}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-16">
                <Loader className="h-10 w-10 animate-spin mb-4" style={{ color: theme.colors.primary }} />
                <p className="text-gray-600 dark:text-gray-400">{t('profile.loadingProfile')}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-16">
                <AlertTriangle className="h-12 w-12 text-error-500 mb-4" />
                <p className="text-error-600 dark:text-error-400 font-medium mb-2">{t('profile.error')}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
              </div>
            ) : userProfile ? (
              <>
                {/* Hero Banner */}
                <div className="relative h-36 overflow-hidden">
                  {bannerUrl ? (
                    <img
                      src={bannerUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.primary}50 0%, ${theme.colors.secondary}40 50%, ${theme.colors.primary}25 100%)`
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-dark-100/90 dark:to-dark-100/95" />
                  <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                      backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, ${theme.colors.primary} 10px, ${theme.colors.primary} 20px)`
                    }}
                  />

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60 hover:text-white transition-all border border-white/10"
                    aria-label={t('profile.close')}
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Overlaid Action Buttons */}
                  {isOtherPlayer && (
                    <div className="absolute top-3 left-3 z-10 flex gap-2">
                      <button
                        onClick={handleSendFriendRequest}
                        disabled={isSendingFriendRequest || friendRequestSent}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all border border-white/10 disabled:opacity-50"
                      >
                        {isSendingFriendRequest ? (
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                        ) : friendRequestSent ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          <UserPlus className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {friendRequestSent ? t('profile.requestSent') : t('profile.addAsFriend')}
                        </span>
                      </button>

                      <button
                        onClick={() => setShowChatModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all border border-white/10"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t('profile.message')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Avatar + Identity Block */}
                <div className="relative px-6 pb-4">
                  <div className="flex flex-col items-center -mt-12">
                    <div
                      className="rounded-2xl"
                      style={{ boxShadow: `0 0 24px ${theme.colors.primary}40` }}
                    >
                      <AvatarWithFrame
                        avatarUrl={userProfile?.avatar_url}
                        username={userProfile?.username}
                        frame={userCustomization?.avatar_frame}
                        badge={userCustomization?.avatar_badge}
                        size="xl"
                        themeColor={theme.colors.primary}
                      />
                    </div>

                    <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white mt-3">
                      {userProfile?.username || t('profile.unknownUser')}
                    </h3>

                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {userProfile?.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {getCountryName(userProfile.country)}
                        </span>
                      )}
                      {userProfile?.country && userProfile?.created_at && (
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                      )}
                      {userProfile?.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {t('profile.memberSince', { date: formatDate(userProfile.created_at) })}
                        </span>
                      )}
                    </div>

                    {userProfile?.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center max-w-sm line-clamp-2">
                        {userProfile.bio}
                      </p>
                    )}

                    {(userProfile?.discord_handle || userProfile?.twitter_handle) && (
                      <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                        {userProfile?.discord_handle && (
                          <button
                            onClick={handleCopyDiscord}
                            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border"
                            style={{
                              backgroundColor: discordCopied ? '#3ba55d15' : '#5865F215',
                              borderColor: discordCopied ? '#3ba55d40' : '#5865F240',
                              color: discordCopied ? '#3ba55d' : '#5865F2',
                            }}
                          >
                            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                            </svg>
                            <span className="truncate max-w-[140px]">{userProfile.discord_handle}</span>
                            {discordCopied ? (
                              <Check className="h-3.5 w-3.5 flex-shrink-0" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        )}
                        {userProfile?.twitter_handle && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-200/60 border border-gray-200/50 dark:border-gray-700/50">
                            <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.571 4.714h1.715l5.143 8.571L24 4.714h-3.429L17.143 9.43 13.714 4.714zM1.143 4.714L6.857 12l-6 8.571h3.429l4.285-6.143 3.715 6.143h5.143L11.571 12l5.714-7.286H13.857l-3.714 5.143-3.429-5.143z" />
                            </svg>
                            {userProfile.twitter_handle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
                  {(['overview', 'tournaments'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                        activeTab === tab
                          ? 'text-white'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {tab === 'overview' ? <User className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                        {tab === 'overview' ? t('profile.overviewTab', 'Overview') : t('profile.tournamentsTab')}
                      </span>
                      {activeTab === tab && (
                        <div
                          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-340px)] p-5">
                  {activeTab === 'overview' ? (
                    <OverviewTab
                      userProfile={userProfile}
                      bestAimScore={bestAimScore}
                      theme={theme}
                      t={t}
                    />
                  ) : (
                    <TournamentsTab
                      userProfile={userProfile}
                      theme={theme}
                      t={t}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-16">
                <User className="h-16 w-16 text-gray-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('profile.noInformationAvailable')}</p>
              </div>
            )}
          </div>
        </ProfileModalFrame>
      </div>

      {showChatModal && userProfile && userId && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          recipientId={userId}
          recipientName={userProfile?.username || t('profile.user')}
          recipientAvatar={userProfile?.avatar_url}
        />
      )}
    </>
  );
};

interface OverviewTabProps {
  userProfile: any;
  bestAimScore: number | null;
  theme: ReturnType<typeof getGameTheme>;
  t: (key: string, defaultValue?: string) => string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ userProfile, bestAimScore, theme, t }) => {
  const hasAccounts = userProfile?.gaming_accounts?.length > 0;
  const hasRankings = userProfile?.game_rankings?.length > 0;

  if (!hasAccounts && !hasRankings && bestAimScore === null) {
    return (
      <div className="text-center py-10">
        <Trophy className="h-10 w-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('profile.noGameStats')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasAccounts && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
            <Gamepad2 className="h-3.5 w-3.5" />
            {t('profile.gameAccounts')}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {userProfile.gaming_accounts.map((account: any, index: number) => {
              const displayName = account?.is_validated && account?.validation_data
                ? (account.validation_data?.personaname || account.validation_data?.account?.name || account?.value)
                : account?.value;
              const gameName = account?.game_publisher_ids?.games?.name || t('profile.unknownGame');
              return (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-dark-200/80 border border-gray-200/60 dark:border-gray-700/50"
                >
                  {account?.is_validated ? (
                    <CheckCircle className="h-3 w-3 text-success-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-gray-500 dark:text-gray-500">{gameName}</span>
                  <span className="text-gray-300 dark:text-gray-600">-</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                    {displayName || 'N/A'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Rankings - Compact Rows */}
      {hasRankings && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            {t('profile.gameRankings')}
          </h4>
          <div className="space-y-1.5">
            {userProfile.game_rankings.map((ranking: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-dark-200/60 border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {ranking?.game_name || t('profile.unknownGame')}
                  </span>
                  {ranking?.rank && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      #{ranking.rank}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {ranking?.wins || 0}W - {ranking?.losses || 0}L
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: theme.colors.primary }}
                  >
                    {ranking?.elo_rating || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aim Trainer Best Score */}
      {bestAimScore !== null && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: `${theme.colors.primary}08`,
            borderColor: `${theme.colors.primary}20`
          }}
        >
          <Crosshair className="h-4 w-4 flex-shrink-0" style={{ color: theme.colors.primary }} />
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.aimTrainerScores')}</span>
          <span className="ml-auto text-sm font-bold" style={{ color: theme.colors.primary }}>
            {bestAimScore.toLocaleString()} {t('profile.points')}
          </span>
        </div>
      )}
    </div>
  );
};

interface TournamentsTabProps {
  userProfile: any;
  theme: ReturnType<typeof getGameTheme>;
  t: (key: string, defaultValue?: string) => string;
}

const TournamentsTab: React.FC<TournamentsTabProps> = ({ userProfile, theme, t }) => {
  return (
    <div className="space-y-5">
      {/* Tournament Stats Grid */}
      {userProfile?.tournament_stats && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'total', value: userProfile.tournament_stats.total || 0, color: theme.colors.primary },
            { key: 'upcoming', value: userProfile.tournament_stats.upcoming || 0, color: '#f59e0b' },
            { key: 'ongoing', value: userProfile.tournament_stats.ongoing || 0, color: '#ef4444' },
            { key: 'completed', value: userProfile.tournament_stats.completed || 0, color: '#22c55e' },
          ].map((stat) => (
            <div
              key={stat.key}
              className="p-3 rounded-lg text-center bg-gray-50 dark:bg-dark-200/60 border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="text-xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">
                {t(`profile.${stat.key}`)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Tournaments - Max 2 */}
      {userProfile?.tournament_registrations?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
            {t('profile.recentTournaments')}
          </h4>
          <div className="space-y-2">
            {userProfile.tournament_registrations.slice(0, 2).map((registration: any) => (
              <div
                key={registration?.id || Math.random()}
                className="flex items-center justify-between px-3 py-3 rounded-lg bg-gray-50 dark:bg-dark-200/60 border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {registration?.tournaments?.title || t('profile.unknownTournament')}
                  </h5>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <Calendar className="h-3 w-3 mr-1" />
                    {registration?.tournaments?.start_date && formatDate(registration.tournaments.start_date)}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${
                  registration?.status === 'approved' ? 'bg-success-500/15 text-success-400' :
                  registration?.status === 'pending' ? 'bg-warning-500/15 text-warning-400' :
                  'bg-error-500/15 text-error-400'
                }`}>
                  {registration?.status === 'approved' ? t('profile.approved') :
                   registration?.status === 'pending' ? t('profile.pending') :
                   t('profile.rejected')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!userProfile?.tournament_stats && !userProfile?.tournament_registrations?.length && (
        <div className="text-center py-10">
          <Trophy className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('profile.noGameStats')}</p>
        </div>
      )}
    </div>
  );
};

export default PlayerProfileModal;
