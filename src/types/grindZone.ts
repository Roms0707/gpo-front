export type GrindDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GrindPlaylistPreviewVideo {
  title: string;
}

export interface GrindPlaylist {
  id: string;
  game_id: string;
  title: string;
  description: string;
  cover_image_url: string;
  banner_image_url?: string;
  difficulty: GrindDifficulty;
  category: string;
  game_name?: string;
  video_count: number;
  estimated_duration_minutes: number;
  sort_order: number;
  tags: string[];
  preview_videos?: GrindPlaylistPreviewVideo[];
}

export interface FeaturedGrindSlide {
  id: string;
  playlist_id: string;
  title: string;
  subtitle: string;
  category: string;
  game_name: string;
  cover_image_url: string;
  trailer_url?: string;
  is_new?: boolean;
}

export interface GrindVideo {
  id: string;
  playlist_id: string;
  position: number;
  title: string;
  description: string;
  thumbnail_url: string;
  streaming_url: string;
  duration_seconds: number;
}

export interface GrindQuizQuestion {
  id: string;
  playlist_id: string;
  question_text: string;
  screenshot_url?: string;
  choices: [string, string, string, string];
  correct_index: number;
  explanation: string;
}

export interface GrindQuiz {
  id: string;
  playlist_id: string;
  title: string;
  questions: GrindQuizQuestion[];
  pass_threshold: number;
}

export interface GrindUserProgress {
  playlist_id: string;
  videos_completed: string[];
  quiz_score: number | null;
  quiz_passed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface GrindLevel {
  tier: number;
  name: string;
  min_playlists_completed: number;
  icon: string;
  gradient: [string, string];
}

export const GRIND_LEVELS: GrindLevel[] = [
  { tier: 0, name: 'Iron Grinder', min_playlists_completed: 0, icon: 'shield', gradient: ['#6B7280', '#4B5563'] },
  { tier: 1, name: 'Bronze Grinder', min_playlists_completed: 2, icon: 'shield', gradient: ['#CD7F32', '#8B4513'] },
  { tier: 2, name: 'Silver Grinder', min_playlists_completed: 5, icon: 'award', gradient: ['#C0C0C0', '#A8A8A8'] },
  { tier: 3, name: 'Gold Grinder', min_playlists_completed: 10, icon: 'crown', gradient: ['#FFD700', '#FFA500'] },
  { tier: 4, name: 'Platinum Grinder', min_playlists_completed: 20, icon: 'gem', gradient: ['#00CED1', '#008B8B'] },
  { tier: 5, name: 'Diamond Grinder', min_playlists_completed: 35, icon: 'diamond', gradient: ['#00BFFF', '#1E90FF'] },
];

export function getGrindLevel(playlistsCompleted: number): GrindLevel {
  let current = GRIND_LEVELS[0];
  for (const level of GRIND_LEVELS) {
    if (playlistsCompleted >= level.min_playlists_completed) {
      current = level;
    }
  }
  return current;
}

export function getGrindLevelProgress(playlistsCompleted: number): {
  current: GrindLevel;
  next: GrindLevel | null;
  progress: number;
  remaining: number;
} {
  const current = getGrindLevel(playlistsCompleted);
  const nextIndex = GRIND_LEVELS.findIndex(l => l.tier === current.tier) + 1;
  const next = nextIndex < GRIND_LEVELS.length ? GRIND_LEVELS[nextIndex] : null;

  if (!next) {
    return { current, next: null, progress: 100, remaining: 0 };
  }

  const range = next.min_playlists_completed - current.min_playlists_completed;
  const done = playlistsCompleted - current.min_playlists_completed;
  const progress = Math.min(100, Math.round((done / range) * 100));
  const remaining = next.min_playlists_completed - playlistsCompleted;

  return { current, next, progress, remaining };
}
