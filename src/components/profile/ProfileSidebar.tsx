import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Gamepad2,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Plus,
  Globe,
  ChevronDown,
  BarChart3,
  Shield,
  Eye,
  EyeOff,
  Compass,
  Settings,
  MessageSquare
} from 'lucide-react';
import { GameTheme, getGameTheme } from '../../utils/gameThemes';
import LanguageSwitcher from '../ui/LanguageSwitcher';

interface GamingAccount {
  id: string;
  value: string;
  is_validated?: boolean;
  game_publisher_ids?: {
    label?: string;
    games?: {
      id: string;
      name: string;
    };
  };
}

interface PlayerRanking {
  id: string;
  elo_rating: number;
  wins: number;
  losses: number;
  rank_tier?: string;
  games?: {
    id: string;
    name: string;
  };
}

interface ProfileSidebarProps {
  gamingAccounts: GamingAccount[];
  playerRankings?: PlayerRanking[];
  theme: GameTheme;
  isProfilePublic: boolean;
  isUpdatingVisibility: boolean;
  onVisibilityToggle: () => void;
  ticketCount?: number;
  isLoading?: boolean;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  gamingAccounts,
  playerRankings = [],
  theme,
  isProfilePublic,
  isUpdatingVisibility,
  onVisibilityToggle,
  ticketCount = 0,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 dark:bg-dark-300 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {playerRankings.length > 0 && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: `${theme.colors.primary}30` }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: `${theme.colors.primary}10` }}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('profile.gameStats', 'Game Stats')}
              </h3>
            </div>
            <Link
              to="/profile/gaming-stats"
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: theme.colors.primary }}
            >
              {t('profile.viewAll', 'View All')}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-3 space-y-2 bg-white dark:bg-dark-100">
            {playerRankings.slice(0, 3).map((ranking) => {
              const gameTheme = getGameTheme(ranking.games?.name);
              const winRate = ranking.wins + ranking.losses > 0
                ? Math.round((ranking.wins / (ranking.wins + ranking.losses)) * 100)
                : 0;

              return (
                <div
                  key={ranking.id}
                  className="flex items-center gap-3 p-2 rounded-xl"
                  style={{ backgroundColor: `${gameTheme.colors.primary}08` }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${gameTheme.colors.primary}20` }}
                  >
                    <Gamepad2 className="w-5 h-5" style={{ color: gameTheme.colors.primary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {ranking.games?.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{ranking.elo_rating} ELO</span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span className="text-green-500">{winRate}% WR</span>
                    </div>
                  </div>
                  {ranking.rank_tier && (
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${gameTheme.colors.primary}20`,
                        color: gameTheme.colors.primary
                      }}
                    >
                      {ranking.rank_tier}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: `${theme.colors.primary}30` }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: `${theme.colors.primary}10` }}
        >
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" style={{ color: theme.colors.primary }} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('profile.connectedAccounts', 'Connected Accounts')}
            </h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {gamingAccounts.length} {t('profile.linked', 'linked')}
          </span>
        </div>

        <div className="p-3 space-y-2 bg-white dark:bg-dark-100">
          {gamingAccounts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {t('profile.noAccountsLinked', 'No gaming accounts linked')}
              </p>
              <Link
                to="/profile/settings"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: `${theme.colors.primary}15`,
                  color: theme.colors.primary
                }}
              >
                <Plus className="w-4 h-4" />
                {t('profile.linkAccount', 'Link Account')}
              </Link>
            </div>
          ) : (
            <>
              {gamingAccounts.slice(0, 4).map((account) => {
                const gameName = account.game_publisher_ids?.games?.name;
                const gameTheme = getGameTheme(gameName);

                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 dark:border-gray-800"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${gameTheme.colors.primary}15` }}
                    >
                      <Gamepad2 className="w-4 h-4" style={{ color: gameTheme.colors.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {account.value}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {gameName || account.game_publisher_ids?.label}
                      </p>
                    </div>
                    {account.is_validated ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}

              {gamingAccounts.length > 4 && (
                <Link
                  to="/profile/settings"
                  className="block text-center text-sm py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  +{gamingAccounts.length - 4} {t('profile.more', 'more')}
                </Link>
              )}

              <Link
                to="/profile/settings"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('profile.addAccount', 'Add Account')}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-dark-100">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
          <Settings className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('profile.quickSettings', 'Quick Settings')}
          </h3>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <button
            onClick={() => toggleSection('visibility')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('profile.visibility', 'Profile Visibility')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isProfilePublic
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {isProfilePublic ? t('profile.public', 'Public') : t('profile.private', 'Private')}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'visibility' ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {expandedSection === 'visibility' && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-200">
              <button
                onClick={onVisibilityToggle}
                disabled={isUpdatingVisibility}
                className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-dark-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isProfilePublic ? (
                    <Eye className="w-5 h-5 text-green-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {isProfilePublic ? t('profile.publicProfile', 'Public Profile') : t('profile.privateProfile', 'Private Profile')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isProfilePublic
                        ? t('profile.publicDesc', 'Others can view your profile')
                        : t('profile.privateDesc', 'Only you can view your profile')}
                    </p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${isProfilePublic ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${isProfilePublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          )}

          <button
            onClick={() => toggleSection('language')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('profile.language', 'Language')}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'language' ? 'rotate-180' : ''}`} />
          </button>

          {expandedSection === 'language' && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-200">
              <LanguageSwitcher />
            </div>
          )}

          <Link
            to="/profile/guided-tours"
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('profile.guidedTours', 'Guided Tours')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <Link
            to="/profile/support"
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('profile.supportTickets', 'Support Tickets')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {ticketCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {ticketCount}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
