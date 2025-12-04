import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MessageSquare, Plus, Info, Globe, Lock, Upload, Image } from 'lucide-react';
import { createChannel } from '../../services/channelService';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

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
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCommunity, setIsCommunity] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-auto">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Plus className="text-primary-500 h-5 w-5 mr-2" />
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
              {t('chat.createNewChannel')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              {/* Channel Image */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('chat.communityImage')}
                </label>
                <div className="flex items-center">
                  <div 
                    className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-dark-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 dark:hover:bg-dark-400 transition-colors border border-gray-300 dark:border-gray-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-8 w-8 text-gray-500 dark:text-gray-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-300 dark:hover:bg-dark-400 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors flex items-center"
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
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-500">
                  #
                </span>
                <input
                  ref={nameInputRef}
                  type="text"
                  id="channelName"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg pl-8 pr-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <textarea
                id="channelDescription"
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                placeholder={t('chat.descriptionPlaceholder')}
              />
            </div>
            
            <div className="space-y-3 bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCommunity"
                  checked={isCommunity}
                  onChange={(e) => {
                    setIsCommunity(e.target.checked);
                    // If it's a community, it can't be private
                    if (e.target.checked) {
                      setIsPrivate(false);
                    }
                  }}
                  className="mr-2 rounded border-gray-400 dark:border-gray-600 bg-white dark:bg-dark-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <label htmlFor="isCommunity" className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Globe className="h-4 w-4 mr-1 text-primary-400" />
                    {t('chat.openCommunity')}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('chat.openCommunityHint')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => {
                    setIsPrivate(e.target.checked);
                    // If it's private, it can't be a community
                    if (e.target.checked) {
                      setIsCommunity(false);
                    }
                  }}
                  disabled={isCommunity}
                  className="mr-2 rounded border-gray-400 dark:border-gray-600 bg-white dark:bg-dark-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                />
                <div>
                  <label htmlFor="isPrivate" className={`text-sm ${isPrivate ? 'text-gray-700 dark:text-gray-300' : isCommunity ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'} flex items-center`}>
                    <Lock className="h-4 w-4 mr-1 text-primary-400" />
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
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-3 flex-shrink-0 bg-white dark:bg-dark-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isCreating || isUploading || !channelName.trim()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
            >
              {isCreating || isUploading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
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