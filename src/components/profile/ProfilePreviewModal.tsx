import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  User,
  MapPin,
  Calendar,
  Trophy,
  Gamepad2,
  Eye,
  Info
} from 'lucide-react';
import { countries } from '../../utils/countries';
import { getGameTheme, GameTheme } from '../../utils/gameThemes';
import { Game, ProfileFrame, ProfileBadge } from '../../types';
import AvatarWithFrame from './AvatarWithFrame';
import ProfileModalFrame from './ProfileModalFrame';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  bio: string;
  avatarPreview: string | null;
  discordHandle: string;
  twitchHandle: string;
  country: string;
  selectedGame: Game | null;
  memberSince?: string;
  avatarFrame?: ProfileFrame | null;
  modalFrame?: ProfileFrame | null;
  badge?: ProfileBadge | null;
}

const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  isOpen,
  onClose,
  username,
  bio,
  avatarPreview,
  discordHandle,
  twitchHandle,
  country,
  selectedGame,
  memberSince,
  avatarFrame,
  modalFrame,
  badge
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'tournaments'>('profile');

  const theme: GameTheme = getGameTheme(selectedGame?.name || null);

  const getCountryName = (countryCode: string) => {
    const countryData = countries.find(c => c.code === countryCode);
    return countryData ? countryData.name : countryCode;
  };

  const getCountryFlag = (countryCode: string) => {
    const countryData = countries.find(c => c.code === countryCode);
    return countryData?.flag || '';
  };

  if (!isOpen) return null;

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <ProfileModalFrame
        frame={modalFrame}
        themeColor={theme.colors.primary}
        className="bg-dark-100 w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-50 shadow-2xl"
      >
        <div onClick={stopPropagation}>
          <div
            className="absolute top-0 left-0 right-0 py-2.5 px-4 flex items-center justify-center gap-2 z-10"
            style={{ backgroundColor: `${theme.colors.primary}20`, borderBottom: `1px solid ${theme.colors.primary}30` }}
          >
            <Eye className="w-4 h-4" style={{ color: theme.colors.primary }} />
            <span className="text-sm font-medium" style={{ color: theme.colors.primary }}>
              {t('profile.previewMode')}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              - {t('profile.howOthersSeeYou')}
            </span>
          </div>

          <div className="flex items-center justify-between p-6 pt-14 border-b border-gray-800">
            <h2 className="font-heading font-bold text-xl text-white">
              {t('profile.playerProfile')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-dark-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div
              className="p-6"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, ${theme.colors.secondary}10 50%, transparent 100%)`
              }}
            >
              <div className="flex items-start gap-5">
                <AvatarWithFrame
                  avatarUrl={avatarPreview}
                  username={username}
                  frame={avatarFrame}
                  badge={badge}
                  size="xl"
                  themeColor={theme.colors.primary}
                  className="flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-2xl text-white mb-1">
                  {username || t('profile.username')}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                  {country && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">{getCountryFlag(country)}</span>
                      {getCountryName(country)}
                    </span>
                  )}
                  {memberSince && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {t('profile.memberSince', { date: new Date(memberSince).toLocaleDateString() })}
                    </span>
                  )}
                </div>

                {selectedGame && (
                  <span
                    className="inline-flex px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${theme.colors.primary}25`,
                      color: theme.colors.primary,
                      border: `1px solid ${theme.colors.primary}30`
                    }}
                  >
                    <Gamepad2 className="w-3.5 h-3.5 mr-1.5" />
                    {selectedGame.name}
                  </span>
                )}
              </div>
            </div>

            {bio && (
              <div className="mt-4 p-4 rounded-xl bg-dark-200/50 border border-gray-700/50">
                <p className="text-gray-300 text-sm leading-relaxed">{bio}</p>
              </div>
            )}
          </div>

          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'border-b-2 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              style={{
                borderColor: activeTab === 'profile' ? theme.colors.primary : 'transparent',
                color: activeTab === 'profile' ? theme.colors.primary : undefined
              }}
            >
              <User className="h-4 w-4 inline mr-2" />
              {t('profile.profileTab')}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'border-b-2 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              style={{
                borderColor: activeTab === 'stats' ? theme.colors.primary : 'transparent',
                color: activeTab === 'stats' ? theme.colors.primary : undefined
              }}
            >
              <Trophy className="h-4 w-4 inline mr-2" />
              {t('profile.statisticsTab')}
            </button>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium transition-colors ${
                activeTab === 'tournaments'
                  ? 'border-b-2 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              style={{
                borderColor: activeTab === 'tournaments' ? theme.colors.primary : 'transparent',
                color: activeTab === 'tournaments' ? theme.colors.primary : undefined
              }}
            >
              <Gamepad2 className="h-4 w-4 inline mr-2" />
              {t('profile.tournamentsTab')}
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {(discordHandle || twitchHandle) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">{t('profile.socialLinks')}</h4>
                    <div className="space-y-2">
                      {discordHandle && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-200/50 border border-gray-700/50">
                          <div className="w-9 h-9 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t('profile.discord')}</p>
                            <p className="text-sm font-medium text-white">{discordHandle}</p>
                          </div>
                        </div>
                      )}
                      {twitchHandle && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-200/50 border border-gray-700/50">
                          <div className="w-9 h-9 rounded-lg bg-[#9146FF]/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t('profile.twitch')}</p>
                            <p className="text-sm font-medium text-white">{twitchHandle}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!discordHandle && !twitchHandle && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-dark-200 flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-500">{t('profile.noSocialLinksYet')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{ backgroundColor: `${theme.colors.primary}10`, border: `1px solid ${theme.colors.primary}20` }}
                >
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.colors.primary }} />
                  <p className="text-sm text-gray-400">
                    {t('profile.sampleDataNotice')}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-warning-500" />
                    {t('profile.gameRankings')}
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-dark-200/50 p-4 rounded-xl border border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">{selectedGame?.name || 'League of Legends'}</h5>
                          <div className="flex items-center text-sm text-gray-400 mt-1">
                            <Trophy className="h-4 w-4 text-warning-500 mr-1" />
                            <span>{t('profile.rankNumber', { rank: 42 })}</span>
                            <span className="ml-2 px-2 py-0.5 bg-primary-600/20 text-primary-400 rounded text-xs">
                              Gold II
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg" style={{ color: theme.colors.primary }}>1,247</div>
                          <div className="text-xs text-gray-500">{t('profile.elo')}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-center pt-3 border-t border-gray-700/50">
                        <div>
                          <div className="text-sm font-bold text-success-400">28</div>
                          <div className="text-xs text-gray-500">{t('profile.victories')}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-error-400">14</div>
                          <div className="text-xs text-gray-500">{t('profile.defeats')}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-info-400">67%</div>
                          <div className="text-xs text-gray-500">{t('profile.winRate')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div className="space-y-6">
                <div
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{ backgroundColor: `${theme.colors.primary}10`, border: `1px solid ${theme.colors.primary}20` }}
                >
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.colors.primary }} />
                  <p className="text-sm text-gray-400">
                    {t('profile.sampleDataNotice')}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-warning-500" />
                    {t('profile.tournamentStatistics')}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-dark-200/50 p-4 rounded-xl text-center border border-gray-700/50">
                      <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>12</div>
                      <div className="text-xs text-gray-500">{t('profile.total')}</div>
                    </div>
                    <div className="bg-dark-200/50 p-4 rounded-xl text-center border border-gray-700/50">
                      <div className="text-2xl font-bold text-warning-400">2</div>
                      <div className="text-xs text-gray-500">{t('profile.upcoming')}</div>
                    </div>
                    <div className="bg-dark-200/50 p-4 rounded-xl text-center border border-gray-700/50">
                      <div className="text-2xl font-bold text-error-400">1</div>
                      <div className="text-xs text-gray-500">{t('profile.ongoing')}</div>
                    </div>
                    <div className="bg-dark-200/50 p-4 rounded-xl text-center border border-gray-700/50">
                      <div className="text-2xl font-bold text-success-400">9</div>
                      <div className="text-xs text-gray-500">{t('profile.completed')}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">{t('profile.recentTournaments')}</h4>
                  <div className="space-y-2">
                    <div className="bg-dark-200/50 p-4 rounded-xl border border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Weekly Championship</h5>
                          <div className="flex items-center text-sm text-gray-400 mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            Jan 15, 2025
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-success-500/20 text-success-400">
                          {t('profile.approved')}
                        </span>
                      </div>
                    </div>
                    <div className="bg-dark-200/50 p-4 rounded-xl border border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Pro League Season 3</h5>
                          <div className="flex items-center text-sm text-gray-400 mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            Jan 20, 2025
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-warning-500/20 text-warning-400">
                          {t('profile.pending')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </ProfileModalFrame>
    </div>
  );
};

export default ProfilePreviewModal;
