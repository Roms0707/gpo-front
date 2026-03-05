import React from 'react';
import { Lock, Check } from 'lucide-react';
import type { ProfileBannerWithUnlockStatus, ItemRarity, AvatarGameAffinity } from '../../types';
import CustomizationCardBorder from './CustomizationCardBorder';

interface BannerSelectionCardProps {
  banner: ProfileBannerWithUnlockStatus;
  isSelected: boolean;
  onClick: () => void;
  userXp?: number;
  themeColor?: string;
  gameAffinityIcon?: React.ReactNode;
}

const getRarityColor = (rarity: ItemRarity): string => {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'rare': return '#3b82f6';
    case 'epic': return '#a855f7';
    case 'legendary': return '#f97316';
    default: return '#9ca3af';
  }
};

export const getBannerAffinityColor = (affinity: AvatarGameAffinity): string => {
  switch (affinity) {
    case 'lol': return '#c89b3c';
    case 'warzone': return '#4a5a3d';
    case 'valorant': return '#ff4655';
    case 'cs2': return '#ffb03b';
    case 'apex': return '#da291c';
    case 'rocket_league': return '#00b4ff';
    case 'universal': return '#8b5cf6';
    default: return '#6b7280';
  }
};

const BannerSelectionCard: React.FC<BannerSelectionCardProps> = ({
  banner,
  isSelected,
  onClick,
  userXp = 0,
  themeColor,
  gameAffinityIcon,
}) => {
  const isLocked = !banner.is_unlocked;
  const requiredXp = banner.unlock_requirement?.xp || 0;
  const progress = requiredXp > 0 ? Math.min((userXp / requiredXp) * 100, 100) : 100;
  const gameColor = getBannerAffinityColor(banner.game_affinity);

  return (
    <CustomizationCardBorder
      rarity={banner.rarity}
      isSelected={isSelected}
      isLocked={isLocked}
    >
      <button
        onClick={isLocked ? undefined : onClick}
        disabled={isLocked}
        className={`relative w-full rounded-xl border transition-all group overflow-hidden ${
          isSelected
            ? 'border-transparent'
            : isLocked
            ? 'border-gray-800/30 cursor-not-allowed'
            : 'border-gray-700/30 hover:border-transparent'
        }`}
        style={{
          backgroundColor: isSelected ? `${themeColor || getRarityColor(banner.rarity)}15` : undefined,
        }}
      >
        <div className="relative w-full aspect-[3/1] overflow-hidden rounded-t-lg">
          <img
            src={banner.image_url}
            alt={banner.name}
            className={`w-full h-full object-cover transition-all ${
              isLocked ? 'grayscale brightness-50' : ''
            }`}
          />

          {banner.rarity === 'legendary' && !isLocked && (
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent animate-pulse pointer-events-none" />
          )}

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 2px ${isLocked ? '#374151' : getRarityColor(banner.rarity)}40`,
            }}
          />

          {isLocked && (
            <div className="absolute inset-0 bg-dark-100/60 flex flex-col items-center justify-center">
              <Lock className="w-5 h-5 text-gray-500 mb-1" />
              {requiredXp > 0 && (
                <span className="text-[10px] text-gray-500 font-medium">
                  {requiredXp} XP
                </span>
              )}
            </div>
          )}

          {isSelected && !isLocked && (
            <div
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: themeColor || getRarityColor(banner.rarity) }}
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          {gameAffinityIcon && (
            <div
              className="absolute top-2 left-2 w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: `${gameColor}60`, backdropFilter: 'blur(4px)' }}
            >
              {gameAffinityIcon}
            </div>
          )}
        </div>

        <div className="px-2.5 py-2">
          <p className={`text-xs font-medium truncate text-left ${isLocked ? 'text-gray-500' : 'text-white'}`}>
            {banner.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isLocked ? '#6b7280' : getRarityColor(banner.rarity) }}
            />
            <span className="text-[10px] text-gray-500 capitalize">{banner.rarity}</span>
          </div>
        </div>

        {isLocked && requiredXp > 0 && (
          <div className="px-2.5 pb-2">
            <div className="h-1 bg-dark-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[9px] text-gray-500">{userXp}/{requiredXp}</span>
              <span className="text-[9px] text-gray-600">{Math.round(progress)}%</span>
            </div>
          </div>
        )}
      </button>
    </CustomizationCardBorder>
  );
};

export default BannerSelectionCard;
