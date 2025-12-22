import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface BracketRoundTimer {
  id: string;
  tournament_id: string;
  round_number: number;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  status: 'pending' | 'active' | 'paused' | 'finished';
  paused_at: string | null;
  paused_remaining_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface RoundTimerState {
  timers: BracketRoundTimer[];
  activeRound: number | null;
  isLoading: boolean;
  error: string | null;
  getRoundStatus: (roundNumber: number) => 'pending' | 'active' | 'paused' | 'finished' | 'unknown';
  getRoundTimer: (roundNumber: number) => BracketRoundTimer | undefined;
  getRemainingSeconds: (roundNumber: number) => number | null;
  refetch: () => Promise<void>;
}

export function useBracketRoundTimers(tournamentId: string | null): RoundTimerState {
  const [timers, setTimers] = useState<BracketRoundTimer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimers = useCallback(async () => {
    if (!tournamentId) {
      setTimers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('bracket_round_timers')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setTimers(data || []);
    } catch (err) {
      console.error('[useBracketRoundTimers] Error fetching timers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch round timers');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTimers();
  }, [fetchTimers]);

  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`bracket-round-timers-${tournamentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bracket_round_timers',
        filter: `tournament_id=eq.${tournamentId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTimers(prev => [...prev, payload.new as BracketRoundTimer].sort((a, b) => a.round_number - b.round_number));
        } else if (payload.eventType === 'UPDATE') {
          setTimers(prev => prev.map(timer =>
            timer.id === payload.new.id ? payload.new as BracketRoundTimer : timer
          ));
        } else if (payload.eventType === 'DELETE') {
          setTimers(prev => prev.filter(timer => timer.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const activeRound = timers.find(t => t.status === 'active')?.round_number ??
                      timers.find(t => t.status === 'paused')?.round_number ??
                      null;

  const getRoundStatus = useCallback((roundNumber: number): 'pending' | 'active' | 'paused' | 'finished' | 'unknown' => {
    const timer = timers.find(t => t.round_number === roundNumber);
    if (!timer) return 'unknown';
    return timer.status as 'pending' | 'active' | 'paused' | 'finished';
  }, [timers]);

  const getRoundTimer = useCallback((roundNumber: number): BracketRoundTimer | undefined => {
    return timers.find(t => t.round_number === roundNumber);
  }, [timers]);

  const getRemainingSeconds = useCallback((roundNumber: number): number | null => {
    const timer = timers.find(t => t.round_number === roundNumber);
    if (!timer) return null;

    if (timer.status === 'paused' && timer.paused_remaining_seconds !== null) {
      return timer.paused_remaining_seconds;
    }

    if (timer.status === 'active' && timer.end_time) {
      const endTime = new Date(timer.end_time).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      return remaining;
    }

    if (timer.status === 'pending') {
      return timer.duration_minutes * 60;
    }

    return 0;
  }, [timers]);

  return {
    timers,
    activeRound,
    isLoading,
    error,
    getRoundStatus,
    getRoundTimer,
    getRemainingSeconds,
    refetch: fetchTimers
  };
}
