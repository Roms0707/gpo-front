import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatButton from '../chat/ChatButton';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white transition-colors duration-200 overflow-x-hidden w-full">
      <Header />
      <main id="main-content" className="flex-grow w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />

      {/* Chat Button - Only show for logged in users */}
      {user && <ChatButton />}
    </div>
  );
};

export default Layout;