import { GameContent } from '../types';

export interface VideoGroup {
  seriesName: string;
  videos: GameContent[];
  sortKey: number;
}

interface ParsedTitle {
  seriesName: string;
  episodeNumber: number | null;
  fullTitle: string;
}

const EPISODE_PATTERNS = [
  /(.+?)\s*[-–—]\s*[Ee]pisode\s*(\d+)/i,
  /(.+?)\s*[-–—]\s*[Ee]p\.?\s*(\d+)/i,
  /(.+?)\s*[-–—]\s*[Pp]art\s*(\d+)/i,
  /(.+?)\s*[-–—]\s*#(\d+)/i,
  /(.+?)\s*[-–—]\s*(\d+)$/,
  /(.+?)\s+[Ee]pisode\s*(\d+)/i,
  /(.+?)\s+[Ee]p\.?\s*(\d+)/i,
  /(.+?)\s+[Pp]art\s*(\d+)/i,
  /(.+?)\s+#(\d+)/i,
  /(.+?)\s*\((\d+)\)\s*$/,
  /(.+?)\s*\[(\d+)\]\s*$/,
  /^(\d+)\.\s*(.+)$/,
];

const parseTitle = (title: string): ParsedTitle => {
  const trimmedTitle = title.trim();

  for (const pattern of EPISODE_PATTERNS) {
    const match = trimmedTitle.match(pattern);
    if (match) {
      if (pattern === EPISODE_PATTERNS[EPISODE_PATTERNS.length - 1]) {
        return {
          seriesName: match[2].trim(),
          episodeNumber: parseInt(match[1], 10),
          fullTitle: trimmedTitle,
        };
      }
      return {
        seriesName: match[1].trim(),
        episodeNumber: parseInt(match[2], 10),
        fullTitle: trimmedTitle,
      };
    }
  }

  return {
    seriesName: trimmedTitle,
    episodeNumber: null,
    fullTitle: trimmedTitle,
  };
};

const normalizeSeriesName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const groupVideosByTitle = (videos: GameContent[]): VideoGroup[] => {
  const seriesMap = new Map<string, { displayName: string; videos: GameContent[] }>();
  const ungroupedVideos: GameContent[] = [];

  for (const video of videos) {
    const parsed = parseTitle(video.title);
    const normalizedName = normalizeSeriesName(parsed.seriesName);

    if (parsed.episodeNumber !== null) {
      const existing = seriesMap.get(normalizedName);
      if (existing) {
        existing.videos.push(video);
      } else {
        seriesMap.set(normalizedName, {
          displayName: parsed.seriesName,
          videos: [video],
        });
      }
    } else {
      ungroupedVideos.push(video);
    }
  }

  const groups: VideoGroup[] = [];

  seriesMap.forEach((series) => {
    if (series.videos.length >= 2) {
      series.videos.sort((a, b) => {
        const parsedA = parseTitle(a.title);
        const parsedB = parseTitle(b.title);
        const numA = parsedA.episodeNumber ?? 0;
        const numB = parsedB.episodeNumber ?? 0;
        return numA - numB;
      });

      groups.push({
        seriesName: series.displayName,
        videos: series.videos,
        sortKey: series.videos.length,
      });
    } else {
      ungroupedVideos.push(...series.videos);
    }
  });

  groups.sort((a, b) => b.sortKey - a.sortKey);

  if (ungroupedVideos.length > 0) {
    ungroupedVideos.sort((a, b) => a.title.localeCompare(b.title));
    groups.push({
      seriesName: '',
      videos: ungroupedVideos,
      sortKey: 0,
    });
  }

  return groups;
};

export const flattenGroupsToVideos = (groups: VideoGroup[]): GameContent[] => {
  return groups.flatMap((group) => group.videos);
};

export const getVideoEpisodeInfo = (video: GameContent): { episodeNumber: number | null; seriesName: string } => {
  const parsed = parseTitle(video.title);
  return {
    episodeNumber: parsed.episodeNumber,
    seriesName: parsed.seriesName,
  };
};
