import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Save,
  User,
  Loader,
  Palette,
  Camera,
  Info,
  MapPin,
  Phone,
  MessageCircle,
  Check,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { countries } from '../utils/countries';
import { validateUserProfile, fetchGames } from '../services/api';
import { Game, ProfileFrameWithUnlockStatus, ProfileBadgeWithUnlockStatus, ProfileAvatarWithUnlockStatus, ProfileFrame, ProfileBadge } from '../types';
import FavoriteGameSelector from '../components/profile/FavoriteGameSelector';
import ProfilePreviewModal from '../components/profile/ProfilePreviewModal';
import AvatarWithFrame from '../components/profile/AvatarWithFrame';
import ProfileCustomizationSection from '../components/profile/ProfileCustomizationSection';
import { getGameTheme, GameTheme } from '../utils/gameThemes';
import {
  fetchAvailableFrames,
  fetchAvailableBadges,
  fetchUserCustomization,
  saveUserCustomization
} from '../services/profileCustomizationService';
import { fetchAvatarsWithUnlockStatus } from '../services/avatarService';
import toast from 'react-hot-toast';

const MAX_BIO_LENGTH = 500;

const ProfileEditPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [discordHandle, setDiscordHandle] = useState(user?.discord_handle || '');
  const [twitterHandle, setTwitterHandle] = useState(user?.twitter_handle || '');
  const [country] = useState(user?.country || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.msisdn || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [favoriteGameId, setFavoriteGameId] = useState<string | null>(user?.favorite_game_id || null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isThemeSectionExpanded, setIsThemeSectionExpanded] = useState(true);
  const [isCustomizationExpanded, setIsCustomizationExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarFrames, setAvatarFrames] = useState<ProfileFrameWithUnlockStatus[]>([]);
  const [modalFrames, setModalFrames] = useState<ProfileFrameWithUnlockStatus[]>([]);
  const [badges, setBadges] = useState<ProfileBadgeWithUnlockStatus[]>([]);
  const [presetAvatars, setPresetAvatars] = useState<ProfileAvatarWithUnlockStatus[]>([]);
  const [selectedAvatarFrameId, setSelectedAvatarFrameId] = useState<string | null>(null);
  const [selectedModalFrameId, setSelectedModalFrameId] = useState<string | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [selectedPresetAvatarId, setSelectedPresetAvatarId] = useState<string | null>(null);
  const [usePresetAvatar, setUsePresetAvatar] = useState(false);
  const [initialAvatarFrameId, setInitialAvatarFrameId] = useState<string | null>(null);
  const [initialModalFrameId, setInitialModalFrameId] = useState<string | null>(null);
  const [initialBadgeId, setInitialBadgeId] = useState<string | null>(null);
  const [initialPresetAvatarId, setInitialPresetAvatarId] = useState<string | null>(null);
  const [initialUsePresetAvatar, setInitialUsePresetAvatar] = useState(false);
  const [isLoadingCustomization, setIsLoadingCustomization] = useState(true);

  const hasUnsavedChanges = useMemo(() => {
    if (!user) return false;
    return (
      username !== (user.username || '') ||
      bio !== (user.bio || '') ||
      discordHandle !== (user.discord_handle || '') ||
      twitterHandle !== (user.twitter_handle || '') ||
      phoneNumber !== (user.msisdn || '') ||
      favoriteGameId !== (user.favorite_game_id || null) ||
      avatar !== null ||
      selectedAvatarFrameId !== initialAvatarFrameId ||
      selectedModalFrameId !== initialModalFrameId ||
      selectedBadgeId !== initialBadgeId ||
      selectedPresetAvatarId !== initialPresetAvatarId ||
      usePresetAvatar !== initialUsePresetAvatar
    );
  }, [user, username, bio, discordHandle, twitterHandle, phoneNumber, favoriteGameId, avatar, selectedAvatarFrameId, selectedModalFrameId, selectedBadgeId, selectedPresetAvatarId, usePresetAvatar, initialAvatarFrameId, initialModalFrameId, initialBadgeId, initialPresetAvatarId, initialUsePresetAvatar]);

  const selectedAvatarFrame = useMemo(() => {
    return avatarFrames.find(f => f.id === selectedAvatarFrameId) || null;
  }, [avatarFrames, selectedAvatarFrameId]);

  const selectedBadge = useMemo(() => {
    return badges.find(b => b.id === selectedBadgeId) || null;
  }, [badges, selectedBadgeId]);

  const selectedPresetAvatarData = useMemo(() => {
    return presetAvatars.find(a => a.id === selectedPresetAvatarId) || null;
  }, [presetAvatars, selectedPresetAvatarId]);

  const displayAvatarUrl = useMemo(() => {
    if (usePresetAvatar && selectedPresetAvatarData) {
      return selectedPresetAvatarData.image_url;
    }
    return avatarPreview;
  }, [usePresetAvatar, selectedPresetAvatarData, avatarPreview]);

  const selectedGame = useMemo(() => {
    if (!favoriteGameId) return null;
    return games.find(g => g.id === favoriteGameId) || null;
  }, [games, favoriteGameId]);

  const theme: GameTheme = useMemo(() => {
    return getGameTheme(selectedGame?.name || null);
  }, [selectedGame]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoadingGames(true);
        const gamesData = await fetchGames();
        setGames(gamesData);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setIsLoadingGames(false);
      }
    };
    loadGames();
  }, []);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setDiscordHandle(user.discord_handle || '');
      setTwitterHandle(user.twitter_handle || '');
      setPhoneNumber(user.msisdn || '');
      setAvatarPreview(user.avatar_url || null);
      setFavoriteGameId(user.favorite_game_id || null);
    }
  }, [user]);

  useEffect(() => {
    const loadCustomizationData = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingCustomization(true);

        const [avatarFramesData, modalFramesData, badgesData, presetAvatarsData, userCustomization] = await Promise.all([
          fetchAvailableFrames(user.id, 'avatar'),
          fetchAvailableFrames(user.id, 'modal'),
          fetchAvailableBadges(user.id),
          fetchAvatarsWithUnlockStatus(user.id, user.xp || 0),
          fetchUserCustomization(user.id),
        ]);

        setAvatarFrames(avatarFramesData);
        setModalFrames(modalFramesData);
        setBadges(badgesData);
        setPresetAvatars(presetAvatarsData);

        if (userCustomization) {
          setSelectedAvatarFrameId(userCustomization.avatar_frame_id || null);
          setSelectedModalFrameId(userCustomization.modal_frame_id || null);
          setSelectedBadgeId(userCustomization.avatar_badge_id || null);
          setSelectedPresetAvatarId(userCustomization.selected_avatar_id || null);
          setUsePresetAvatar(userCustomization.use_preset_avatar || false);
          setInitialAvatarFrameId(userCustomization.avatar_frame_id || null);
          setInitialModalFrameId(userCustomization.modal_frame_id || null);
          setInitialBadgeId(userCustomization.avatar_badge_id || null);
          setInitialPresetAvatarId(userCustomization.selected_avatar_id || null);
          setInitialUsePresetAvatar(userCustomization.use_preset_avatar || false);
        }
      } catch (error) {
        console.error('Error loading customization data:', error);
      } finally {
        setIsLoadingCustomization(false);
      }
    };

    loadCustomizationData();
  }, [user?.id, user?.xp]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAvatarFile(e.target.files[0]);
    }
  };

  const processAvatarFile = (file: File) => {
    const validFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validFileTypes.includes(file.type)) {
      toast.error(t('profile.unsupportedFileType'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.imageTooLarge'));
      return;
    }

    setAvatar(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAvatarFile(e.dataTransfer.files[0]);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatar || !user?.id) return null;

    try {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('profile.errorUploadingAvatar'));
      return null;
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    try {
      setIsLoading(true);

      const validationResult = await validateUserProfile(user.id, {
        username,
        bio,
        discord_handle: discordHandle,
        twitter_handle: twitterHandle,
        country,
        msisdn: phoneNumber
      });

      if (!validationResult.success) {
        toast.error(validationResult.error || 'Profile validation failed');
        return;
      }

      let avatarUrl = user.avatar_url;
      if (usePresetAvatar && selectedPresetAvatarData) {
        avatarUrl = selectedPresetAvatarData.image_url;
      } else if (avatar) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const finalCountry = user.country;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username,
          bio,
          discord_handle: discordHandle,
          twitter_handle: twitterHandle,
          country: finalCountry,
          msisdn: phoneNumber || null,
          avatar_url: avatarUrl,
          favorite_game_id: favoriteGameId,
          is_profile_completed: true
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const hasCustomizationChanges =
        selectedAvatarFrameId !== initialAvatarFrameId ||
        selectedModalFrameId !== initialModalFrameId ||
        selectedBadgeId !== initialBadgeId ||
        selectedPresetAvatarId !== initialPresetAvatarId ||
        usePresetAvatar !== initialUsePresetAvatar;

      if (hasCustomizationChanges) {
        await saveUserCustomization(user.id, {
          avatar_frame_id: selectedAvatarFrameId,
          modal_frame_id: selectedModalFrameId,
          avatar_badge_id: selectedBadgeId,
          selected_avatar_id: selectedPresetAvatarId,
          use_preset_avatar: usePresetAvatar,
        });
        setInitialAvatarFrameId(selectedAvatarFrameId);
        setInitialModalFrameId(selectedModalFrameId);
        setInitialBadgeId(selectedBadgeId);
        setInitialPresetAvatarId(selectedPresetAvatarId);
        setInitialUsePresetAvatar(usePresetAvatar);
      }

      if (favoriteGameId) {
        const selectedGameData = games.find(g => g.id === favoriteGameId);
        if (selectedGameData) {
          localStorage.setItem('favorite_game_cache', JSON.stringify({
            gameId: favoriteGameId,
            gameName: selectedGameData.name
          }));
        }
      } else {
        localStorage.removeItem('favorite_game_cache');
      }

      const checkSession = useAuthStore.getState().checkSession;
      await checkSession();

      toast.success(t('profile.profileUpdatedSuccess'));

      window.scrollTo(0, 0);
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.errorUpdatingProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      navigate('/profile');
    }
  };

  const bioCharacterCount = bio.length;
  const bioPercentage = (bioCharacterCount / MAX_BIO_LENGTH) * 100;

  return (
    <div
      className="min-h-screen pt-28 pb-24"
      style={{
        background: `linear-gradient(180deg, ${theme.colors.primary}08 0%, transparent 30%)`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('profile.backToProfile')}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <form onSubmit={handleSaveProfile} className="space-y-8">
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
                  <div
                    className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-15"
                    style={{ backgroundColor: theme.colors.secondary }}
                  />

                  <div className="relative z-10 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${theme.colors.primary}20` }}
                      >
                        <User className="w-5 h-5" style={{ color: theme.colors.primary }} />
                      </div>
                      <div>
                        <h1 className="font-heading font-bold text-2xl text-white">
                          {t('profile.editMyProfile')}
                        </h1>
                        <p className="text-sm text-gray-400">
                          {t('profile.updateYourPersonalInfo')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
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
                  <div className="p-6 border-b border-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${theme.colors.primary}20` }}
                      >
                        <Info className="w-5 h-5" style={{ color: theme.colors.primary }} />
                      </div>
                      <h2 className="font-heading font-semibold text-lg text-white">
                        {t('profile.personalInformation')}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                        {t('profile.username')}
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white transition-all focus:outline-none focus:border-transparent"
                        style={{
                          boxShadow: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary}40`;
                          e.target.style.borderColor = theme.colors.primary;
                        }}
                        onBlur={(e) => {
                          e.target.style.boxShadow = 'none';
                          e.target.style.borderColor = '';
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                        {t('profile.biography')}
                      </label>
                      <div className="relative">
                        <textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                          className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white transition-all focus:outline-none min-h-[120px] resize-none"
                          placeholder={t('profile.tellUsAboutYou')}
                          style={{
                            boxShadow: 'none'
                          }}
                          onFocus={(e) => {
                            e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary}40`;
                            e.target.style.borderColor = theme.colors.primary;
                          }}
                          onBlur={(e) => {
                            e.target.style.boxShadow = 'none';
                            e.target.style.borderColor = '';
                          }}
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <span className={`text-xs ${bioPercentage > 90 ? 'text-warning-400' : 'text-gray-500'}`}>
                            {bioCharacterCount}/{MAX_BIO_LENGTH}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 h-1 bg-dark-300 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300 rounded-full"
                          style={{
                            width: `${bioPercentage}%`,
                            backgroundColor: bioPercentage > 90 ? '#f59e0b' : theme.colors.primary
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
                  <div className="p-6 border-b border-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${theme.colors.primary}20` }}
                      >
                        <MessageCircle className="w-5 h-5" style={{ color: theme.colors.primary }} />
                      </div>
                      <h2 className="font-heading font-semibold text-lg text-white">
                        {t('profile.socialConnections')}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="discordHandle" className="block text-sm font-medium text-gray-300 mb-2">
                          {t('profile.discordHandle')}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                          </div>
                          <input
                            type="text"
                            id="discordHandle"
                            value={discordHandle}
                            onChange={(e) => setDiscordHandle(e.target.value)}
                            className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl pl-14 pr-4 py-3 text-white transition-all focus:outline-none"
                            placeholder="username"
                            style={{ boxShadow: 'none' }}
                            onFocus={(e) => {
                              e.target.style.boxShadow = `0 0 0 2px #5865F240`;
                              e.target.style.borderColor = '#5865F2';
                            }}
                            onBlur={(e) => {
                              e.target.style.boxShadow = 'none';
                              e.target.style.borderColor = '';
                            }}
                          />
                          {discordHandle && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Check className="w-4 h-4 text-success-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="twitterHandle" className="block text-sm font-medium text-gray-300 mb-2">
                          {t('profile.twitchHandle')}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#9146FF]/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                            </svg>
                          </div>
                          <input
                            type="text"
                            id="twitterHandle"
                            value={twitterHandle}
                            onChange={(e) => setTwitterHandle(e.target.value)}
                            className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl pl-14 pr-4 py-3 text-white transition-all focus:outline-none"
                            placeholder="your_twitch_username"
                            style={{ boxShadow: 'none' }}
                            onFocus={(e) => {
                              e.target.style.boxShadow = `0 0 0 2px #9146FF40`;
                              e.target.style.borderColor = '#9146FF';
                            }}
                            onBlur={(e) => {
                              e.target.style.boxShadow = 'none';
                              e.target.style.borderColor = '';
                            }}
                          />
                          {twitterHandle && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Check className="w-4 h-4 text-success-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
                  <div className="p-6 border-b border-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${theme.colors.primary}20` }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: theme.colors.primary }} />
                      </div>
                      <div>
                        <h2 className="font-heading font-semibold text-lg text-white">
                          {t('profile.requiredInformation')}
                        </h2>
                        <p className="text-xs text-gray-400">
                          {t('profile.importantInfoRequiredForTournaments')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="p-4 rounded-xl bg-info-500/10 border border-info-500/20">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-info-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-info-300">
                          {t('profile.tournamentInfoNote')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                          {t('profile.countryOfResidenceRequired')} <span className="text-error-400">*</span>
                        </label>
                        <div className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white flex items-center">
                          {country ? (
                            <span className="flex items-center gap-2">
                              <span className="text-lg">{countries.find((c) => c.code === country)?.flag}</span>
                              {countries.find((c) => c.code === country)?.name || country}
                            </span>
                          ) : (
                            <span className="text-gray-500">{t('profile.notDefined')}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                          {t('profile.countryDetectedAutomatically')}
                        </p>
                      </div>

                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                          {t('profile.phoneNumberOptional')}{' '}
                          <span className="text-gray-500 text-xs">({t('profile.optional')})</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-700/30 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-dark-200/50 border border-gray-700/50 rounded-xl pl-14 pr-4 py-3 text-white transition-all focus:outline-none"
                            placeholder="+33 6 12 34 56 78"
                            disabled={isLoading}
                            style={{ boxShadow: 'none' }}
                            onFocus={(e) => {
                              e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary}40`;
                              e.target.style.borderColor = theme.colors.primary;
                            }}
                            onBlur={(e) => {
                              e.target.style.boxShadow = 'none';
                              e.target.style.borderColor = '';
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                          {t('profile.internationalFormatRecommended')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-4">
                <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
                  <div className="p-4 border-b border-gray-800/50">
                    <h3 className="text-sm font-medium text-gray-400">{t('profile.livePreview')}</h3>
                  </div>

                  <div
                    className="p-5"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, ${theme.colors.secondary}10 50%, transparent 100%)`
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <AvatarWithFrame
                        avatarUrl={displayAvatarUrl}
                        username={username}
                        frame={selectedAvatarFrame}
                        badge={selectedBadge}
                        size="lg"
                        themeColor={theme.colors.primary}
                        className="mb-3"
                      />

                      <h3 className="font-heading font-bold text-lg text-white mb-1">
                        {username || 'Username'}
                      </h3>

                      {selectedGame && (
                        <span
                          className="inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2"
                          style={{
                            backgroundColor: `${theme.colors.primary}25`,
                            color: theme.colors.primary,
                            border: `1px solid ${theme.colors.primary}30`
                          }}
                        >
                          {selectedGame.name}
                        </span>
                      )}

                      {bio && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                          {bio}
                        </p>
                      )}

                      <div className="w-full space-y-1.5">
                        {discordHandle && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-dark-200/50 text-xs">
                            <svg className="w-3.5 h-3.5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            <span className="text-gray-300 truncate">{discordHandle}</span>
                          </div>
                        )}
                        {twitterHandle && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-dark-200/50 text-xs">
                            <svg className="w-3.5 h-3.5 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                            </svg>
                            <span className="text-gray-300 truncate">{twitterHandle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full py-3.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group"
                  style={{
                    backgroundColor: `${theme.colors.primary}15`,
                    border: `1px solid ${theme.colors.primary}30`,
                    color: theme.colors.primary
                  }}
                >
                  <Eye className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>{t('profile.previewAsOthersSeeYou')}</span>
                </button>
                <p className="text-xs text-gray-500 text-center -mt-2 mb-4">
                  {t('profile.previewDescription')}
                </p>

                <div className="bg-dark-100/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsThemeSectionExpanded(!isThemeSectionExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-dark-200/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${theme.colors.primary}20` }}
                      >
                        <Palette className="w-4 h-4" style={{ color: theme.colors.primary }} />
                      </div>
                      <span className="text-sm font-medium text-white">{t('profile.profileTheme')}</span>
                    </div>
                    {isThemeSectionExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isThemeSectionExpanded && (
                    <div className="px-4 pb-4">
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
                  )}
                </div>

                <ProfileCustomizationSection
                  avatarFrames={avatarFrames}
                  modalFrames={modalFrames}
                  badges={badges}
                  presetAvatars={presetAvatars}
                  selectedAvatarFrameId={selectedAvatarFrameId}
                  selectedModalFrameId={selectedModalFrameId}
                  selectedBadgeId={selectedBadgeId}
                  selectedPresetAvatarId={selectedPresetAvatarId}
                  usePresetAvatar={usePresetAvatar}
                  onSelectAvatarFrame={setSelectedAvatarFrameId}
                  onSelectModalFrame={setSelectedModalFrameId}
                  onSelectBadge={setSelectedBadgeId}
                  onSelectPresetAvatar={(avatarId) => {
                    setSelectedPresetAvatarId(avatarId);
                    setUsePresetAvatar(avatarId !== null);
                  }}
                  userXp={user?.xp || 0}
                  themeColor={theme.colors.primary}
                  avatarUrl={avatarPreview}
                  isLoading={isLoadingCustomization}
                  isExpanded={isCustomizationExpanded}
                  onToggleExpand={() => setIsCustomizationExpanded(!isCustomizationExpanded)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-dark-100/95 backdrop-blur-md border-t border-gray-800/50 py-4 px-4 z-40">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="text-sm text-warning-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-warning-400 animate-pulse" />
                  {t('profile.unsavedChanges')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelClick}
                className="px-5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-dark-200 transition-all font-medium"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.text,
                  boxShadow: `0 4px 15px ${theme.colors.primary}40`
                }}
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    {t('profile.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t('profile.save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 rounded-2xl border border-gray-800 max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-warning-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-warning-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">
                    {t('profile.unsavedChangesTitle')}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {t('profile.unsavedChangesDescription')}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-dark-200/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-300 transition-all"
              >
                {t('common.keepEditing')}
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 rounded-lg bg-error-600 hover:bg-error-700 text-white transition-all"
              >
                {t('common.discardChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfilePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        username={username}
        bio={bio}
        avatarPreview={displayAvatarUrl}
        discordHandle={discordHandle}
        twitchHandle={twitterHandle}
        country={country}
        selectedGame={selectedGame}
        memberSince={user?.created_at}
        avatarFrame={selectedAvatarFrame}
        modalFrame={modalFrames.find(f => f.id === selectedModalFrameId) || null}
        badge={selectedBadge}
      />
    </div>
  );
};

export default ProfileEditPage;
