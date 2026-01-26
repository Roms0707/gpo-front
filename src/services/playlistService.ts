import { supabase } from '../lib/supabase';
import {
  VideoPlaylist,
  PlaylistWithVideos,
  PlaylistVideo,
  UserVideoProgress,
  ContinueWatchingVideo,
  PLAYLIST_CATEGORY_ORDER
} from '../types/playlist';

export const fetchPlaylistsByGame = async (
  gameId: string,
  userId?: string
): Promise<PlaylistWithVideos[]> => {
  try {
    const { data: playlists, error: playlistsError } = await supabase
      .from('video_playlists')
      .select('*')
      .eq('game_id', gameId)
      .order('sort_order', { ascending: true });

    if (playlistsError) {
      console.error('Error fetching playlists:', playlistsError);
      throw new Error('Failed to fetch playlists');
    }

    if (!playlists || playlists.length === 0) {
      return [];
    }

    const playlistIds = playlists.map(p => p.id);

    const { data: playlistVideos, error: videosError } = await supabase
      .from('playlist_videos')
      .select(`
        id,
        playlist_id,
        content_id,
        position,
        created_at,
        video:content_id (
          id,
          title,
          description,
          content_url,
          playlist_image_url,
          duration,
          theme_label,
          game_id
        )
      `)
      .in('playlist_id', playlistIds)
      .order('position', { ascending: true });

    if (videosError) {
      console.error('Error fetching playlist videos:', videosError);
      throw new Error('Failed to fetch playlist videos');
    }

    let userProgress: UserVideoProgress[] = [];
    if (userId) {
      const contentIds = playlistVideos?.map(pv => pv.content_id) || [];
      if (contentIds.length > 0) {
        const { data: progress, error: progressError } = await supabase
          .from('user_video_progress')
          .select('*')
          .eq('user_id', userId)
          .in('content_id', contentIds);

        if (!progressError && progress) {
          userProgress = progress;
        }
      }
    }

    const progressMap = new Map<string, UserVideoProgress>();
    userProgress.forEach(p => progressMap.set(p.content_id, p));

    const videosByPlaylist = new Map<string, PlaylistVideo[]>();
    playlistVideos?.forEach(pv => {
      const playlistId = pv.playlist_id;
      if (!videosByPlaylist.has(playlistId)) {
        videosByPlaylist.set(playlistId, []);
      }
      videosByPlaylist.get(playlistId)!.push({
        ...pv,
        video: pv.video as any,
        progress: progressMap.get(pv.content_id)
      });
    });

    const playlistsWithVideos: PlaylistWithVideos[] = playlists.map(playlist => ({
      ...playlist,
      videos: videosByPlaylist.get(playlist.id) || []
    }));

    playlistsWithVideos.sort((a, b) => {
      const categoryOrderA = PLAYLIST_CATEGORY_ORDER.indexOf(a.category as any);
      const categoryOrderB = PLAYLIST_CATEGORY_ORDER.indexOf(b.category as any);

      if (categoryOrderA !== categoryOrderB) {
        const orderA = categoryOrderA === -1 ? 999 : categoryOrderA;
        const orderB = categoryOrderB === -1 ? 999 : categoryOrderB;
        return orderA - orderB;
      }

      return a.sort_order - b.sort_order;
    });

    return playlistsWithVideos;
  } catch (error) {
    console.error('Error in fetchPlaylistsByGame:', error);
    throw error;
  }
};

export const fetchContinueWatching = async (
  userId: string,
  gameId: string,
  limit: number = 10
): Promise<ContinueWatchingVideo[]> => {
  try {
    const { data: progress, error: progressError } = await supabase
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .gt('watch_time_seconds', 0)
      .order('last_watched_at', { ascending: false })
      .limit(limit * 2);

    if (progressError) {
      console.error('Error fetching user progress:', progressError);
      return [];
    }

    if (!progress || progress.length === 0) {
      return [];
    }

    const contentIds = progress.map(p => p.content_id);

    const { data: videos, error: videosError } = await supabase
      .from('game_contents')
      .select('id, title, playlist_image_url, duration, game_id')
      .in('id', contentIds)
      .eq('game_id', gameId);

    if (videosError) {
      console.error('Error fetching video content:', videosError);
      return [];
    }

    const videoMap = new Map<string, any>();
    videos?.forEach(v => videoMap.set(v.id, v));

    const { data: playlistVideoLinks, error: linksError } = await supabase
      .from('playlist_videos')
      .select(`
        content_id,
        playlist:playlist_id (
          id,
          name
        )
      `)
      .in('content_id', contentIds);

    const playlistMap = new Map<string, { id: string; name: string }>();
    if (!linksError && playlistVideoLinks) {
      playlistVideoLinks.forEach(link => {
        if (link.playlist) {
          playlistMap.set(link.content_id, link.playlist as any);
        }
      });
    }

    const continueWatching: ContinueWatchingVideo[] = [];

    for (const p of progress) {
      const video = videoMap.get(p.content_id);
      if (!video) continue;

      const playlist = playlistMap.get(p.content_id);

      continueWatching.push({
        content_id: p.content_id,
        title: video.title,
        playlist_image_url: video.playlist_image_url,
        duration: video.duration,
        watch_time_seconds: p.watch_time_seconds,
        duration_seconds: p.duration_seconds,
        is_completed: p.is_completed,
        last_watched_at: p.last_watched_at,
        game_id: video.game_id,
        playlist_name: playlist?.name,
        playlist_id: playlist?.id
      });

      if (continueWatching.length >= limit) break;
    }

    return continueWatching;
  } catch (error) {
    console.error('Error in fetchContinueWatching:', error);
    return [];
  }
};

export const saveVideoProgress = async (
  userId: string,
  contentId: string,
  watchTimeSeconds: number,
  durationSeconds: number
): Promise<boolean> => {
  try {
    const isCompleted = durationSeconds > 0 && (watchTimeSeconds / durationSeconds) >= 0.9;

    const { error } = await supabase
      .from('user_video_progress')
      .upsert(
        {
          user_id: userId,
          content_id: contentId,
          watch_time_seconds: watchTimeSeconds,
          duration_seconds: durationSeconds,
          is_completed: isCompleted,
          last_watched_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,content_id'
        }
      );

    if (error) {
      console.error('Error saving video progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveVideoProgress:', error);
    return false;
  }
};

export const markVideoCompleted = async (
  userId: string,
  contentId: string,
  durationSeconds: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_video_progress')
      .upsert(
        {
          user_id: userId,
          content_id: contentId,
          watch_time_seconds: durationSeconds,
          duration_seconds: durationSeconds,
          is_completed: true,
          last_watched_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,content_id'
        }
      );

    if (error) {
      console.error('Error marking video completed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markVideoCompleted:', error);
    return false;
  }
};

export const getVideoProgress = async (
  userId: string,
  contentId: string
): Promise<UserVideoProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching video progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getVideoProgress:', error);
    return null;
  }
};

export const generatePlaylistsForGame = async (gameId: string): Promise<{
  success: boolean;
  playlists_created?: number;
  videos_assigned?: number;
  error?: string;
}> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video-playlists`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ game_id: gameId })
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating playlists:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const checkAndGeneratePlaylists = async (gameId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('video_playlists')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);

    if (error) {
      console.error('Error checking playlists:', error);
      return false;
    }

    if (count === 0) {
      console.log(`No playlists found for game ${gameId}, generating...`);
      const result = await generatePlaylistsForGame(gameId);
      return result.success;
    }

    return true;
  } catch (error) {
    console.error('Error in checkAndGeneratePlaylists:', error);
    return false;
  }
};
