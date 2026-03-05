import { MasterclassEpisode } from '../types';

const CACHE_TTL_MS = 30 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ProjectRubric {
  id: string;
  rubric_id: string;
  rubric_name: string;
  content_url: string;
}

interface ProjectRubricsResponse {
  config_id: string;
  brand_name: string;
  campaign_id: string;
  country_code: string;
  language_code: string;
  project_rubrics: ProjectRubric[];
  game_rubrics: Record<string, ProjectRubric[]>;
  total_rubrics: number;
}

export interface GalaxyVideo {
  id: string;
  title: string;
  description?: string;
  streamingUrl: string;
  thumbnailUrl?: string;
  duration?: number;
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

export const fetchProjectRubrics = async (configId: string): Promise<ProjectRubricsResponse> => {
  const cacheKey = `galaxy_rubrics_${configId}`;
  const cached = getCached<ProjectRubricsResponse>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-project-rubrics`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ config_id: configId }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch project rubrics (${response.status})`);
  }

  const data: ProjectRubricsResponse = await response.json();
  setCache(cacheKey, data);
  return data;
};

function parseGalaxyResponse(raw: any): GalaxyVideo[] {
  const items: any[] = raw?.data || raw?.contents || raw?.items || raw?.results || [];

  if (!Array.isArray(items)) {
    console.warn('[GalaxyMasterclass] Unexpected Galaxy response shape:', Object.keys(raw || {}));
    return [];
  }

  return items
    .map((item: any) => {
      const streamingUrl =
        item.delivery?.url ||
        item.delivery_url ||
        item.content_url ||
        item.streaming_url ||
        item.video_url ||
        item.url ||
        '';

      const thumbnailUrl =
        item.asset?.image_url ||
        item.asset?.url ||
        item.image_url ||
        item.thumbnail_url ||
        item.poster_url ||
        '';

      const title = item.title || item.name || '';

      if (!streamingUrl) return null;

      return {
        id: item.id || item.content_id || item.galaxy_content_id || '',
        title,
        description: item.description || item.synopsis || '',
        streamingUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        duration: item.duration ? Number(item.duration) : undefined,
      } as GalaxyVideo;
    })
    .filter((v): v is GalaxyVideo => v !== null);
}

export const fetchGalaxyVideosForRubric = async (contentUrl: string): Promise<GalaxyVideo[]> => {
  const cacheKey = `galaxy_videos_${btoa(contentUrl).slice(0, 60)}`;
  const cached = getCached<GalaxyVideo[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(contentUrl);

  if (!response.ok) {
    throw new Error(`Galaxy API returned ${response.status}`);
  }

  const raw = await response.json();
  console.log('[GalaxyMasterclass] Raw Galaxy response keys:', Object.keys(raw || {}));

  const videos = parseGalaxyResponse(raw);
  if (videos.length > 0) {
    setCache(cacheKey, videos);
  }
  return videos;
};

function extractPartNumber(title: string): number | null {
  const patterns = [
    /part\s*(\d+)/i,
    /partie\s*(\d+)/i,
    /episode\s*(\d+)/i,
    /ep\.?\s*(\d+)/i,
    /\b(\d+)\s*(?:\/\s*\d+|\s*-\s*\d+)?\s*$/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

export const matchGalaxyVideosToEpisodes = (
  galaxyVideos: GalaxyVideo[],
  episodes: MasterclassEpisode[]
): Record<string, GalaxyVideo> => {
  const result: Record<string, GalaxyVideo> = {};

  for (const episode of episodes) {
    const matchingVideo = galaxyVideos.find((video) => {
      const partNum = extractPartNumber(video.title);
      return partNum === episode.episode_number;
    });

    if (matchingVideo) {
      result[episode.id] = matchingVideo;
    }
  }

  return result;
};

export const fetchMasterclassVideos = async (
  configId: string,
  galaxyRubricId: string,
  episodes: MasterclassEpisode[]
): Promise<Record<string, GalaxyVideo>> => {
  const rubrics = await fetchProjectRubrics(configId);

  const allRubrics = [
    ...rubrics.project_rubrics,
    ...Object.values(rubrics.game_rubrics).flat(),
  ];

  const matchingRubric = allRubrics.find((r) => r.rubric_id === galaxyRubricId);

  if (!matchingRubric) {
    console.warn(`[GalaxyMasterclass] No rubric found with id ${galaxyRubricId}`);
    return {};
  }

  const videos = await fetchGalaxyVideosForRubric(matchingRubric.content_url);

  if (videos.length === 0) {
    console.warn('[GalaxyMasterclass] No videos returned from Galaxy for rubric:', matchingRubric.rubric_name);
    return {};
  }

  return matchGalaxyVideosToEpisodes(videos, episodes);
};
