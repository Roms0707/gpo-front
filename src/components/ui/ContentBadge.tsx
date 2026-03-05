import React from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeType, BADGE_DEFINITIONS } from '../../services/badgeService';

interface ContentBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md';
  className?: string;
}

const ContentBadge: React.FC<ContentBadgeProps> = ({ type, size = 'sm', className = '' }) => {
  const { t } = useTranslation();
  const def = BADGE_DEFINITIONS[type];
  if (!def) return null;

  const Icon = def.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-bold uppercase tracking-wider backdrop-blur-sm ${
        isSm ? 'px-1.5 py-0.5 rounded text-[9px]' : 'px-2 py-0.5 rounded-md text-[10px]'
      } ${className}`}
      style={{
        backgroundColor: def.bgColor,
        color: def.textColor,
        boxShadow: `0 2px 8px ${def.glowColor}`,
      }}
    >
      <Icon className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {t(def.labelKey, def.fallbackLabel)}
    </span>
  );
};

interface ContentBadgeStackProps {
  badges: BadgeType[];
  size?: 'sm' | 'md';
  className?: string;
  maxVisible?: number;
}

export const ContentBadgeStack: React.FC<ContentBadgeStackProps> = ({
  badges,
  size = 'sm',
  className = '',
  maxVisible = 2,
}) => {
  if (badges.length === 0) return null;

  const visible = badges.slice(0, maxVisible);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {visible.map((badge) => (
        <ContentBadge key={badge} type={badge} size={size} />
      ))}
    </div>
  );
};

export default ContentBadge;
