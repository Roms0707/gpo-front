import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, ChevronRight, LinkIcon } from 'lucide-react';
import { User } from '../../types';
import { GameTheme } from '../../utils/gameThemes';

interface ProfileSocialLinksCardProps {
  user: User | null;
  theme: GameTheme;
}

const ProfileSocialLinksCard: React.FC<ProfileSocialLinksCardProps> = ({
  user,
  theme
}) => {
  const { t } = useTranslation();

  const discordHandle = user?.discord_handle;
  const twitchHandle = user?.twitter_handle;
  const hasSocialLinks = discordHandle || twitchHandle;

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{
        borderColor: `${theme.colors.primary}25`,
        backgroundColor: `${theme.colors.primary}05`
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}15` }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('profile.socialConnections', 'Social Connections')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('profile.socialDescription', 'Your linked social accounts')}
              </p>
            </div>
          </div>
          <Link
            to="/profile/edit"
            className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: theme.colors.primary }}
          >
            {t('profile.edit', 'Edit')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {hasSocialLinks ? (
          <div className="space-y-2.5">
            {discordHandle && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/8">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#5865F2]/15 flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                    {t('profile.discord', 'Discord')}
                  </p>
                  <p className="text-sm font-medium text-white truncate">{discordHandle}</p>
                </div>
              </div>
            )}

            {twitchHandle && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/8">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#9146FF]/15 flex-shrink-0">
                  <svg className="text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                    {t('profile.twitch', 'Twitch')}
                  </p>
                  <p className="text-sm font-medium text-white truncate">{twitchHandle}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${theme.colors.primary}10` }}
            >
              <LinkIcon className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {t('profile.noSocialLinksYet', 'No social links added yet')}
            </p>
            <Link
              to="/profile/edit"
              className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: `${theme.colors.primary}15`,
                color: theme.colors.primary
              }}
            >
              {t('profile.addSocialLinks', 'Add Social Links')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSocialLinksCard;
