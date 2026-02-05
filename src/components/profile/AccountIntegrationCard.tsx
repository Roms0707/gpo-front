import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccountIntegrationCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const AccountIntegrationCard: React.FC<AccountIntegrationCardProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <div className={`bg-gray-100 dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-white dark:bg-dark-100 border border-gray-300 dark:border-gray-600">
            {icon}
          </div>
          <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-100">
          {children}
        </div>
      )}
    </div>
  );
};

export default AccountIntegrationCard;