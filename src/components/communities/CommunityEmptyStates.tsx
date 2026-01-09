import React from 'react';
import { MessageSquare, Search, Lock, Compass, Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface EmptyStateProps {
  onAction?: () => void;
}

export const CommunityCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden animate-pulse">
      <div className="h-16 sm:h-20 bg-gray-700/30" />
      <div className="p-4 pt-8">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl bg-gray-700/50 -mt-10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-3/4" />
            <div className="h-3 bg-gray-700/30 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-700/30 rounded w-full" />
          <div className="h-3 bg-gray-700/30 rounded w-2/3" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 bg-gray-700/30 rounded w-20" />
          <div className="h-3 bg-gray-700/30 rounded w-12" />
        </div>
        <div className="h-10 bg-gray-700/50 rounded-lg" />
      </div>
    </div>
  );
};

export const MyCommunityCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-700/50" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700/50 rounded w-1/2" />
          <div className="h-3 bg-gray-700/30 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};

export const LoadingGrid: React.FC<{ count?: number; variant?: 'grid' | 'my-community' }> = ({
  count = 6,
  variant = 'grid',
}) => {
  if (variant === 'my-community') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <MyCommunityCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CommunityCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const NoCommunitiesFound: React.FC<EmptyStateProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-20 h-20 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-6">
        <Search className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {t('communitiesPage.empty.noResults.title')}
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-sm mb-6">
        {t('communitiesPage.empty.noResults.description')}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors"
          style={{
            backgroundColor: `${primaryColor}15`,
            border: `1px solid ${primaryColor}40`,
            color: primaryColor,
          }}
        >
          <Plus className="w-4 h-4" />
          {t('communitiesPage.empty.noResults.action')}
        </button>
      )}
    </div>
  );
};

export const NoPublicCommunities: React.FC<EmptyStateProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-20 h-20 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-6">
        <MessageSquare className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {t('communitiesPage.empty.noPublic.title')}
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-sm mb-6">
        {t('communitiesPage.empty.noPublic.description')}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
            boxShadow: `0 0 20px ${primaryColor}40`,
          }}
        >
          <Plus className="w-4 h-4" />
          {t('communitiesPage.empty.noPublic.action')}
        </button>
      )}
    </div>
  );
};

export const NotJoinedAnyCommunity: React.FC<EmptyStateProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">
        {t('communitiesPage.empty.notJoined.title')}
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-xs mb-4">
        {t('communitiesPage.empty.notJoined.description')}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
          style={{
            backgroundColor: `${primaryColor}15`,
            border: `1px solid ${primaryColor}40`,
            color: primaryColor,
          }}
        >
          <Compass className="w-4 h-4" />
          {t('communitiesPage.empty.notJoined.action')}
        </button>
      )}
    </div>
  );
};

export const SignInRequired: React.FC = () => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">
        {t('communitiesPage.empty.signIn.title')}
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-xs mb-4">
        {t('communitiesPage.empty.signIn.description')}
      </p>
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
          boxShadow: `0 0 20px ${primaryColor}40`,
        }}
      >
        <Users className="w-4 h-4" />
        {t('communitiesPage.empty.signIn.action')}
      </button>
    </div>
  );
};
