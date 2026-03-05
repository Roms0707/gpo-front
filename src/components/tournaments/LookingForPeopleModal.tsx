import React, { useState, useEffect } from 'react';
import { X, Users, User, Search, UserPlus, Clock, CheckCircle, XCircle, Shield, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { joinChannel } from '../../services/channelService';
import { useAuth } from '../../contexts/AuthContext';
import { validateTeamApplicationAcceptance } from '../../services/api';
import toast from 'react-hot-toast';
import PlayerProfileModal from '../ui/PlayerProfileModal';

interface Team {
  id: string;
  name: string;
  captain_id: string;
  captain_name: string;
  current_members: number;
  max_members: number | null;
  is_lfp: boolean;
  user_has_applied: boolean;
  application_status?: string;
}

interface LookingForPeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  userTeamId: string | null;
  isTeamCaptain: boolean;
}

const LookingForPeopleModal: React.FC<LookingForPeopleModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
  userTeamId,
  isTeamCaptain
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTeamLfp, setIsTeamLfp] = useState(false);
  const [isUpdatingLfp, setIsUpdatingLfp] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [activeTab, setActiveTab] = useState<'teams' | 'applications'>('teams');
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [teamApplications, setTeamApplications] = useState<any[]>([]);

  // Application form state
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [applicationMessage, setApplicationMessage] = useState('');
  const [gamePublisherFields, setGamePublisherFields] = useState<any[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);

  // Player profile modal state
  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTeams();
      if (user) {
        checkTeamLfpStatus();
        loadUserApplications();
        if (userTeamId && isTeamCaptain) {
          loadTeamApplications();
        }
      }
    }
  }, [isOpen, tournamentId, user, userTeamId, isTeamCaptain]);

  // Load game ID for the tournament
  useEffect(() => {
    const loadTournamentGameId = async () => {
      if (!tournamentId) return;

      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('game_id')
          .eq('id', tournamentId)
          .single();

        if (error) {
          console.error('Error loading tournament game ID:', error);
          return;
        }

        if (data?.game_id) {
          setGameId(data.game_id);
          loadGamePublisherFields(data.game_id);
        }
      } catch (error) {
        console.error('Error loading tournament game ID:', error);
      }
    };

    loadTournamentGameId();
  }, [tournamentId]);

  const loadGamePublisherFields = async (gameId: string) => {
    try {
      // Get game publisher IDs for this specific game
      const { data: publisherIds, error: publisherError } = await supabase
        .from('game_publisher_ids')
        .select('id, label, id_name, required')
        .eq('game_id', gameId)
        .order('label', { ascending: true });

      if (publisherError) {
        console.error('Error loading game publisher IDs:', publisherError);
        return;
      }

      if (!publisherIds || publisherIds.length === 0) {
        console.log('No publisher IDs found for game:', gameId);
        setGamePublisherFields([]);
        return;
      }

      // Get user's existing values for this game if user is logged in
      let userValues = [];
      if (user?.id) {
        const { data: userValuesData, error: userError } = await supabase
          .from('game_publisher_id_for_users')
          .select('game_publisher_id, value')
          .eq('user_id', user.id)
          .eq('game_id', gameId);

        if (userError) {
          console.error('Error loading user gaming accounts:', userError);
        } else {
          userValues = userValuesData || [];
        }
      }

      // Create a map of existing values
      const existingValues = new Map();
      userValues.forEach(item => {
        existingValues.set(item.game_publisher_id, item.value);
      });

      // Transform the data
      const fields = publisherIds.map(item => ({
        id: item.id,
        game_id: gameId,
        label: item.label,
        id_name: item.id_name,
        required: item.required,
        value: existingValues.get(item.id) || ''
      }));

      setGamePublisherFields(fields);
    } catch (error) {
      console.error('Error loading game publisher fields:', error);
    }
  };

  const handleGamePublisherFieldChange = (fieldId: string, value: string) => {
    setGamePublisherFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, value } : field
      )
    );
  };

  const loadTeams = async () => {
    try {
      setIsLoading(true);

      // Get teams for this tournament that are looking for players
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          captain_id,
          users:captain_id (username),
          is_looking_for_players,
          tournament_id,
          tournaments:tournament_id (max_players_per_team)
        `)
        .eq('tournament_id', tournamentId)
        .eq('is_looking_for_players', true);

      if (error) {
        console.error('Error loading teams:', error);
        return;
      }

      // Get member counts for each team
      const teamsWithMemberCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          // Get current member count
          const { count: memberCount, error: countError } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('status', 'accepted');

          // Check if user has applied to this team
          let userHasApplied = false;
          let applicationStatus = null;

          if (user) {
            const { data: applicationData, error: appError } = await supabase
              .from('team_applications')
              .select('status')
              .eq('team_id', team.id)
              .eq('user_id', user.id)
              .maybeSingle();

            if (!appError && applicationData) {
              userHasApplied = true;
              applicationStatus = applicationData.status;
            }
          }

          return {
            id: team.id,
            name: team.name,
            captain_id: team.captain_id,
            captain_name: team.users?.username || 'Unknown',
            current_members: memberCount || 0,
            max_members: team.tournaments?.max_players_per_team || null,
            is_lfp: team.is_looking_for_players,
            user_has_applied: userHasApplied,
            application_status: applicationStatus
          };
        })
      );

      setTeams(teamsWithMemberCounts);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTeamLfpStatus = async () => {
    if (!userTeamId || !isTeamCaptain) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('is_looking_for_players')
        .eq('id', userTeamId)
        .single();

      if (error) {
        console.error('Error checking LFP status:', error);
        return;
      }

      setIsTeamLfp(data?.is_looking_for_players || false);
    } catch (error) {
      console.error('Error checking LFP status:', error);
    }
  };

  const toggleLfpStatus = async () => {
    if (!userTeamId || !isTeamCaptain) return;

    try {
      setIsUpdatingLfp(true);

      const newStatus = !isTeamLfp;

      const { error } = await supabase
        .from('teams')
        .update({ is_looking_for_players: newStatus })
        .eq('id', userTeamId);

      if (error) {
        console.error('Error updating LFP status:', error);
        toast.error(t('lookingForPeople.errorUpdatingStatus'));
        return;
      }

      setIsTeamLfp(newStatus);
      toast.success(newStatus ? t('lookingForPeople.teamNowLookingForPlayers') : t('lookingForPeople.teamNoLongerLookingForPlayers'));

      // Refresh the teams list
      loadTeams();
    } catch (error) {
      console.error('Error updating LFP status:', error);
      toast.error(t('toast.statusUpdateError'));
    } finally {
      setIsUpdatingLfp(false);
    }
  };

  const openApplicationForm = (teamId: string, teamName: string) => {
    if (!user) {
      toast.error(t('lookingForPeople.mustBeLoggedInToApply'));
      return;
    }

    setSelectedTeamId(teamId);
    setSelectedTeamName(teamName);
    setShowApplicationForm(true);
  };

  const saveGamePublisherAccounts = async () => {
    if (!user?.id || !gameId) return;

    try {
      // Only save fields with values
      const fieldsWithValues = gamePublisherFields.filter(field => field.value && field.value.trim() !== '');

      if (fieldsWithValues.length > 0) {
        // For each field, upsert the value
        for (const field of fieldsWithValues) {
          const { error } = await supabase
            .from('game_publisher_id_for_users')
            .upsert([{
              user_id: user.id,
              game_id: field.game_id,
              game_publisher_id: field.id,
              value: field.value.trim()
            }], {
              onConflict: 'user_id,game_publisher_id'
            });

          if (error) {
            console.error('Error saving gaming account:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error saving game publisher accounts:', error);
      throw error;
    }
  };

  const submitApplication = async () => {
    if (!user) {
      toast.error(t('lookingForPeople.mustBeLoggedInToApply'));
      return;
    }

    if (!selectedTeamId) {
      toast.error(t('lookingForPeople.noTeamSelected'));
      return;
    }

    // Validate required gaming account fields
    const requiredFields = gamePublisherFields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !field.value || field.value.trim() === '');

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => field.label).join(', ');
      toast.error(t('lookingForPeople.pleaseFillRequiredFields', { fieldNames }));
      return;
    }

    try {
      setIsApplying(true);

      // Save gaming account information first
      if (gamePublisherFields.length > 0) {
        await saveGamePublisherAccounts();
      }

      // Check if user already has a team for this tournament
      const { data: existingTeam, error: teamError } = await supabase
        .from('team_members') // Check team_members table
        .select(`
          team_id,
          teams!inner(tournament_id) // Join with teams table to filter by tournament_id
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .eq('teams.tournament_id', tournamentId) // Filter by the current tournament ID
        .maybeSingle();

      if (existingTeam) {
        toast.error(t('lookingForPeople.alreadyMemberOfTeam'));
        return;
      }

      // Create application
      const { error } = await supabase
        .from('team_applications')
        .insert([
          {
            team_id: selectedTeamId,
            user_id: user.id,
            tournament_id: tournamentId,
            status: 'pending',
            message: applicationMessage
          }
        ]);

      if (error) {
        console.error('Error applying to team:', error);

        if (error.code === '23505') { // Unique constraint violation
          toast.error(t('lookingForPeople.alreadyAppliedToTeam'));
        } else {
          toast.error(t('lookingForPeople.errorApplying'));
        }
        return;
      }

      toast.success(t('lookingForPeople.applicationSentSuccessfully'));

      // Reset form and close it
      setShowApplicationForm(false);
      setSelectedTeamId(null);
      setSelectedTeamName('');
      setApplicationMessage('');

      // Refresh the teams list and user applications
      loadTeams();
      loadUserApplications();
    } catch (error) {
      console.error('Error applying to team:', error);
      toast.error(t('lookingForPeople.errorApplying'));
    } finally {
      setIsApplying(false);
    }
  };

  const loadUserApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_applications')
        .select(`
          id,
          status,
          created_at,
          team_id,
          teams:team_id (
            name,
            captain_id,
            users:captain_id (username)
          )
        `)
        .eq('user_id', user.id)
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('Error loading user applications:', error);
        return;
      }

      setUserApplications(data || []);
    } catch (error) {
      console.error('Error loading user applications:', error);
    }
  };

  const loadTeamApplications = async () => {
    if (!userTeamId || !isTeamCaptain) return;

    try {
      const { data, error } = await supabase
        .from('team_applications')
        .select(`
          id,
          status,
          created_at,
          message,
          user_id,
          users:user_id (
            username,
            avatar_url,
            country
          )
        `)
        .eq('team_id', userTeamId)
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('Error loading team applications:', error);
        return;
      }

      setTeamApplications(data || []);
    } catch (error) {
      console.error('Error loading team applications:', error);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      // For acceptance, validate server-side first
      if (action === 'accept') {
        console.log('Validating team application acceptance...');

        // Get application details to get user_id
        const application = teamApplications.find(app => app.id === applicationId);
        if (!application) {
          toast.error('Application not found');
          return;
        }

        const validationResult = await validateTeamApplicationAcceptance(
          applicationId,
          userTeamId!,
          application.user_id
        );

        if (!validationResult.success) {
          toast.error(validationResult.error || 'Application acceptance validation failed');
          return;
        }

        console.log('Team application acceptance validation passed');
      }

      // Update application status
      const { error: updateError } = await supabase
        .from('team_applications')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error updating application:', updateError);
        toast.error(t('toast.applicationUpdateError'));
        return;
      }

      // If accepted, add user to team
      if (action === 'accept') {
        // Get the application to get the user_id
        let userId;
        let teamChatChannelId = null;

        const { data: application, error: appError } = await supabase
          .from('team_applications')
          .select('user_id')
          .eq('id', applicationId)
          .single();

        if (appError || !application) {
          console.error('Error getting application:', appError);
          toast.error(t('toast.addTeamMemberError'));
          return;
        }

        userId = application.user_id;

        // Get the team's chat channel ID
        const { data: teamData, error: teamDataError } = await supabase
          .from('teams')
          .select('chat_channel_id')
          .eq('id', userTeamId)
          .single();

        if (teamDataError) {
          console.error('Error getting team data:', teamDataError);
        } else if (teamData?.chat_channel_id) {
          teamChatChannelId = teamData.chat_channel_id;
        }

        // Add user to team
        const { error: memberError } = await supabase
          .from('team_members')
          .insert([
            {
              team_id: userTeamId,
              user_id: userId,
              role: 'member',
              status: 'accepted'
            }
          ]);

        if (memberError) {
          console.error('Error adding team member:', memberError);
          toast.error(t('toast.addTeamMemberError'));
          return;
        }

        // Add user to team chat channel if it exists
        if (teamChatChannelId) {
          try {
            // Join the team chat channel - force accepted status since this is a team member
            await joinChannel(teamChatChannelId, userId);
          } catch (channelError) {
            console.error('Error adding user to team chat channel:', channelError);
            // Don't throw here, as this is not critical to the team joining process
          }
        }

        // Register user for tournament with team
        const { error: regError } = await supabase
          .from('tournament_registrations')
          .insert([
            {
              tournament_id: tournamentId,
              user_id: userId,
              team_id: userTeamId,
              status: 'pending'
            }
          ]);

        if (regError && regError.code !== '23505') { // Ignore unique constraint violations (already registered)
          console.error('Error registering user for tournament:', regError);
        }
      }

      toast.success(action === 'accept' ? t('lookingForPeople.applicationAccepted') : t('lookingForPeople.applicationRejected'));

      // Refresh applications
      loadTeamApplications();
    } catch (error) {
      console.error('Error handling application:', error);
      toast.error(t('lookingForPeople.errorProcessingApplication'));
    }
  };

  const cancelApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('team_applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error('Error canceling application:', error);
        toast.error(t('lookingForPeople.errorCancelingApplication'));
        return;
      }

      toast.success(t('lookingForPeople.applicationCanceled'));

      // Refresh applications
      loadUserApplications();
      loadTeams();
    } catch (error) {
      console.error('Error canceling application:', error);
      toast.error(t('toast.cancelApplicationError'));
    }
  };

  // Handle player profile click
  const handlePlayerClick = (userId: string) => {
    setSelectedPlayerId(userId);
    setIsPlayerProfileModalOpen(true);
  };

  if (!isOpen) return null;

  // Filter teams based on search query
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.captain_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Application form
  if (showApplicationForm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center">
              <UserPlus className="text-primary-500 h-5 w-5 mr-2" />
              <h2 className="font-heading font-semibold text-xl">
                {t('lookingForPeople.applyFor', { teamName: selectedTeamName })}
              </h2>
            </div>
            <button
              onClick={() => setShowApplicationForm(false)}
              className="text-gray-400 hover:text-white"
              aria-label={t('lookingForPeople.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-6">
              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('lookingForPeople.messageForTeam')} <span className="text-error-500">{t('lookingForPeople.messageRequired')}</span>
                </label>
                <textarea
                  id="message"
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                  placeholder={t('lookingForPeople.messagePlaceholder')}
                  required
                />
              </div>

              {/* Gaming Account Fields */}
              {gamePublisherFields.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('lookingForPeople.requiredGameAccounts')}</h3>
                  <div className="bg-dark-200 p-4 rounded-lg space-y-4">
                    {gamePublisherFields.map((field) => (
                      <div key={field.id}>
                        <label htmlFor={`gaming_${field.id}`} className="block text-sm font-medium text-gray-300 mb-1">
                          {field.label} {field.required && <span className="text-error-500">{t('lookingForPeople.messageRequired')}</span>}
                        </label>
                        <input
                          type="text"
                          id={`gaming_${field.id}`}
                          value={field.value || ''}
                          onChange={(e) => handleGamePublisherFieldChange(field.id, e.target.value)}
                          className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={t('lookingForPeople.yourFieldName', { fieldName: field.id_name })}
                          required={field.required}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 mt-2">
                      {t('lookingForPeople.accountsWillBeSaved')}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-info-500/20 border border-info-600/30 p-4 rounded-lg">
                <p className="text-info-300 text-sm">
                  {t('lookingForPeople.applyingAcceptTerms')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-800 flex justify-between">
            <button
              onClick={() => setShowApplicationForm(false)}
              className="px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors"
            >
              {t('lookingForPeople.cancel')}
            </button>
            <button
              onClick={submitApplication}
              disabled={isApplying || !applicationMessage.trim()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
            >
              {isApplying ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  {t('lookingForPeople.sendingApplication')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('lookingForPeople.sendApplication')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Users className="text-primary-500 h-5 w-5 mr-2" />
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
              {t('lookingForPeople.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label={t('lookingForPeople.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Captain Controls - Only show if user is a team captain */}
        {userTeamId && isTeamCaptain && (
          <div className="p-4 bg-gray-100 dark:bg-dark-200 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium mb-1 text-gray-900 dark:text-white">{t('lookingForPeople.yourTeam')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('lookingForPeople.indicateIfLookingForPlayers')}
                </p>
              </div>
              <button
                onClick={toggleLfpStatus}
                disabled={isUpdatingLfp}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isTeamLfp
                    ? 'bg-success-600 hover:bg-success-700 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 dark:bg-dark-300 dark:hover:bg-dark-400 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isUpdatingLfp ? (
                  <span className="flex items-center">
                    <Clock className="animate-spin h-4 w-4 mr-2" />
                    {t('lookingForPeople.updating')}
                  </span>
                ) : isTeamLfp ? (
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('lookingForPeople.searchActive')}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('lookingForPeople.enablePlayerSearch')}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tabs - Show tabs if user is captain or has applications */}
        {((userTeamId && isTeamCaptain) || userApplications.length > 0) && (
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'teams'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              {t('lookingForPeople.availableTeams')}
            </button>

            {userTeamId && isTeamCaptain ? (
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'applications'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                {t('lookingForPeople.receivedApplications')}
                {teamApplications.filter(app => app.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {teamApplications.filter(app => app.status === 'pending').length}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'applications'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                {t('lookingForPeople.myApplications')}
                {userApplications.filter(app => app.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {userApplications.filter(app => app.status === 'pending').length}
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Teams List */}
        {activeTab === 'teams' && (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={t('lookingForPeople.searchTeam')}
                  className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">{t('lookingForPeople.loadingTeams')}</span>
                </div>
              ) : filteredTeams.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredTeams.map((team) => (
                    <div key={team.id} className="p-4 hover:bg-gray-50 dark:hover:bg-dark-200/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium text-lg text-gray-900 dark:text-white">{team.name}</h3>
                            {team.current_members === team.max_members && (
                              <span className="ml-2 text-xs bg-error-600/20 text-error-400 px-2 py-0.5 rounded-full">
                                {t('lookingForPeople.full')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="flex items-center">
                              <Shield className="h-3 w-3 mr-1 text-primary-500" />
                              {t('lookingForPeople.captain')} {team.captain_name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {t('lookingForPeople.members')} {team.current_members}{team.max_members ? `/${team.max_members}` : ''}
                            </span>
                          </div>
                        </div>

                        <div>
                          {user ? (
                            team.user_has_applied ? (
                              <div className="text-sm">
                                {team.application_status === 'pending' && (
                                  <span className="bg-warning-600/20 text-warning-400 px-3 py-1 rounded-lg flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {t('lookingForPeople.pending')}
                                  </span>
                                )}
                                {team.application_status === 'accepted' && (
                                  <span className="bg-success-600/20 text-success-400 px-3 py-1 rounded-lg flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {t('lookingForPeople.accepted')}
                                  </span>
                                )}
                                {team.application_status === 'rejected' && (
                                  <span className="bg-error-600/20 text-error-400 px-3 py-1 rounded-lg flex items-center">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {t('lookingForPeople.rejected')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => openApplicationForm(team.id, team.name)}
                                disabled={team.current_members === team.max_members || team.captain_id === user.id || userTeamId !== null}
                                className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                {t('lookingForPeople.apply')}
                              </button>
                            )
                          ) : (
                            <button
                              disabled
                              className="bg-dark-300 text-gray-500 cursor-not-allowed px-3 py-1 rounded-lg text-sm"
                            >
                              {t('lookingForPeople.logIn')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchQuery ? t('lookingForPeople.noTeamFoundForSearch') : t('lookingForPeople.noTeamLookingForPlayers')}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="overflow-y-auto max-h-[60vh]">
            {userTeamId && isTeamCaptain ? (
              // Team captain view - applications to their team
              teamApplications.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {teamApplications.map((application) => (
                    <div key={application.id} className="p-4 hover:bg-dark-200/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 rounded-full bg-dark-300 overflow-hidden mr-3 cursor-pointer"
                            onClick={() => handlePlayerClick(application.user_id)}
                          >
                            {application.users.avatar_url ? (
                              <img
                                src={application.users.avatar_url}
                                alt={application.users.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-gray-400 m-2" />
                            )}
                          </div>
                          <div>
                            <h3
                              className="font-medium cursor-pointer hover:text-primary-400 transition-colors"
                              onClick={() => handlePlayerClick(application.user_id)}
                            >
                              {application.users.username}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {new Date(application.created_at).toLocaleDateString()}
                            </p>
                            {application.message && (
                              <p className="text-sm text-gray-300 mt-1 italic">
                                "{application.message}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {application.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApplicationAction(application.id, 'accept')}
                                className="bg-success-600 hover:bg-success-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                {t('lookingForPeople.accept')}
                              </button>
                              <button
                                onClick={() => handleApplicationAction(application.id, 'reject')}
                                className="bg-error-600 hover:bg-error-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                {t('lookingForPeople.refuse')}
                              </button>
                            </>
                          ) : (
                            <span className={`px-3 py-1 rounded-lg text-sm ${
                              application.status === 'accepted'
                                ? 'bg-success-600/20 text-success-400'
                                : 'bg-error-600/20 text-error-400'
                            }`}>
                              {application.status === 'accepted' ? t('lookingForPeople.accepted') : t('lookingForPeople.rejected')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {t('lookingForPeople.noApplicationReceivedForTeam')}
                  </p>
                </div>
              )
            ) : (
              // Regular user view - their applications to teams
              userApplications.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {userApplications.map((application) => (
                    <div key={application.id} className="p-4 hover:bg-dark-200/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{application.teams.name}</h3>
                          <p className="text-sm text-gray-400">
                            {t('lookingForPeople.captain')} {application.teams.users.username}
                          </p>
                          <p className="text-sm text-gray-400">
                            {t('lookingForPeople.appliedOn')} {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center">
                          {application.status === 'pending' ? (
                            <>
                              <span className="bg-warning-600/20 text-warning-400 px-3 py-1 rounded-lg text-sm flex items-center mr-2">
                                <Clock className="h-3 w-3 mr-1" />
                                {t('lookingForPeople.pending')}
                              </span>
                              <button
                                onClick={() => cancelApplication(application.id)}
                                className="bg-dark-300 hover:bg-dark-400 text-gray-300 px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                {t('lookingForPeople.cancel')}
                              </button>
                            </>
                          ) : application.status === 'accepted' ? (
                            <span className="bg-success-600/20 text-success-400 px-3 py-1 rounded-lg text-sm flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t('lookingForPeople.accepted')}
                            </span>
                          ) : (
                            <span className="bg-error-600/20 text-error-400 px-3 py-1 rounded-lg text-sm flex items-center">
                              <XCircle className="h-3 w-3 mr-1" />
                              {t('lookingForPeople.rejected')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {t('lookingForPeople.notAppliedToTeamYet')}
                  </p>
                </div>
              )
            )}
          </div>
        )}

        <div className="p-4 border-t border-gray-800 bg-dark-200">
          <div className="text-sm text-gray-400">
            <p>
              {userTeamId && isTeamCaptain
                ? t('lookingForPeople.captainDescription')
                : t('lookingForPeople.playerDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
      />
    </div>
  );
};

export default LookingForPeopleModal;
