// Application-wide constants
export const APP_CONFIG = {
  // Pagination
  MESSAGES_PER_PAGE: 20,
  TOURNAMENTS_PER_PAGE: 50,
  LEADERBOARD_LIMIT: 100,

  // Timeouts and intervals
  QUERY_TIMEOUT_MS: 8000,
  CONNECTION_MONITOR_INTERVAL: 300000, // 5 minutes
  SLIDESHOW_INTERVAL: 5000, // 5 seconds

  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB

  // Gaming
  AIM_TRAINER_GAME_IDS: [
    '44d38835-4666-4a02-8eb4-25589a88ebd8',
    '67da1904-004d-472c-8f37-32f0350ce53e',
    'ab74ea87-6563-4448-bf84-e37c5c39275a',
    'ad0d9c5c-5d81-44e2-9a3f-8009e310bf53',
    'cbfef5c0-9a2c-4ab5-9a5f-bf0a65e43b1d',
    'dad78506-9cc6-4bcb-b488-f87007702342'
  ],

  REACTION_TIME_ONLY_GAME_IDS: [
    '614e99e6-40b0-48e6-9dcd-d8c3f1981f52',
    '7759f604-0199-4c42-8a04-81c9b10978b2',
    'a41e04cb-bded-4867-9474-555ba247ef50',
    'ca9408a6-94b1-4744-9177-834c2b63fa10'
  ],

  // Validation
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 6,
  MAX_BIO_LENGTH: 500,
  MAX_DISCORD_HANDLE_LENGTH: 37,
  MAX_TWITTER_HANDLE_LENGTH: 15,

  // Retry logic
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,

  // Default values
  DEFAULT_ELO_RATING: 1000,
  DEFAULT_LEVEL: 1,
  DEFAULT_XP: 0,

  // Supported file types
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],

  // Storage buckets
  STORAGE_BUCKETS: {
    AVATARS: 'avatars',
    CHAT_ATTACHMENTS: 'chat-attachments',
    PARENTAL_CONSENT: 'controle-parental'
  },

  // Local storage keys
  STORAGE_KEYS: {
    USER_DATA: 'esport_user_data',
    THEME: 'theme',
    ONBOARDING_COMPLETED: 'onboarding_completed'
  },

  // Contact information
  CONTACT: {
    SUPPORT_EMAIL: 'support@orangearena.com',
    LEGAL_EMAIL: 'legal@orangearena.com',
    PRIVACY_EMAIL: 'privacy@orangearena.com',
    DISCORD_INVITE: 'https://discord.gg/orangearena',
    COMPANY_NAME: 'Orange Arena SAS',
    COMPANY_ADDRESS: '123 Avenue du Jeu, 75001 Paris, France'
  },

  // Social media base URLs
  SOCIAL_MEDIA: {
    TWITTER_BASE: 'https://twitter.com/intent/tweet',
    FACEBOOK_BASE: 'https://www.facebook.com/sharer/sharer.php',
    DISCORD_BASE: 'https://discord.com/channels/@me'
  }
} as const;

// Riot Data Dragon configuration
export const RIOT_CONFIG = {
  DDRAGON_VERSION: '14.1.1',
  VALID_REGIONS: ['euw1', 'eun1', 'na1', 'kr', 'jp1', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru'],
  DEFAULT_REGION: 'euw1'
} as const;

// Notification types that should trigger live notifications
export const LIVE_NOTIFICATION_TYPES = [
  'team_application',
  'team_accepted',
  'team_rejected',
  'team_member_joined',
  'bracket_advance',
  'bracket_eliminated',
  'friend_request',
  'friend_accepted',
  'tournament_join_now',
  'registration_cancelled'
] as const;

// Tournament statuses
export const TOURNAMENT_STATUS = {
  ONGOING: 'ongoing',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed'
} as const;

// Registration statuses
export const REGISTRATION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  NOT_STARTED: 'not_started'
} as const;

// User types
export const USER_TYPES = {
  ADMIN: 'admin',
  GAMER: 'gamer'
} as const;

// Default images
export const DEFAULT_IMAGES = {
  TOURNAMENT: 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  GAME: 'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  ESPORTS_HERO: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
} as const;
