import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Info,
  MapPin,
  Phone,
  MessageCircle,
  Check,
  AlertCircle,
} from 'lucide-react';
import { countries } from '../../../utils/countries';
import { GameTheme } from '../../../utils/gameThemes';

interface ProfileInfoTabProps {
  username: string;
  setUsername: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  discordHandle: string;
  setDiscordHandle: (val: string) => void;
  twitterHandle: string;
  setTwitterHandle: (val: string) => void;
  country: string;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  isLoading: boolean;
  theme: GameTheme;
  maxBioLength: number;
}

const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  username,
  setUsername,
  bio,
  setBio,
  discordHandle,
  setDiscordHandle,
  twitterHandle,
  setTwitterHandle,
  country,
  phoneNumber,
  setPhoneNumber,
  isLoading,
  theme,
  maxBioLength,
}) => {
  const { t } = useTranslation();
  const bioCharacterCount = bio.length;
  const bioPercentage = (bioCharacterCount / maxBioLength) * 100;

  const inputFocusStyle = (color: string) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.boxShadow = `0 0 0 2px ${color}40`;
      e.target.style.borderColor = color;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.boxShadow = 'none';
      e.target.style.borderColor = '';
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
        <div className="p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <Info className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <h2 className="font-heading font-semibold text-lg text-white">
              {t('profile.personalInformation')}
            </h2>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              {t('profile.username')}
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white transition-all focus:outline-none focus:border-transparent"
              style={{ boxShadow: 'none' }}
              {...inputFocusStyle(theme.colors.primary)}
              required
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
              {t('profile.biography')}
            </label>
            <div className="relative">
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, maxBioLength))}
                className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white transition-all focus:outline-none min-h-[120px] resize-none"
                placeholder={t('profile.tellUsAboutYou')}
                style={{ boxShadow: 'none' }}
                {...inputFocusStyle(theme.colors.primary)}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className={`text-xs ${bioPercentage > 90 ? 'text-warning-400' : 'text-gray-500'}`}>
                  {bioCharacterCount}/{maxBioLength}
                </span>
              </div>
            </div>
            <div className="mt-1.5 h-1 bg-dark-300 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${bioPercentage}%`,
                  backgroundColor: bioPercentage > 90 ? '#f59e0b' : theme.colors.primary
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
        <div className="p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <h2 className="font-heading font-semibold text-lg text-white">
              {t('profile.socialConnections')}
            </h2>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="discordHandle" className="block text-sm font-medium text-gray-300 mb-2">
                {t('profile.discordHandle')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  id="discordHandle"
                  value={discordHandle}
                  onChange={(e) => setDiscordHandle(e.target.value)}
                  className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl pl-14 pr-4 py-3 text-white transition-all focus:outline-none"
                  placeholder="username"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px #5865F240'; e.target.style.borderColor = '#5865F2'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = ''; }}
                />
                {discordHandle && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4 text-success-400" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="twitterHandle" className="block text-sm font-medium text-gray-300 mb-2">
                {t('profile.twitchHandle')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#9146FF]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  id="twitterHandle"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl pl-14 pr-4 py-3 text-white transition-all focus:outline-none"
                  placeholder="your_twitch_username"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px #9146FF40'; e.target.style.borderColor = '#9146FF'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = ''; }}
                />
                {twitterHandle && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4 text-success-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
        <div className="p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <MapPin className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-white">
                {t('profile.requiredInformation')}
              </h2>
              <p className="text-xs text-gray-400">
                {t('profile.importantInfoRequiredForTournaments')}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="p-4 rounded-xl bg-info-500/10 border border-info-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-info-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-info-300">
                {t('profile.tournamentInfoNote')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                {t('profile.countryOfResidenceRequired')} <span className="text-error-400">*</span>
              </label>
              <div className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white flex items-center">
                {country ? (
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{countries.find((c) => c.code === country)?.flag}</span>
                    {countries.find((c) => c.code === country)?.name || country}
                  </span>
                ) : (
                  <span className="text-gray-500">{t('profile.notDefined')}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {t('profile.countryDetectedAutomatically')}
              </p>
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                {t('profile.phoneNumberOptional')}{' '}
                <span className="text-gray-500 text-xs">({t('profile.optional')})</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-700/30 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl pl-14 pr-4 py-3 text-white transition-all focus:outline-none"
                  placeholder="+33 6 12 34 56 78"
                  disabled={isLoading}
                  style={{ boxShadow: 'none' }}
                  {...inputFocusStyle(theme.colors.primary)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {t('profile.internationalFormatRecommended')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoTab;
