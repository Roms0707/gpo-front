import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { User, CreditCard as Edit, Users, Gamepad2, Globe } from 'lucide-react';
import { useProfileData } from '../hooks/useProfileData';
import { useProfileVisibility } from '../hooks/useProfileVisibility';
import ProfileVisibilityControl from '../components/profile/ProfileVisibilityControl';
import ProfileInformation from '../components/profile/ProfileInformation';
import FriendsPreview from '../components/profile/FriendsPreview';
import SupportTicketsPreview from '../components/profile/SupportTicketsPreview';
import TournamentSection from '../components/profile/TournamentSection';
import GamingAccountsSection from '../components/profile/GamingAccountsSection';
import GamingStatsPreview from '../components/profile/GamingStatsPreview';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import GuidedToursSection from '../components/profile/GuidedToursSection';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const {
    user,
    userProfile,
    registrations,
    friends,
    tickets,
    gamingAccounts,
    isLoading,
    isLoadingFriends,
    isLoadingTickets,
    error
  } = useProfileData();

  const {
    isProfilePublic,
    isUpdatingVisibility,
    handleVisibilityToggle
  } = useProfileVisibility();

  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-12 border-b border-gray-800">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-dark-200 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <h1 className="font-heading font-bold text-2xl mb-1">
                  {user?.username}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>

                <div className="flex space-x-3 mt-4">
                  <Link to="/profile/edit" className="inline-flex items-center text-sm bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg">
                    <Edit className="h-4 w-4 mr-1" />
                    {t('profile.editProfile')}
                  </Link>

                  <Link to="/profile/friends" className="inline-flex items-center text-sm bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg">
                    <Users className="h-4 w-4 mr-1" />
                    {t('profile.friends')}
                    {friends.length > 0 && (
                      <span className="ml-1 bg-primary-600 text-white text-xs px-1.5 rounded-full">
                        {friends.length}
                      </span>
                    )}
                  </Link>

                  <Link to="/profile/gaming-stats" className="inline-flex items-center text-sm bg-secondary-600 hover:bg-secondary-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                    <Gamepad2 className="h-4 w-4 mr-1" />
                    {t('profile.myStats')}
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6">
              <ProfileVisibilityControl
                isProfilePublic={isProfilePublic}
                isUpdatingVisibility={isUpdatingVisibility}
                onToggle={handleVisibilityToggle}
              />

              {/* Language Settings Section */}
              <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-primary-500" />
                    <div>
                      <h2 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
                        {t('profile.languageSettings')}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {t('profile.selectLanguage')}
                      </p>
                    </div>
                  </div>
                  <LanguageSwitcher />
                </div>
              </div>

              <GuidedToursSection />

              <ProfileInformation user={user} />

              <FriendsPreview friends={friends} isLoading={isLoadingFriends} />

              <SupportTicketsPreview tickets={tickets} isLoading={isLoadingTickets} />

              <TournamentSection
                registrations={registrations}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>

          <GamingAccountsSection
            userProfile={userProfile}
            gamingAccounts={gamingAccounts}
            isLoading={isLoading}
          />

          <GamingStatsPreview />
        </div>
      </div>

      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
      />
    </div>
  );
};

export default ProfilePage;