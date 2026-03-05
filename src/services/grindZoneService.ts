import { GrindPlaylist, GrindVideo, GrindQuiz, GrindUserProgress } from '../types/grindZone';
import { getMockPlaylists, getMockVideos, getMockQuizQuestions } from '../data/grindZonePlaceholders';

const STORAGE_KEY = 'grind_zone_progress';

function loadAllProgress(): Record<string, GrindUserProgress> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllProgress(data: Record<string, GrindUserProgress>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// TODO: Replace with Galaxy API call
export async function fetchGrindPlaylists(gameId: string, gameName: string): Promise<GrindPlaylist[]> {
  return getMockPlaylists(gameId, gameName);
}

// TODO: Replace with Galaxy API call
export async function fetchPlaylistVideos(playlistId: string, videoCount: number): Promise<GrindVideo[]> {
  return getMockVideos(playlistId, videoCount);
}

// TODO: Replace with Galaxy API call
export async function fetchPlaylistQuiz(playlistId: string): Promise<GrindQuiz> {
  const questions = getMockQuizQuestions(playlistId);
  return {
    id: `quiz-${playlistId}`,
    playlist_id: playlistId,
    title: 'Playlist Quiz',
    questions,
    pass_threshold: 0.8,
  };
}

// TODO: Replace with Galaxy API call
export async function fetchUserGrindProgress(
  _userId: string,
  gameId: string,
  gameName: string
): Promise<Record<string, GrindUserProgress>> {
  const all = loadAllProgress();
  const playlists = getMockPlaylists(gameId, gameName);
  const result: Record<string, GrindUserProgress> = {};
  for (const p of playlists) {
    if (all[p.id]) {
      result[p.id] = all[p.id];
    }
  }
  return result;
}

// TODO: Replace with Galaxy API call
export async function saveVideoProgress(
  _userId: string,
  playlistId: string,
  videoId: string
): Promise<GrindUserProgress> {
  const all = loadAllProgress();
  const existing = all[playlistId] || {
    playlist_id: playlistId,
    videos_completed: [],
    quiz_score: null,
    quiz_passed: false,
    started_at: new Date().toISOString(),
    completed_at: null,
  };

  if (!existing.videos_completed.includes(videoId)) {
    existing.videos_completed = [...existing.videos_completed, videoId];
  }

  all[playlistId] = existing;
  saveAllProgress(all);
  return existing;
}

// TODO: Replace with Galaxy API call
export async function saveQuizResult(
  _userId: string,
  playlistId: string,
  score: number,
  passed: boolean
): Promise<GrindUserProgress> {
  const all = loadAllProgress();
  const existing = all[playlistId] || {
    playlist_id: playlistId,
    videos_completed: [],
    quiz_score: null,
    quiz_passed: false,
    started_at: new Date().toISOString(),
    completed_at: null,
  };

  existing.quiz_score = score;
  existing.quiz_passed = passed;
  if (passed) {
    existing.completed_at = new Date().toISOString();
  }

  all[playlistId] = existing;
  saveAllProgress(all);
  return existing;
}

export function getCompletedPlaylistCount(): number {
  const all = loadAllProgress();
  return Object.values(all).filter(p => p.quiz_passed).length;
}

export function getTotalGrindStats(): {
  playlistsCompleted: number;
  videosWatched: number;
  quizzesPassed: number;
} {
  const all = loadAllProgress();
  const entries = Object.values(all);
  return {
    playlistsCompleted: entries.filter(p => p.quiz_passed).length,
    videosWatched: entries.reduce((sum, p) => sum + p.videos_completed.length, 0),
    quizzesPassed: entries.filter(p => p.quiz_passed).length,
  };
}
