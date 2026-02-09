import React from 'react';
import { Info } from 'lucide-react';

interface InfoMessageProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'accent';
  className?: string;
  showIcon?: boolean;
}

const InfoMessage: React.FC<InfoMessageProps> = ({
  message,
  type = 'info',
  className = '',
  showIcon = true
}) => {
  const typeStyles = {
    info: 'bg-info-500/20 border-info-600 text-info-300',
    success: 'bg-success-500/20 border-success-600 text-success-300',
    warning: 'bg-warning-500/20 border-warning-600 text-warning-300',
    accent: 'bg-accent-500/20 border-accent-600 text-accent-300'
  };

  const iconColors = {
    info: 'text-info-400',
    success: 'text-success-400',
    warning: 'text-warning-400',
    accent: 'text-accent-400'
  };

  return (
    <div className={`border px-4 py-3 rounded mb-4 ${typeStyles[type]} ${className}`}>
      <div className="flex items-center">
        {showIcon && <Info className={`h-5 w-5 mr-2 ${iconColors[type]}`} />}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default InfoMessage;
