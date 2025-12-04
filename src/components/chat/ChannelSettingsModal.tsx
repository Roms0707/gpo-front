import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, Edit, Bell, Save, Trash2, UserPlus, UserMinus, Shield, User, Upload, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { getChannelMembers } from '../../services/channelService';

interface ChannelMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected';
  joined_at: string;
  users: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface ChannelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  channelDescription?: string;
  onChannelUpdated: (name: string, description: string) => void;
}

const ChannelSettingsModal: React.FC<ChannelSettingsModalProps> = ({
  isOpen,
  onClose,
  channelId,
  channelName,
  channelDescription = '',
  onChannelUpdated
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'notifications'>('general');
  const [name, setName] = useState(channelName);
  const [description, setDescription] = useState(channelDescription);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<ChannelMember[]>([]);
  
  // Notification preferences
  const [notifyAllMessages, setNotifyAllMessages] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyNothing, setNotifyNothing] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setName(channelName);
      setDescription(channelDescription);
      loadMembers();
      
      // Load channel image
      loadChannelImage();
      
      // Set focus to the modal when it opens
      if (modalRef.current) {
        modalRef.current.focus();
      }
    }
  }, [isOpen, channelName, channelDescription]);
  
  const loadChannelImage = async () => {
    if (!channelId) return;
    
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('image_url')
        .eq('id', channelId)
        .single();
      
      if (error) {
        console.error('Error loading channel image:', error);
        return;
      }
      
      if (data?.image_url) {
        setImageUrl(data.image_url);
        setImagePreview(data.image_url);
      }
    } catch (error) {
      console.error('Error loading channel image:', error);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      const validFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validFileTypes.includes(file.type)) {
        toast.error(t('channelSettings.unsupportedFileType'));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('channelSettings.fileTooLarge'));
        return;
      }
      
      setImageFile(file);
      // Create a temporary URL for preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };
  
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl; // Return existing URL if no new file
    
    try {
      setIsUploading(true);
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `community-${channelId}-${Date.now()}.${fileExt}`;
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
      toast.error(t('channelSettings.imageUploadError'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const loadMembers = async () => {
    if (!channelId) return;
    
    try {
      setIsLoading(true);
      
      const allMembers = await getChannelMembers(channelId);
      console.log("Loaded members:", allMembers);

      // Separate accepted members from pending invitations
      const accepted = allMembers.filter(member => member.status === 'accepted');
      const pending = allMembers.filter(member => member.status === 'pending');
      
      setMembers(accepted);
      setPendingInvitations(pending);
      
      // Check if current user is an admin
      if (user) {
        const currentUserMember = accepted.find(member => member.user_id === user.id);
        setIsAdmin(currentUserMember?.role === 'admin');
      }
    } catch (error) {
      console.error('Error loading channel members:', error);
      toast.error(t('channelSettings.memberAddError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveGeneral = async () => {
    if (!channelId || !name.trim()) return;
    
    try {
      setIsSaving(true);
      
      // Upload image if there's a new one
      let newImageUrl = imageUrl;
      if (imageFile) {
        newImageUrl = await uploadImage();
      }
      
      const { error } = await supabase
        .from('channels')
        .update({
          name: name.trim(),
          description: description.trim(),
          image_url: newImageUrl
        })
        .eq('id', channelId);
      
      if (error) {
        console.error('Error updating channel:', error);
        toast.error(t('channelSettings.channelUpdateError'));
        return;
      }
      
      toast.success(t('channelSettings.channelUpdated'));
      onChannelUpdated(name.trim(), description.trim());
    } catch (error) {
      console.error('Error updating channel:', error);
      toast.error(t('channelSettings.channelUpdateError'));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddMember = async () => {
    if (!channelId || !newMemberUsername.trim()) return;
    
    try {
      setIsAddingMember(true);
      
      // First, find the user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', newMemberUsername.trim())
        .single();
      
      if (userError || !userData) {
        toast.error(t('channelSettings.userNotFound'));
        return;
      }
      
      // Check if user is already a member
      const existingMember = members.find(member => member.user_id === userData.id);
      if (existingMember) {
        toast.error(t('channelSettings.alreadyMember'));
        return;
      }
      
      // Add user to channel
      const { error } = await supabase
        .from('channel_members')
        .insert([{
          channel_id: channelId,
          user_id: userData.id,
          role: 'member',
          status: 'pending'
        }]);
      
      if (error) {
        console.error('Error adding member:', error);
        toast.error(t('channelSettings.memberAddError'));
        return;
      }

      toast.success(t('channelSettings.memberAdded'));
      toast.info(t('channelSettings.invitationSent'));
      setNewMemberUsername('');
      loadMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(t('channelSettings.memberAddError'));
    } finally {
      setIsAddingMember(false);
    }
  };
  
  const handleRemoveMember = async (memberId: string) => {
    if (!channelId) return;
    
    try {
      const { error } = await supabase
        .from('channel_members')
        .delete()
        .eq('id', memberId);
      
      if (error) {
        console.error('Error removing member:', error);
        toast.error(t('channelSettings.memberRemoveError'));
        return;
      }

      toast.success(t('channelSettings.memberRemoved'));
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(t('channelSettings.memberRemoveError'));
    }
  };
  
  const handlePromoteToAdmin = async (memberId: string) => {
    if (!channelId) return;
    
    try {
      const { error } = await supabase
        .from('channel_members')
        .update({ role: 'admin' })
        .eq('id', memberId);
      
      if (error) {
        console.error('Error promoting member:', error);
        toast.error(t('channelSettings.promoteError'));
        return;
      }

      toast.success(t('channelSettings.promotedToAdmin'));
      loadMembers();
    } catch (error) {
      console.error('Error promoting member:', error);
      toast.error(t('channelSettings.promoteError'));
    }
  };
  
  const handleSaveNotifications = () => {
    // In a real implementation, this would save to a user_channel_preferences table
    toast.success(t('channelSettings.preferencesUpdated'));
    
    // For now, we'll just simulate saving
    localStorage.setItem(`channel_${channelId}_notifications`, JSON.stringify({
      notifyAllMessages,
      notifyMentions,
      notifyNothing
    }));
  };
  
  // Handle notification radio button changes
  const handleNotificationChange = (type: 'all' | 'mentions' | 'none') => {
    if (type === 'all') {
      setNotifyAllMessages(true);
      setNotifyMentions(false);
      setNotifyNothing(false);
    } else if (type === 'mentions') {
      setNotifyAllMessages(false);
      setNotifyMentions(true);
      setNotifyNothing(false);
    } else {
      setNotifyAllMessages(false);
      setNotifyMentions(false);
      setNotifyNothing(true);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div 
        ref={modalRef}
        className="bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-heading font-semibold text-xl">
            {t('channelSettings.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'general' 
                ? 'text-primary-500 border-b-2 border-primary-500' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Edit className="h-4 w-4 inline mr-2" />
            {t('channelSettings.general')}
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'members' 
                ? 'text-primary-500 border-b-2 border-primary-500' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            {t('channelSettings.members')}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'notifications' 
                ? 'text-primary-500 border-b-2 border-primary-500' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Bell className="h-4 w-4 inline mr-2" />
            {t('channelSettings.notifications')}
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="channelName" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('channelSettings.channelImage')}
                </label>
                <div className="flex items-center">
                  <div 
                    className="w-20 h-20 rounded-lg bg-dark-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-dark-400 transition-colors border border-gray-700"
                    onClick={() => isAdmin && fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 bg-dark-300 hover:bg-dark-400 text-gray-300 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t('channelSettings.changeImage')}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('channelSettings.fileFormatInfo')}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {t('channelSettings.onlyAdminsCanEditImage')}
                      </p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif, image/webp"
                    disabled={!isAdmin}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="channelName" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('channelSettings.channelName')}
                </label>
                <input
                  type="text"
                  id="channelName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('channelSettings.channelNamePlaceholder')}
                  disabled={!isAdmin}
                />
                {!isAdmin && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('channelSettings.onlyAdminsCanEditName')}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="channelDescription" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('channelSettings.description')}
                </label>
                <textarea
                  id="channelDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                  placeholder={t('channelSettings.descriptionPlaceholder')}
                  disabled={!isAdmin}
                />
                {!isAdmin && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('channelSettings.onlyAdminsCanEditDescription')}
                  </p>
                )}
              </div>
              
              {isAdmin && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveGeneral}
                    disabled={isSaving || !name.trim()}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        {t('channelSettings.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('channelSettings.saveChanges')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Members Management */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t('channelSettings.addMember')}</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    placeholder={t('channelSettings.usernamePlaceholder')}
                    className="flex-1 bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={!isAdmin}
                  />
                  <button
                    onClick={handleAddMember}
                    disabled={isAddingMember || !newMemberUsername.trim() || !isAdmin}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
                  >
                    {isAddingMember ? (
                      <span className="animate-spin">⟳</span>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('channelSettings.add')}
                      </>
                    )}
                  </button>
                </div>
                {!isAdmin && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('channelSettings.onlyAdminsCanAddMembers')}
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">{t('channelSettings.channelMembers', { count: members.length })}</h3>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                    <span className="ml-3 text-gray-400">{t('channelSettings.loadingMembers')}</span>
                  </div>
                ) : members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="bg-dark-200 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3">
                            {member.users.avatar_url ? (
                              <img 
                                src={member.users.avatar_url} 
                                alt={member.users.username} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-gray-400 m-2.5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-medium">{member.users.username}</h4>
                              {member.role === 'admin' && (
                                <span className="ml-2 bg-primary-600/20 text-primary-400 text-xs px-2 py-0.5 rounded-full flex items-center">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {t('channelSettings.admin')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {t('channelSettings.membersSince', { date: new Date(member.joined_at).toLocaleDateString() })}
                            </p>
                          </div>
                        </div>
                        
                        {isAdmin && member.user_id !== user?.id && (
                          <div className="flex space-x-2">
                            {member.role !== 'admin' && (
                              <button
                                onClick={() => handlePromoteToAdmin(member.id)}
                                className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
                                title={t('channelSettings.promoteToAdmin')}
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="bg-error-600 hover:bg-error-700 text-white p-2 rounded-lg transition-colors"
                              title={t('channelSettings.removeFromChannel')}
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-dark-200 rounded-lg">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">{t('channelSettings.noMembers')}</p>
                  </div>
                )}
                
                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-300 px-2 py-1 bg-dark-300/50">{t('channelSettings.pendingInvitations')}</h4>
                    <div className="space-y-1">
                      {pendingInvitations.map(member => (
                        <div key={member.id} className="flex items-center p-2 rounded-lg hover:bg-dark-300">
                          <div className="w-8 h-8 rounded-full bg-dark-300 overflow-hidden mr-2">
                            {member.users.avatar_url ? (
                              <img 
                                src={member.users.avatar_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-400 m-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate">{member.users.username}</span>
                            <span className="text-xs text-warning-400 block">{t('channelSettings.waitingAcceptance')}</span>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-gray-400 hover:text-error-400 p-1"
                              title={t('channelSettings.cancelInvitation')}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4">{t('channelSettings.notificationPreferences')}</h3>
              
              <div className="space-y-4 bg-dark-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="notifyAll"
                    name="notificationPreference"
                    checked={notifyAllMessages}
                    onChange={() => handleNotificationChange('all')}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <label htmlFor="notifyAll" className="font-medium">{t('channelSettings.allMessages')}</label>
                    <p className="text-sm text-gray-400">
                      {t('channelSettings.allMessagesDesc')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="notifyMentions"
                    name="notificationPreference"
                    checked={notifyMentions}
                    onChange={() => handleNotificationChange('mentions')}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <label htmlFor="notifyMentions" className="font-medium">{t('channelSettings.mentionsOnly')}</label>
                    <p className="text-sm text-gray-400">
                      {t('channelSettings.mentionsOnlyDesc')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="notifyNone"
                    name="notificationPreference"
                    checked={notifyNothing}
                    onChange={() => handleNotificationChange('none')}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <label htmlFor="notifyNone" className="font-medium">{t('channelSettings.noNotifications')}</label>
                    <p className="text-sm text-gray-400">
                      {t('channelSettings.noNotificationsDesc')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotifications}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('channelSettings.savePreferences')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelSettingsModal;