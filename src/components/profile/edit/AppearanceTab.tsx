import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  User,
  Palette,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import { Game, ProfileBannerWithUnlockStatus, AvatarGameAffinity } from '../../../types';
import { GameTheme } from '../../../utils/gameThemes';
import FavoriteGameSelector from '../FavoriteGameSelector';
import BannerSelectionCard from '../BannerSelectionCard';
import { Crown, Crosshair, Target, Swords, Rocket, Zap, Gamepad2, Globe } from 'lucide-react';

type BannerMode = 'upload' | 'preset';
type BannerFilter = 'all' | AvatarGameAffinity;

interface BannerCollectionInfo {
  id: BannerFilter;
  name: string;
  icon: React.ElementType;
  color: string;
}

const BANNER_COLLECTIONS: BannerCollectionInfo[] = [
  { id: 'all', name: 'All', icon: Globe, color: '#6b7280' },
  { id: 'lol', name: 'LoL', icon: Crown, color: '#c89b3c' },
  { id: 'warzone', name: 'Warzone', icon: Crosshair, color: '#4a5a3d' },
  { id: 'valorant', name: 'Valorant', icon: Target, color: '#ff4655' },
  { id: 'cs2', name: 'CS2', icon: Swords, color: '#ffb03b' },
  { id: 'apex', name: 'Apex', icon: Rocket, color: '#da291c' },
  { id: 'rocket_league', name: 'Rocket', icon: Zap, color: '#00b4ff' },
  { id: 'universal', name: 'Elite', icon: Gamepad2, color: '#8b5cf6' },
];

