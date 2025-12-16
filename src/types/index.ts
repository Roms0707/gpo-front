export interface Tournament {
  id: string;
  title: string;
  game: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  mode: string;
  format: string;
  maxParticipants: number;
  currentParticipants: number;
  cashPrize: number;
  status: 'ongoing' | 'upcoming' | 'completed';
  image?: string;
  header_url?: string;
  streamLink?: string;
  main_prize?: string;
  full_prize?: string;
  locationType?: string;
  locationName?: string;
  eligible_countries?: string;
  minimum_age?: number;
  max_players_per_team?: number;
  max_nb_players?: number;
  backup?: number;
  game_id?: string;
  discord_url?: string;
  twitch_url?: string;
  is_twitch_live?: boolean;
  twitch_last_checked?: string;
  created_at?: string;
  prizes?: TournamentPrize[];
}

export type AuthProvider = 'email' | 'discord' | 'kliento';

export interface User {
  id: string;
  username: string;
  email: string;
  type: 'admin' | 'gamer';
  dateOfBirth?: string;
  hasParentalConsent?: boolean;
  registeredTournaments?: string[];
  country?: string;
  bio?: string;
  avatar_url?: string;
  is_profile_public?: boolean;
  is_profile_completed?: boolean;
  riot_game_name?: string;
  riot_tagline?: string;
  fortnite_epic_id?: string;
  is_fortnite_validated?: boolean;
  fortnite_validation_data?: any;
  discord_handle?: string;
  twitter_handle?: string;
  level?: number;
  xp?: number;
  current_avatar_id?: string;
  msisdn?: string;
  phone_number?: string;
  kliento_user_id?: string;
  auth_provider?: AuthProvider;
  preferred_language?: 'en' | 'fr';
}

export interface KlientoLoginResponse {
  success: boolean;
  user_id?: string;
  error?: string;
  message?: string;
}

export interface KlientoAccountInfo {
  user_id: string;
  msisdn?: string;
  status?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (username: string, email: string, password: string, dateOfBirth: string, country: string, parentalConsent?: File) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  user_id: string;
  team_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'validated' | 'refused' | 'backup';
  created_at: string;
  tournament?: Tournament;
}

export interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
  has_an_api?: boolean;
  api_key?: string;
  slug?: string;
  twitch_cover_url?: string;
  twitch_game_id?: string;
  cover_last_updated?: string;
  igdb_game_id?: string;
  igdb_artwork_url?: string;
  igdb_last_updated?: string;
}

export interface GameContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  game_id: string;
  created_at: string;
  duration?: number;
  theme_label?: string;
  product_year?: number;
  product_country?: string;
  galaxy_content_type?: string;
  galaxy_content_id?: string;
  galaxy_rubric_id?: string;
  extra_data?: any;
  playlist_image_url?: string;
  article_text?: string;
  article_image_url?: string;
}

export type PrizeType = 'monetary' | 'physical_digital';

export interface TournamentPrize {
  id: string;
  tournament_id: string;
  position: number;
  title: string;
  prize_name: string;
  image_url?: string;
  created_at: string;
  prize_type: PrizeType;
  monetary_amount?: number;
  currency?: string;
  redemption_code?: string;
}

export interface MonetaryPrize extends TournamentPrize {
  prize_type: 'monetary';
  monetary_amount: number;
  currency: string;
}

export interface PhysicalDigitalPrize extends TournamentPrize {
  prize_type: 'physical_digital';
  prize_name: string;
}

export interface UserRelationship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: 'pending' | 'accepted' | 'blocked' | 'favorite';
  created_at: string;
  updated_at: string;
  related_user?: {
    id: string;
    username: string;
    avatar_url?: string;
    country?: string;
    bio?: string;
  };
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar?: string;
  receiver_id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface UserGamePublisherAccount {
  id: string;
  user_id: string;
  game_id: string;
  game_publisher_id: string;
  value: string;
  created_at: string;
  is_validated?: boolean;
  validation_date?: string;
  validation_data?: any;
  game_publisher_ids: {
    id: string;
    label: string;
    id_name: string;
    games: {
      id: string;
      name: string;
    };
  };
}

