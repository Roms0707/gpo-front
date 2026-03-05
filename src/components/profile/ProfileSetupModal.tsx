import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Camera,
  Upload,
  User,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader
} from 'lucide-react';
import { User as UserType } from '../../types';
import { GameTheme } from '../../utils/gameThemes';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  theme: GameTheme;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BIO_LENGTH = 500;

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onClose, user, theme }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [bio, setBio] = useState(user?.bio || '');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user?.banner_url || null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const steps = useMemo(() => [
    { icon: Camera, label: t('profile.setupStepAvatar', 'Profile Picture'), done: !!avatarPreview },
    { icon: FileText, label: t('profile.setupStepBio', 'Bio'), done: bio.trim().length > 0 },
    { icon: ImageIcon, label: t('profile.setupStepBanner', 'Banner'), done: !!bannerPreview },
  ], [avatarPreview, bio, bannerPreview, t]);

  const handleFileSelect = useCallback((file: File, type: 'avatar' | 'banner') => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t('profile.invalidFileType', 'Please use JPG, PNG, or WebP'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('profile.fileTooLarge', 'File must be under 5MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (type === 'avatar') {
        setAvatarFile(file);
        setAvatarPreview(url);
      } else {
        setBannerFile(file);
        setBannerPreview(url);
      }
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent, type: 'avatar' | 'banner') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file, type);
  }, [handleFileSelect]);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user?.id) return null;
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      const updates: Record<string, string | null> = {};

      if (avatarFile) {
        const url = await uploadFile(avatarFile, 'avatars');
        if (url) updates.avatar_url = url;
      }

      if (bio.trim() !== (user.bio || '')) {
        updates.bio = bio.trim() || null;
      }

      if (bannerFile) {
        const url = await uploadFile(bannerFile, 'banners');
        if (url) updates.banner_url = url;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);

        if (error) throw error;

        const checkSession = useAuthStore.getState().checkSession;
        await checkSession();
      }

      toast.success(t('profile.setupSaved', 'Profile updated!'));
      onClose();
    } catch (error) {
      console.error('Error saving profile setup:', error);
      toast.error(t('profile.errorSavingSetup', 'Error saving changes'));
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSave();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="font-bold text-lg text-white">
            {t('profile.setupTitle', 'Configure Your Profile')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-3">
          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i === currentStep
                        ? 'text-white'
                        : i < currentStep || step.done
                          ? 'text-white'
                          : 'text-gray-500 bg-gray-800'
                    }`}
                    style={
                      i === currentStep
                        ? { backgroundColor: theme.colors.primary }
                        : i < currentStep || step.done
                          ? { backgroundColor: `${theme.colors.primary}60` }
                          : {}
                    }
                  >
                    {(i < currentStep || step.done) && i !== currentStep ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-xs hidden sm:inline ${
                    i === currentStep ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-px"
                    style={{
                      backgroundColor: i < currentStep ? theme.colors.primary : 'rgb(55 65 81)'
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-6 py-6 min-h-[280px]">
          {currentStep === 0 && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-400 text-center mb-2">
                {t('profile.setupAvatarDesc', 'Choose a profile picture that represents you.')}
              </p>
              <div
                className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, 'avatar')}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  border: `3px dashed ${theme.colors.primary}40`
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                    <User className="w-10 h-10 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'avatar');
                }}
              />
              <p className="text-xs text-gray-500">
                {t('profile.setupAvatarHint', 'JPG, PNG or WebP. Max 5MB.')}
              </p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-400">
                {t('profile.setupBioDesc', 'Tell others about yourself. What games do you play?')}
              </p>
              <div className="relative">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                  rows={5}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 resize-none"
                  style={{ focusRingColor: theme.colors.primary } as React.CSSProperties}
                  placeholder={t('profile.bioPlaceholder', 'Write something about yourself...')}
                />
                <span className="absolute bottom-3 right-3 text-xs text-gray-500">
                  {bio.length}/{MAX_BIO_LENGTH}
                </span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-400 text-center mb-2">
                {t('profile.setupBannerDesc', 'Add a banner to personalize your profile page.')}
              </p>
              <div
                className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => bannerInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, 'banner')}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  border: `2px dashed ${theme.colors.primary}40`
                }}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                    <span className="text-sm text-gray-500">
                      {t('profile.setupBannerHint', 'Click or drop an image here')}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'banner');
                }}
              />
              <p className="text-xs text-gray-500">
                {t('profile.setupBannerSize', 'Recommended: 1200x400px. JPG, PNG or WebP. Max 5MB.')}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center justify-between">
          <button
            onClick={currentStep === 0 ? goNext : goPrev}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            {currentStep === 0
              ? t('profile.setupSkip', 'Skip')
              : (
                <span className="flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  {t('profile.setupBack', 'Back')}
                </span>
              )}
          </button>
          <button
            onClick={goNext}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              boxShadow: `0 4px 12px ${theme.colors.primary}40`
            }}
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t('profile.saving', 'Saving...')}
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                {t('profile.setupSave', 'Save')}
              </>
            ) : (
              <>
                {t('profile.setupNext', 'Next')}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupModal;
