import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Settings,
  Users,
  Edit3,
  Trophy,
  Target,
  UserPlus,
  MapPin,
  Calendar,
  Eye
} from 'lucide-react';
import { User as UserType } from '../../types';
import { GameTheme } from '../../utils/gameThemes';
import PlayerLevelBadge from './PlayerLevelBadge';

interface ProfileHeroBannerProps {
  user: UserType | null;
  theme: GameTheme;
  primaryGameName: string | null;
  xp: number;
  stats: {
    tournamentsPlayed: number;
    winRate: number;
    friendsCount: number;
    connectedAccounts: number;
  };
  onPreviewClick?: () => void;
}

const ProfileHeroBanner: React.FC<ProfileHeroBannerProps> = ({
  user,
  theme,
  primaryGameName,
  xp,
  stats,
  onPreviewClick
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}30 0%, ${theme.colors.secondary}20 50%, ${theme.colors.primary}15 100%)`
        }}
      />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            ${theme.colors.primary}20 10px,
            ${theme.colors.primary}20 20px
          )`
        }}
      />

      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: theme.colors.primary }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: theme.colors.secondary }}
      />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex items-start gap-5">
            <div
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden flex-shrink-0"
              style={{
                boxShadow: `0 0 30px ${theme.colors.primary}40`,
                border: `3px solid ${theme.colors.primary}60`
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}30` }}
                >
                  <User className="w-12 h-12 text-white/60" />
                </div>
              )}

              <div
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 0 10px ${theme.colors.primary}`
                }}
              >
                {Math.floor(xp / 100)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-heading font-bold text-2xl md:text-3xl text-white truncate">
                  {user?.username || 'Player'}
                </h1>
                {primaryGameName && (
                  <span
                    className="hidden md:inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${theme.colors.primary}30`,
                      color: theme.colors.primary,
                      border: `1px solid ${theme.colors.primary}40`
                    }}
                  >
                    {primaryGameName}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-2">
                {user?.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.country}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('profile.memberSince', { date: formatDate(user?.created_at) })}
                </span>
              </div>

              {user?.bio && (
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-3">
                  {user.bio}
                </p>
              )}

              <div className="hidden md:block">
                <PlayerLevelBadge xp={xp} theme={theme} compact />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <Link
              to="/profile/edit"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.text,
                boxShadow: `0 4px 15px ${theme.colors.primary}40`
              }}
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('profile.editProfile')}</span>
            </Link>

            <button
              onClick={onPreviewClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{t('profile.preview', 'Preview')}</span>
            </button>

            <Link
              to="/profile/friends"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t('profile.friends')}</span>
            </Link>

            <Link
              to="/profile/settings"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatCard
            icon={Trophy}
            value={stats.tournamentsPlayed}
            label={t('profile.tournaments', 'Tournaments')}
            theme={theme}
          />
          <StatCard
            icon={Target}
            value={`${stats.winRate}%`}
            label={t('profile.winRate', 'Win Rate')}
            theme={theme}
          />
          <StatCard
            icon={UserPlus}
            value={stats.friendsCount}
            label={t('profile.friends', 'Friends')}
            theme={theme}
          />
          <StatCard
            icon={User}
            value={stats.connectedAccounts}
            label={t('profile.accounts', 'Accounts')}
            theme={theme}
          />
        </div>

        <div className="md:hidden mt-4">
          <PlayerLevelBadge xp={xp} theme={theme} />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.FC<{ className?: string }>;
  value: number | string;
  label: string;
  theme: GameTheme;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, theme }) => {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 backdrop-blur-sm transition-transform hover:scale-105"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: `1px solid ${theme.colors.primary}20`
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${theme.colors.primary}25` }}
        >
          <Icon className="w-5 h-5" style={{ color: theme.colors.primary }} />
        </div>
        <div>
          <div className="text-xl font-bold text-white">{value}</div>
          <div className="text-xs text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeroBanner;
