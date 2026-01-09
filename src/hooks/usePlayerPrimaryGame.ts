import { useMemo } from 'react';
import { getGameTheme, GameTheme } from '../utils/gameThemes';

interface PlayerRanking {
  id: string;
  elo_rating: number;
  wins: number;
  losses: number;
  rank_tier?: string;
  games?: {
    id: string;
    name: string;
    publisher?: string;
  };
}

interface TournamentRegistration {
  id: string;
  status: string;
  tournament?: {
    game_id?: string;
    games?: {
      id: string;
      name: string;
    };
  };
}

interface GamingAccount {
  id: string;
  value: string;
  is_validated?: boolean;
  game_publisher_ids?: {
    games?: {
      id: string;
      name: string;
    };
  };
}

interface UsePlayerPrimaryGameParams {
  playerRankings?: PlayerRanking[];
  registrations?: TournamentRegistration[];
  gamingAccounts?: GamingAccount[];
  favoriteGameId?: string | null;
  favoriteGameName?: string | null;
}

interface GameActivityScore {
  gameId: string;
  gameName: string;
  score: number;
  tournamentCount: number;
  hasRanking: boolean;
  isValidated: boolean;
}

export interface PlayerPrimaryGameResult {
  primaryGame: string | null;
  primaryGameId: string | null;
  theme: GameTheme;
  gameActivities: GameActivityScore[];
  isLoading: boolean;
}

export const usePlayerPrimaryGame = ({
  playerRankings = [],
  registrations = [],
  gamingAccounts = [],
  favoriteGameId = null,
  favoriteGameName = null
}: UsePlayerPrimaryGameParams): PlayerPrimaryGameResult => {
  const result = useMemo(() => {
    if (favoriteGameId && favoriteGameName) {
      const theme = getGameTheme(favoriteGameName);
      return {
        primaryGame: favoriteGameName,
        primaryGameId: favoriteGameId,
        theme,
        gameActivities: [],
        isLoading: false
      };
    }

    const gameScores: Map<string, GameActivityScore> = new Map();

    playerRankings.forEach((ranking) => {
      if (ranking.games?.name) {
        const gameId = ranking.games.id;
        const gameName = ranking.games.name;
        const existing = gameScores.get(gameId) || {
          gameId,
          gameName,
          score: 0,
          tournamentCount: 0,
          hasRanking: false,
          isValidated: false
        };

        existing.hasRanking = true;
        existing.score += 100;
        existing.score += (ranking.wins || 0) * 10;
        existing.score += (ranking.elo_rating || 0) / 10;

        gameScores.set(gameId, existing);
      }
    });

    registrations.forEach((reg) => {
      const game = reg.tournament?.games;
      if (game?.name) {
        const gameId = game.id;
        const gameName = game.name;
        const existing = gameScores.get(gameId) || {
          gameId,
          gameName,
          score: 0,
          tournamentCount: 0,
          hasRanking: false,
          isValidated: false
        };

        existing.tournamentCount += 1;
        existing.score += 50;

        if (reg.status === 'approved' || reg.status === 'validated') {
          existing.score += 25;
        }

        gameScores.set(gameId, existing);
      }
    });

    gamingAccounts.forEach((account) => {
      const game = account.game_publisher_ids?.games;
      if (game?.name) {
        const gameId = game.id;
        const gameName = game.name;
        const existing = gameScores.get(gameId) || {
          gameId,
          gameName,
          score: 0,
          tournamentCount: 0,
          hasRanking: false,
          isValidated: false
        };

        existing.score += 30;

        if (account.is_validated) {
          existing.isValidated = true;
          existing.score += 20;
        }

        gameScores.set(gameId, existing);
      }
    });

    const sortedActivities = Array.from(gameScores.values())
      .sort((a, b) => b.score - a.score);

    const primaryGame = sortedActivities[0]?.gameName || null;
    const primaryGameId = sortedActivities[0]?.gameId || null;
    const theme = getGameTheme(primaryGame);

    return {
      primaryGame,
      primaryGameId,
      theme,
      gameActivities: sortedActivities,
      isLoading: false
    };
  }, [playerRankings, registrations, gamingAccounts, favoriteGameId, favoriteGameName]);

  return result;
};

export const calculatePlayerLevel = (xp: number): { level: number; title: string; nextLevelXp: number; progress: number } => {
  const levels = [
    { threshold: 0, title: 'Rookie' },
    { threshold: 500, title: 'Bronze' },
    { threshold: 1500, title: 'Silver' },
    { threshold: 3000, title: 'Gold' },
    { threshold: 5000, title: 'Platinum' },
    { threshold: 8000, title: 'Diamond' },
    { threshold: 12000, title: 'Master' },
    { threshold: 20000, title: 'Legend' }
  ];

  let currentLevel = 0;
  let currentTitle = levels[0].title;
  let nextLevelXp = levels[1].threshold;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].threshold) {
      currentLevel = i;
      currentTitle = levels[i].title;
      nextLevelXp = levels[i + 1]?.threshold || levels[i].threshold;
      break;
    }
  }

  const currentThreshold = levels[currentLevel].threshold;
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextLevelXp - currentThreshold;
  const progress = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  return {
    level: currentLevel + 1,
    title: currentTitle,
    nextLevelXp,
    progress
  };
};

export const calculateXpFromActivity = (
  tournamentsPlayed: number,
  tournamentsWon: number,
  validatedAccounts: number,
  isProfileComplete: boolean,
  friendsCount: number
): number => {
  let xp = 0;

  xp += tournamentsPlayed * 50;
  xp += tournamentsWon * 100;
  xp += validatedAccounts * 25;
  xp += isProfileComplete ? 50 : 0;
  xp += Math.min(friendsCount, 20) * 10;

  return xp;
};
