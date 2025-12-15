import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LiveNotificationManager from './components/notifications/LiveNotificationManager';
import MatchNotificationManager from './components/notifications/MatchNotificationManager';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useDynamicFavicon } from './hooks/useDynamicFavicon';

// Lazy load pages for better code splitting
const HomePage = React.lazy(() => import('./pages/HomePage'));
const TournamentPage = React.lazy(() => import('./pages/TournamentPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ProfileEditPage = React.lazy(() => import('./pages/ProfileEditPage'));
const FriendsPage = React.lazy(() => import('./pages/FriendsPage'));
const GamingStatsPage = React.lazy(() => import('./pages/GamingStatsPage'));
const ProfileSupportPage = React.lazy(() => import('./pages/ProfileSupportPage'));
const TicketDetailPage = React.lazy(() => import('./pages/TicketDetailPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const FAQPage = React.lazy(() => import('./pages/FAQPage'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const LegalPage = React.lazy(() => import('./pages/LegalPage'));
const LeaderboardsPage = React.lazy(() => import('./pages/LeaderboardsPage'));
const GameLeaderboardPage = React.lazy(() => import('./pages/GameLeaderboardPage'));
const TwitchEmbedPage = React.lazy(() => import('./pages/TwitchEmbedPage'));
const CommunitiesPage = React.lazy(() => import('./pages/CommunitiesPage'));
const VideoPlayerPage = React.lazy(() => import('./pages/VideoPlayerPage'));
const TransactionWaitingPage = React.lazy(() => import('./pages/TransactionWaitingPage'));
const GameHubPage = React.lazy(() => import('./pages/GameHubPage'));

// Loading fallback component
const PageLoadingFallback = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
      <LoadingSpinner size="lg" text={t('common.loadingPage')} />
    </div>
  );
};

const AppContent = () => {
  useDynamicFavicon();
  const { t } = useTranslation();

  return (
    <ErrorBoundary>
      {/* Skip to content link for keyboard users */}
      <a href="#main-content" className="skip-to-content">
        {t('header.skipToContent')}
      </a>

      <Routes>
        {/* Transaction callback page - standalone without layout */}
        <Route path="/callback" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <TransactionWaitingPage />
          </Suspense>
        } />

        <Route path="/" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <Layout />
          </Suspense>
        }>
          <Route index element={
            <Suspense fallback={<PageLoadingFallback />}>
              <HomePage />
            </Suspense>
          } />
          <Route path="tournaments/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <TournamentPage />
            </Suspense>
          } />
          <Route path="login" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <LoginPage />
            </Suspense>
          } />
          <Route path="signup" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SignupPage />
            </Suspense>
          } />
          
          {/* Leaderboards */}
          <Route path="leaderboards" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <LeaderboardsPage />
            </Suspense>
          } />
          <Route path="leaderboards/:gameId" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <GameLeaderboardPage />
            </Suspense>
          } />
         
          {/* Twitch Embed */}
          <Route path="stream/:channelName" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <TwitchEmbedPage />
            </Suspense>
          } />
          
          {/* Video Player */}
          <Route path="video/:contentId" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <VideoPlayerPage />
            </Suspense>
          } />
          
         {/* Communities */}
         <Route path="communities" element={
           <Suspense fallback={<PageLoadingFallback />}>
             <CommunitiesPage />
           </Suspense>
         } />

          {/* Game Hub */}
          <Route path="hub" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <GameHubPage />
            </Suspense>
          } />
          <Route path="hub/:gameId" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <GameHubPage />
            </Suspense>
          } />
          
          <Route element={<ProtectedRoute />}>
            <Route path="tournaments/:id/register" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <RegisterPage />
              </Suspense>
            } />
            <Route path="profile" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <ProfilePage />
              </Suspense>
            } />
            <Route path="profile/edit" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <ProfileEditPage />
              </Suspense>
            } />
            <Route path="profile/friends" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <FriendsPage />
              </Suspense>
            } />
            <Route path="profile/gaming-stats" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <GamingStatsPage />
              </Suspense>
            } />
            <Route path="profile/support" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <ProfileSupportPage />
              </Suspense>
            } />
            <Route path="profile/support/:ticketId" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <TicketDetailPage />
              </Suspense>
            } />
          </Route>
          
          {/* Admin-only routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="admin/support/:ticketId" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <TicketDetailPage />
              </Suspense>
            } />
            {/* Add admin routes here when needed */}
            {/* Example: <Route path="admin/dashboard" element={<AdminDashboard />} /> */}
          </Route>
          
          {/* Support and Info pages */}
          <Route path="faq" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <FAQPage />
            </Suspense>
          } />
          <Route path="support" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SupportPage />
            </Suspense>
          } />
          <Route path="contact" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ContactPage />
            </Suspense>
          } />
          <Route path="terms" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <TermsPage />
            </Suspense>
          } />
          <Route path="privacy" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PrivacyPage />
            </Suspense>
          } />
          <Route path="legal" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <LegalPage />
            </Suspense>
          } />
          <Route path="profile/gaming-stats/:userId" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <GamingStatsPage />
            </Suspense>
          } />
          
          <Route path="*" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <NotFoundPage />
            </Suspense>
          } />
        </Route>
      </Routes>

      {/* Live notification system */}
      <LiveNotificationManager />

      {/* Match notification system - for gamers only */}
      <MatchNotificationManager />
    </ErrorBoundary>
  );
};

function App() {
  return <AppContent />;
}

export default App;