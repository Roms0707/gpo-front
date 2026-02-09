import { useState, useEffect } from 'react';
import { useAppConfig } from '../contexts/AppConfigContext';
import { fetchConfigGames, ConfigGame } from '../services/configGamesService';

interface UseConfigGamesResult {
  games: ConfigGame[];
  isLoading: boolean;
  error: string | null;
}

export const useConfigGames = (): UseConfigGamesResult => {
  const { projectConfigUuid, isLoading: configLoading } = useAppConfig();
  const [games, setGames] = useState<ConfigGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (configLoading) return;

    const loadGames = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchConfigGames(projectConfigUuid);
        setGames(data);
      } catch (err) {
        console.error('[useConfigGames] Error loading config games:', err);
        setError('Failed to load games');
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, [projectConfigUuid, configLoading]);

  return { games, isLoading, error };
};
