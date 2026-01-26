import React, { useState } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Settings, UserPlus, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

// Lazy load heavy modals
const GamingStatsModal = React.lazy(() => import('./GamingStatsModal'));

interface ProfileHeaderProps {
  user: User;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const { t } = useTranslation();
  const [showGamingStatsModal, setShowGamingStatsModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowGamingStatsModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('gaming.gamingStatistics')}
            </button>
            <Link
              to="/profile/edit"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Edit size={20} />
            </Link>
            <Link
              to="/settings"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>
      </div>

      {showGamingStatsModal && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8">
              <LoadingSpinner size="lg" text={t('gaming.loadingStatistics')} />
            </div>
          </div>
        }>
          <GamingStatsModal
            isOpen={showGamingStatsModal}
            onClose={() => setShowGamingStatsModal(false)}
            user={user}
          />
        </Suspense>
      )}
    </>
  );
};

export default ProfileHeader;
