import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  className?: string;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = '',
  showIcon = true
}) => {
  return (
    <div className={`bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded mb-4 ${className}`}>
      <div className="flex items-center">
        {showIcon && <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default ErrorMessage;