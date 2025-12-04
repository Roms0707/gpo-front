import React from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';

interface WhitelistBadgeProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const WhitelistBadge: React.FC<WhitelistBadgeProps> = ({
  className = '',
  showText = true,
  size = 'md'
}) => {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full ${sizeClasses[size]} font-medium text-amber-400 dark:text-amber-300 ${className}`}
      title={t('badges.fullAccessTooltip')}
    >
      <Crown className={`${iconSizes[size]} text-amber-500`} />
      {showText && (
        <span className="whitespace-nowrap">{t('badges.fullAccess')}</span>
      )}
    </div>
  );
};

export default WhitelistBadge;
