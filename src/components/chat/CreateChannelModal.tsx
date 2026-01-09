import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MessageSquare, Plus, Info, Globe, Lock, Upload, Image, Sparkles } from 'lucide-react';
import { createChannel } from '../../services/channelService';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelCreated: (channelId: string, channelName: string) => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  onChannelCreated
}) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCommunity, setIsCommunity] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle clicks outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Add event listener with a small delay to avoid immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      const validFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validFileTypes.includes(file.type)) {
        toast.error(t('chat.unsupportedFileType'));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('chat.imageTooLarge'));
        return;
      }
      
      setImageFile(file);
      // Create a temporary URL for preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };
  
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      setIsUploading(true);
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `community-${Date.now()}.${fileExt}`;
      const filePath = `community-images/${fileName}`;
      
      // Upload the image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('chat.uploadImageError'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelName.trim()) {
      toast.error(t('chat.channelNameRequired'));
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Upload image if selected
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      
      const result = await createChannel(
        channelName.trim(),
        channelDescription.trim(),
        isPrivate,
        isCommunity,
        imageUrl
      );
      
      if (result) {
        toast.success(t('chat.channelCreated'));
        onChannelCreated(result.id, channelName.trim());
        
        // Reset form
        setChannelName('');
        setChannelDescription('');
        setImageFile(null);
        setImagePreview(null);
        setIsPrivate(false);
        setIsCommunity(false);
        
        // Close modal
        onClose();
      } else {
        toast.error(t('chat.channelCreationError'));
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Erreur lors de la création du canal');
    } finally {
      setIsCreating(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-auto">
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-dark-100 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          boxShadow: `0 0 60px ${primaryColor}15, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: `1px solid`,
            borderImage: `linear-gradient(135deg, ${primaryColor}40, transparent 40%, transparent 60%, ${primaryColor}20) 1`,
          }}
        />
        <div className="absolute inset-0 rounded-2xl border border-gray-700/30 pointer-events-none" />

        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20"
          style={{ background: `radial-gradient(circle, ${primaryColor}25 0%, transparent 70%)` }}
        />

        <div className="relative flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
            </div>
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
              {t('chat.createNewChannel')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="relative flex flex-col flex-1">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('chat.communityImage')}
                </label>
                <div className="flex items-center">
                  <div
                    className="relative w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300"
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={() => setIsImageHovered(true)}
                    onMouseLeave={() => setIsImageHovered(false)}
                    style={{
                      background: imagePreview ? 'transparent' : `linear-gradient(135deg, ${primaryColor}10 0%, ${primaryColor}05 100%)`,
                      border: `2px dashed ${isImageHovered ? primaryColor : '#4B5563'}`,
                      boxShadow: isImageHovered ? `0 0 20px ${primaryColor}20` : 'none',
                    }}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image
                        className="h-8 w-8 transition-colors duration-300"
                        style={{ color: isImageHovered ? primaryColor : '#6B7280' }}
                      />
                    )}
                    {isImageHovered && !imagePreview && (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl"
                      >
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t('chat.chooseImage')}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {t('chat.imageFormats')}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif, image/webp"
                  />
                </div>
              </div>
              
              <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('chat.channelNameLabel')} <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-lg transition-all duration-300 pointer-events-none"
                  style={{
                    opacity: isNameFocused ? 1 : 0,
                    boxShadow: `0 0 0 2px ${primaryColor}40, 0 0 20px ${primaryColor}15`,
                  }}
                />
                <span
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
                  style={{ color: isNameFocused ? primaryColor : '#6B7280' }}
                >
                  #
                </span>
                <input
                  ref={nameInputRef}
                  type="text"
                  id="channelName"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-gray-900 dark:text-white focus:outline-none transition-all duration-200"
                  placeholder={t('chat.channelNamePlaceholder')}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {t('chat.channelNameHint')}
              </p>
            </div>
            
            <div>
              <label htmlFor="channelDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('chat.descriptionLabel')}
              </label>
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-lg transition-all duration-300 pointer-events-none"
                  style={{
                    opacity: isDescFocused ? 1 : 0,
                    boxShadow: `0 0 0 2px ${primaryColor}40, 0 0 20px ${primaryColor}15`,
                  }}
                />
                <textarea
                  id="channelDescription"
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  onFocus={() => setIsDescFocused(true)}
                  onBlur={() => setIsDescFocused(false)}
                  className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none transition-all duration-200 min-h-[80px] resize-none"
                  placeholder={t('chat.descriptionPlaceholder')}
                />
              </div>
            </div>
            
            <div
              className="space-y-3 p-4 rounded-xl border"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}05 0%, transparent 100%)`,
                borderColor: `${primaryColor}15`,
              }}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCommunity"
                  checked={isCommunity}
                  onChange={(e) => {
                    setIsCommunity(e.target.checked);
                    if (e.target.checked) {
                      setIsPrivate(false);
                    }
                  }}
                  className="mr-3 w-4 h-4 rounded border-gray-400 dark:border-gray-600 bg-white dark:bg-dark-300 focus:ring-2 transition-colors"
                  style={{
                    accentColor: primaryColor,
                  }}
                />
                <div>
                  <label htmlFor="isCommunity" className="text-sm text-gray-700 dark:text-gray-300 flex items-center cursor-pointer">
                    <Globe className="h-4 w-4 mr-1.5" style={{ color: primaryColor }} />
                    {t('chat.openCommunity')}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('chat.openCommunityHint')}
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50" />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => {
                    setIsPrivate(e.target.checked);
                    if (e.target.checked) {
                      setIsCommunity(false);
                    }
                  }}
                  disabled={isCommunity}
                  className="mr-3 w-4 h-4 rounded border-gray-400 dark:border-gray-600 bg-white dark:bg-dark-300 focus:ring-2 disabled:opacity-50 transition-colors"
                  style={{
                    accentColor: primaryColor,
                  }}
                />
                <div>
                  <label htmlFor="isPrivate" className={`text-sm ${isPrivate ? 'text-gray-700 dark:text-gray-300' : isCommunity ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'} flex items-center cursor-pointer`}>
                    <Lock className="h-4 w-4 mr-1.5" style={{ color: isCommunity ? '#6B7280' : primaryColor }} />
                    {t('chat.privateChannel')}
                  </label>
                  <p className={`text-xs ${isCommunity ? 'text-gray-500 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'} mt-0.5`}>
                    {t('chat.privateChannelHint')}
                  </p>
                </div>
              </div>
            </div>
            
            {isCommunity && (
              <div className="bg-info-100 dark:bg-info-500/20 border border-info-300 dark:border-info-600/30 p-3 rounded-lg flex items-start">
                <Info className="h-5 w-5 text-info-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-info-700 dark:text-info-300">
                  {t('chat.openCommunityInfo')}
                </p>
              </div>
            )}
            
            {isPrivate && (
              <div className="bg-info-100 dark:bg-info-500/20 border border-info-300 dark:border-info-600/30 p-3 rounded-lg flex items-start">
                <Info className="h-5 w-5 text-info-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-info-700 dark:text-info-300">
                  {t('chat.privateChannelInfo')}
                </p>
              </div>
            )}
          </div>
          
          <div className="relative p-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end space-x-3 flex-shrink-0 bg-white dark:bg-dark-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white rounded-lg transition-all duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isCreating || isUploading || !channelName.trim()}
              className="px-5 py-2.5 text-white rounded-lg transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] disabled:hover:scale-100"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
                boxShadow: `0 0 20px ${primaryColor}30`,
              }}
            >
              {isCreating || isUploading ? (
                <>
                  <span className="animate-spin mr-2">&#8635;</span>
                  {isUploading ? t('chat.uploading') : t('chat.creating')}
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('chat.createChannel')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;