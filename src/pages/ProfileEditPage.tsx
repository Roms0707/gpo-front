import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, Save, Upload, User, Gamepad2, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { countries } from '../utils/countries';
import { validateRiotId, validateUserProfile } from '../services/api';
import toast from 'react-hot-toast';
import AccountIntegrationCard from '../components/profile/AccountIntegrationCard';
import SteamAccountIntegration from '../components/profile/SteamAccountIntegration';
import FortniteAccountIntegration from '../components/profile/FortniteAccountIntegration';
import RiotAccountIntegration from '../components/profile/RiotAccountIntegration';
import DiscordOAuthIntegration from '../components/profile/DiscordOAuthIntegration';

interface GamePublisherField {
  id: string;
  game_id: string;
  label: string;
  id_name: string;
  required: boolean;
  value?: string;
  isValidating?: boolean;
  isValidated?: boolean;
  validation_data?: any;
  validation_date?: string;
  gameName?: string;
  publisherLabel?: string;
}

const ProfileEditPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(() => {
    const initialBio = user?.bio || '';
    console.log('[ProfileEditPage] Initial bio state:', initialBio, 'from user:', user?.bio);
    return initialBio;
  });
  const [discordHandle, setDiscordHandle] = useState(user?.discord_handle || '');
  const [twitterHandle, setTwitterHandle] = useState(user?.twitter_handle || '');
  const [country] = useState(user?.country || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.msisdn || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [gamePublisherFields, setGamePublisherFields] = useState<GamePublisherField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [gameHasApi, setGameHasApi] = useState(false);
  const [fieldPairs, setFieldPairs] = useState<{[key: string]: string[]}>({});
  const [steamData, setSteamData] = useState({ value: '', isValidated: false, validationData: null });
  const [fortniteData, setFortniteData] = useState({ 
    value: user?.fortnite_epic_id || '', 
    isValidated: user?.is_fortnite_validated || false, 
    validationData: user?.fortnite_validation_data || null 
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadGamePublisherFields();
    loadSteamId64();
  }, [user, navigate]);

  // Update form fields when user data loads
  useEffect(() => {
    console.log('[ProfileEditPage] User data changed:', user);
    console.log('[ProfileEditPage] User bio value:', user?.bio);
    console.log('[ProfileEditPage] Current bio state:', bio);

    if (user) {
      console.log('[ProfileEditPage] Setting form fields from user data...');
      setUsername(user.username || '');
      console.log('[ProfileEditPage] About to setBio with:', user.bio);
      setBio(user.bio || '');
      setDiscordHandle(user.discord_handle || '');
      setTwitterHandle(user.twitter_handle || '');
      // Country is set via GeoIP and cannot be modified
      setPhoneNumber(user.msisdn || '');
      setAvatarPreview(user.avatar_url || null);
      setFortniteData({
        value: user.fortnite_epic_id || '',
        isValidated: user.is_fortnite_validated || false,
        validationData: user.fortnite_validation_data || null
      });

      console.log('[ProfileEditPage] Bio after setting:', user.bio || '');
      console.log('[ProfileEditPage] Username after setting:', user.username || '');
    }
  }, [user]);

  // Monitor bio state changes
  useEffect(() => {
    console.log('[ProfileEditPage] Bio state changed to:', bio);
  }, [bio]);

  const loadSteamId64 = async () => {
    if (!user?.id) return;
    
    try {
      console.log('[SteamID64] Starting loadSteamId64 for user:', user.id);
      
      // Get Steam game ID first
      const { data: steamGame, error: steamGameError } = await supabase
        .from('games')
        .select('id')
        .ilike('name', '%steam%')
        .maybeSingle();
      
      console.log('[SteamID64] Steam game query result:', { steamGame, steamGameError });
      
      if (steamGameError || !steamGame) {
        console.log('[SteamID64] Steam game not found in database:', steamGameError);
        return;
      }
      
      // Get SteamID64 publisher ID
      const { data: steamPublisher, error: steamPublisherError } = await supabase
        .from('game_publisher_ids')
        .select('id')
        .eq('game_id', steamGame.id)
        .ilike('label', '%steam%')
        .maybeSingle();
      
      console.log('[SteamID64] Steam publisher query result:', { steamPublisher, steamPublisherError });
      
      if (steamPublisherError || !steamPublisher) {
        console.log('[SteamID64] Steam publisher ID not found in database:', steamPublisherError);
        return;
      }
      
      // Get user's existing SteamID64
      const { data: userSteamData, error: userSteamError } = await supabase
        .from('game_publisher_id_for_users')
        .select('value, is_validated, validation_data')
        .eq('user_id', user.id)
        .eq('game_publisher_id', steamPublisher.id)
        .maybeSingle();
      
      console.log('[SteamID64] User Steam data query result:', { userSteamData, userSteamError });
      
      if (!userSteamError && userSteamData) {
        console.log('[SteamID64] Setting Steam data from database:', userSteamData.value);
        setSteamData({
          value: userSteamData.value,
          isValidated: userSteamData.is_validated || false,
          validationData: userSteamData.validation_data
        });
      } else {
        console.log('[SteamID64] No existing Steam data found for user');
      }
    } catch (error) {
      console.error('[SteamID64] Error loading SteamID64:', error);
    }
  };

  const loadGamePublisherFields = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingFields(true);
      
      // Get all game publisher IDs for League of Legends (Riot Games)
      const { data: publisherIds, error: publisherError } = await supabase
        .from('game_publisher_ids')
        .select(`
          id, 
          label, 
          id_name, 
          required, 
          game_id,
          games:game_id (
            name,
            has_an_api
          )
        `)
        .order('label', { ascending: true });

      if (publisherError) {
        console.error('Error loading game publisher IDs:', publisherError);
        return;
      }

      if (!publisherIds || publisherIds.length === 0) {
        setGamePublisherFields([]);
        return;
      }

      // Check if any game has API (for validation)
      const hasApiGame = publisherIds.some(item => item.games?.has_an_api);
      setGameHasApi(hasApiGame);

      // Identify field pairs (e.g., Riot Game Name + Riot Tagline)
      const pairs: {[key: string]: string[]} = {};
      
      publisherIds.forEach(item => {
        let baseName = item.id_name;
        
        if (baseName.includes('game_name-riot')) {
          baseName = 'riot';
        } else if (baseName.includes('tagline-riot')) {
          baseName = 'riot';
        }
        
        if (!pairs[baseName]) {
          pairs[baseName] = [];
        }
        pairs[baseName].push(item.id);
      });
      
      // Keep only actual pairs (2+ fields with same base)
      Object.keys(pairs).forEach(key => {
        if (pairs[key].length < 2) {
          delete pairs[key];
        }
      });
      
      setFieldPairs(pairs);

      // Get user's existing values
      const { data: userValues, error: userError } = await supabase
        .from('game_publisher_id_for_users')
        .select(`
          game_publisher_id, 
          value, 
          is_validated, 
          validation_data, 
          validation_date
        `)
        .eq('user_id', user.id);

      if (userError) {
        console.error('Error loading user gaming accounts:', userError);
      }

      // Create a map of existing values
      const existingValues = new Map();
      (userValues || []).forEach(item => {
        existingValues.set(item.game_publisher_id, {
          value: item.value,
          isValidated: item.is_validated,
          validation_data: item.validation_data,
          validation_date: item.validation_date
        });
      });

      // Transform the data
      const fields: GamePublisherField[] = publisherIds.map(item => {
        const existing = existingValues.get(item.id);
        return {
          id: item.id,
          game_id: item.game_id,
          label: item.label,
          id_name: item.id_name,
          required: item.required,
          value: existing?.value || '',
          isValidated: existing?.isValidated || false,
          validation_data: existing?.validation_data,
          validation_date: existing?.validation_date,
          gameName: item.games?.name || 'Unknown Game',
          publisherLabel: item.label
        };
      });

      setGamePublisherFields(fields);
    } catch (error) {
      console.error('Error loading game publisher fields:', error);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const saveSteamId64 = async () => {
    if (!user?.id || !steamData.value) {
      console.log('[SteamID64] No user ID or SteamID64 provided, skipping Steam save');
      return;
    }
    
    try {
      console.log('[SteamID64] Starting saveSteamId64 for user:', user.id, 'steamId64:', steamData.value);
      
      // Get Steam game ID
      const { data: steamGame, error: steamGameError } = await supabase
        .from('games')
        .select('id')
        .ilike('name', '%steam%')
        .maybeSingle();
      
      console.log('[SteamID64] Steam game query result for save:', { steamGame, steamGameError });
      
      if (steamGameError || !steamGame) {
        console.log('[SteamID64] Steam game not found in database, skipping Steam save:', steamGameError);
        // Don't throw error, just skip Steam saving if not configured
        return;
      }
      
      // Get SteamID64 publisher ID
      const { data: steamPublisher, error: steamPublisherError } = await supabase
        .from('game_publisher_ids')
        .select('id')
        .eq('game_id', steamGame.id)
        .ilike('label', '%steam%')
        .maybeSingle();
      
      console.log('[SteamID64] Steam publisher query result for save:', { steamPublisher, steamPublisherError });
      
      if (steamPublisherError || !steamPublisher) {
        console.log('[SteamID64] Steam publisher ID not found in database, skipping Steam save:', steamPublisherError);
        // Don't throw error, just skip Steam saving if not configured
        return;
      }
      
      const upsertData = {
        user_id: user.id,
        game_id: steamGame.id,
        game_publisher_id: steamPublisher.id,
        value: steamData.value,
        is_validated: steamData.isValidated,
        validation_data: steamData.validationData,
        validation_date: steamData.isValidated ? new Date().toISOString() : null,
        validation_source: steamData.isValidated ? 'steam_api' : null
      };
      
      console.log('[SteamID64] About to upsert with data:', upsertData);
      
      // Upsert the SteamID64
      const { error: upsertError } = await supabase
        .from('game_publisher_id_for_users')
        .upsert([upsertData], {
          onConflict: 'user_id,game_publisher_id'
        });
      
      if (upsertError) {
        console.error('[SteamID64] Error saving SteamID64:', upsertError);
        throw upsertError;
      }
      
      console.log('[SteamID64] SteamID64 saved successfully');
    } catch (error) {
      console.error('[SteamID64] Error saving SteamID64:', error);
      throw error;
    }
  };

  const handleGamePublisherFieldChange = (fieldId: string, value: string) => {
    setGamePublisherFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, value, isValidated: false } : field
      )
    );
  };

  const validateGameAccount = async (fieldId: string) => {
    if (!gameHasApi) return;

    // Find the field to validate
    const field = gamePublisherFields.find(f => f.id === fieldId);
    if (!field || !field.value) return;

    // Check if this field is part of a pair
    let pairFieldIds: string[] = [];
    
    // Find if this field is part of a pair
    for (const [baseName, fieldIds] of Object.entries(fieldPairs)) {
      if (fieldIds.includes(fieldId) && fieldIds.length > 1) {
        pairFieldIds = fieldIds;
        break;
      }
    }

    try {
      // Set validating state for all fields in the pair
      setGamePublisherFields(prev => 
        prev.map(f => 
          pairFieldIds.includes(f.id) ? { ...f, isValidating: true, isValidated: false } : f
        )
      );

      // For Riot fields, call the Riot API validation
      if (field.id_name.includes('riot') && pairFieldIds.length > 1) {
        const gameNameField = gamePublisherFields.find(f => f.id_name.includes('game_name-riot'));
        const taglineField = gamePublisherFields.find(f => f.id_name.includes('tagline-riot'));
        
        if (gameNameField?.value && taglineField?.value) {
          console.log('Validating Riot ID:', gameNameField.value, taglineField.value);
          
          const result = await validateRiotId(gameNameField.value, taglineField.value);
          
          if (result.valid) {
            // Set validated state for all fields in the pair
            setGamePublisherFields(prev => 
              prev.map(f => 
                pairFieldIds.includes(f.id) ? { 
                  ...f, 
                  isValidating: false, 
                  isValidated: true,
                  validation_data: result,
                  validation_date: new Date().toISOString()
                } : f
              )
            );
            
            toast.success(t('profile.accountValidatedSuccess', { account: `${gameNameField.value}#${taglineField.value}` }));
          } else {
            // Reset validation state for all fields in the pair
            setGamePublisherFields(prev => 
              prev.map(f => 
                pairFieldIds.includes(f.id) ? { 
                  ...f, 
                  isValidating: false, 
                  isValidated: false,
                  validation_data: undefined,
                  validation_date: undefined
                } : f
              )
            );
            
            toast.error(result.error || t('profile.errorValidatingRiotAccount'));
          }
          
          return;
        }
      }

      // For other games or as a fallback, simulate validation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set validated state for all fields in the pair
      setGamePublisherFields(prev => 
        prev.map(f => 
          pairFieldIds.includes(f.id) ? { 
            ...f, 
            isValidating: false, 
            isValidated: true,
            validation_date: new Date().toISOString()
          } : f
        )
      );

      toast.success(t('profile.accountValidatedSuccessGeneric'));
    } catch (error) {
      console.error('Error validating game account:', error);
      
      // Reset validation state for all fields in the pair
      setGamePublisherFields(prev => 
        prev.map(f => 
          pairFieldIds.includes(f.id) ? { 
            ...f, 
            isValidating: false, 
            isValidated: false,
            validation_date: undefined
          } : f
        )
      );
      
      toast.error(t('profile.errorValidatingAccount'));
    }
  };

  // Check if all fields in a pair have values
  const allPairFieldsHaveValues = (fieldId: string): boolean => {
    for (const fieldIds of Object.values(fieldPairs)) {
      if (fieldIds.includes(fieldId) && fieldIds.length > 1) {
        const pairFields = fieldIds
          .map(id => gamePublisherFields.find(f => f.id === id))
          .filter(Boolean) as GamePublisherField[];
        return pairFields.every(f => f.value && f.value.trim() !== '');
      }
    }
    return false;
  };

  // Check if any field in a pair is being validated or is validated
  const isPairBeingValidatedOrValidated = (fieldId: string): boolean => {
    for (const fieldIds of Object.values(fieldPairs)) {
      if (fieldIds.includes(fieldId) && fieldIds.length > 1) {
        const pairFields = fieldIds
          .map(id => gamePublisherFields.find(f => f.id === id))
          .filter(Boolean) as GamePublisherField[];
        return pairFields.some(f => f.isValidating || f.isValidated);
      }
    }
    return false;
  };

  // Get the first field ID in a pair
  const getFirstFieldIdInPair = (fieldId: string): string | null => {
    for (const fieldIds of Object.values(fieldPairs)) {
      if (fieldIds.includes(fieldId) && fieldIds.length > 1) {
        return fieldIds[0];
      }
    }
    return null;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      const validFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validFileTypes.includes(file.type)) {
        toast.error(t('profile.unsupportedFileType'));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('profile.imageTooLarge'));
        return;
      }
      
      setAvatar(file);
      // Create a temporary URL for preview
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatar || !user?.id) return null;
    
    try {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar, {
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
      console.error('Error uploading avatar:', error);
      toast.error(t('profile.errorUploadingAvatar'));
      return null;
    }
  };

  const saveGamePublisherAccounts = async () => {
    if (!user?.id) return;

    try {
      // Insert/update entries for fields with values
      const fieldsWithValues = gamePublisherFields.filter(field => field.value && field.value.trim() !== '');
      
      if (fieldsWithValues.length > 0) {
        // Use upsert for each field to handle updates properly
        for (const field of fieldsWithValues) {
          const upsertData = {
            user_id: user.id,
            game_id: field.game_id,
            game_publisher_id: field.id,
            value: field.value.trim(),
            is_validated: field.isValidated || false,
            validation_date: field.validation_date || null,
            validation_data: field.validation_data || null,
            validation_source: field.validation_data ? 'riot_api' : null
          };

          const { error: upsertError } = await supabase
            .from('game_publisher_id_for_users')
            .upsert([upsertData], {
              onConflict: 'user_id,game_publisher_id'
            });

          if (upsertError) {
            console.error('Error saving gaming account:', upsertError);
            throw upsertError;
          }
        }

        console.log('Gaming accounts saved successfully');
      }
    } catch (error) {
      console.error('Error saving game publisher accounts:', error);
      throw error;
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // First, validate the profile data server-side
      console.log('Validating user profile...');
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
      
      console.log('User profile validation passed');
      
      // Upload avatar if a new one was selected
      let avatarUrl = user.avatar_url;
      if (avatar) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }
      
      // Country is set via GeoIP and cannot be modified by user
      // Keep the existing country value from the database
      const finalCountry = user.country;

      console.log('[ProfileEditPage] Saving profile with country (unchanged):', finalCountry);

      // Update user profile and mark as completed
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username,
          bio,
          discord_handle: discordHandle,
          twitter_handle: twitterHandle,
          country: finalCountry,
          msisdn: phoneNumber || null, // Store null if empty string
          avatar_url: avatarUrl,
          fortnite_epic_id: fortniteData.value,
          is_fortnite_validated: fortniteData.isValidated,
          fortnite_validation_data: fortniteData.validationData,
          is_profile_completed: true
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('[ProfileEditPage] Error updating profile:', updateError);
        throw updateError;
      }

      console.log('[ProfileEditPage] Profile updated successfully in database');

      // Save gaming accounts
      await saveGamePublisherAccounts();

      // Save SteamID64 if provided
      try {
        if (steamData.value) {
          await saveSteamId64();
        }
      } catch (error) {
        console.log('Steam save failed, continuing with profile update:', error);
        // Don't fail the entire profile update if Steam save fails
      }

      // Refresh user data in auth store after profile update
      console.log('[ProfileEditPage] Refreshing user data in auth store after profile update...');
      const checkSession = useAuthStore.getState().checkSession;
      await checkSession();

      console.log('[ProfileEditPage] Auth store refreshed with new data');

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

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('profile.backToProfile')}
          </Link>
          
          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
              <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white">
                {t('profile.editMyProfile')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('profile.updateYourPersonalInfo')}
              </p>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              {/* Avatar Section */}
              <div>
                <h3 className="text-lg font-heading font-semibold flex items-center text-gray-900 dark:text-white mb-4">
                  <User className="h-5 w-5 mr-2 text-primary-500" />
                  {t('profile.personalInformation')}
                </h3>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.profilePhoto')}
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-dark-200 overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-300 text-gray-700 dark:text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      {user?.avatar_url ? t('profile.changePhoto') : t('profile.addPhoto')}
                      <input
                        type="file"
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/jpeg, image/png, image/gif, image/webp"
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('profile.imageFormatsAndSize')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.username')}
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.biography')}
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => {
                    console.log('[ProfileEditPage] Bio changed via textarea:', e.target.value);
                    setBio(e.target.value);
                  }}
                  className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                  placeholder={t('profile.tellUsAboutYou')}
                />
              </div>
              
              {/* Social Media */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discordHandle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.discordHandle')}
                  </label>
                  <input
                    type="text"
                    id="discordHandle"
                    value={discordHandle}
                    onChange={(e) => setDiscordHandle(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="username#1234"
                  />
                </div>
                
                <div>
                  <label htmlFor="twitterHandle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.twitchHandle')}
                  </label>
                  <input
                    type="text"
                    id="twitterHandle"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="votre_nom_twitch"
                  />
                </div>
              </div>

              {/* Discord OAuth Integration */}
              <div>
                <AccountIntegrationCard
                  title={t('discord.oauth.title')}
                  icon={
                    <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  }
                  defaultOpen={false}
                >
                  <DiscordOAuthIntegration disabled={isSubmitting || isLoading} />
                </AccountIntegrationCard>
              </div>

              {/* Gaming Account Integrations */}
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-semibold flex items-center text-gray-900 dark:text-white">
                  <Gamepad2 className="h-5 w-5 mr-2 text-primary-500" />
                  {t('profile.gamingAccounts')}
                </h3>
                
                {/* Steam Account Integration */}
                <AccountIntegrationCard
                  title={t('profile.steamAccount')}
                  icon={
                    <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                    </svg>
                  }
                  defaultOpen={false}
                >
                  <SteamAccountIntegration
                    initialValue={steamData.value}
                    initialValidated={steamData.isValidated}
                    initialValidationData={steamData.validationData}
                    onDataChange={setSteamData}
                    disabled={isSubmitting || isLoading}
                  />
                </AccountIntegrationCard>

                {/* Fortnite Account Integration */}
                <AccountIntegrationCard
                  title={t('profile.fortniteAccount')}
                  icon={
                    <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                    </svg>
                  }
                  defaultOpen={false}
                >
                  <FortniteAccountIntegration
                    initialValue={fortniteData.value}
                    initialValidated={fortniteData.isValidated}
                    initialValidationData={fortniteData.validationData}
                    onDataChange={setFortniteData}
                    disabled={isSubmitting || isLoading}
                  />
                </AccountIntegrationCard>

                {/* Riot Account Integration */}
                {isLoadingFields ? (
                  <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">{t('profile.loadingRiotAccounts')}</span>
                    </div>
                  </div>
                ) : gamePublisherFields.filter(f => f.id_name.includes('riot')).length > 0 ? (
                  <AccountIntegrationCard
                    title={t('profile.riotGamesAccount')}
                    icon={
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                      </svg>
                    }
                    defaultOpen={false}
                  >
                    <RiotAccountIntegration
                      initialRiotFields={gamePublisherFields.filter(f => f.id_name.includes('riot'))}
                      onDataChange={(updatedFields) => {
                        setGamePublisherFields(prev => 
                          prev.map(field => {
                            const updated = updatedFields.find(f => f.id === field.id);
                            return updated || field;
                          })
                        );
                      }}
                      disabled={isSubmitting || isLoading}
                    />
                  </AccountIntegrationCard>
                ) : null}
                
                {/* Other Game IDs Integration */}
                {gamePublisherFields.filter(field => 
                  !field.id_name.includes('steam') && 
                  !field.id_name.includes('riot') && 
                  !field.id_name.includes('epic') &&
                  !field.id_name.includes('fortnite')
                ).length > 0 && (
                  <AccountIntegrationCard
                    title={t('profile.otherGameAccounts')}
                    icon={
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                      </svg>
                    }
                    defaultOpen={false}
                  >
                    <div className="space-y-4">
                      {gamePublisherFields.filter(field => 
                        !field.id_name.includes('steam') && 
                        !field.id_name.includes('riot') && 
                        !field.id_name.includes('epic') &&
                        !field.id_name.includes('fortnite')
                      ).map((field) => (
                        <div key={field.id}>
                          <label htmlFor={`other_${field.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            id={`other_${field.id}`}
                            value={field.value || ''}
                            onChange={(e) => handleGamePublisherFieldChange(field.id, e.target.value)}
                            className="w-full bg-white dark:bg-dark-300 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={`Votre ${field.id_name}`}
                            required={false}
                            disabled={isSubmitting || isLoading}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('profile.game')}: {field.gameName}
                          </p>
                          {field.isValidated && field.validation_data && (
                            <div className="mt-2 p-2 bg-success-500/10 border border-success-500/30 rounded-lg">
                              <div className="flex items-center text-success-400 text-sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span>{t('profile.accountValidated')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {gamePublisherFields.filter(field => 
                        !field.id_name.includes('steam') && 
                        !field.id_name.includes('riot') && 
                        !field.id_name.includes('epic') &&
                        !field.id_name.includes('fortnite')
                      ).length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t('profile.noOtherGameAccountsAvailable')}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccountIntegrationCard>
                )}
                
                <div className="bg-info-500/10 border border-info-600/30 p-4 rounded-lg">
                  <p className="text-info-700 dark:text-info-300 text-sm">
                    <strong>Tip:</strong> {t('profile.tipValidateAccountsToParticipate')}
                  </p>
                </div>
              </div>

              {/* Required Information Section */}
              <div className="space-y-6 border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-lg font-heading font-semibold flex items-center text-gray-900 dark:text-white">
                  <User className="h-5 w-5 mr-2 text-primary-500" />
                  {t('profile.requiredInformation')}
                </h3>

                <div className="bg-info-500/10 border border-info-600/30 p-4 rounded-lg">
                  <p className="text-info-700 dark:text-info-300 text-sm">
                    <strong>Important:</strong> {t('profile.importantInfoRequiredForTournaments')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('profile.countryOfResidenceRequired')} <span className="text-error-500">*</span>
                    </label>
                    <div className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white">
                      {country ? (
                        <span className="flex items-center">
                          {countries.find(c => c.code === country)?.flag} {countries.find(c => c.code === country)?.name || country}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t('profile.notDefined')}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('profile.countryDetectedAutomatically')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('profile.phoneNumberOptional')} <span className="text-gray-500 dark:text-gray-400">{t('profile.optional')}</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+33 6 12 34 56 78"
                      disabled={isSubmitting || isLoading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('profile.internationalFormatRecommended')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Save Button */}
              <div className="flex justify-end space-x-3">
                <Link
                  to="/profile"
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white rounded-lg transition-colors"
                >
                  {t('profile.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      {t('profile.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('profile.save')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;