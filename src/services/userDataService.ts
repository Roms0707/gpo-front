import { User } from '../types';
import { APP_CONFIG, USER_TYPES } from '../constants';
import { getCountryByCode } from '../utils/countries';

// User data storage utilities
export const clearStoredCredentials = () => {
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
};

export const saveUserData = (userData: User) => {
  localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
};

export const getSavedUserData = (): User | null => {
  try {
    const savedData = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('[UserDataService] getSavedUserData - parsed data:', parsedData);
      console.log('[UserDataService] getSavedUserData - bio in parsed data:', parsedData.bio);
      return parsedData;
    }
  } catch (error) {
    console.warn('Error parsing saved user data:', error);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
  }
  return null;
};

// Country validation utility
export const validateCountryCode = (countryCode: string | null): string => {
  if (!countryCode) return 'TN';

  // Check if the country code exists in our allowed countries
  const validCountry = getCountryByCode(countryCode);
  return validCountry ? countryCode : 'TN';
};

// User object creation utility
export const createUserFromData = (userData: any, sessionUser?: any): User => {
  console.log('[UserDataService] createUserFromData - userData:', userData);
  console.log('[UserDataService] createUserFromData - bio from userData:', userData.bio);

  const user = {
    id: userData.id || sessionUser?.id || '',
    username: userData.username || sessionUser?.email?.split('@')[0] || 'User',
    email: userData.email || sessionUser?.email || '',
    type: userData.type || USER_TYPES.GAMER,
    dateOfBirth: userData.date_of_birth || '',
    hasParentalConsent: userData.has_parental_consent,
    country: userData.country || null,
    registeredTournaments: [],
    avatar_url: userData.avatar_url || null,
    bio: userData.bio || '',
    riot_game_name: userData.riot_game_name || '',
    riot_tagline: userData.riot_tagline || '',
    fortnite_epic_id: userData.fortnite_epic_id || '',
    is_fortnite_validated: userData.is_fortnite_validated || false,
    fortnite_validation_data: userData.fortnite_validation_data || null,
    discord_handle: userData.discord_handle || '',
    discord_user_id: userData.discord_user_id || null,
    twitter_handle: userData.twitter_handle || '',
    level: userData.level || APP_CONFIG.DEFAULT_LEVEL,
    xp: userData.xp || APP_CONFIG.DEFAULT_XP,
    current_avatar_id: userData.current_avatar_id || null,
    msisdn: userData.msisdn || '',
    is_profile_public: userData.is_profile_public !== undefined ? userData.is_profile_public : true,
    is_profile_completed: userData.is_profile_completed !== undefined ? userData.is_profile_completed : false,
    favorite_game_id: userData.favorite_game_id || null,
    created_at: userData.created_at || null
  };

  console.log('[UserDataService] createUserFromData - created user bio:', user.bio);
  return user;
};
