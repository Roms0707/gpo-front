import React from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  teamInviteMessage?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  teamInviteMessage,
}) => {
  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="bg-gradient-to-r from-primary-600/10 to-secondary-600/10 dark:from-primary-600/20 dark:to-secondary-600/20 px-6 py-8 border-b border-gray-200 dark:border-gray-800 text-center">
              <h1 className="font-heading font-bold text-2xl">
                {title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {subtitle}
              </p>
            </div>
            
            <div className="p-6">
              {teamInviteMessage}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;