interface AppearanceTabProps {
  bannerPreview: string | null;
  isBannerDragging: boolean;
  setIsBannerDragging: (val: boolean) => void;
  bannerInputRef: React.RefObject<HTMLInputElement>;
  processBannerFile: (file: File) => void;
  avatarPreview: string | null;
  displayAvatarUrl: string | null;
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  usePresetAvatar: boolean;
  games: Game[];
  favoriteGameId: string | null;
  setFavoriteGameId: (id: string | null) => void;
  isLoadingGames: boolean;
  theme: GameTheme;
  presetBanners: ProfileBannerWithUnlockStatus[];
  selectedPresetBannerId: string | null;
  onSelectPresetBanner: (bannerId: string | null) => void;
  usePresetBanner: boolean;
  onToggleBannerMode: (usePreset: boolean) => void;
  userXp: number;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  bannerPreview,
  isBannerDragging,
  setIsBannerDragging,
  bannerInputRef,
  processBannerFile,
  displayAvatarUrl,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  fileInputRef,
  handleAvatarChange,
  usePresetAvatar,
  games,
  favoriteGameId,
  setFavoriteGameId,
  isLoadingGames,
  theme,
  presetBanners,
  selectedPresetBannerId,
  onSelectPresetBanner,
  usePresetBanner,
  onToggleBannerMode,
  userXp,
}) => {
  const { t } = useTranslation();
  const [bannerMode, setBannerMode] = useState<BannerMode>(usePresetBanner ? 'preset' : 'upload');
  const [bannerFilter, setBannerFilter] = useState<BannerFilter>('all');

  const handleBannerModeSwitch = (mode: BannerMode) => {
    setBannerMode(mode);
    if (mode === 'upload') {
      onToggleBannerMode(false);
    }
  };

  const filteredBanners = useMemo(() => {
    if (bannerFilter === 'all') return presetBanners;
    return presetBanners.filter(b => b.game_affinity === bannerFilter);
  }, [presetBanners, bannerFilter]);

  const availableBannerCollections = useMemo(() => {
    const affinities = new Set<string>();
    presetBanners.forEach(b => affinities.add(b.game_affinity));
    return BANNER_COLLECTIONS.filter(c => c.id === 'all' || affinities.has(c.id));
  }, [presetBanners]);

  const getBannerCollectionStats = (affinity: BannerFilter) => {
    const banners = affinity === 'all'
      ? presetBanners
      : presetBanners.filter(b => b.game_affinity === affinity);
    const unlocked = banners.filter(b => b.is_unlocked).length;
    return { total: banners.length, unlocked };
  };

  const getAffinityIcon = (affinity: AvatarGameAffinity) => {
    const collection = BANNER_COLLECTIONS.find(c => c.id === affinity);
    if (!collection) return null;
    const Icon = collection.icon;
    return <Icon className="w-3 h-3" style={{ color: collection.color }} />;
  };

  const selectedBannerData = presetBanners.find(b => b.id === selectedPresetBannerId);
  const displayBannerUrl = usePresetBanner && selectedBannerData
    ? selectedBannerData.image_url
    : bannerPreview;

  return (
    <div className="space-y-6">
      <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
        <div className="p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <Camera className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-white">
                {t('profile.bannerImage', 'Banner Image')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('profile.bannerDescription', 'Choose a preset banner or upload your own')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden mb-4">
            {displayBannerUrl ? (
              <img src={displayBannerUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20 0%, ${theme.colors.secondary}15 100%)` }}
              >
                <ImageIcon className="w-8 h-8 text-gray-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => handleBannerModeSwitch('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                bannerMode === 'upload'
                  ? 'text-white'
                  : 'border-gray-700/50 text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
              style={{
                borderColor: bannerMode === 'upload' ? theme.colors.primary : undefined,
                backgroundColor: bannerMode === 'upload' ? `${theme.colors.primary}15` : undefined,
                color: bannerMode === 'upload' ? theme.colors.primary : undefined,
              }}
            >
              <Upload className="w-4 h-4" />
              {t('profile.customUpload', 'Custom Upload')}
            </button>
            <button
              type="button"
              onClick={() => { setBannerMode('preset'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                bannerMode === 'preset'
                  ? 'text-white'
                  : 'border-gray-700/50 text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
              style={{
                borderColor: bannerMode === 'preset' ? theme.colors.primary : undefined,
                backgroundColor: bannerMode === 'preset' ? `${theme.colors.primary}15` : undefined,
                color: bannerMode === 'preset' ? theme.colors.primary : undefined,
              }}
            >
              <ImageIcon className="w-4 h-4" />
              {t('profile.presetBanners', 'Preset Banners')}
            </button>
          </div>

          {bannerMode === 'upload' && (
            <div>
              <div
                className={`relative w-full h-28 rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${isBannerDragging ? 'ring-4 scale-[1.01]' : ''}`}
                style={{
                  border: `2px dashed ${theme.colors.primary}40`,
                  ringColor: theme.colors.primary
                }}
                onClick={() => bannerInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsBannerDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsBannerDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsBannerDragging(false); if (e.dataTransfer.files[0]) processBannerFile(e.dataTransfer.files[0]); }}
              >
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-2"
                  style={{ backgroundColor: `${theme.colors.primary}08` }}
                >
                  <Camera className="w-6 h-6 text-gray-600" />
                  <span className="text-sm text-gray-500">{t('profile.uploadBanner', 'Click or drag to upload a banner')}</span>
                </div>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => { if (e.target.files?.[0]) processBannerFile(e.target.files[0]); }}
              />
              <p className="text-xs text-gray-500 mt-2">{t('profile.bannerHint', 'Recommended: 1200x400px. JPG, PNG or WebP. Max 5MB.')}</p>
            </div>
          )}

          {bannerMode === 'preset' && (
            <div>
              {availableBannerCollections.length > 1 && (
                <div className="mb-4">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {availableBannerCollections.map((collection) => {
                      const stats = getBannerCollectionStats(collection.id);
                      const CollectionIcon = collection.icon;
                      const isActive = bannerFilter === collection.id;
                      return (
                        <button
                          key={collection.id}
                          type="button"
                          onClick={() => setBannerFilter(collection.id)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                            isActive
                              ? 'border-opacity-50'
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPresetBanner(null);
                    onToggleBannerMode(false);
                  }}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    !selectedPresetBannerId || !usePresetBanner
                      ? 'border-2'
                      : 'border-gray-700/50 hover:border-gray-600 hover:bg-dark-200/30'
                  }`}
                  style={{
                    borderColor: (!selectedPresetBannerId || !usePresetBanner) ? theme.colors.primary : undefined,
                    backgroundColor: (!selectedPresetBannerId || !usePresetBanner) ? `${theme.colors.primary}10` : undefined,
                  }}
                >
                  <div className="w-full aspect-[3/1] bg-dark-300/50 flex items-center justify-center">
                    <X className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-medium text-gray-400 text-left">{t('profile.customization.useCustomUpload', 'Use Custom Upload')}</p>
                  </div>
                </button>
                {filteredBanners.map((banner) => (
                  <BannerSelectionCard
                    key={banner.id}
                    banner={banner}
                    isSelected={usePresetBanner && selectedPresetBannerId === banner.id}
                    onClick={() => {
                      onSelectPresetBanner(banner.id);
                      onToggleBannerMode(true);
                    }}
                    userXp={userXp}
                    themeColor={theme.colors.primary}
                    gameAffinityIcon={getAffinityIcon(banner.game_affinity)}
                  />
                ))}
              </div>
              {filteredBanners.length === 0 && bannerFilter !== 'all' && (
                <div className="py-6 text-center text-gray-500 text-sm">
                  {t('profile.customization.noBannersInCollection', 'No banners in this collection')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-gray-800/50"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, ${theme.colors.secondary}10 50%, transparent 100%)`
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <User className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-white">
                {t('profile.avatarPhoto', 'Avatar Photo')}
              </h2>
              <p className="text-xs text-gray-400">
                {usePresetAvatar
                  ? t('profile.usingPresetAvatar', 'Using a preset avatar from Customization tab')
                  : t('profile.dragDropOrClick')}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div
              className={`
                relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden flex-shrink-0
                cursor-pointer group transition-all duration-300
                ${isDragging ? 'ring-4 scale-105' : ''}
              `}
              style={{
                boxShadow: `0 0 30px ${theme.colors.primary}30`,
                border: `3px solid ${theme.colors.primary}40`,
                ringColor: theme.colors.primary
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {displayAvatarUrl ? (
                <img
                  src={displayAvatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <User className="w-12 h-12 text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-white mb-2" />
                <span className="text-xs text-white font-medium">
                  {t('profile.changePhoto')}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleAvatarChange}
                className="hidden"
                accept="image/jpeg, image/png, image/gif, image/webp"
              />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-gray-400 mb-3">
                {t('profile.dragDropOrClick')}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="px-2 py-1 rounded-md bg-dark-200/50">JPG</span>
                <span className="px-2 py-1 rounded-md bg-dark-200/50">PNG</span>
                <span className="px-2 py-1 rounded-md bg-dark-200/50">GIF</span>
                <span className="px-2 py-1 rounded-md bg-dark-200/50">WebP</span>
                <span className="px-2 py-1 rounded-md bg-dark-200/50">Max 5MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
        <div className="p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <Palette className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-white">
                {t('profile.profileTheme')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('profile.profileThemeDescription', 'Select your favorite game to customize your profile theme')}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <FavoriteGameSelector
            games={games}
            selectedGameId={favoriteGameId}
            onSelect={setFavoriteGameId}
            isLoading={isLoadingGames}
            variant="grid"
            showLabel={true}
            showColorPreview={true}
          />
        </div>
      </div>
    </div>
  );
};

export default AppearanceTab;
