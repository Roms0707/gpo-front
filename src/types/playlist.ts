export interface VideoPlaylist {
  id: string;
  game_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  sort_order: number;
  is_auto_generated: boolean;
  keywords: string[];
  created_at: string;
  updated_at: string;
  video_count?: number;
  total_duration?: number;
  completed_count?: number;
}

export interface PlaylistVideo {
  id: string;
  playlist_id: string;
  content_id: string;
  position: number;
  created_at: string;
  video?: PlaylistVideoContent;
  progress?: UserVideoProgress;
}

export interface PlaylistVideoContent {
  id: string;
  title: string;
  description: string | null;
  content_url: string;
  playlist_image_url: string | null;
  duration: number | null;
  theme_label: string | null;
  game_id: string;
}

export interface UserVideoProgress {
  id: string;
  user_id: string;
  content_id: string;
  watch_time_seconds: number;
  duration_seconds: number;
  is_completed: boolean;
  last_watched_at: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistWithVideos extends VideoPlaylist {
  videos: PlaylistVideo[];
}

export interface ContinueWatchingVideo {
  content_id: string;
  title: string;
  playlist_image_url: string | null;
  duration: number | null;
  watch_time_seconds: number;
  duration_seconds: number;
  is_completed: boolean;
  last_watched_at: string;
  game_id: string;
  playlist_name?: string;
  playlist_id?: string;
}

export type PlaylistCategory =
  | 'fundamentals'
  | 'knowledge'
  | 'advanced'
  | 'characters'
  | 'analysis'
  | 'general';

export const PLAYLIST_CATEGORY_LABELS: Record<PlaylistCategory, string> = {
  fundamentals: 'Fundamentals',
  knowledge: 'Game Knowledge',
  advanced: 'Advanced',
  characters: 'Character Guides',
  analysis: 'Analysis',
  general: 'General'
};

export const PLAYLIST_CATEGORY_ORDER: PlaylistCategory[] = [
  'fundamentals',
  'knowledge',
  'characters',
  'advanced',
  'analysis',
  'general'
];
