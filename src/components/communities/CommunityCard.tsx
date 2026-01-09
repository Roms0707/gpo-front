import React, { useState } from 'react';
import { MessageSquare, Users, Flame, Globe, Lock, Settings, ArrowRight, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { useAppConfig } from '../../contexts/AppConfigContext';

export type UserRole = 'admin' | 'moderator' | 'member';

interface CommunityCardProps {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  onlineCount?: number;
  lastActivity?: string;
  creatorName?: string;
  isPrivate?: boolean;
  isCommunity?: boolean;
  isActive?: boolean;
  userRole?: UserRole;
  isMember?: boolean;
  onJoin?: () => void;
  onOpen?: () => void;
  onSettings?: () => void;
  isJoining?: boolean;
  variant?: 'default' | 'compact' | 'my-community';
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  id,
  name,
  description,
  memberCount,
  onlineCount = 0,
  lastActivity,
  creatorName,
  isPrivate = false,
  isCommunity = true,
  isActive = false,
  userRole,
  isMember = false,
  onJoin,
  onOpen,
  onSettings,
  isJoining = false,
  variant = 'default',
}) => {
  const { t } = useTranslation();
  const { primaryColor, secondaryColor } = useAppConfig();
  const [isHovered, setIsHovered] = useState(false);

  const getRoleBorderColor = () => {
    switch (userRole) {
      case 'admin':
        return secondaryColor;
      case 'moderator':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getRoleBadge = () => {
    if (!userRole || userRole === 'member') return null;

    const config = {
      admin: { label: t('communitiesPage.roles.admin'), color: secondaryColor },
      moderator: { label: t('communitiesPage.roles.moderator'), color: '#3B82F6' },
    };

    const roleConfig = config[userRole as keyof typeof config];
    if (!roleConfig) return null;

    return (
      <span
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{
          backgroundColor: `${roleConfig.color}20`,
          color: roleConfig.color,
        }}
      >
        {roleConfig.label}
      </span>
    );
  };

  if (variant === 'my-community') {
    return (
      <div
        className="group relative bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-gray-600/50 hover:bg-gray-800/70 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onOpen}
        style={{
          boxShadow: isHovered ? `0 0 30px ${primaryColor}10` : 'none',
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}30 0%, ${primaryColor}10 100%)`,
                boxShadow: isHovered ? `0 0 15px ${getRoleBorderColor()}30` : 'none',
              }}
            >
              <div
                className="absolute inset-0 rounded-xl border-2"
                style={{ borderColor: getRoleBorderColor() }}
              />
              <MessageSquare className="w-5 h-5" style={{ color: primaryColor }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white truncate">
                  <span className="text-gray-500">#</span> {name}
                </h3>
                {isCommunity && (
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />
                )}
                {isPrivate && (
                  <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {memberCount}
                </span>
                {onlineCount > 0 && (
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {onlineCount} {t('communitiesPage.online')}
                  </span>
                )}
                {getRoleBadge()}
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {userRole === 'admin' && onSettings && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSettings();
                  }}
                  className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          {description && (
            <p className="text-sm text-gray-400 mt-3 line-clamp-1">{description}</p>
          )}

          {lastActivity && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
            </div>
          )}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300"
          style={{
            background: isHovered
              ? `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`
              : 'transparent',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="group relative bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-gray-600/50 hover:bg-gray-800/70 hover:scale-[1.02] hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered
          ? `0 10px 40px ${primaryColor}15, 0 0 30px ${primaryColor}10`
          : '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      <div
        className="h-16 sm:h-20 relative"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}30 0%, ${secondaryColor}20 50%, ${primaryColor}10 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-800/90" />

        {isActive && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-medium text-orange-400">
                {t('communitiesPage.active')}
              </span>
            </div>
          </div>
        )}

        <div
          className="absolute -bottom-5 left-4 w-14 h-14 rounded-xl flex items-center justify-center border-2 border-gray-800"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}20 100%)`,
            boxShadow: `0 0 20px ${primaryColor}30`,
          }}
        >
          <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
        </div>
      </div>

      <div className="p-4 pt-8">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">
                <span className="text-gray-500">#</span> {name}
              </h3>
              {isCommunity && (
                <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />
              )}
            </div>
            {creatorName && (
              <p className="text-xs text-gray-500 mt-0.5">
                {t('communitiesPage.by')} {creatorName}
              </p>
            )}
          </div>
        </div>

        {description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount} {t('communitiesPage.members')}
            </span>
            {onlineCount > 0 && (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {onlineCount}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          {isMember ? (
            <button
              onClick={onOpen}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
                boxShadow: isHovered ? `0 0 20px ${primaryColor}40` : `0 0 10px ${primaryColor}20`,
              }}
            >
              {t('communitiesPage.open')}
            </button>
          ) : (
            <button
              onClick={onJoin}
              disabled={isJoining}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: `linear-gradient(135deg, ${secondaryColor} 0%, ${secondaryColor}CC 100%)`,
                boxShadow: isHovered ? `0 0 20px ${secondaryColor}40` : `0 0 10px ${secondaryColor}20`,
              }}
            >
              {isJoining ? t('communitiesPage.joining') : t('communitiesPage.join')}
            </button>
          )}
        </div>
      </div>

      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          boxShadow: `inset 0 0 0 1px ${primaryColor}30`,
        }}
      />
    </div>
  );
};
