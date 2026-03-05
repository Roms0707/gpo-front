import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Settings,
  Edit3,
  Trophy,
  Target,
  Star,
  Eye,
  Camera,
  Calendar
} from 'lucide-react';
import { User as UserType } from '../../types';
import { GameTheme } from '../../utils/gameThemes';

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

  const level = Math.floor(xp / 100);

  return (
    <div className="relative overflow-hidden">
      {user?.banner_url ? (
        <img
          src={user.banner_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}40 0%, ${theme.colors.secondary}30 50%, ${theme.colors.primary}20 100%)`
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/70 to-gray-900/95" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, ${theme.colors.primary}20 10px, ${theme.colors.primary}20 20px)`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-end gap-2 p-4">
          <Link
            to="/profile/edit"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all border border-white/10"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('profile.editProfile')}</span>
          </Link>
          <button
            onClick={onPreviewClick}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all border border-white/10"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <Link
            to="/profile/settings"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all border border-white/10"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="flex flex-col items-center relative">
            <div className="absolute top-0 right-0">
              <Link
                to="/profile/edit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60 transition-all border border-white/10"
              >
                <Camera className="w-3 h-3" />
                {t('profile.changeBanner', 'Change Banner')}
              </Link>
            </div>
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-gray-900"
              style={{
                boxShadow: `0 0 30px ${theme.colors.primary}30`
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
            </div>
            <Link
              to="/profile/edit"
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 border-2 border-gray-900 hover:bg-gray-700 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-white/80" />
            </Link>
          </div>

          <div className="mt-3 text-center">
            {primaryGameName && (
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold mb-1"
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  color: theme.colors.primary
                }}
              >
                {primaryGameName}
              </span>
            )}
            {!primaryGameName && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold mb-1 bg-white/10 text-gray-400">
                {t('profile.player', 'Player')}
              </span>
            )}
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
              {user?.username || 'Player'}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-1.5 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {t('profile.online', 'Online')}
              </span>
              <span className="text-gray-600">-</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {t('profile.memberSince', { date: formatDate(user?.created_at) })}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6 max-w-lg mx-auto w-full">
            <StatCard
              icon={Trophy}
              value={stats.tournamentsPlayed}
              label={t('profile.played', 'Played')}
              theme={theme}
            />
            <StatCard
              icon={Target}
              value={`${stats.winRate}%`}
              label={t('profile.winRate', 'Win Rate')}
              theme={theme}
            />
            <StatCard
              icon={Star}
              value={level}
              label={t('profile.reputation', 'Reputation')}
              theme={theme}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  value: number | string;
  label: string;
  theme: GameTheme;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, theme }) => {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-3 md:p-4 text-center transition-transform hover:scale-[1.03] backdrop-blur-sm"
      style={{
        backgroundColor: `${theme.colors.primary}15`,
        border: `1px solid ${theme.colors.primary}25`
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.colors.primary}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
        </div>
        <div className="text-left min-w-0">
          <div className="text-lg font-bold text-white leading-tight">{value}</div>
          <div className="text-[11px] text-gray-500 truncate">{label}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeroBanner;
