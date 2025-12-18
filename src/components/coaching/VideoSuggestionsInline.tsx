import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Clock, ChevronUp, ChevronDown, Loader2, Video, X } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { supabase } from '../../lib/supabase';

interface VideoSuggestion {
  id: string;
  title: string;
  description: string;
  content_url: string;
  playlist_image_url: string;
  duration: number | null;
  theme_label: string | null;
}

interface VideoSuggestionsInlineProps {
  inputValue: string;
  gameId: string;
  theme: GameTheme;
  onVideoSelect: (video: VideoSuggestion) => void;
  excludeIds?: string[];
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  farming: ['farm', 'cs', 'minion', 'last hit', 'gold', 'creep'],
  vision: ['ward', 'vision', 'map', 'awareness', 'control'],
  teamfight: ['teamfight', 'team fight', 'engage', 'fight', 'combo'],
  laning: ['lane', 'trading', 'harass', 'poke', 'matchup'],
  macro: ['macro', 'rotation', 'objective', 'dragon', 'baron', 'split'],
  mechanics: ['mechanic', 'combo', 'animation', 'cancel', 'flash', 'skill'],
  jungle: ['jungle', 'gank', 'path', 'clear', 'invade'],
  support: ['support', 'roam', 'peel', 'engage', 'adc'],
  positioning: ['position', 'spacing', 'kiting', 'movement'],
  champion: ['champion', 'build', 'rune', 'item', 'counter'],
  climbing: ['climb', 'rank', 'lp', 'elo', 'improve', 'better'],
};

const detectTopics = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  const detectedTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      detectedTopics.push(topic);
    }
  }

  return detectedTopics;
};

const VideoSuggestionsInline: React.FC<VideoSuggestionsInlineProps> = ({
  inputValue,
  gameId,
  theme,
  onVideoSelect,
  excludeIds = []
}) => {
  const [videos, setVideos] = useState<VideoSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [detectedTopics, setDetectedTopics] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, VideoSuggestion[]>>(new Map());

  const fetchVideos = useCallback(async (topics: string[], keywords: string[]) => {
    const cacheKey = `${gameId}-${topics.join(',')}-${keywords.join(',')}`;

    if (cacheRef.current.has(cacheKey)) {
      setVideos(cacheRef.current.get(cacheKey) || []);
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await supabase.functions.invoke('fetch-coaching-videos', {
        body: {
          game_id: gameId,
          topic: topics[0],
          keywords: keywords.slice(0, 5),
          limit: 4,
          exclude_ids: excludeIds
        }
      });

      if (data?.success && data.videos) {
        const filteredVideos = data.videos.filter(
          (v: VideoSuggestion) => !excludeIds.includes(v.id)
        ).slice(0, 3);

        setVideos(filteredVideos);
        cacheRef.current.set(cacheKey, filteredVideos);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('[VideoSuggestions] Error fetching videos:', error);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, excludeIds]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputValue.length < 3) {
      setVideos([]);
      setDetectedTopics([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const topics = detectTopics(inputValue);
      setDetectedTopics(topics);

      if (topics.length > 0) {
        const keywords = inputValue
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 2);
        fetchVideos(topics, keywords);
      } else {
        setVideos([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, fetchVideos]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDismiss = () => {
    setVideos([]);
    setDetectedTopics([]);
  };

  if (videos.length === 0 && !isLoading) return null;

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: isExpanded ? '220px' : '44px',
        backgroundColor: `${theme.colors.primary}08`,
        borderTop: `1px solid ${theme.colors.primary}20`,
        borderLeft: `1px solid ${theme.colors.primary}20`,
        borderRight: `1px solid ${theme.colors.primary}20`,
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4" style={{ color: theme.colors.primary }} />
          <span className="text-xs font-medium text-gray-300">
            Related Videos
          </span>
          {detectedTopics.length > 0 && (
            <div className="flex items-center gap-1">
              {detectedTopics.slice(0, 2).map((topic, i) => (
                <span
                  key={topic}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    color: theme.colors.primary
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.colors.primary }} />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      <div
        className="px-3 pb-3 transition-opacity duration-200"
        style={{ opacity: isExpanded ? 1 : 0 }}
      >
        {isLoading && videos.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Finding relevant tutorials...
            </div>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-700">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => onVideoSelect(video)}
                className="flex-shrink-0 w-44 rounded-lg overflow-hidden bg-dark-300 hover:bg-dark-400 transition-all group hover:scale-[1.02] focus:outline-none focus:ring-2"
                style={{
                  border: `1px solid ${theme.colors.primary}20`,
                  '--tw-ring-color': theme.colors.primary
                } as React.CSSProperties}
              >
                <div className="relative aspect-video bg-gray-800">
                  {video.playlist_image_url ? (
                    <img
                      src={video.playlist_image_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-600" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>

                  {video.duration && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <p className="text-xs text-white font-medium line-clamp-2 text-left leading-tight">
                    {video.title}
                  </p>
                  {video.theme_label && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {video.theme_label}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSuggestionsInline;
