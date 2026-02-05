import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNavBar from '../navigation/MobileNavBar';
import ChatButton from '../chat/ChatButton';
import CompleteProfileModal from '../profile/CompleteProfileModal';
import SubscriptionExpiredModal from '../ui/SubscriptionExpiredModal';
import AccountSuspendedModal from '../ui/AccountSuspendedModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const {
    showSubscriptionModal,
    setShowSubscriptionModal,
    subscriptionRedirectUrl,
    showSuspendedModal,
    setShowSuspendedModal,
    refreshSubscription,
    subscriptionStatus,
  } = useSubscription();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const needsProfileCompletion = user && user.is_profile_completed === false;

  useEffect(() => {
    if (needsProfileCompletion) {
      setShowProfileModal(true);
    } else {
      setShowProfileModal(false);
    }
  }, [needsProfileCompletion]);

  const handleProfileModalClose = () => {
    setShowProfileModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white transition-colors duration-200 overflow-x-hidden w-full">
      <Header />
      <main id="main-content" className="flex-grow w-full overflow-x-hidden pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />

      {/* Mobile Navigation Bar */}
      <MobileNavBar user={user} />

      {/* Chat Button - Only show for logged in users */}
      {user && <ChatButton />}

      {/* Complete Profile Modal - Show for users who haven't completed their profile */}
      {user && showProfileModal && (
        <CompleteProfileModal
          isOpen={true}
          currentUsername={user.username}
          currentAvatarUrl={user.avatar_url}
          currentBio={user.bio}
          userId={user.id}
          onClose={handleProfileModalClose}
        />
      )}

      {/* Subscription Expired Modal - Show when Kliento user's subscription is not active */}
      <SubscriptionExpiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        redirectUrl={subscriptionRedirectUrl}
      />

      {/* Account Suspended Modal - Show when Kliento user's account is suspended */}
      <AccountSuspendedModal
        isOpen={showSuspendedModal}
        onClose={() => setShowSuspendedModal(false)}
        onRefresh={refreshSubscription}
        subscriptionStatus={subscriptionStatus}
      />
    </div>
  );
};

export default Layout;