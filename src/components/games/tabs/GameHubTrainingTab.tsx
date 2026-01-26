import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Search, Loader2, RefreshCw, BookOpen } from 'lucide-react';
import { GameTheme } from '../../../utils/gameThemes';
import { useAuth } from '../../../contexts/AuthContext';
import {
  fetchPlaylistsByGame,
  fetchContinueWatching,
  checkAndGeneratePlaylists
} from '../../../services/playlistService';
import {
  PlaylistWithVideos,
  ContinueWatchingVideo,
  PLAYLIST_CATEGORY_LABELS,
  PLAYLIST_CATEGORY_ORDER,
  PlaylistCategory
} from '../../../types/playlist';
import PlaylistAccordion from '../../training/PlaylistAccordion';
import ContinueWatchingSection from '../../training/ContinueWatchingSection';
import AuthRequiredOverlay from '../../auth/AuthRequiredOverlay';

interface GameHubTrainingTabProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
}

const GameHubTrainingTab: React.FC<GameHubTrainingTabProps> = ({
  gameId,
  gameName,
  theme,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistWithVideos[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await checkAndGeneratePlaylists(gameId);

      const playlistData = await fetchPlaylistsByGame(gameId, user?.id);
      setPlaylists(playlistData);

      if (user?.id) {
        const continueWatchingData = await fetchContinueWatching(user.id, gameId);
        setContinueWatching(continueWatchingData);
      }
    } catch (err) {
      console.error('Error loading training data:', err);
      setError('Failed to load training content');
    } finally {
      setIsLoading(false);
    }
  }, [gameId, user?.id]);

  useEffect(() => {
    setPlaylists([]);
    setContinueWatching([]);
    setExpandedPlaylistId(null);
    setSearchQuery('');
    loadData();
  }, [gameId, loadData]);

  const handleRegeneratePlaylists = async () => {
    try {
      setIsGenerating(true);
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
      if (result.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Error regenerating playlists:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePlaylist = (playlistId: string) => {
    setExpandedPlaylistId(prev => prev === playlistId ? null : playlistId);
  };

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;

    const query = searchQuery.toLowerCase();
    return playlists
      .map(playlist => {
        const matchesPlaylistName = playlist.name.toLowerCase().includes(query);

        const matchingVideos = playlist.videos.filter(pv =>
          pv.video?.title.toLowerCase().includes(query)
        );

        if (matchesPlaylistName) {
          return playlist;
        }

        if (matchingVideos.length > 0) {
          return {
            ...playlist,
            videos: matchingVideos
          };
        }

        return null;
      })
      .filter((p): p is PlaylistWithVideos => p !== null);
  }, [playlists, searchQuery]);

  const playlistsByCategory = useMemo(() => {
    const grouped = new Map<string, PlaylistWithVideos[]>();

    filteredPlaylists.forEach(playlist => {
      const category = playlist.category || 'general';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(playlist);
    });

    const sortedCategories = Array.from(grouped.entries()).sort((a, b) => {
      const orderA = PLAYLIST_CATEGORY_ORDER.indexOf(a[0] as PlaylistCategory);
      const orderB = PLAYLIST_CATEGORY_ORDER.indexOf(b[0] as PlaylistCategory);
      const finalOrderA = orderA === -1 ? 999 : orderA;
      const finalOrderB = orderB === -1 ? 999 : orderB;
      return finalOrderA - finalOrderB;
    });

    return sortedCategories;
  }, [filteredPlaylists]);

  const totalVideos = playlists.reduce((acc, p) => acc + p.videos.length, 0);
  const totalCompleted = playlists.reduce((acc, p) =>
    acc + p.videos.filter(v => v.progress?.is_completed).length, 0
  );

  const renderContent = () => (
    <div id="walkthrough-gamehub-training" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('gameHub.searchVideos', 'Search videos...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-4">
          {user && totalVideos > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <BookOpen className="w-4 h-4" />
              <span>
                {totalCompleted}/{totalVideos} completed
              </span>
            </div>
          )}

          <button
            onClick={handleRegeneratePlaylists}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-dark-300 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh playlists"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isGenerating ? 'Generating...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {user && continueWatching.length > 0 && !searchQuery && (
        <ContinueWatchingSection
          videos={continueWatching}
          theme={theme}
        />
      )}

      {filteredPlaylists.length === 0 ? (
        <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <Play className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery
              ? t('gameHub.noSearchResults', 'No matching videos found')
              : t('gameHub.noTrainingContent', 'No training content available')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery
              ? t('gameHub.tryDifferentSearch', 'Try a different search term')
              : t('gameHub.noTrainingContentDesc', 'Training videos for this game will appear here once available.')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {playlistsByCategory.map(([category, categoryPlaylists]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {PLAYLIST_CATEGORY_LABELS[category as PlaylistCategory] || category}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({categoryPlaylists.length} {categoryPlaylists.length === 1 ? 'playlist' : 'playlists'})
                </span>
              </div>

              <div className="space-y-3">
                {categoryPlaylists.map((playlist) => (
                  <PlaylistAccordion
                    key={playlist.id}
                    playlist={playlist}
                    theme={theme}
                    isExpanded={expandedPlaylistId === playlist.id}
                    onToggle={() => handleTogglePlaylist(playlist.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 rounded-xl p-6 flex items-center gap-4 shadow-xl">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.colors.primary }} />
            <span className="text-gray-900 dark:text-white">
              Generating playlists from videos...
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 max-w-md bg-gray-200 dark:bg-dark-300 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
        <Play className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('gameHub.errorLoadingContent', 'Error loading content')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
          {error}
        </p>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-lg text-white transition-colors"
          style={{ backgroundColor: theme.colors.primary }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequiredOverlay
        theme={theme}
        title={t('auth.trainingLocked.title', 'Unlock Training Content')}
        description={t('auth.trainingLocked.description', 'Login to access video tutorials and track your progress')}
      >
        {renderContent()}
      </AuthRequiredOverlay>
    );
  }

  return renderContent();
};

export default GameHubTrainingTab;
