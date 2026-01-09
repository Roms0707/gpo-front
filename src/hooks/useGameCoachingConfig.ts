import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface StatsPlatform {
  platform: string;
  name: string;
  url_pattern: string;
  url_example: string;
}

export interface GameCoachingConfig {
  id: string;
  game_id: string;
  game_category: string;
  character_field_label: string;
  character_field_placeholder: string | null;
  stats_platforms: StatsPlatform[];
  rank_tiers: string[];
  quick_prompts: Record<string, string[]>;
}

interface UseGameCoachingConfigResult {
  config: GameCoachingConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_RANK_TIERS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Professional'];

const DEFAULT_STATS_PLATFORMS: StatsPlatform[] = [
  { platform: 'tracker.gg', name: 'Tracker.gg', url_pattern: 'tracker.gg/', url_example: 'https://tracker.gg/...' },
  { platform: 'other', name: 'Other', url_pattern: '', url_example: '' },
];

const DEFAULT_QUICK_PROMPTS: Record<string, string[]> = {
  en: ['Analyze my gameplay', 'Tips to improve', 'Review my recent matches', 'What am I doing wrong?', 'Best strategies'],
  fr: ['Analyser mon gameplay', 'Conseils pour progresser', 'Revoir mes matchs récents', 'Qu\'est-ce que je fais mal?', 'Meilleures stratégies'],
};

const FALLBACK_CONFIGS: Record<string, Partial<GameCoachingConfig>> = {
  moba: {
    game_category: 'moba',
    character_field_label: 'Main Champions',
    character_field_placeholder: 'e.g., Yasuo, Lux, Thresh',
    rank_tiers: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
    quick_prompts: {
      en: ['Improve my CS', 'Wave management tips', 'Vision control', 'Champion recommendations', 'Teamfight positioning'],
      fr: ['Améliorer mon CS', 'Conseils de gestion des vagues', 'Contrôle de la vision', 'Recommandations de champions', 'Positionnement en teamfight'],
    },
  },
  fps: {
    game_category: 'fps',
    character_field_label: 'Main Agents',
    character_field_placeholder: 'e.g., Jett, Reyna, Sage',
    rank_tiers: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
    quick_prompts: {
      en: ['Improve my aim', 'Crosshair placement tips', 'Economy management', 'Map control strategies', 'Ability usage'],
      fr: ['Améliorer ma visée', 'Conseils de placement du viseur', 'Gestion de l\'économie', 'Stratégies de contrôle de carte', 'Utilisation des compétences'],
    },
  },
  battle_royale: {
    game_category: 'battle_royale',
    character_field_label: 'Main Legends',
    character_field_placeholder: 'e.g., Wraith, Octane, Bloodhound',
    rank_tiers: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Apex Predator'],
    quick_prompts: {
      en: ['Landing strategies', 'Movement techniques', 'Best loadouts', 'Zone rotation tips', 'Endgame strategies'],
      fr: ['Stratégies d\'atterrissage', 'Techniques de mouvement', 'Meilleurs équipements', 'Conseils de rotation de zone', 'Stratégies de fin de partie'],
    },
  },
  fighting: {
    game_category: 'fighting',
    character_field_label: 'Main Characters',
    character_field_placeholder: 'e.g., Ryu, Jin, Chun-Li',
    rank_tiers: ['Rookie', 'Beginner', 'Intermediate', 'Advanced', 'Master', 'Legend'],
    quick_prompts: {
      en: ['Combo execution tips', 'Frame data basics', 'Punish options', 'Matchup advice', 'Movement fundamentals'],
      fr: ['Conseils d\'exécution des combos', 'Bases des frame data', 'Options de punition', 'Conseils de matchup', 'Fondamentaux du mouvement'],
    },
  },
  sports: {
    game_category: 'sports',
    character_field_label: 'Preferred Formations',
    character_field_placeholder: 'e.g., 4-3-3, 4-2-3-1',
    stats_platforms: [],
    rank_tiers: ['Division 10', 'Division 5', 'Division 1', 'Elite'],
    quick_prompts: {
      en: ['Skill moves tips', 'Defensive tactics', 'Formation advice', 'Custom tactics setup', 'Player chemistry'],
      fr: ['Conseils sur les gestes techniques', 'Tactiques défensives', 'Conseils de formation', 'Configuration des tactiques', 'Alchimie des joueurs'],
    },
  },
  default: {
    game_category: 'default',
    character_field_label: 'Main Characters',
    character_field_placeholder: 'Enter your main characters or preferences',
    rank_tiers: DEFAULT_RANK_TIERS,
    quick_prompts: DEFAULT_QUICK_PROMPTS,
  },
};

const detectGameCategoryFromName = (gameName: string): string => {
  const lowerName = gameName.toLowerCase();
  if (lowerName.includes('league') || lowerName.includes('dota') || lowerName.includes('lol')) return 'moba';
  if (lowerName.includes('valorant') || lowerName.includes('cs') || lowerName.includes('counter-strike') || lowerName.includes('overwatch')) return 'fps';
  if (lowerName.includes('fortnite') || lowerName.includes('apex') || lowerName.includes('pubg') || lowerName.includes('warzone')) return 'battle_royale';
  if (lowerName.includes('street fighter') || lowerName.includes('tekken') || lowerName.includes('mortal') || lowerName.includes('guilty gear') || lowerName.includes('smash')) return 'fighting';
  if (lowerName.includes('fc') || lowerName.includes('fifa') || lowerName.includes('nba') || lowerName.includes('rocket league')) return 'sports';
  return 'default';
};

const configCache = new Map<string, { config: GameCoachingConfig; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export const useGameCoachingConfig = (gameId: string, gameName: string): UseGameCoachingConfigResult => {
  const [config, setConfig] = useState<GameCoachingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!gameId) {
      setIsLoading(false);
      return;
    }

    const cached = configCache.get(gameId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setConfig(cached.config);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('game_coaching_ui_config')
        .select('*')
        .eq('game_id', gameId)
        .maybeSingle();

      if (fetchError) {
        console.error('[useGameCoachingConfig] Error fetching config:', fetchError.message);
        throw new Error(fetchError.message);
      }

      let resultConfig: GameCoachingConfig;

      if (data) {
        const detectedCategory = detectGameCategoryFromName(gameName);
        const categoryFallback = FALLBACK_CONFIGS[detectedCategory] || FALLBACK_CONFIGS.default;

        resultConfig = {
          id: data.id,
          game_id: data.game_id,
          game_category: data.game_category || 'default',
          character_field_label: data.character_field_label || 'Main Characters',
          character_field_placeholder: data.character_field_placeholder,
          stats_platforms: Array.isArray(data.stats_platforms) ? data.stats_platforms : DEFAULT_STATS_PLATFORMS,
          rank_tiers: Array.isArray(data.rank_tiers) ? data.rank_tiers : DEFAULT_RANK_TIERS,
          quick_prompts: (data.quick_prompts && typeof data.quick_prompts === 'object' && Object.keys(data.quick_prompts).length > 0)
            ? data.quick_prompts
            : categoryFallback.quick_prompts || DEFAULT_QUICK_PROMPTS,
        };
      } else {
        const detectedCategory = detectGameCategoryFromName(gameName);
        const fallback = FALLBACK_CONFIGS[detectedCategory] || FALLBACK_CONFIGS.default;

        resultConfig = {
          id: '',
          game_id: gameId,
          game_category: fallback.game_category || 'default',
          character_field_label: fallback.character_field_label || 'Main Characters',
          character_field_placeholder: fallback.character_field_placeholder || null,
          stats_platforms: fallback.stats_platforms !== undefined ? fallback.stats_platforms : DEFAULT_STATS_PLATFORMS,
          rank_tiers: fallback.rank_tiers || DEFAULT_RANK_TIERS,
          quick_prompts: fallback.quick_prompts || DEFAULT_QUICK_PROMPTS,
        };
      }

      configCache.set(gameId, { config: resultConfig, timestamp: Date.now() });
      setConfig(resultConfig);
    } catch (err: any) {
      console.error('[useGameCoachingConfig] Error:', err);
      setError(err.message);

      const detectedCategory = detectGameCategoryFromName(gameName);
      const fallback = FALLBACK_CONFIGS[detectedCategory] || FALLBACK_CONFIGS.default;

      setConfig({
        id: '',
        game_id: gameId,
        game_category: fallback.game_category || 'default',
        character_field_label: fallback.character_field_label || 'Main Characters',
        character_field_placeholder: fallback.character_field_placeholder || null,
        stats_platforms: fallback.stats_platforms !== undefined ? fallback.stats_platforms : DEFAULT_STATS_PLATFORMS,
        rank_tiers: fallback.rank_tiers || DEFAULT_RANK_TIERS,
        quick_prompts: fallback.quick_prompts || DEFAULT_QUICK_PROMPTS,
      });
    } finally {
      setIsLoading(false);
    }
  }, [gameId, gameName]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, isLoading, error, refetch: fetchConfig };
};

export const clearCoachingConfigCache = (gameId?: string) => {
  if (gameId) {
    configCache.delete(gameId);
  } else {
    configCache.clear();
  }
};

export const getLocalizedPrompts = (
  quickPrompts: Record<string, string[]> | undefined,
  language: string
): string[] => {
  if (!quickPrompts || typeof quickPrompts !== 'object') {
    return DEFAULT_QUICK_PROMPTS[language] || DEFAULT_QUICK_PROMPTS['en'] || [];
  }
  return quickPrompts[language] || quickPrompts['en'] || [];
};
