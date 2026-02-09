import { RIOT_CONFIG } from '../constants';

const DDRAGON_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${RIOT_CONFIG.DDRAGON_VERSION}`;

/**
 * Get the URL for a champion's square icon
 * @param championName - The champion's name (e.g., "Jinx", "LeeSin")
 * @returns URL to the champion's 64x64 icon
 */
export const getChampionIconUrl = (championName: string): string => {
  return `${DDRAGON_BASE_URL}/img/champion/${championName}.png`;
};

/**
 * Get the URL for a summoner spell icon
 * @param summonerSpellId - The summoner spell ID (e.g., 4 for Flash, 14 for Ignite)
 * @returns URL to the summoner spell's 64x64 icon
 */
export const getSummonerSpellIconUrl = (summonerSpellId: number): string => {
  const spellMap: { [key: number]: string } = {
    1: 'SummonerBoost', // Cleanse
    3: 'SummonerExhaust', // Exhaust
    4: 'SummonerFlash', // Flash
    6: 'SummonerHaste', // Ghost
    7: 'SummonerHeal', // Heal
    11: 'SummonerSmite', // Smite
    12: 'SummonerTeleport', // Teleport
    13: 'SummonerMana', // Clarity
    14: 'SummonerDot', // Ignite
    21: 'SummonerBarrier', // Barrier
    31: 'SummonerPoroThrow', // Poro Toss
    32: 'SummonerSnowball', // Mark/Dash
    39: 'SummonerSnowURFSnowball_Mark', // Mark
    54: 'Summoner_UltBookPlaceholder', // Placeholder
  };

  const spellName = spellMap[summonerSpellId] || 'SummonerFlash';
  return `${DDRAGON_BASE_URL}/img/spell/${spellName}.png`;
};

/**
 * Get the URL for an item icon
 * @param itemId - The item's ID number
 * @returns URL to the item's icon
 */
export const getItemIconUrl = (itemId: number): string => {
  return `${DDRAGON_BASE_URL}/img/item/${itemId}.png`;
};

/**
 * Get the URL for a profile icon
 * @param iconId - The profile icon's ID number
 * @returns URL to the profile icon
 */
export const getProfileIconUrl = (iconId: number): string => {
  return `${DDRAGON_BASE_URL}/img/profileicon/${iconId}.png`;
};

/**
 * Calculate KDA ratio
 * @param kills - Number of kills
 * @param deaths - Number of deaths
 * @param assists - Number of assists
 * @returns KDA ratio rounded to 2 decimal places
 */
export const calculateKDAR = (kills: number, deaths: number, assists: number): number => {
  if (deaths === 0) {
    return kills + assists; // Perfect KDA
  }
  return Math.round(((kills + assists) / deaths) * 100) / 100;
};

/**
 * Format game duration from seconds to MM:SS format
 * @param seconds - Game duration in seconds
 * @returns Formatted duration string (e.g., "31:45")
 */
export const formatGameDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format time ago from timestamp
 * @param timestamp - Game creation timestamp in milliseconds
 * @returns Time ago string (e.g., "5m ago", "2h ago", "3d ago")
 */
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Get queue type display name
 * @param gameMode - The game mode from Riot API
 * @returns Human-readable queue type
 */
export const getQueueTypeDisplayName = (gameMode: string): string => {
  const queueMap: { [key: string]: string } = {
    'CLASSIC': 'Summoner\'s Rift',
    'ARAM': 'ARAM',
    'URF': 'URF',
    'ONEFORALL': 'One for All',
    'ASCENSION': 'Ascension',
    'FIRSTBLOOD': 'Snowdown Showdown',
    'KINGPORO': 'Legend of the Poro King',
    'SIEGE': 'Nexus Siege',
    'ASSASSINATE': 'Blood Hunt Assassin',
    'ARSR': 'All Random Summoner\'s Rift',
    'DARKSTAR': 'Dark Star: Singularity',
    'STARGUARDIAN': 'Star Guardian Invasion',
    'PROJECT': 'PROJECT: Hunters',
    'GAMEMODEX': 'Nexus Blitz',
    'ODYSSEY': 'Odyssey: Extraction',
    'TUTORIAL': 'Tutorial',
    'DOOMBOTSTEEMO': 'Doom Bots',
    'PRACTICETOOL': 'Practice Tool',
    'CHERRY': 'Arena'
  };

  return queueMap[gameMode] || gameMode;
};
