import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatButton from '../chat/ChatButton';
import CompleteProfileModal from '../profile/CompleteProfileModal';
import SubscriptionExpiredModal from '../ui/SubscriptionExpiredModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const { showSubscriptionModal, setShowSubscriptionModal, subscriptionRedirectUrl } = useSubscription();

  const needsProfileCompletion = user && user.is_profile_completed === false;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white transition-colors duration-200 overflow-x-hidden w-full">
      <Header />
      <main id="main-content" className="flex-grow w-full overflow-x-hidden pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />

      {/* Chat Button - Only show for logged in users */}
      {user && <ChatButton />}

      {/* Complete Profile Modal - Show for users who haven't completed their profile */}
      {needsProfileCompletion && (
        <CompleteProfileModal
          isOpen={true}
          currentUsername={user.username}
          currentAvatarUrl={user.avatar_url}
          currentBio={user.bio}
          userId={user.id}
        />
      )}

      {/* Subscription Expired Modal - Show when Kliento user's subscription is not active */}
      <SubscriptionExpiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        redirectUrl={subscriptionRedirectUrl}
      />
    </div>
  );
};

export default Layout;