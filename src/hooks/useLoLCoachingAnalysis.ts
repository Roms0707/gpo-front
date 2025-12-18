import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MatchData {
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
    champLevel: number;
  };
  items: number[];
  summoners: number[];
}

interface PerformanceStats {
  winRate: number;
  avgKDA: number;
  avgCSPerMin: number;
  totalGames: number;
  wins: number;
  losses: number;
  mostPlayedChampions: { name: string; games: number; winRate: number }[];
  recentTrend: 'improving' | 'stable' | 'declining';
}

interface CoachingContext {
  matches: MatchData[];
  stats: PerformanceStats;
  rank?: string;
  region?: string;
  riotId?: string;
  puuid?: string;
}

interface UseLoLCoachingAnalysisReturn {
  context: CoachingContext | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLoLCoachingAnalysis(gameId: string): UseLoLCoachingAnalysisReturn {
  const { user } = useAuth();
  const [context, setContext] = useState<CoachingContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = (matches: MatchData[]): PerformanceStats => {
    if (matches.length === 0) {
      return {
        winRate: 0,
        avgKDA: 0,
        avgCSPerMin: 0,
        totalGames: 0,
        wins: 0,
        losses: 0,
        mostPlayedChampions: [],
        recentTrend: 'stable'
      };
    }

    const wins = matches.filter(m => m.stats.win).length;
    const losses = matches.length - wins;
    const winRate = (wins / matches.length) * 100;

    const totalKills = matches.reduce((sum, m) => sum + m.stats.kills, 0);
    const totalDeaths = matches.reduce((sum, m) => sum + m.stats.deaths, 0);
    const totalAssists = matches.reduce((sum, m) => sum + m.stats.assists, 0);
    const avgKDA = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists;

    const totalCS = matches.reduce((sum, m) => sum + m.stats.creepScore, 0);
    const totalDuration = matches.reduce((sum, m) => sum + m.gameDuration, 0);
    const avgCSPerMin = totalDuration > 0 ? (totalCS / (totalDuration / 60)) : 0;

    const championCounts: { [key: string]: { games: number; wins: number } } = {};
    matches.forEach(m => {
      const champName = m.champion.name;
      if (!championCounts[champName]) {
        championCounts[champName] = { games: 0, wins: 0 };
      }
      championCounts[champName].games++;
      if (m.stats.win) championCounts[champName].wins++;
    });

    const mostPlayedChampions = Object.entries(championCounts)
      .map(([name, data]) => ({
        name,
        games: data.games,
        winRate: (data.wins / data.games) * 100
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);

    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (matches.length >= 6) {
      const recentMatches = matches.slice(0, 3);
      const olderMatches = matches.slice(3, 6);
      const recentWinRate = recentMatches.filter(m => m.stats.win).length / recentMatches.length;
      const olderWinRate = olderMatches.filter(m => m.stats.win).length / olderMatches.length;

      if (recentWinRate > olderWinRate + 0.1) {
        recentTrend = 'improving';
      } else if (recentWinRate < olderWinRate - 0.1) {
        recentTrend = 'declining';
      }
    }

    return {
      winRate,
      avgKDA,
      avgCSPerMin,
      totalGames: matches.length,
      wins,
      losses,
      mostPlayedChampions,
      recentTrend
    };
  };

  const fetchCoachingContext = useCallback(async () => {
    if (!user || !gameId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: accountData, error: accountError } = await supabase
        .from('game_publisher_id_for_users')
        .select(`
          id,
          value,
          is_validated,
          validation_data,
          game_publisher_ids (
            games (id, name)
          )
        `)
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .eq('is_validated', true)
        .maybeSingle();

      if (accountError) {
        console.error('Error fetching gaming account:', accountError);
        setError('Failed to load gaming account');
        setIsLoading(false);
        return;
      }

      if (!accountData) {
        setContext(null);
        setIsLoading(false);
        return;
      }

      const puuid = accountData.validation_data?.puuid;
      const region = accountData.validation_data?.region || 'euw1';
      const riotId = accountData.value;

      if (!puuid) {
        setContext({
          matches: [],
          stats: calculateStats([]),
          riotId,
          region
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-riot-match-history`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            puuid,
            region,
            count: 10
          })
        }
      );

      const matchResult = await response.json();

      if (!matchResult.success || !matchResult.matches) {
        setContext({
          matches: [],
          stats: calculateStats([]),
          riotId,
          region,
          puuid
        });
        setIsLoading(false);
        return;
      }

      const matches: MatchData[] = matchResult.matches;
      const stats = calculateStats(matches);

      setContext({
        matches,
        stats,
        riotId,
        region,
        puuid
      });

    } catch (err) {
      console.error('Error fetching coaching context:', err);
      setError('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  }, [user, gameId]);

  useEffect(() => {
    fetchCoachingContext();
  }, [fetchCoachingContext]);

  return {
    context,
    isLoading,
    error,
    refresh: fetchCoachingContext
  };
}
