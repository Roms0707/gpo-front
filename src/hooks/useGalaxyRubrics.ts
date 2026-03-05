import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppConfig } from '../contexts/AppConfigContext';
import {
  fetchRubricsCatalog,
  getTipsRubrics,
  getMasterclassRubrics,
  getGrindZoneRubrics,
  getAllRubricsForGame,
} from '../services/galaxyContentService';
import { GalaxyRubric } from '../types/galaxy';

export function useGalaxyRubrics() {
  const { configId } = useAppConfig();
  const [rubrics, setRubrics] = useState<GalaxyRubric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRubrics = useCallback(async () => {
    if (!configId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchRubricsCatalog(configId);
      setRubrics(data);
    } catch (err: unknown) {
      console.error('Failed to load rubrics:', err);
      setError('Content is temporarily unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    loadRubrics();
  }, [loadRubrics]);

  const tipsForGame = useCallback(
    (gameId: string) => getTipsRubrics(rubrics, gameId),
    [rubrics]
  );

  const masterclasses = useMemo(
    () => getMasterclassRubrics(rubrics),
    [rubrics]
  );

  const grindZoneForGame = useCallback(
    (gameId: string) => getGrindZoneRubrics(rubrics, gameId),
    [rubrics]
  );

  const gameHasGrindZoneContent = useCallback(
    (gameId: string) => getGrindZoneRubrics(rubrics, gameId).length > 0,
    [rubrics]
  );

  const allForGame = useCallback(
    (gameId: string) => getAllRubricsForGame(rubrics, gameId),
    [rubrics]
  );

  return {
    rubrics,
    isLoading,
    error,
    reload: loadRubrics,
    configId,
    tipsForGame,
    masterclasses,
    grindZoneForGame,
    gameHasGrindZoneContent,
    allForGame,
  };
}
