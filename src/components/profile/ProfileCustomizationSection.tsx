import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, LayoutGrid as Layout, Award, Lock, Check, Sparkles, Star, CheckCircle, TrendingUp, Crown, Trophy, Flame, Loader, X, ChevronDown, ChevronUp, Swords, Target, Skull, Rocket, Crosshair, Zap, Globe } from 'lucide-react';
import type {
  ProfileFrame,
  ProfileBadge,
  ProfileFrameWithUnlockStatus,
  ProfileBadgeWithUnlockStatus,
  ItemRarity,
  FrameCollection
} from '../../types';
import AvatarWithFrame from './AvatarWithFrame';
import CustomizationCardBorder from './CustomizationCardBorder';

type CustomizationTab = 'avatar' | 'modal' | 'badges';
type CollectionFilter = 'all' | FrameCollection;

interface CollectionInfo {
  id: CollectionFilter;
  name: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

const COLLECTIONS: CollectionInfo[] = [
  { id: 'all', name: 'All', icon: Globe, color: '#6b7280', gradient: 'from-gray-500/20 to-gray-600/20' },
  { id: 'default', name: 'Classic', icon: Star, color: '#9ca3af', gradient: 'from-gray-400/20 to-gray-500/20' },
  { id: 'league_of_legends', name: 'LoL', icon: Crown, color: '#c89b3c', gradient: 'from-amber-500/20 to-cyan-500/20' },
  { id: 'valorant', name: 'Valorant', icon: Target, color: '#ff4655', gradient: 'from-red-500/20 to-slate-800/20' },
  { id: 'diablo', name: 'Diablo', icon: Skull, color: '#8b0000', gradient: 'from-red-900/20 to-gray-900/20' },
  { id: 'apex', name: 'Apex', icon: Rocket, color: '#da291c', gradient: 'from-red-600/20 to-gray-700/20' },
  { id: 'cs2', name: 'CS2', icon: Crosshair, color: '#ffb03b', gradient: 'from-amber-500/20 to-gray-700/20' },
  { id: 'rocket_league', name: 'Rocket', icon: Zap, color: '#00b4ff', gradient: 'from-blue-500/20 to-orange-500/20' },
  { id: 'universal', name: 'Elite', icon: Sparkles, color: '#8b5cf6', gradient: 'from-violet-500/20 to-cyan-500/20' },
];

interface ProfileCustomizationSectionProps {
  avatarFrames: ProfileFrameWithUnlockStatus[];
  modalFrames: ProfileFrameWithUnlockStatus[];
  badges: ProfileBadgeWithUnlockStatus[];
  selectedAvatarFrameId?: string | null;
  selectedModalFrameId?: string | null;
  selectedBadgeId?: string | null;
  onSelectAvatarFrame: (frameId: string | null) => void;
  onSelectModalFrame: (frameId: string | null) => void;
  onSelectBadge: (badgeId: string | null) => void;
  userXp?: number;
  themeColor?: string;
  avatarUrl?: string | null;
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const getBadgeIcon = (iconName: string) => {
  switch (iconName) {
    case 'star': return Star;
    case 'check-circle': return CheckCircle;
    case 'trending-up': return TrendingUp;
    case 'crown': return Crown;
    case 'trophy': return Trophy;
    case 'flame': return Flame;
    default: return Star;
  }
};

const getRarityColor = (rarity: ItemRarity): string => {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'rare': return '#3b82f6';
    case 'epic': return '#a855f7';
    case 'legendary': return '#f97316';
    default: return '#9ca3af';
  }
};

const getRarityGradient = (rarity: ItemRarity): string => {
  switch (rarity) {
    case 'common': return 'from-gray-500/20 to-gray-600/20';
    case 'rare': return 'from-blue-500/20 to-blue-600/20';
    case 'epic': return 'from-purple-500/20 to-purple-600/20';
    case 'legendary': return 'from-orange-500/20 to-red-500/20';
    default: return 'from-gray-500/20 to-gray-600/20';
  }
};

const ProfileCustomizationSection: React.FC<ProfileCustomizationSectionProps> = ({
  avatarFrames,
  modalFrames,
  badges,
  selectedAvatarFrameId,
  selectedModalFrameId,
  selectedBadgeId,
  onSelectAvatarFrame,
  onSelectModalFrame,
  onSelectBadge,
  userXp = 0,
  themeColor,
  avatarUrl,
  isLoading = false,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CustomizationTab>('avatar');
  const [hoveredFrame, setHoveredFrame] = useState<ProfileFrame | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<ProfileBadge | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');

  const selectedAvatarFrame = avatarFrames.find(f => f.id === selectedAvatarFrameId) || null;
  const selectedBadge = badges.find(b => b.id === selectedBadgeId) || null;

  const filteredAvatarFrames = useMemo(() => {
    if (collectionFilter === 'all') return avatarFrames;
    return avatarFrames.filter(f => f.collection === collectionFilter);
  }, [avatarFrames, collectionFilter]);

  const filteredModalFrames = useMemo(() => {
    if (collectionFilter === 'all') return modalFrames;
    return modalFrames.filter(f => f.collection === collectionFilter);
  }, [modalFrames, collectionFilter]);

  const availableCollections = useMemo(() => {
    const frameCollections = new Set<string>();
    avatarFrames.forEach(f => f.collection && frameCollections.add(f.collection));
    modalFrames.forEach(f => f.collection && frameCollections.add(f.collection));
    return COLLECTIONS.filter(c => c.id === 'all' || frameCollections.has(c.id));
  }, [avatarFrames, modalFrames]);

  const getCollectionStats = (collection: CollectionFilter) => {
    const frames = collection === 'all'
      ? avatarFrames
      : avatarFrames.filter(f => f.collection === collection);
    const unlocked = frames.filter(f => f.is_unlocked).length;
    return { total: frames.length, unlocked };
  };

  const renderUnlockRequirement = (item: ProfileFrameWithUnlockStatus | ProfileBadgeWithUnlockStatus) => {
    if (item.is_unlocked) return null;

    const requirement = item.unlock_requirement;

    if (item.unlock_type === 'xp' && requirement.xp) {
      const progress = Math.min((userXp / requirement.xp) * 100, 100);
      return (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">{userXp} / {requirement.xp} XP</span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-dark-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    }

    if (item.unlock_type === 'achievement') {
      return (
        <p className="text-xs text-gray-500 mt-1">
          {t('profile.customization.achievementRequired')}
        </p>
      );
    }

    if (item.unlock_type === 'premium') {
      return (
        <p className="text-xs text-amber-500/80 mt-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {t('profile.customization.premiumRequired')}
        </p>
      );
    }

    return null;
  };

  const getCollectionInfo = (collectionId?: string) => {
    return COLLECTIONS.find(c => c.id === collectionId) || COLLECTIONS[0];
  };

  const renderFrameItem = (
    frame: ProfileFrameWithUnlockStatus,
    isSelected: boolean,
    onClick: () => void
  ) => {
    const isLocked = !frame.is_unlocked;
    const collection = getCollectionInfo(frame.collection);
    const CollectionIcon = collection.icon;

    return (
      <CustomizationCardBorder
        key={frame.id}
        rarity={frame.rarity}
        isSelected={isSelected}
        isLocked={isLocked}
      >
        <button
          onClick={isLocked ? undefined : onClick}
          onMouseEnter={() => setHoveredFrame(frame)}
          onMouseLeave={() => setHoveredFrame(null)}
          disabled={isLocked}
          className={`relative w-full p-3 rounded-xl border transition-all group ${
            isSelected
              ? 'border-transparent'
              : isLocked
              ? 'border-gray-800/30 cursor-not-allowed'
              : 'border-gray-700/30 hover:border-transparent'
          }`}
          style={{
            backgroundColor: isSelected ? `${themeColor || getRarityColor(frame.rarity)}15` : undefined,
          }}
        >
          <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getRarityGradient(frame.rarity)} flex items-center justify-center mb-2 relative overflow-hidden`}>
            {frame.rarity === 'legendary' && (
              <div className={`absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent animate-pulse ${isLocked ? 'opacity-40' : ''}`} />
            )}
            <div
              className={`w-12 h-12 rounded-lg ${frame.animation_class ? frame.animation_class : ''}`}
              style={{
                ...frame.css_styles,
                borderWidth: frame.css_styles.borderWidth || '3px',
                borderStyle: (frame.css_styles.borderStyle as React.CSSProperties['borderStyle']) || 'solid',
                filter: isLocked ? 'grayscale(0.5) brightness(0.7)' : undefined,
              }}
            />

            {isLocked && (
              <div className="absolute inset-0 bg-dark-100/50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
            )}

            {isSelected && !isLocked && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: themeColor || getRarityColor(frame.rarity) }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {frame.collection && frame.collection !== 'default' && (
              <div
                className="absolute top-1 left-1 w-4 h-4 rounded flex items-center justify-center"
                style={{ backgroundColor: `${collection.color}30` }}
                title={collection.name}
              >
                <CollectionIcon className="w-2.5 h-2.5" style={{ color: isLocked ? '#6b7280' : collection.color }} />
              </div>
            )}
          </div>

          <p className={`text-xs font-medium truncate ${isLocked ? 'text-gray-500' : 'text-white'}`}>{frame.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isLocked ? '#6b7280' : getRarityColor(frame.rarity) }}
            />
            <span className="text-xs text-gray-500 capitalize">{frame.rarity}</span>
          </div>

          {isLocked && renderUnlockRequirement(frame)}
        </button>
      </CustomizationCardBorder>
    );
  };

  const renderBadgeItem = (
    badge: ProfileBadgeWithUnlockStatus,
    isSelected: boolean,
    onClick: () => void
  ) => {
    const isLocked = !badge.is_unlocked;
    const BadgeIcon = getBadgeIcon(badge.css_styles?.icon || 'star');

    return (
      <CustomizationCardBorder
        key={badge.id}
        rarity={badge.rarity}
        isSelected={isSelected}
        isLocked={isLocked}
      >
        <button
          onClick={isLocked ? undefined : onClick}
          onMouseEnter={() => setHoveredBadge(badge)}
          onMouseLeave={() => setHoveredBadge(null)}
          disabled={isLocked}
          className={`relative w-full p-3 rounded-xl border transition-all group ${
            isSelected
              ? 'border-transparent'
              : isLocked
              ? 'border-gray-800/30 cursor-not-allowed'
              : 'border-gray-700/30 hover:border-transparent'
          }`}
          style={{
            backgroundColor: isSelected ? `${themeColor || getRarityColor(badge.rarity)}15` : undefined,
          }}
        >
          <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getRarityGradient(badge.rarity)} flex items-center justify-center mb-2 relative`}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: '#1a1a2e',
                boxShadow: badge.css_styles?.glow && !isLocked ? `0 0 15px ${badge.css_styles.color}50` : undefined,
                filter: isLocked ? 'grayscale(0.7) brightness(0.6)' : undefined,
              }}
            >
              <BadgeIcon
                className="w-5 h-5"
                style={{ color: isLocked ? '#6b7280' : (badge.css_styles?.color || '#FFD700') }}
              />
            </div>

            {isLocked && (
              <div className="absolute inset-0 bg-dark-100/70 flex items-center justify-center rounded-lg">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
            )}

            {isSelected && !isLocked && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: themeColor || getRarityColor(badge.rarity) }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <p className={`text-xs font-medium truncate ${isLocked ? 'text-gray-500' : 'text-white'}`}>{badge.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isLocked ? '#6b7280' : getRarityColor(badge.rarity) }}
            />
            <span className="text-xs text-gray-500 capitalize">{badge.rarity}</span>
          </div>

          {isLocked && renderUnlockRequirement(badge)}
        </button>
      </CustomizationCardBorder>
    );
  };

  const tabs = [
    { id: 'avatar' as CustomizationTab, label: t('profile.customization.avatarFrame'), icon: Image, count: avatarFrames.length },
    { id: 'modal' as CustomizationTab, label: t('profile.customization.modalFrame'), icon: Layout, count: modalFrames.length },
    { id: 'badges' as CustomizationTab, label: t('profile.customization.badges'), icon: Award, count: badges.length },
  ];

  return (
    <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-dark-200/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: themeColor ? `${themeColor}20` : 'rgba(59, 130, 246, 0.2)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: themeColor || '#3b82f6' }} />
          </div>
          <div className="text-left">
            <span className="text-sm font-medium text-white block">
              {t('profile.customization.title')}
            </span>
            <span className="text-xs text-gray-500">
              {t('profile.customization.subtitle')}
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-4 mb-4 py-3 border-t border-gray-800/50">
            <AvatarWithFrame
              avatarUrl={avatarUrl}
              frame={hoveredFrame || selectedAvatarFrame}
              badge={hoveredBadge || selectedBadge}
              size="lg"
              themeColor={themeColor}
            />
            <div className="text-left">
              <p className="text-xs text-gray-400 mb-1">{t('profile.customization.preview')}</p>
              <p className="text-sm font-medium text-white">
                {hoveredFrame?.name || selectedAvatarFrame?.name || t('profile.customization.noFrame')}
              </p>
              {(hoveredBadge || selectedBadge) && (
                <p className="text-xs text-gray-500 mt-0.5">
                  + {hoveredBadge?.name || selectedBadge?.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1 mb-3 p-1 bg-dark-200/50 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-dark-100 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? `${themeColor}20` : undefined,
                  color: activeTab === tab.id ? themeColor : undefined,
                }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {(activeTab === 'avatar' || activeTab === 'modal') && availableCollections.length > 2 && (
            <div className="mb-3">
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {availableCollections.map((collection) => {
                  const stats = getCollectionStats(collection.id);
                  const CollectionIcon = collection.icon;
                  const isActive = collectionFilter === collection.id;
                  return (
                    <button
                      key={collection.id}
                      onClick={() => setCollectionFilter(collection.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isActive
                          ? 'border-opacity-50 bg-opacity-20'
                          : 'border-transparent bg-dark-300/30 hover:bg-dark-300/50 text-gray-400'
                      }`}
                      style={{
                        borderColor: isActive ? collection.color : undefined,
                        backgroundColor: isActive ? `${collection.color}15` : undefined,
                        color: isActive ? collection.color : undefined,
                      }}
                    >
                      <CollectionIcon className="w-3.5 h-3.5" />
                      <span>{collection.name}</span>
                      {collection.id !== 'all' && (
                        <span className="text-[10px] opacity-70">
                          {stats.unlocked}/{stats.total}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
              {activeTab === 'avatar' && (
                <>
                  <button
                    onClick={() => onSelectAvatarFrame(null)}
                    className={`p-3 rounded-xl border transition-all ${
                      !selectedAvatarFrameId
                        ? 'border-2'
                        : 'border-gray-700/50 hover:border-gray-600 hover:bg-dark-200/30'
                    }`}
                    style={{
                      borderColor: !selectedAvatarFrameId ? themeColor || '#3b82f6' : undefined,
                      backgroundColor: !selectedAvatarFrameId ? `${themeColor || '#3b82f6'}10` : undefined,
                    }}
                  >
                    <div className="w-full aspect-square rounded-lg bg-dark-300/50 flex items-center justify-center mb-2">
                      <X className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-xs font-medium text-gray-400">{t('profile.customization.none')}</p>
                  </button>
                  {filteredAvatarFrames.map((frame) =>
                    renderFrameItem(
                      frame,
                      selectedAvatarFrameId === frame.id,
                      () => onSelectAvatarFrame(frame.id)
                    )
                  )}
                  {filteredAvatarFrames.length === 0 && collectionFilter !== 'all' && (
                    <div className="col-span-3 py-6 text-center text-gray-500 text-sm">
                      No frames in this collection yet
                    </div>
                  )}
                </>
              )}

              {activeTab === 'modal' && (
                <>
                  <button
                    onClick={() => onSelectModalFrame(null)}
                    className={`p-3 rounded-xl border transition-all ${
                      !selectedModalFrameId
                        ? 'border-2'
                        : 'border-gray-700/50 hover:border-gray-600 hover:bg-dark-200/30'
                    }`}
                    style={{
                      borderColor: !selectedModalFrameId ? themeColor || '#3b82f6' : undefined,
                      backgroundColor: !selectedModalFrameId ? `${themeColor || '#3b82f6'}10` : undefined,
                    }}
                  >
                    <div className="w-full aspect-square rounded-lg bg-dark-300/50 flex items-center justify-center mb-2">
                      <X className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-xs font-medium text-gray-400">{t('profile.customization.none')}</p>
                  </button>
                  {filteredModalFrames.map((frame) =>
                    renderFrameItem(
                      frame,
                      selectedModalFrameId === frame.id,
                      () => onSelectModalFrame(frame.id)
                    )
                  )}
                  {filteredModalFrames.length === 0 && collectionFilter !== 'all' && (
                    <div className="col-span-3 py-6 text-center text-gray-500 text-sm">
                      No modal frames in this collection yet
                    </div>
                  )}
                </>
              )}

              {activeTab === 'badges' && (
                <>
                  <button
                    onClick={() => onSelectBadge(null)}
                    className={`p-3 rounded-xl border transition-all ${
                      !selectedBadgeId
                        ? 'border-2'
                        : 'border-gray-700/50 hover:border-gray-600 hover:bg-dark-200/30'
                    }`}
                    style={{
                      borderColor: !selectedBadgeId ? themeColor || '#3b82f6' : undefined,
                      backgroundColor: !selectedBadgeId ? `${themeColor || '#3b82f6'}10` : undefined,
                    }}
                  >
                    <div className="w-full aspect-square rounded-lg bg-dark-300/50 flex items-center justify-center mb-2">
                      <X className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-xs font-medium text-gray-400">{t('profile.customization.none')}</p>
                  </button>
                  {badges.map((badge) =>
                    renderBadgeItem(
                      badge,
                      selectedBadgeId === badge.id,
                      () => onSelectBadge(badge.id)
                    )
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCustomizationSection;
