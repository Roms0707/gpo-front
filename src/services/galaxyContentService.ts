import {
  GalaxyRubric,
  GalaxyContentItem,
  ResolvedVideo,
  GalaxyErrorResponse,
} from '../types/galaxy';
import { supabase } from '../lib/supabase';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable
  }
}

async function invokeFunction<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token || anonKey;

  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': anonKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request to ${functionName} failed`;
    try {
      const errorBody = await response.json();
      message = errorBody.error || errorBody.message || message;
    } catch {
      // response body not JSON
    }
    const err: GalaxyErrorResponse = {
      status: response.status,
      message,
    };
    throw err;
  }

  return (await response.json()) as T;
}

function parseRubric(raw: Record<string, unknown>): GalaxyRubric {
  return {
    rubric_id: (raw.rubric_id || raw.id || '') as string,
    name: (raw.name || raw.rubric_name || raw.title || '') as string,
    description: (raw.description || null) as string | null,
    thumbnail_url: (raw.thumbnail_url || raw.image_url || raw.cover_image_url || null) as string | null,
    content_category: (raw.content_category || raw.category || '') as string,
    game_id: (raw.game_id || null) as string | null,
    display_on_frontend: raw.display_on_frontend !== false,
    found_in_galaxy: raw.found_in_galaxy !== false,
    content_count: typeof raw.content_count === 'number' ? raw.content_count : undefined,
    sort_order: typeof raw.sort_order === 'number' ? raw.sort_order : undefined,
  };
}

function parseContentItem(raw: Record<string, unknown>, index: number): GalaxyContentItem {
  return {
    content_id: (raw.content_id || raw.id || raw.galaxy_content_id || '') as string,
    title: (raw.title || raw.name || '') as string,
    description: (raw.description || raw.synopsis || null) as string | null,
    thumbnail_url: (
      raw.thumbnail_url ||
      raw.image_url ||
      (raw.asset as Record<string, unknown>)?.image_url ||
      (raw.asset as Record<string, unknown>)?.url ||
      raw.poster_url ||
      null
    ) as string | null,
    duration: raw.duration ? Number(raw.duration) : null,
    content_type: (raw.content_type || raw.type || null) as string | null,
    theme_label: (raw.theme_label || raw.theme || null) as string | null,
    position: typeof raw.position === 'number' ? raw.position : index + 1,
  };
}

export async function fetchRubricsCatalog(configId: string): Promise<GalaxyRubric[]> {
  const cacheKey = `galaxy_catalog_${configId}`;
  const cached = getCached<GalaxyRubric[]>(cacheKey);
  if (cached) return cached;

  const raw = await invokeFunction<Record<string, unknown>>('list-rubrics', { config_id: configId });

  const items = (raw.rubrics || raw.data || raw.items || raw.results || []) as Record<string, unknown>[];
  if (!Array.isArray(items)) {
    return [];
  }

  const rubrics = items.map(parseRubric);
  setCache(cacheKey, rubrics);
  return rubrics;
}

export async function fetchRubricContents(
  configId: string,
  rubricId: string
): Promise<GalaxyContentItem[]> {
  const cacheKey = `galaxy_contents_${configId}_${rubricId}`;
  const cached = getCached<GalaxyContentItem[]>(cacheKey);
  if (cached) return cached;

  const raw = await invokeFunction<Record<string, unknown>>('get-project-rubrics', { config_id: configId, rubric_id: rubricId });

  const items = (
    raw.contents || raw.data || raw.items || raw.results || raw.videos || []
  ) as Record<string, unknown>[];

  if (!Array.isArray(items)) {
    return [];
  }

  const contents = items.map((item, i) => parseContentItem(item, i));
  if (contents.length > 0) {
    setCache(cacheKey, contents);
  }
  return contents;
}

export async function resolveVideoUrl(
  configId: string,
  rubricId: string,
  contentId: string
): Promise<ResolvedVideo> {
  const cacheKey = `galaxy_url_${configId}_${rubricId}_${contentId}`;
  const cached = getCached<ResolvedVideo>(cacheKey);
  if (cached) return cached;

  const raw = await invokeFunction<Record<string, unknown>>('resolve-galaxy-video-url', { config_id: configId, rubric_id: rubricId, content_id: contentId });

  const resolved: ResolvedVideo = {
    content_id: (raw.content_id || contentId) as string,
    delivery_url: (raw.delivery_url || raw.url || raw.streaming_url || raw.video_url || '') as string,
  };

  if (resolved.delivery_url) {
    setCache(cacheKey, resolved);
  }
  return resolved;
}

export function getVisibleRubrics(rubrics: GalaxyRubric[]): GalaxyRubric[] {
  return rubrics.filter(r => r.display_on_frontend && r.found_in_galaxy);
}

export function getTipsRubrics(rubrics: GalaxyRubric[], gameId: string): GalaxyRubric[] {
  return getVisibleRubrics(rubrics).filter(
    r => r.content_category === 'tips' && r.game_id === gameId
  );
}

export function getMasterclassRubrics(rubrics: GalaxyRubric[]): GalaxyRubric[] {
  return getVisibleRubrics(rubrics).filter(r => r.content_category === 'masterclass');
}

export function getGrindZoneRubrics(rubrics: GalaxyRubric[], gameId: string): GalaxyRubric[] {
  return getVisibleRubrics(rubrics).filter(
    r => r.content_category === 'grind_zone' && r.game_id === gameId
  );
}

export function getAllRubricsForGame(rubrics: GalaxyRubric[], gameId: string): GalaxyRubric[] {
  return getVisibleRubrics(rubrics).filter(r => r.game_id === gameId);
}

export function formatGalaxyDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function clearGalaxyCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('galaxy_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => sessionStorage.removeItem(k));
}
