import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, MapPin, Calendar, Trophy, Gamepad2, Shield, CheckCircle, XCircle, Loader, AlertTriangle, UserPlus, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchUserProfile, sendFriendRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';
import { countries } from '../../utils/countries';
import { UserProfileCustomization, ProfileFrame, ProfileBadge } from '../../types';
import { fetchUserCustomization } from '../../services/profileCustomizationService';
import AvatarWithFrame from '../profile/AvatarWithFrame';
import ProfileModalFrame from '../profile/ProfileModalFrame';
import toast from 'react-hot-toast';
import ChatModal from '../chat/ChatModal';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'tournaments'>('profile');
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [userCustomization, setUserCustomization] = useState<UserProfileCustomization | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isOpen || !userId) {
        if (isOpen && !userId) {
          setError(t('profile.invalidUserId'));
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setUserProfile(null);
        setUserCustomization(null);

        console.log('[PlayerProfileModal] Loading profile for user:', userId);
        const [profileData, customizationData] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserCustomization(userId).catch(() => null)
        ]);

        if (!profileData) {
          throw new Error(t('profile.noProfileData'));
        }

        console.log('[PlayerProfileModal] Profile data loaded:', profileData);
        setUserProfile(profileData);
        setUserCustomization(customizationData);
      } catch (error: any) {
        console.error('[PlayerProfileModal] Error loading user profile:', error);
        const errorMessage = error?.message || t('profile.errorLoadingProfile');
        setError(errorMessage);
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
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(t('profile.friendRequestError'));
    } finally {
      setIsSendingFriendRequest(false);
    }
  };

  // Add/remove modal-open class to body
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Prevent clicks inside the modal from closing it
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Get country name from country code
  const getCountryName = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div className="fixed inset-0 bg-black/75 z-49" onClick={onClose}></div>

        <ProfileModalFrame
          frame={userCustomization?.modal_frame}
          themeColor="#3b82f6"
          className="bg-white dark:bg-dark-100 w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-50"
        >
          <div onClick={stopPropagation}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                {t('profile.playerProfile')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label={t('profile.close')}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader className="h-10 w-10 text-primary-500 animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">{t('profile.loadingProfile')}</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <AlertTriangle className="h-12 w-12 text-error-500 mb-4" />
                  <p className="text-error-600 dark:text-error-400 font-medium mb-2">{t('profile.error')}</p>
                  <p className="text-gray-600 dark:text-gray-400">{error}</p>
                </div>
              ) : userProfile ? (
                <div>
                  <div className="bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-600/20 dark:to-secondary-600/20 p-6">
                    <div className="flex items-center">
                      <AvatarWithFrame
                        avatarUrl={userProfile?.avatar_url}
                        username={userProfile?.username}
                        frame={userCustomization?.avatar_frame}
                        badge={userCustomization?.avatar_badge}
                        size="lg"
                        themeColor="#3b82f6"
                        className="mr-4"
                      />
                    <div>
                      <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white">{userProfile?.username || t('profile.unknownUser')}</h3>
                      <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        {userProfile?.country && (
                          <>
                            <MapPin className="h-4 w-4 mr-1" />
                            {getCountryName(userProfile.country)}
                          </>
                        )}
                      </div>
                      {userProfile?.created_at && (
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {t('profile.memberSince', { date: formatDate(userProfile.created_at) })}
                        </div>
                      )}
                    </div>
                  </div>

                  {userProfile?.bio && (
                    <div className="mt-4 p-3 bg-white/50 dark:bg-dark-100/50 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300">{userProfile.bio}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {currentUser && currentUser.id !== userId && (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex space-x-3">
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={isSendingFriendRequest || friendRequestSent}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {isSendingFriendRequest ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          {t('profile.sendingRequest')}
                        </>
                      ) : friendRequestSent ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('profile.requestSent')}
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          {t('profile.addAsFriend')}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowChatModal(true)}
                      className="bg-secondary-600 hover:bg-secondary-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t('profile.message')}
                    </button>
                  </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${
                      activeTab === 'profile'
                        ? 'text-primary-500 border-b-2 border-primary-500'
                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    {t('profile.profileTab')}
                  </button>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${
                      activeTab === 'stats'
                        ? 'text-primary-500 border-b-2 border-primary-500'
                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Trophy className="h-4 w-4 inline mr-2" />
                    {t('profile.statisticsTab')}
                  </button>
                  <button
                    onClick={() => setActiveTab('tournaments')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${
                      activeTab === 'tournaments'
                        ? 'text-primary-500 border-b-2 border-primary-500'
                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Gamepad2 className="h-4 w-4 inline mr-2" />
                    {t('profile.tournamentsTab')}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      {/* Gaming Accounts */}
                      {userProfile?.gaming_accounts && userProfile.gaming_accounts.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium mb-4 flex items-center text-gray-900 dark:text-white">
                            <Gamepad2 className="h-5 w-5 text-primary-500 mr-2" />
                            {t('profile.gameAccounts')}
                          </h4>
                          <div className="space-y-3">
                            {userProfile.gaming_accounts.map((account: any, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {account?.is_validated && account?.validation_data ? (
                                        account.validation_data?.personaname ||
                                        account.validation_data?.account?.name ||
                                        account?.value || 'N/A'
                                      ) : (
                                        account?.value || 'N/A'
                                      )}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      ({account?.game_publisher_ids?.games?.name || t('profile.unknownGame')})
                                    </span>
                                  </div>

                                  <div className="flex items-center">
                                    {account?.is_validated ? (
                                      <CheckCircle className="h-4 w-4 text-success-400" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social Links */}
                      {(userProfile?.discord_handle || userProfile?.twitter_handle) && (
                        <div>
                          <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">{t('profile.socialLinks')}</h4>
                          <div className="space-y-2">
                            {userProfile?.discord_handle && (
                              <div className="flex items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{t('profile.discord')}:</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{userProfile?.discord_handle}</span>
                              </div>
                            )}
                            {userProfile?.twitter_handle && (
                              <div className="flex items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{t('profile.twitch')}:</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{userProfile?.twitter_handle}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats Tab */}
                  {activeTab === 'stats' && (
                    <div className="space-y-6">
                      {/* Game Rankings */}
                      {userProfile?.game_rankings && userProfile.game_rankings.length > 0 ? (
                        <div>
                          <h4 className="text-lg font-medium mb-4 flex items-center text-gray-900 dark:text-white">
                            <Trophy className="h-5 w-5 text-warning-500 mr-2" />
                            {t('profile.gameRankings')}
                          </h4>
                          <div className="space-y-4">
                            {userProfile.game_rankings.map((ranking: any, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900 dark:text-white">{ranking?.game_name || t('profile.unknownGame')}</h5>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      <Trophy className="h-4 w-4 text-warning-500 mr-1" />
                                      <span>{ranking?.rank ? t('profile.rankNumber', { rank: ranking.rank }) : 'N/A'}</span>
                                      {ranking?.tier && (
                                        <span className="ml-2 px-2 py-1 bg-primary-600/10 text-primary-600 dark:text-primary-400 rounded text-xs">
                                          {ranking.tier}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-lg text-primary-400">{ranking?.elo_rating || 0}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('profile.elo')}</div>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <div className="text-sm font-bold text-success-400">{ranking?.wins || 0}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('profile.victories')}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-error-400">{ranking?.losses || 0}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('profile.defeats')}</div>
                                  </div>
                                  <div>
                                    <div className={`text-sm font-bold ${
                                      (ranking?.win_rate || 0) >= 70 ? 'text-success-400' :
                                      (ranking?.win_rate || 0) >= 50 ? 'text-info-400' :
                                      'text-error-400'
                                    }`}>
                                      {ranking?.win_rate || 0}%
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('profile.winRate')}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">{t('profile.noGameStats')}</p>
                        </div>
                      )}

                      {/* Aim Trainer Scores */}
                      {userProfile?.aim_trainer_scores && userProfile.aim_trainer_scores.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium mb-4 flex items-center text-gray-900 dark:text-white">
                            <Shield className="h-5 w-5 text-primary-500 mr-2" />
                            {t('profile.aimTrainerScores')}
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {userProfile.aim_trainer_scores.slice(0, 10).map((score: any, index: number) => (
                              <div key={score?.id || index} className="bg-gray-50 dark:bg-dark-200 p-3 rounded-lg flex items-center justify-between border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-500 dark:text-gray-400 mr-3">#{index + 1}</span>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{score?.score?.toLocaleString() || 0} {t('profile.points')}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {score?.created_at ? new Date(score.created_at).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tournaments Tab */}
                  {activeTab === 'tournaments' && (
                    <div className="space-y-6">
                      {/* Tournament Stats */}
                      {userProfile?.tournament_stats && (
                        <div>
                          <h4 className="text-lg font-medium mb-4 flex items-center text-gray-900 dark:text-white">
                            <Trophy className="h-5 w-5 text-warning-500 mr-2" />
                            {t('profile.tournamentStatistics')}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                              <div className="text-2xl font-bold text-primary-400">{userProfile?.tournament_stats?.total || 0}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.total')}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                              <div className="text-2xl font-bold text-warning-400">{userProfile?.tournament_stats?.upcoming || 0}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.upcoming')}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                              <div className="text-2xl font-bold text-error-400">{userProfile?.tournament_stats?.ongoing || 0}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.ongoing')}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                              <div className="text-2xl font-bold text-success-400">{userProfile?.tournament_stats?.completed || 0}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.completed')}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recent Tournament Registrations */}
                      {userProfile?.tournament_registrations && userProfile.tournament_registrations.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">{t('profile.recentTournaments')}</h4>
                          <div className="space-y-3">
                            {userProfile.tournament_registrations.slice(0, 5).map((registration: any) => (
                              <div key={registration?.id || Math.random()} className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900 dark:text-white">{registration?.tournaments?.title || t('profile.unknownTournament')}</h5>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {registration?.tournaments?.start_date && formatDate(registration.tournaments.start_date)}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      registration?.status === 'approved' ? 'bg-success-500/20 text-success-400' :
                                      registration?.status === 'pending' ? 'bg-warning-500/20 text-warning-400' :
                                      'bg-error-500/20 text-error-400'
                                    }`}>
                                      {registration?.status === 'approved' ? t('profile.approved') :
                                       registration?.status === 'pending' ? t('profile.pending') :
                                       t('profile.rejected')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12">
                <User className="h-16 w-16 text-gray-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('profile.noInformationAvailable')}</p>
              </div>
            )}
          </div>
          </div>
        </ProfileModalFrame>
      </div>

      {/* Chat Modal */}
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

export default PlayerProfileModal;
