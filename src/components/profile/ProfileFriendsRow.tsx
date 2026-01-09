import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, UserPlus, ChevronRight, User } from 'lucide-react';
import { UserRelationship } from '../../types';
import { GameTheme } from '../../utils/gameThemes';

interface ProfileFriendsRowProps {
  friends: UserRelationship[];
  theme: GameTheme;
  isLoading?: boolean;
  maxVisible?: number;
}

const ProfileFriendsRow: React.FC<ProfileFriendsRowProps> = ({
  friends,
  theme,
  isLoading = false,
  maxVisible = 8
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-dark-100">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-24 bg-gray-200 dark:bg-dark-300 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-dark-300 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-12 h-12 bg-gray-200 dark:bg-dark-300 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const visibleFriends = friends.slice(0, maxVisible);
  const remainingCount = Math.max(0, friends.length - maxVisible);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-dark-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: theme.colors.primary }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('profile.friends', 'Friends')}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({friends.length})
          </span>
        </div>
        <Link
          to="/profile/friends"
          className="text-sm font-medium flex items-center gap-1"
          style={{ color: theme.colors.primary }}
        >
          {t('profile.viewAll', 'View All')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-6">
          <div
            className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}15` }}
          >
            <Users className="w-6 h-6" style={{ color: theme.colors.primary }} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {t('profile.noFriendsYet', 'No friends yet')}
          </p>
          <Link
            to="/profile/friends"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: `${theme.colors.primary}15`,
              color: theme.colors.primary
            }}
          >
            <UserPlus className="w-4 h-4" />
            {t('profile.addFriends', 'Add Friends')}
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            {visibleFriends.map((friend) => (
              <Link
                key={friend.id}
                to={`/profile/${friend.related_user?.id}`}
                className="relative group"
              >
                <div
                  className="w-11 h-11 rounded-full border-2 border-white dark:border-dark-100 overflow-hidden transition-transform hover:scale-110 hover:z-10"
                  style={{
                    boxShadow: `0 2px 8px ${theme.colors.primary}20`
                  }}
                >
                  {friend.related_user?.avatar_url ? (
                    <img
                      src={friend.related_user.avatar_url}
                      alt={friend.related_user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      {friend.related_user?.username?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  {friend.related_user?.username}
                </div>
              </Link>
            ))}
          </div>

          {remainingCount > 0 && (
            <Link
              to="/profile/friends"
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              +{remainingCount}
            </Link>
          )}

          <Link
            to="/profile/friends"
            className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-dashed transition-colors ml-1"
            style={{
              borderColor: `${theme.colors.primary}40`,
              color: theme.colors.primary
            }}
          >
            <UserPlus className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProfileFriendsRow;
