import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tournament, TournamentPrize } from '../types';
import { fetchTournamentById, fetchTournamentPrizes, checkTournamentRegistration, syncTournamentPrizePool } from '../services/api';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { calculateTotalPrizePool } from '../utils/prizePoolUtils';

export const useTournamentData = (user: any) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [prizes, setPrizes] = useState<TournamentPrize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<{ registered: boolean, status: string | null }>({ 
    registered: false, 
    status: null 
  });
  const [gameName, setGameName] = useState<string>('');
  const [currentParticipants, setCurrentParticipants] = useState<number>(0);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [backupSlots, setBackupSlots] = useState<number>(0);
  const [currentBackups, setCurrentBackups] = useState<number>(0);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  // Function to load participants count - Updated to handle team vs solo tournaments and backup slots
  const loadParticipantsCount = async (tournamentId: string, tournamentMode?: string) => {
    try {
      setIsLoadingParticipants(true);

      // Check if this is a team tournament
      const isTeamTournament = tournamentMode?.toLowerCase().includes('team');

      if (isTeamTournament) {
        // For team tournaments, count unique teams by status
        const { data, error } = await supabase.rpc('execute_sql', {
          query: `
            SELECT
              COUNT(DISTINCT CASE WHEN status IN ('pending', 'approved', 'validated') THEN team_id END) as approved_count,
              COUNT(DISTINCT CASE WHEN status = 'backup' THEN team_id END) as backup_count
            FROM tournament_registrations
            WHERE tournament_id = '${tournamentId}'
            AND team_id IS NOT NULL
          `
        });

        if (error) {
          console.error('Error loading team participants count:', error);
          setCurrentParticipants(0);
          setCurrentBackups(0);
        } else {
          const approvedCount = data && data.length > 0 ? parseInt(data[0].approved_count) || 0 : 0;
          const backupCount = data && data.length > 0 ? parseInt(data[0].backup_count) || 0 : 0;
          setCurrentParticipants(approvedCount);
          setCurrentBackups(backupCount);
        }
      } else {
        // For solo tournaments, count individual registrations by status
        const { count: approvedCount, error: approvedError } = await supabase
          .from('tournament_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournamentId)
          .in('status', ['pending', 'approved', 'validated']);

        const { count: backupCount, error: backupError } = await supabase
          .from('tournament_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournamentId)
          .eq('status', 'backup');

        if (approvedError || backupError) {
          console.error('Error loading participants count:', approvedError || backupError);
          setCurrentParticipants(0);
          setCurrentBackups(0);
        } else {
          setCurrentParticipants(approvedCount || 0);
          setCurrentBackups(backupCount || 0);
        }
      }
    } catch (error) {
      console.error('Error loading participants count:', error);
      setCurrentParticipants(0);
      setCurrentBackups(0);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  useEffect(() => {
    const loadTournament = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        const { data } = await fetchTournamentById(id);
        
        if (!data) {
          toast.error('Tournoi non trouvé');
          navigate('/');
          return;
        }
        
        setTournament(data);
        
        // Use max_nb_players from the tournament database field for the Inscription section
        if (data.max_nb_players && data.max_nb_players > 0) {
          setMaxParticipants(data.max_nb_players);
        } else {
          setMaxParticipants(null);
        }

        // Set backup slots if available
        if (data.backup && data.backup > 0) {
          setBackupSlots(data.backup);
        } else {
          setBackupSlots(0);
        }
        
        // Load game name if game_id exists
        if (data.game_id) {
          try {
            const { data: gameData, error: gameError } = await supabase
              .from('games')
              .select('name')
              .eq('id', data.game_id)
              .single();
            
            if (!gameError && gameData) {
              setGameName(gameData.name);
            }
          } catch (error) {
            console.error('Error loading game name:', error);
          }
        }
        
        // Load current participants count with tournament mode
        await loadParticipantsCount(id, data.mode);
        
        // Load tournament prizes
        try {
          const prizesData = await fetchTournamentPrizes(id);
          setPrizes(prizesData);

          if (!data.full_prize && prizesData.length > 0) {
            const calculation = calculateTotalPrizePool(prizesData);
            if (calculation.isNumeric && calculation.total > 0) {
              await syncTournamentPrizePool(id);
            }
          }
        } catch (error) {
          console.error('Error loading prizes:', error);
        }
        
        // Check registration status if user is logged in
        if (user?.id) {
          try {
            const regStatus = await checkTournamentRegistration(id, user.id);
            setRegistrationStatus(regStatus);
          } catch (error) {
            console.error('Error checking registration status:', error);
          }
        }
      } catch (err) {
        console.error('Error loading tournament:', err);
        toast.error('Erreur lors du chargement du tournoi');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTournament();
  }, [id, navigate, user?.id]);

  return {
    tournament,
    prizes,
    isLoading,
    registrationStatus,
    setRegistrationStatus,
    gameName,
    currentParticipants,
    maxParticipants,
    backupSlots,
    currentBackups,
    isLoadingParticipants,
    loadParticipantsCount
  };
};