export interface RiotSummonerInfo {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotRankedStats {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface RiotValidationResponse {
  valid: boolean;
  puuid?: string;
  error?: string;
  summonerInfo?: RiotSummonerInfo;
  rankedStats?: RiotRankedStats[];
  region?: string;
}

interface RiotMatch {
  matchId: string;
  gameMode: string;
  gameDuration: number;
  gameCreation: number;
  champion: {
    name: string;
    id: number;
  };
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
    totalDamageDealt: number;
    goldEarned: number;
    creepScore: number;
    champLevel?: number;
  };
  items: number[];
  summoners: number[];
  otherParticipants: {
    championName: string;
    summonerName: string;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
  }[];
  kdaRatio?: number;
}

export interface ValorantRankedData {
  puuid: string;
  gameName?: string;
  tagLine?: string;
  leaderboardRank?: number;
  rankedRating: number;
  numberOfWins: number;
  competitiveTier: number;
  actId: string;
  error?: string;
  message?: string;
}

export interface ValorantMatch {
  matchId: string;
  gameMode: string;
  mapName: string;
  gameStartMillis: number;
  gameLengthMillis: number;
  isRanked: boolean;
  agent: {
    name: string;
    id: string;
  };
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    roundsPlayed: number;
    won: boolean;
    team: string;
  };
  roundResults: {
    roundNum: number;
    roundResult: string;
    roundCeremony: string;
  }[];
  teammates: {
    puuid: string;
    gameName: string;
    tagLine: string;
    agent: string;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
  }[];
}

export interface ValorantRankedResponse {
  success: boolean;
  rankedData?: ValorantRankedData;
  error?: string;
  region?: string;
}

export interface ValorantMatchHistoryResponse {
  success: boolean;
  matches?: ValorantMatch[];
  error?: string;
}

export interface PlayerMatchNotification {
  id: string;
  user_id: string;
  tournament_id: string;
  match_id?: string;
  round_number: number;
  notification_type: 'match_starting' | 'match_result' | 'next_opponent' | 'bracket_ready';
  opponent_id?: string;
  opponent_user_id?: string;
  opponent_game_ids?: OpponentGameIds;
  match_result?: 'won' | 'lost' | 'draw';
  message: string;
  metadata?: NotificationMetadata;
  is_read: boolean;
  created_at: string;
  team_id?: string;
}

export interface OpponentGameIds {
  steam_id?: string;
  discord_handle?: string;
  riot_game_name?: string;
  riot_tagline?: string;
  ea_id?: string;
  epic_games_id?: string;
  battle_net_id?: string;
  ubisoft_username?: string;
  playstation_id?: string;
  xbox_gamertag?: string;
  nintendo_friend_code?: string;
}

export interface NotificationMetadata {
  tournament_title?: string;
  round_name?: string;
  opponent_username?: string;
  match_time?: string;
  bracket_position?: string;
  total_participants?: number;
  tournament_start_time?: string;
  tournament_image?: string;
  [key: string]: any;
}

export interface TournamentDiscordVerification {
  id: string;
  tournament_id: string;
  user_id: string;
  discord_user_id: string;
  discord_username: string;
  is_member: boolean;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface DiscordVerificationStatus {
  isConnected: boolean;
  isMember: boolean;
  discordUsername?: string;
  lastVerified?: string;
  error?: string;
}

export interface GameTrailer {
  id: string;
  config_id: string;
  game_id?: string;
  tournament_id?: string;
  video_url: string;
  is_featured: boolean;
  is_default: boolean;
  title?: string;
  typewriter_phrase_1?: string;
  typewriter_phrase_2?: string;
  created_at: string;
  updated_at: string;
  tournament?: Tournament;
  game?: Game;
}