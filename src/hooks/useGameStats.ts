import { useState, useCallback } from 'react';
import { fetchValorantRankedStats, fetchValorantMatchHistory, fetchFortniteStats } from '../services/api';
import { ValorantRankedData, ValorantMatch } from '../types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useRiotStats = () => {
  const { t } = useTranslation();
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatchHistory = useCallback(async (puuid: string, region: string = 'euw1') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-riot-match-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ puuid, region, count: 10, start: 0 })
      });

      const result = await response.json();

      if (result.success && result.matches) {
        setMatchHistory(result.matches);
        toast.success(t('gaming.matchHistoryLoaded'));
      } else {
        setError(result.error || t('gaming.cannotLoadMatchHistory'));
        toast.error(t('gaming.cannotLoadMatchHistory'));
      }
    } catch (err) {
      console.error('Error loading Riot match history:', err);
      setError(t('gaming.errorLoadingHistory'));
      toast.error(t('gaming.errorLoadingHistory'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return { matchHistory, isLoading, error, loadMatchHistory };
};

export const useValorantStats = () => {
  const { t } = useTranslation();
  const [rankedData, setRankedData] = useState<ValorantRankedData | null>(null);
  const [matchHistory, setMatchHistory] = useState<ValorantMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (puuid: string, region: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const rankedResponse = await fetchValorantRankedStats(puuid, region);
      if (rankedResponse.success && rankedResponse.rankedData) {
        setRankedData(rankedResponse.rankedData);
      } else {
        setError(rankedResponse.error || t('gaming.errorLoadingValorantData'));
      }

      const matchHistoryResponse = await fetchValorantMatchHistory(puuid, region, 10);
      if (matchHistoryResponse.success && matchHistoryResponse.matches) {
        setMatchHistory(matchHistoryResponse.matches);
      }

      toast.success(t('gaming.valorantDataLoaded'));
    } catch (err) {
      console.error('Error loading Valorant data:', err);
      setError(t('gaming.errorLoadingValorantData'));
      toast.error(t('gaming.errorLoadingValorantData'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return { rankedData, matchHistory, isLoading, error, loadData };
};

export const useFortniteStatsData = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (playerIdentifier: string, platform: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchFortniteStats(playerIdentifier, platform);
      setStats(data);
      toast.success(t('gaming.fortniteStatsLoaded'));
    } catch (err: any) {
      console.error('Error loading Fortnite stats:', err);
      setStats(null);
      toast.error(t('gaming.errorLoadingFortniteStats'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return { stats, isLoading, error, loadStats };
};

export const useSteamStats = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (steamId64: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-steam-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          steamId64,
          includeBans: true,
          includeGames: true,
          includeLevel: true
        })
      });

      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || t('gaming.errorLoadingStatistics'));
      }
    } catch (err) {
      console.error('Error loading Steam data:', err);
      setError(t('gaming.errorLoadingStatistics'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return { data, isLoading, error, loadData };
};
