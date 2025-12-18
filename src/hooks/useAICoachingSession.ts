import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLoLCoachingAnalysis } from './useLoLCoachingAnalysis';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface VideoRecommendation {
  content_id: string;
  title: string;
  reason: string;
  playlist_image_url?: string;
  duration?: number;
}

interface CoachingSession {
  id: string;
  session_title: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed';
  messages: ChatMessage[];
}

interface UseAICoachingSessionReturn {
  sessionId: string | null;
  messages: ChatMessage[];
  videoRecommendations: VideoRecommendation[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sessions: CoachingSession[];
  sendMessage: (message: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  startNewSession: () => void;
  isContextLoading: boolean;
}

export function useAICoachingSession(
  gameId: string,
  gameName: string
): UseAICoachingSessionReturn {
  const { user } = useAuth();
  const { context, isLoading: isContextLoading } = useLoLCoachingAnalysis(gameId);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [videoRecommendations, setVideoRecommendations] = useState<VideoRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);

  const fetchSessions = useCallback(async () => {
    if (!user || !gameId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_coaching_sessions')
        .select('id, session_title, created_at, updated_at, status, messages')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (fetchError) {
        console.error('Error fetching sessions:', fetchError);
        return;
      }

      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  }, [user, gameId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const sendMessage = useCallback(async (message: string) => {
    if (!user || !gameId || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      const performanceContext = context ? {
        matches: context.matches,
        stats: context.stats,
        rank: context.rank,
        region: context.region
      } : undefined;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coaching-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            session_id: sessionId,
            message,
            game_id: gameId,
            game_name: gameName,
            performance_context: performanceContext
          })
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get coaching response');
      }

      if (!sessionId && result.session_id) {
        setSessionId(result.session_id);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (result.video_recommendations && result.video_recommendations.length > 0) {
        const videoIds = result.video_recommendations.map((v: any) => v.content_id);
        const { data: videoDetails } = await supabase
          .from('game_contents')
          .select('id, title, playlist_image_url, duration')
          .in('id', videoIds);

        if (videoDetails) {
          const enrichedRecs = result.video_recommendations.map((rec: any) => {
            const details = videoDetails.find(v => v.id === rec.content_id);
            return {
              ...rec,
              playlist_image_url: details?.playlist_image_url,
              duration: details?.duration
            };
          });
          setVideoRecommendations(prev => [...prev, ...enrichedRecs]);
        } else {
          setVideoRecommendations(prev => [...prev, ...result.video_recommendations]);
        }
      }

      fetchSessions();

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  }, [user, gameId, gameName, sessionId, context, isSending, fetchSessions]);

  const loadSession = useCallback(async (loadSessionId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ai_coaching_sessions')
        .select('*')
        .eq('id', loadSessionId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !data) {
        throw new Error('Session not found');
      }

      setSessionId(data.id);
      setMessages(data.messages || []);
      setVideoRecommendations([]);

      const { data: recommendations } = await supabase
        .from('coaching_content_recommendations')
        .select(`
          content_id,
          reason,
          game_contents (
            id,
            title,
            playlist_image_url,
            duration
          )
        `)
        .eq('session_id', loadSessionId);

      if (recommendations && recommendations.length > 0) {
        const enrichedRecs = recommendations.map((rec: any) => ({
          content_id: rec.content_id,
          title: rec.game_contents?.title || '',
          reason: rec.reason,
          playlist_image_url: rec.game_contents?.playlist_image_url,
          duration: rec.game_contents?.duration
        }));
        setVideoRecommendations(enrichedRecs);
      }

    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const startNewSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setVideoRecommendations([]);
    setError(null);
  }, []);

  return {
    sessionId,
    messages,
    videoRecommendations,
    isLoading,
    isSending,
    error,
    sessions,
    sendMessage,
    loadSession,
    startNewSession,
    isContextLoading
  };
}
