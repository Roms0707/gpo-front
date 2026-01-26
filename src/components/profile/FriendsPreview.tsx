import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, User } from 'lucide-react';
import { UserRelationship } from '../../types';

interface FriendsPreviewProps {
  friends: UserRelationship[];
  isLoading: boolean;
}

const FriendsPreview: React.FC<FriendsPreviewProps> = ({ friends, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-semibold text-xl flex items-center text-gray-900 dark:text-white">
          <Users className="h-5 w-5 mr-2 text-primary-500" />
          {t('friends.title')}
        </h2>
        <Link to="/profile/friends" className="text-primary-500 hover:text-primary-400 text-sm">
          {t('friends.viewAllFriends')}
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : friends.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {friends.slice(0, 4).map(friend => (
            <div key={friend.id} className="bg-gray-100 dark:bg-dark-200 p-3 rounded-lg text-center hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mx-auto mb-2">
                {friend.related_user?.avatar_url ? (
                  <img
                    src={friend.related_user.avatar_url}
                    alt={friend.related_user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400 m-4" />
                )}
              </div>
              <p className="font-medium text-sm truncate text-gray-900 dark:text-white">{friend.related_user?.username}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">{t('friends.noFriends')}</p>
          <Link to="/profile/friends" className="text-primary-500 hover:text-primary-400 text-sm">
            {t('friends.addFriends')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default FriendsPreview;
