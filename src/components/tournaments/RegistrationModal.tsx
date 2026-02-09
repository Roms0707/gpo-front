import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Users, User, Gamepad2, CheckCircle, Loader, FileText, AlertTriangle, MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '../../stores/authStore';
import { registerForTournament } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { createChannel, joinChannel } from '../../services/channelService';
import toast from 'react-hot-toast';
import { validateRiotId } from '../../services/api';
import DateInput from '../ui/DateInput';
import PhoneInput from '../ui/PhoneInput';
import { formatTournamentFieldValueAsJson } from '../../utils/tournamentUtils';
import { getDefaultPhoneCountry, getEligiblePhoneCountries } from '../../utils/countries';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { discordVerificationService } from '../../services/discordVerificationService';
import { DiscordConnectionRequired } from './DiscordConnectionRequired';

interface GamePublisherField {
  id: string;
  game_id: string;
  label: string;
  id_name: string;
  required: boolean;
  value?: string;
  isValidating?: boolean;
  isValidated?: boolean;
  pairId?: string; // For fields that need to be paired (e.g. Riot ID + Tagline)
  puuid?: string;
  validation_data?: any;
  validation_date?: string;
}

interface TournamentField {
  id: string;
  name: string;
  field_type: string;
  required: boolean;
  value?: string;
  options?: string | string[];
  selectedValues?: string[];
  phoneError?: string;
}

interface RegistrationModalProps {
  tournament: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (registrationStatus: { registered: boolean, status: string }) => void;
  isLoading: boolean;
  teamId?: string | null;
  registrationStatus: { registered: boolean, status: string | null };
  userTeamId?: string | null;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  teamId,
  registrationStatus,
  userTeamId
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openGamingStatsModal, refreshKlientoUser } = useAuthStore();
  const [teamName, setTeamName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [gamePublisherFields, setGamePublisherFields] = useState<GamePublisherField[]>([]);
  const [tournamentFields, setTournamentFields] = useState<TournamentField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameHasApi, setGameHasApi] = useState(false);
  const [fieldPairs, setFieldPairs] = useState<{[key: string]: string[]}>({});
  const [steamIdConfig, setSteamIdConfig] = useState<{gameId: string, publisherId: string} | null>(null);
  const [steamId64, setSteamId64] = useState('');
  const [isValidatingSteam, setIsValidatingSteam] = useState(false);
  const [isSteamValidated, setIsSteamValidated] = useState(false);
  const [steamValidationData, setSteamValidationData] = useState<any>(null);
  const [requiresDiscord, setRequiresDiscord] = useState(false);
  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const [isDiscordMember, setIsDiscordMember] = useState(false);
  const [isCheckingDiscord, setIsCheckingDiscord] = useState(false);
  const [showDiscordRequired, setShowDiscordRequired] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [hasDiscordUserId, setHasDiscordUserId] = useState(false);
  const [discordVerificationError, setDiscordVerificationError] = useState<string | null>(null);
  const [isTechnicalDiscordError, setIsTechnicalDiscordError] = useState(false);
  const [isUnlinkingDiscord, setIsUnlinkingDiscord] = useState(false);
  const [isVerifyingMembership, setIsVerifyingMembership] = useState(false);
  const [tournamentDiscordUrl, setTournamentDiscordUrl] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isTeamTournament = tournament?.mode?.toLowerCase().includes('team');

  useEffect(() => {
    if (isOpen && tournament?.game_id) {
      console.log('RegistrationModal: Loading game publisher fields for game:', tournament.game_id);
      loadGamePublisherFields(tournament.game_id);

      // Set focus to the modal when it opens
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
          // Scroll to top of the modal
          modalRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen, tournament?.game_id]);

  useEffect(() => {
    if (isOpen && tournament?.id && user?.id) {
      checkDiscordRequirements();
    }
  }, [isOpen, tournament?.id, user?.id]);

  const checkDiscordRequirements = async () => {
    if (!tournament?.id || !user?.id) return;

    setIsCheckingDiscord(true);
    setDiscordVerificationError(null);
    setIsTechnicalDiscordError(false);

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('discord_url')
        .eq('id', tournament.id)
        .maybeSingle();

      const hasDiscordUrl = !!data?.discord_url;
      setRequiresDiscord(hasDiscordUrl);
      setTournamentDiscordUrl(data?.discord_url || null);

      if (hasDiscordUrl) {
        const userHasDiscordId = !!user.discord_user_id;
        setHasDiscordUserId(userHasDiscordId);

        if (!userHasDiscordId) {
          console.log('[RegistrationModal] User does not have discord_user_id - hard block required');
          setIsDiscordLinked(false);
          setIsDiscordMember(false);
          return;
        }

        const linkedViaSupabaseAuth = await discordVerificationService.isDiscordLinked();
        const linked = userHasDiscordId || linkedViaSupabaseAuth;
        setIsDiscordLinked(linked);

        if (linked) {
          try {
            const status = await discordVerificationService.checkVerificationStatus(user.id, tournament.id);
            if (status.error) {
              const errorLower = status.error.toLowerCase();
              const isTechnical = errorLower.includes('rate limit') ||
                                  errorLower.includes('timeout') ||
                                  errorLower.includes('network') ||
                                  errorLower.includes('unavailable') ||
                                  errorLower.includes('500') ||
                                  errorLower.includes('502') ||
                                  errorLower.includes('503') ||
                                  errorLower.includes('504');

              if (isTechnical) {
                console.warn('[RegistrationModal] Technical error during Discord verification (soft-fail):', status.error);
                setIsTechnicalDiscordError(true);
                setDiscordVerificationError(status.error);
                setIsDiscordMember(false);
              } else {
                setIsDiscordMember(false);
                setDiscordVerificationError(status.error);
              }
            } else {
              setIsDiscordMember(status.isMember);
            }
          } catch (verificationError: any) {
            console.error('[RegistrationModal] Discord verification threw exception (soft-fail):', verificationError);
            setIsTechnicalDiscordError(true);
            setDiscordVerificationError(verificationError?.message || 'Verification service unavailable');
            setIsDiscordMember(false);
          }
        }
      }
    } catch (error) {
      console.error('Error checking Discord requirements:', error);
      setIsTechnicalDiscordError(true);
      setDiscordVerificationError('Unable to check Discord requirements');
    } finally {
      setIsCheckingDiscord(false);
    }
  };

  const handleDiscordConnect = async () => {
    if (!tournament?.id || !user?.id) {
      toast.error(t('registrationModal.errorConnectingDiscord'));
      return;
    }

    console.log('[RegistrationModal] Initiating Discord OAuth popup', {
      tournamentId: tournament.id,
      teamId,
    });

    setIsConnectingDiscord(true);

    try {
      const result = await discordVerificationService.initiateDiscordOAuthPopup(user.id);

      if (result.success && result.discord_user) {
        console.log('[RegistrationModal] Discord OAuth successful:', result.discord_user);
        toast.success(t('registrationModal.discordConnected', { username: result.discord_user.handle }));

        await refreshKlientoUser();

        setHasDiscordUserId(true);
        setIsDiscordLinked(true);

        console.log('[RegistrationModal] Verifying Discord server membership...');
        const verifyResult = await discordVerificationService.verifyDiscordMembership(user.id, tournament.id);

        if (verifyResult.success && verifyResult.data?.is_verified) {
          console.log('[RegistrationModal] User is a member of the Discord server');
          setIsDiscordMember(true);
        } else {
          console.log('[RegistrationModal] User is NOT a member of the Discord server');
          setIsDiscordMember(false);
        }
      } else {
        console.error('[RegistrationModal] Discord OAuth failed:', result.error);
        toast.error(result.error || t('registrationModal.errorConnectingDiscord'));
      }
    } catch (error) {
      console.error('[RegistrationModal] Error initiating Discord OAuth:', error);
      toast.error(t('registrationModal.errorConnectingDiscord'));
    } finally {
      setIsConnectingDiscord(false);
    }
  };

  const handleDiscordUnlink = async () => {
    if (!user?.id) {
      toast.error(t('registrationModal.errorUnlinkingDiscord'));
      return;
    }

    setIsUnlinkingDiscord(true);

    try {
      const result = await discordVerificationService.unlinkDiscordAccount(user.id);

      if (result.success) {
        toast.success(t('registrationModal.discordUnlinked'));
        await refreshKlientoUser();
        setHasDiscordUserId(false);
        setIsDiscordLinked(false);
        setIsDiscordMember(false);
      } else {
        toast.error(result.error || t('registrationModal.errorUnlinkingDiscord'));
      }
    } catch (error) {
      console.error('[RegistrationModal] Error unlinking Discord:', error);
      toast.error(t('registrationModal.errorUnlinkingDiscord'));
    } finally {
      setIsUnlinkingDiscord(false);
    }
  };

  const handleVerifyMembership = async () => {
    if (!user?.id || !tournament?.id) return;

    setIsVerifyingMembership(true);
    try {
      const result = await discordVerificationService.verifyDiscordMembership(user.id, tournament.id);

      if (result.success && result.data?.is_verified) {
        setIsDiscordMember(true);
        toast.success(t('registrationModal.discordMembershipVerified'));
      } else {
        setIsDiscordMember(false);
        toast.error(t('registrationModal.notADiscordMember'));
      }
    } catch (error) {
      console.error('[RegistrationModal] Error verifying Discord membership:', error);
      toast.error(t('registrationModal.errorVerifyingMembership'));
    } finally {
      setIsVerifyingMembership(false);
    }
  };

  useEffect(() => {
    if (isOpen && tournament?.id) {
      console.log('RegistrationModal: Loading tournament fields for tournament:', tournament.id);
      loadTournamentFields(tournament.id);
    }
  }, [isOpen, tournament?.id]);

  const loadTournamentFields = async (tournamentId: string) => {
    try {
      setIsLoadingFields(true);

      // Get tournament fields for this tournament
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from('tournament_field_values')
        .select(`
          field_id,
          value,
          tournament_fields:field_id (
            id,
            name,
            field_type,
            required,
            options
          )
        `)
        .eq('tournament_id', tournamentId);

      if (fieldValuesError) {
        console.error('Error loading tournament field values:', fieldValuesError);
        return;
      }

      if (!fieldValues || fieldValues.length === 0) {
        console.log('No tournament fields found for tournament:', tournamentId);
        setTournamentFields([]);
        return;
      }

      // Transform the data
      const fields: TournamentField[] = fieldValues.map(item => ({
        id: item.tournament_fields.id,
        name: item.tournament_fields.name,
        field_type: item.tournament_fields.field_type,
        required: item.tournament_fields.required,
        value: '',
        options: item.tournament_fields.options,
        selectedValues: item.tournament_fields.field_type === 'multi-select' ? [] : undefined
      }));

      console.log('Tournament fields:', fields);
      setTournamentFields(fields);
    } catch (error) {
      console.error('Error loading tournament fields:', error);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const loadGamePublisherFields = async (gameId: string) => {
    console.log('RegistrationModal: loadGamePublisherFields called with gameId:', gameId);

    try {
      setIsLoadingFields(true);

      // Get Fortnite game ID for special handling
      const { data: fortniteGame, error: fortniteGameError } = await supabase
        .from('games')
        .select('id')
        .ilike('name', '%fortnite%')
        .maybeSingle();

      const fortniteGameId = fortniteGame?.id;
      const isFortniteGame = gameId === fortniteGameId;

      // Get game publisher IDs for this specific game
      const { data: publisherIds, error: publisherError } = await supabase
        .from('game_publisher_ids')
        .select('id, label, id_name, required')
        .eq('game_id', gameId)
        .order('label', { ascending: true });

      console.log('RegistrationModal: Publisher IDs query result:', { publisherIds, publisherError });

      // Check if the game has an API
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('has_an_api, api_key')
        .eq('id', gameId)
        .single();

      if (!gameError && gameData) {
        setGameHasApi(gameData.has_an_api || false);
      }

      if (publisherError) {
        console.error('Error loading game publisher IDs:', publisherError);
        return;
      }

      if (!publisherIds || publisherIds.length === 0) {
        console.log('RegistrationModal: No publisher IDs found for game:', gameId);
        setGamePublisherFields([]);
        return;
      }

      console.log('RegistrationModal: Found publisher IDs:', publisherIds);

      // Identify field pairs (e.g., Riot Game Name + Riot Tagline)
      const pairs: {[key: string]: string[]} = {};

      // First pass: identify potential pairs based on id_name patterns
      publisherIds.forEach(item => {
        // Extract base name by removing common suffixes
        let baseName = item.id_name;

        // Handle Riot Game Name + Tagline pattern
        if (baseName.includes('game_name-riot')) {
          baseName = 'riot';
        } else if (baseName.includes('tagline-riot')) {
          baseName = 'riot';
        }
        // Handle other potential patterns
        else if (baseName.includes('_name') || baseName.includes('_tagline') ||
                baseName.includes('_first') || baseName.includes('_second') ||
                baseName.includes('_part1') || baseName.includes('_part2')) {

          baseName = baseName.split('_')[0]; // Get the first part before underscore
        }

        if (!pairs[baseName]) {
          pairs[baseName] = [];
        }
        pairs[baseName].push(item.id);
      });

      // Second pass: keep only actual pairs (2+ fields with same base)
      Object.keys(pairs).forEach(key => {
        if (pairs[key].length < 2) {
          delete pairs[key];
        }
      });

      setFieldPairs(pairs);
      console.log('RegistrationModal: Identified field pairs:', pairs);

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

      console.log('RegistrationModal: User existing values:', userValues);

      // Create a map of existing values
      const existingValues = new Map();
      userValues.forEach(item => {
        existingValues.set(item.game_publisher_id, item.value);
      });

      // Transform the data
      const fields: GamePublisherField[] = publisherIds.map(item => ({
        id: item.id,
        game_id: gameId,
        label: item.label,
        id_name: item.id_name,
        required: item.required,
        value: existingValues.get(item.id) || ''
      }));

      // Special handling for Fortnite tournaments
      if (isFortniteGame && user?.fortnite_epic_id) {
        // Find the Fortnite Epic ID field
        const fortniteEpicField = fields.find(field =>
          field.id_name.toLowerCase().includes('fortnite') ||
          field.id_name.toLowerCase().includes('epic') ||
          field.label.toLowerCase().includes('fortnite') ||
          field.label.toLowerCase().includes('epic')
        );

        if (fortniteEpicField) {
          // Pre-fill with user's validated Fortnite Epic ID
          fortniteEpicField.value = user.fortnite_epic_id;
          fortniteEpicField.isValidated = user.is_fortnite_validated || false;
          fortniteEpicField.validation_data = user.fortnite_validation_data;
          fortniteEpicField.validation_date = user.is_fortnite_validated ? new Date().toISOString() : undefined;

          console.log('RegistrationModal: Pre-filled Fortnite Epic ID from user profile:', user.fortnite_epic_id);
        }
      }
      console.log('RegistrationModal: Final fields:', fields);
      setGamePublisherFields(fields);
    } catch (error) {
      console.error('Error loading game publisher fields:', error);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const handleGamePublisherFieldChange = (fieldId: string, value: string) => {
    setGamePublisherFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, value, isValidated: false } : field
      )
    );
  };

  const handleTournamentFieldChange = (fieldId: string, value: string) => {
    setTournamentFields(prev =>
      prev.map(field => {
        if (field.id === fieldId) {
          if (field.field_type === 'phone') {
            const validation = validatePhoneNumber(value);
            return {
              ...field,
              value,
              phoneError: validation.isValid ? undefined : validation.error
            };
          }
          return { ...field, value };
        }
        return field;
      })
    );
  };

  const handleMultiSelectChange = (fieldId: string, optionValue: string, isChecked: boolean) => {
    setTournamentFields(prev =>
      prev.map(field => {
        if (field.id === fieldId) {
          const currentSelected = field.selectedValues || [];
          let newSelected: string[];

          if (isChecked) {
            newSelected = [...currentSelected, optionValue];
          } else {
            newSelected = currentSelected.filter(v => v !== optionValue);
          }

          return {
            ...field,
            selectedValues: newSelected,
            value: newSelected.join(',')
          };
        }
        return field;
      })
    );
  };

  const isOptionSelected = (fieldId: string, optionValue: string): boolean => {
    const field = tournamentFields.find(f => f.id === fieldId);
    return field?.selectedValues?.includes(optionValue) || false;
  };

  const validateSteamId64 = async () => {
    if (!steamId64 || steamId64.length !== 17 || !/^\d{17}$/.test(steamId64)) {
      toast.error(t('registrationModal.steamId64MustBe17Digits'));
      return;
    }

    try {
      setIsValidatingSteam(true);

      // Call the Steam profile Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-steam-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          steamId64: steamId64,
          includeBans: false,
          includeGames: false
        })
      });

      const result = await response.json();

      if (result.success && result.profile) {
        setIsSteamValidated(true);
        setSteamValidationData(result.profile);
        toast.success(t('registrationModal.steamAccountValidated', { name: result.profile.personaname }));
      } else {
        setIsSteamValidated(false);
        setSteamValidationData(null);
        toast.error(result.error || t('registrationModal.errorValidatingSteamAccount'));
      }
    } catch (error) {
      console.error('Error validating Steam ID:', error);
      setIsSteamValidated(false);
      setSteamValidationData(null);
      toast.error(t('registrationModal.errorValidatingSteamAccount'));
    } finally {
      setIsValidatingSteam(false);
    }
  };

  const validateGameAccount = async (fieldId: string) => {
    if (!gameHasApi) return;

    // Find the field to validate
    const field = gamePublisherFields.find(f => f.id === fieldId);
    if (!field || !field.value) return;

    // Check if this field is part of a pair
    let pairFieldIds: string[] = [];
    let combinedValue: string = '';

    // Find if this field is part of a pair
    for (const [baseName, fieldIds] of Object.entries(fieldPairs)) {
      if (fieldIds.includes(fieldId) && fieldIds.length > 1) {
        // This is part of a pair
        pairFieldIds = fieldIds;

        // Get all fields in the pair
        const pairFields = pairFieldIds.map(id =>
          gamePublisherFields.find(f => f.id === id)
        ).filter(Boolean) as GamePublisherField[];

        // Check if all fields have values
        const allFieldsHaveValues = pairFields.every(f => f.value && f.value.trim() !== '');

        if (allFieldsHaveValues) {
          // For Riot fields, we want to combine as "gameName#tagline"
          if (pairFields.some(f => f.id_name.includes('riot'))) {
            const gameNameField = pairFields.find(f => f.id_name.includes('game_name-riot'));
            const taglineField = pairFields.find(f => f.id_name.includes('tagline-riot'));

            if (gameNameField && taglineField) {
              combinedValue = `${gameNameField.value}#${taglineField.value}`;
            }
          } else {
            // Generic combination for other paired fields
            combinedValue = pairFields.map(f => f.value).join('#');
          }
        }

        break;
      }
    }

    try {
      // Set validating state for all fields in the pair
      setGamePublisherFields(prev =>
        prev.map(f =>
          pairFieldIds.includes(f.id) ? { ...f, isValidating: true, isValidated: false } : f
        )
      );

      // For Riot fields, call the Riot API validation
      if (field.id_name.includes('riot') && pairFieldIds.length > 1) {
        const gameNameField = gamePublisherFields.find(f => f.id_name.includes('game_name-riot'));
        const taglineField = gamePublisherFields.find(f => f.id_name.includes('tagline-riot'));

        if (gameNameField?.value && taglineField?.value) {
          console.log('Validating Riot ID:', gameNameField.value, taglineField.value);

          const result = await validateRiotId(gameNameField.value, taglineField.value);

          if (result.valid) {
            // Set validated state for all fields in the pair
            setGamePublisherFields(prev =>
              prev.map(f =>
                pairFieldIds.includes(f.id) ? {
                  ...f,
                  isValidating: false,
                  isValidated: true,
                  puuid: result.puuid,
                  validation_data: result,
                  validation_date: new Date().toISOString()
                } : f
              )
            );

            toast.success(t('registrationModal.accountValidatedSuccess', { account: `${gameNameField.value}#${taglineField.value}` }));
          } else {
            // Reset validation state for all fields in the pair
            setGamePublisherFields(prev =>
              prev.map(f =>
                pairFieldIds.includes(f.id) ? {
                  ...f,
                  isValidating: false,
                  isValidated: false,
                  puuid: undefined,
                  validation_data: undefined,
                  validation_date: undefined
                } : f
              )
            );

            toast.error(result.error || t('registrationModal.errorValidatingRiotAccount'));
          }

          return;
        }
      }

      // For other games or as a fallback, simulate validation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set validated state for all fields in the pair
      setGamePublisherFields(prev =>
        prev.map(f =>
          pairFieldIds.includes(f.id) ? {
            ...f,
            isValidating: false,
            isValidated: true,
            validation_date: new Date().toISOString()
          } : f
        )
      );

      // Show success message
      if (pairFieldIds.length > 1) {
        toast.success(t('registrationModal.accountValidatedSuccess', { account: combinedValue }));
      } else {
        toast.success(t('registrationModal.accountValidatedSuccess', { account: field.value }));
      }
    } catch (error) {
      console.error('Error validating game account:', error);

      // Reset validation state for all fields in the pair
      setGamePublisherFields(prev =>
        prev.map(f =>
          pairFieldIds.includes(f.id) ? {
            ...f,
            isValidating: false,
            isValidated: false,
            validation_date: undefined
          } : f
        )
      );

      toast.error(t('registrationModal.errorValidatingAccount'));
    }
  };

  // Check if a field is part of a pair
  const isFieldInPair = (fieldId: string): boolean => {
    for (const fieldIds of Object.values(fieldPairs)) {
      if (fieldIds.includes(fieldId) && fieldIds.length > 1) {
        return true;
      }
    }
    return false;
  };

  // Get all fields in a pair
  const getFieldsInPair = (fieldId: string): GamePublisherField[] => {
    for (const fieldIds of Object.values(fieldPairs)) {
      if (fieldIds.includes(fieldId) && fieldIds.length > 1) {
        return fieldIds
          .map(id => gamePublisherFields.find(f => f.id === id))
          .filter(Boolean) as GamePublisherField[];
      }
    }
    return [];
  };

  // Check if all fields in a pair have values
  const allPairFieldsHaveValues = (fieldId: string): boolean => {
    const pairFields = getFieldsInPair(fieldId);
    return pairFields.length > 0 && pairFields.every(f => f.value && f.value.trim() !== '');
  };

  // Check if any field in a pair is being validated or is validated
  const isPairBeingValidatedOrValidated = (fieldId: string): boolean => {
    const pairFields = getFieldsInPair(fieldId);
    return pairFields.some(f => f.isValidating || f.isValidated);
  };

  // Get the first field ID in a pair
  const getFirstFieldIdInPair = (fieldId: string): string | null => {
    for (const fieldIds of Object.values(fieldPairs)) {
      if (fieldIds.includes(fieldId) && fieldIds.length > 1) {
        return fieldIds[0];
      }
    }
    return null;
  };

  const saveGamePublisherAccounts = async () => {
    if (!user?.id || !tournament?.game_id) {
      console.log('[RegistrationModal:saveGamePublisherAccounts] Missing user ID or game ID, skipping');
      return;
    }

    console.log('[RegistrationModal:saveGamePublisherAccounts] Starting to save game publisher accounts', {
      userId: user.id,
      gameId: tournament.game_id,
      totalFields: gamePublisherFields.length
    });

    try {
      // Get Fortnite game ID for special handling
      const { data: fortniteGame } = await supabase
        .from('games')
        .select('id')
        .ilike('name', '%fortnite%')
        .maybeSingle();

      const fortniteGameId = fortniteGame?.id;
      const isFortniteGame = tournament.game_id === fortniteGameId;

      console.log('[RegistrationModal:saveGamePublisherAccounts] Fortnite check', {
        fortniteGameId,
        isFortniteGame
      });

      // Insert new entries for fields with values
      let fieldsWithValues = gamePublisherFields.filter(field => field.value && field.value.trim() !== '');

      console.log('[RegistrationModal:saveGamePublisherAccounts] Fields with values before filtering', {
        count: fieldsWithValues.length,
        fields: fieldsWithValues.map(f => ({ id: f.id, label: f.label, value: f.value, isValidated: f.isValidated }))
      });

      // For Fortnite tournaments, exclude the Epic ID field from being saved to game_publisher_id_for_users
      // since it's managed directly on the users table
      if (isFortniteGame) {
        fieldsWithValues = fieldsWithValues.filter(field =>
          !field.id_name.toLowerCase().includes('fortnite') &&
          !field.id_name.toLowerCase().includes('epic') &&
          !field.label.toLowerCase().includes('fortnite') &&
          !field.label.toLowerCase().includes('epic')
        );

        console.log('[RegistrationModal:saveGamePublisherAccounts] Filtered out Fortnite Epic ID field for Fortnite tournament');
      }

      if (fieldsWithValues.length > 0) {
        console.log('[RegistrationModal:saveGamePublisherAccounts] Starting upsert for', fieldsWithValues.length, 'fields');

        // Use upsert for each field to handle updates properly
        for (const field of fieldsWithValues) {
          const upsertData = {
            user_id: user.id,
            game_id: tournament.game_id,
            game_publisher_id: field.id,
            value: field.value.trim(),
            is_validated: field.isValidated || false,
            validation_date: field.validation_date || null,
            validation_data: field.validation_data || null,
            validation_source: field.validation_data ? 'riot_api' : null
          };

          console.log('[RegistrationModal:saveGamePublisherAccounts] Upserting field', {
            fieldId: field.id,
            fieldLabel: field.label,
            data: upsertData
          });

          const { error: upsertError } = await supabase
            .from('game_publisher_id_for_users')
            .upsert([upsertData], {
              onConflict: 'user_id,game_publisher_id'
            });

          if (upsertError) {
            console.error('[RegistrationModal:saveGamePublisherAccounts] Error saving gaming account for field', field.label, ':', upsertError);
            throw upsertError;
          }

          console.log('[RegistrationModal:saveGamePublisherAccounts] Successfully saved field', field.label);
        }

        console.log('[RegistrationModal:saveGamePublisherAccounts] All gaming accounts saved successfully');
      } else {
        console.log('[RegistrationModal:saveGamePublisherAccounts] No fields with values to save');
      }
    } catch (error) {
      console.error('[RegistrationModal:saveGamePublisherAccounts] Error saving game publisher accounts:', error);
      throw error;
    }
  };

  const saveTournamentFieldValues = async (tournamentId: string, userId: string) => {
    if (!tournamentFields.length) {
      console.log('[RegistrationModal:saveTournamentFieldValues] No tournament fields to save');
      return;
    }

    console.log('[RegistrationModal:saveTournamentFieldValues] Starting to save tournament field values', {
      tournamentId,
      userId,
      totalFields: tournamentFields.length
    });

    try {
      // Delete existing entries for this user and tournament
      console.log('[RegistrationModal:saveTournamentFieldValues] Deleting existing field values');
      const { error: deleteError } = await supabase
        .from('user_tournament_field_values')
        .delete()
        .eq('user_id', userId)
        .eq('tournament_id', tournamentId);

      if (deleteError) {
        console.error('[RegistrationModal:saveTournamentFieldValues] Error deleting existing tournament field values:', deleteError);
      } else {
        console.log('[RegistrationModal:saveTournamentFieldValues] Existing field values deleted successfully');
      }

      // Insert new entries for fields with values
      const fieldsWithValues = tournamentFields.filter(field => field.value && field.value.trim() !== '');

      console.log('[RegistrationModal:saveTournamentFieldValues] Fields with values to insert', {
        count: fieldsWithValues.length,
        fields: fieldsWithValues.map(f => ({ id: f.id, name: f.name, value: f.value, fieldType: f.field_type }))
      });

      if (fieldsWithValues.length > 0) {
        const insertData = fieldsWithValues.map(field => {
          // Format the value as JSON object with field_type as key
          const jsonValue = formatTournamentFieldValueAsJson(field.field_type, field.value.trim());

          console.log(`[RegistrationModal:saveTournamentFieldValues] Formatted field "${field.name}" (${field.field_type}):`, {
            originalValue: field.value.trim(),
            jsonValue: jsonValue,
            jsonValueType: typeof jsonValue
          });

          return {
            user_id: userId,
            tournament_id: tournamentId,
            field_id: field.id,
            value: jsonValue // Insert JSON object directly, Supabase will handle serialization
          };
        });

        console.log('[RegistrationModal:saveTournamentFieldValues] Inserting field values with JSON objects', insertData);

        const { error: insertError } = await supabase
          .from('user_tournament_field_values')
          .insert(insertData);

        if (insertError) {
          console.error('[RegistrationModal:saveTournamentFieldValues] Error saving tournament field values:', insertError);
          throw insertError;
        }

        console.log('[RegistrationModal:saveTournamentFieldValues] Tournament field values saved successfully');
      }
    } catch (error) {
      console.error('[RegistrationModal:saveTournamentFieldValues] Error in saveTournamentFieldValues:', error);
      throw error;
    }
  };

  const createTeamAndRegister = async () => {
    if (!user?.id || !tournament?.id) {
      console.error('[RegistrationModal:createTeamAndRegister] Missing user ID or tournament ID');
      return null;
    }

    try {
      console.log('[RegistrationModal:createTeamAndRegister] Creating team and registering for tournament', {
        userId: user.id,
        tournamentId: tournament.id,
        teamName: teamName.trim()
      });

      // Create the team first
      // Create a team chat channel
      const teamChatName = `Team ${teamName.trim()} Chat`;
      const teamChatDescription = `Private chat for team ${teamName.trim()} members`;

      console.log('[RegistrationModal:createTeamAndRegister] Creating team chat channel', {
        channelName: teamChatName
      });

      const chatChannel = await createChannel(
        teamChatName,
        teamChatDescription,
        true, // Private channel
        false // Not a community channel
      );

      if (!chatChannel) {
        console.error('[RegistrationModal:createTeamAndRegister] Error creating team chat channel');
        throw new Error('Failed to create team chat channel');
      }

      console.log('[RegistrationModal:createTeamAndRegister] Chat channel created successfully', {
        channelId: chatChannel.id
      });

      const teamInsertData = {
        name: teamName.trim(),
        tournament_id: tournament.id,
        captain_id: user.id,
        chat_channel_id: chatChannel.id
      };

      console.log('[RegistrationModal:createTeamAndRegister] Inserting team into database', teamInsertData);

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([teamInsertData])
        .select()
        .single();

      if (teamError) {
        console.error('[RegistrationModal:createTeamAndRegister] Error creating team:', teamError);
        throw teamError;
      }

      console.log('[RegistrationModal:createTeamAndRegister] Team created successfully:', teamData);

      // Register for the tournament with the team
      const registrationInsertData = {
        tournament_id: tournament.id,
        user_id: user.id,
        team_id: teamData.id,
        status: 'pending'
      };

      console.log('[RegistrationModal:createTeamAndRegister] Creating tournament registration', registrationInsertData);

      const { data: registrationData, error: registrationError } = await supabase
        .from('tournament_registrations')
        .insert([registrationInsertData])
        .select()
        .single();

      if (registrationError) {
        console.error('[RegistrationModal:createTeamAndRegister] Error registering for tournament:', registrationError);
        throw registrationError;
      }

      console.log('[RegistrationModal:createTeamAndRegister] Tournament registration created successfully:', registrationData);

      // Add the user as a team member
      const memberInsertData = {
        team_id: teamData.id,
        user_id: user.id,
        role: 'captain',
        status: 'accepted'
      };

      console.log('[RegistrationModal:createTeamAndRegister] Adding user as team member', memberInsertData);

      const { error: memberError } = await supabase
        .from('team_members')
        .insert([memberInsertData]);

      if (memberError) {
        console.error('[RegistrationModal:createTeamAndRegister] Error adding team member:', memberError);
        // Don't throw here as the main registration is done
      } else {
        console.log('[RegistrationModal:createTeamAndRegister] Team member added successfully');
      }

      console.log('[RegistrationModal:createTeamAndRegister] Team creation and registration completed successfully');
      return registrationData;
    } catch (error) {
      console.error('[RegistrationModal:createTeamAndRegister] Error in createTeamAndRegister:', error);
      throw error;
    }
  };

  const joinExistingTeam = async () => {
    if (!user?.id || !tournament?.id || !teamId) {
      console.error('[RegistrationModal:joinExistingTeam] Missing required data', {
        hasUserId: !!user?.id,
        hasTournamentId: !!tournament?.id,
        hasTeamId: !!teamId
      });
      return null;
    }

    try {
      console.log('[RegistrationModal:joinExistingTeam] Joining existing team', {
        userId: user.id,
        tournamentId: tournament.id,
        teamId
      });

      // Register for the tournament with the existing team
      let teamChatChannelId = null;

      // Get the team's chat channel ID
      console.log('[RegistrationModal:joinExistingTeam] Fetching team data for chat channel');
      const { data: teamData, error: teamDataError } = await supabase
        .from('teams')
        .select('chat_channel_id')
        .eq('id', teamId)
        .single();

      if (teamDataError) {
        console.error('[RegistrationModal:joinExistingTeam] Error getting team data:', teamDataError);
      } else if (teamData?.chat_channel_id) {
        teamChatChannelId = teamData.chat_channel_id;
        console.log('[RegistrationModal:joinExistingTeam] Team chat channel ID:', teamChatChannelId);

        // Join the team's chat channel
        try {
          console.log('[RegistrationModal:joinExistingTeam] Attempting to join team chat channel');
          // Force accepted status since this is a team member
          await joinChannel(teamChatChannelId, user.id);
          console.log('[RegistrationModal:joinExistingTeam] Successfully joined team chat channel');
        } catch (channelError) {
          console.error('[RegistrationModal:joinExistingTeam] Error joining team chat channel:', channelError);
          // Don't throw here, as this is not critical to the registration process
        }
      } else {
        console.log('[RegistrationModal:joinExistingTeam] No chat channel ID found for team');
      }

      const registrationInsertData = {
        tournament_id: tournament.id,
        user_id: user.id,
        team_id: teamId,
        status: 'pending'
      };

      console.log('[RegistrationModal:joinExistingTeam] Creating tournament registration', registrationInsertData);

      const { data: registrationData, error: registrationError } = await supabase
        .from('tournament_registrations')
        .insert([registrationInsertData])
        .select()
        .single();

      if (registrationError) {
        console.error('[RegistrationModal:joinExistingTeam] Error registering for tournament:', registrationError);
        throw registrationError;
      }

      console.log('[RegistrationModal:joinExistingTeam] Tournament registration created successfully:', registrationData);

      // Add the user as a team member
      const memberInsertData = {
        team_id: teamId,
        user_id: user.id,
        role: 'member',
        status: 'accepted'
      };

      console.log('[RegistrationModal:joinExistingTeam] Adding user as team member', memberInsertData);

      const { error: memberError } = await supabase
        .from('team_members')
        .insert([memberInsertData]);

      if (memberError) {
        console.error('[RegistrationModal:joinExistingTeam] Error adding team member:', memberError);
        // Don't throw here as the main registration is done
      } else {
        console.log('[RegistrationModal:joinExistingTeam] Team member added successfully');
      }

      console.log('[RegistrationModal:joinExistingTeam] Join existing team completed successfully');
      return registrationData;
    } catch (error) {
      console.error('[RegistrationModal:joinExistingTeam] Error in joinExistingTeam:', error);
      throw error;
    }
  };

  const registerSolo = async () => {
    if (!user?.id || !tournament?.id) {
      console.error('[RegistrationModal:registerSolo] Missing user ID or tournament ID');
      return null;
    }

    try {
      console.log('[RegistrationModal:registerSolo] Registering for solo tournament', {
        userId: user.id,
        tournamentId: tournament.id
      });

      const registrationInsertData = {
        tournament_id: tournament.id,
        user_id: user.id,
        team_id: null,
        status: 'pending'
      };

      console.log('[RegistrationModal:registerSolo] Inserting registration', registrationInsertData);

      // Register for the tournament without a team
      const { data: registrationData, error: registrationError } = await supabase
        .from('tournament_registrations')
        .insert([registrationInsertData])
        .select()
        .single();

      if (registrationError) {
        console.error('[RegistrationModal:registerSolo] Error registering for tournament:', registrationError);
        throw registrationError;
      }

      console.log('[RegistrationModal:registerSolo] Solo tournament registration created successfully:', registrationData);
      return registrationData;
    } catch (error) {
      console.error('[RegistrationModal:registerSolo] Error in registerSolo:', error);
      throw error;
    }
  };

  const handleConfirm = async () => {
    console.log('[RegistrationModal:handleConfirm] ===== STARTING TOURNAMENT REGISTRATION =====');
    console.log('[RegistrationModal:handleConfirm] Initial state', {
      agreeToTerms,
      isTeamTournament,
      teamId,
      teamName,
      userId: user?.id,
      tournamentId: tournament?.id,
      gamePublisherFieldsCount: gamePublisherFields.length,
      tournamentFieldsCount: tournamentFields.length
    });

    if (!agreeToTerms) {
      console.log('[RegistrationModal:handleConfirm] Validation failed: Terms not agreed');
      toast.error(t('registrationModal.mustAcceptTerms'));
      return;
    }

    if (requiresDiscord) {
      if (!hasDiscordUserId) {
        console.log('[RegistrationModal:handleConfirm] HARD BLOCK: User has no discord_user_id');
        setShowDiscordRequired(true);
        toast.error(t('discord.registration.noDiscordUserId'));
        return;
      }

      if (!isDiscordLinked) {
        console.log('[RegistrationModal:handleConfirm] Validation failed: Discord not linked');
        setShowDiscordRequired(true);
        toast.error(t('discord.registration.notLinked'));
        return;
      }

      if (isTechnicalDiscordError) {
        console.warn('[RegistrationModal:handleConfirm] SOFT FAIL: Technical error during Discord verification, proceeding with warning');
        toast(t('discord.registration.verificationUnavailable'), {
          icon: '!',
          duration: 5000,
          style: {
            background: '#F59E0B',
            color: '#FFF',
          },
        });
      }
    }

    if (isTeamTournament && !teamId && !teamName.trim()) {
      console.log('[RegistrationModal:handleConfirm] Validation failed: Team name required but not provided');
      toast.error(t('registrationModal.teamNameRequired'));
      return;
    }

    // Validate required gaming account fields
    const requiredFields = gamePublisherFields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !field.value || field.value.trim() === '');

    console.log('[RegistrationModal:handleConfirm] Gaming account fields validation', {
      requiredFieldsCount: requiredFields.length,
      missingFieldsCount: missingFields.length,
      missingFields: missingFields.map(f => ({ id: f.id, label: f.label }))
    });

    // Add Steam ID validation for the specific game
    if (tournament?.game_id === '4a2705ee-3d9d-474f-b0da-953ff8652ff4' && !steamId64) {
      console.log('[RegistrationModal:handleConfirm] Validation failed: SteamID64 required but not provided');
      toast.error(t('registrationModal.steamId64Required'));
      return;
    }

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => field.label).join(', ');
      console.log('[RegistrationModal:handleConfirm] Validation failed: Missing required gaming account fields:', fieldNames);
      toast.error(t('registrationModal.fillRequiredFields', { fields: fieldNames }));
      return;
    }

    // Validate required tournament fields
    const requiredTournamentFields = tournamentFields.filter(field => field.required);
    const missingTournamentFields = requiredTournamentFields.filter(field => {
      if (field.field_type === 'multi-select') {
        return !field.selectedValues || field.selectedValues.length === 0;
      }
      return !field.value || field.value.trim() === '';
    });

    console.log('[RegistrationModal:handleConfirm] Tournament fields validation', {
      requiredFieldsCount: requiredTournamentFields.length,
      missingFieldsCount: missingTournamentFields.length,
      missingFields: missingTournamentFields.map(f => ({ id: f.id, name: f.name }))
    });

    if (missingTournamentFields.length > 0) {
      const fieldNames = missingTournamentFields.map(field => field.name).join(', ');
      console.log('[RegistrationModal:handleConfirm] Validation failed: Missing required tournament fields:', fieldNames);
      toast.error(t('registrationModal.fillRequiredTournamentFields', { fields: fieldNames }));
      return;
    }

    const phoneFieldsWithErrors = tournamentFields.filter(field => field.field_type === 'phone' && field.phoneError && field.value);
    if (phoneFieldsWithErrors.length > 0) {
      const fieldNames = phoneFieldsWithErrors.map(field => field.name).join(', ');
      console.log('[RegistrationModal:handleConfirm] Validation failed: Invalid phone fields:', fieldNames);
      toast.error(t('registrationModal.invalidPhoneFormat', { fields: fieldNames }));
      return;
    }

    console.log('[RegistrationModal:handleConfirm] All validations passed, proceeding with registration');

    try {
      setIsSubmitting(true);
      console.log('[RegistrationModal:handleConfirm] Submitting state set to true');

      // Save gaming account information first
      if (gamePublisherFields.length > 0) {
        console.log('[RegistrationModal:handleConfirm] Saving gaming account information');
        await saveGamePublisherAccounts();
        console.log('[RegistrationModal:handleConfirm] Gaming accounts saved successfully');
      } else {
        console.log('[RegistrationModal:handleConfirm] No gaming account fields to save');
      }

      // Handle tournament registration based on type
      let registrationData = null;

      console.log('[RegistrationModal:handleConfirm] Determining tournament type', {
        isTeamTournament,
        hasTeamId: !!teamId
      });

      if (isTeamTournament) {
        if (teamId) {
          console.log('[RegistrationModal:handleConfirm] Joining existing team');
          registrationData = await joinExistingTeam();
        } else {
          console.log('[RegistrationModal:handleConfirm] Creating new team');
          registrationData = await createTeamAndRegister();
        }
      } else {
        console.log('[RegistrationModal:handleConfirm] Solo tournament registration');
        registrationData = await registerSolo();
      }

      if (registrationData) {
        console.log('[RegistrationModal:handleConfirm] Registration data received', registrationData);

        // Save tournament field values
        if (tournamentFields.length > 0) {
          console.log('[RegistrationModal:handleConfirm] Saving tournament field values');
          await saveTournamentFieldValues(tournament.id, user?.id);
          console.log('[RegistrationModal:handleConfirm] Tournament field values saved successfully');
        }

        console.log('[RegistrationModal:handleConfirm] ===== REGISTRATION SUCCESSFUL =====');
        console.log('[RegistrationModal:handleConfirm] Final registration data:', registrationData);

        toast.success(t('registrationModal.registrationSuccess'));
        onConfirm({ registered: true, status: registrationData.status });

        // Check if this is an FPS tournament and show aim trainer notification
        const fpsGameIds = [
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', // Apex Legends
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', // Call of Duty: Warzone
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', // Counter-Strike 2
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', // Valorant
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16'  // Overwatch 2
        ];

        if (tournament?.game_id && fpsGameIds.includes(tournament.game_id)) {
          console.log('[RegistrationModal:handleConfirm] Showing aim trainer notification for FPS game');
          // Show custom toast notification for FPS games
          toast.custom((t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-dark-100 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-800`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center">
                      🎯
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('registrationModal.improveYourAim')}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('registrationModal.trainWithAimTrainer')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    openGamingStatsModal();
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {t('registrationModal.train')}
                </button>
              </div>
            </div>
          ), {
            duration: 8000,
            position: 'top-right',
          });
        }
      } else {
        console.error('[RegistrationModal:handleConfirm] ===== REGISTRATION FAILED: No data returned =====');
        throw new Error('Registration failed - no data returned');
      }

    } catch (error) {
      console.error('[RegistrationModal:handleConfirm] ===== REGISTRATION ERROR =====');
      console.error('[RegistrationModal:handleConfirm] Error details:', error);
      console.error('[RegistrationModal:handleConfirm] Error message:', error?.message);
      console.error('[RegistrationModal:handleConfirm] Error stack:', error?.stack);

      // Handle specific error cases
      if (error.message?.includes('duplicate key')) {
        console.log('[RegistrationModal:handleConfirm] Error type: Duplicate key');
        toast.error(t('registrationModal.alreadyRegistered'));
      } else if (error.message?.includes('foreign key')) {
        console.log('[RegistrationModal:handleConfirm] Error type: Foreign key violation');
        toast.error(t('registrationModal.dataError'));
      } else {
        console.log('[RegistrationModal:handleConfirm] Error type: Generic error');
        toast.error(t('registrationModal.registrationError'));
      }
    } finally {
      setIsSubmitting(false);
      console.log('[RegistrationModal:handleConfirm] Submitting state set to false');
      console.log('[RegistrationModal:handleConfirm] ===== REGISTRATION PROCESS COMPLETED =====');
    }
  };

  if (!isOpen) return null;

  // Group fields by whether they're part of a pair
  const groupedFields: { paired: {[key: string]: GamePublisherField[]}; single: GamePublisherField[] } = {
    paired: {},
    single: []
  };

  // Process fields into paired and single groups
  gamePublisherFields.forEach(field => {
    let isPaired = false;

    // Check if this field is part of a pair
    for (const [baseName, fieldIds] of Object.entries(fieldPairs)) {
      if (fieldIds.includes(field.id) && fieldIds.length > 1) {
        // This is part of a pair
        if (!groupedFields.paired[baseName]) {
          groupedFields.paired[baseName] = [];
        }
        groupedFields.paired[baseName].push(field);
        isPaired = true;
        break;
      }
    }

    // If not part of a pair, add to single fields
    if (!isPaired) {
      groupedFields.single.push(field);
    }
  });

  // Special handling for Riot API fields
  const riotApiGameId = "614e99e6-40b0-48e6-9dcd-d8c3f1981f52";
  const hasRiotFields = gamePublisherFields.some(field =>
    field.game_id === riotApiGameId ||
    (field.id_name.includes('game_name-riot') || field.id_name.includes('tagline-riot'))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Trophy className="text-primary-500 h-5 w-5 mr-2" />
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
              {teamId ? t('registrationModal.joinTeam') : t('registrationModal.tournamentRegistration')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label={t('registrationModal.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tournament Info */}
          <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-white">{tournament?.title}</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>{t('registrationModal.game')}: {tournament?.game || t('registrationModal.notSpecified')}</div>
              <div>{t('registrationModal.mode')}: {tournament?.mode}</div>
            </div>
          </div>

          {/* Discord Connection Required Banner - Hard Block for missing discord_user_id */}
          {requiresDiscord && !hasDiscordUserId && (
            <DiscordConnectionRequired
              variant="banner"
              onConnectClick={handleDiscordConnect}
              isConnecting={isConnectingDiscord}
              message={t('discord.registration.linkDiscordFirst')}
            />
          )}

          {/* Discord Connection Required Banner - Discord not linked but has user id */}
          {requiresDiscord && hasDiscordUserId && !isDiscordLinked && (
            <DiscordConnectionRequired
              variant="banner"
              onConnectClick={handleDiscordConnect}
              isConnecting={isConnectingDiscord}
            />
          )}

          {/* Technical Error Warning Banner */}
          {requiresDiscord && hasDiscordUserId && isDiscordLinked && isTechnicalDiscordError && (
            <div className="bg-warning-100 dark:bg-warning-500/20 border border-warning-300 dark:border-warning-600/30 p-4 rounded-lg">
              <p className="text-warning-700 dark:text-warning-300 text-sm">
                {t('discord.registration.verificationTemporarilyUnavailable')}
              </p>
            </div>
          )}

          {/* Discord Linked Success Section */}
          {requiresDiscord && hasDiscordUserId && isDiscordLinked && (
            <div className="bg-[#5865F2]/10 dark:bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#5865F2] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user?.discord_handle || t('registrationModal.discordConnected', { username: '' })}
                      </span>
                      <CheckCircle className="w-4 h-4 text-[#5865F2]" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('registrationModal.discordAccountLinked')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleDiscordUnlink}
                  disabled={isUnlinkingDiscord}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUnlinkingDiscord ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    t('registrationModal.unlinkDiscord')
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Discord Server Membership Warning - Connected but not a member */}
          {requiresDiscord && hasDiscordUserId && isDiscordLinked && !isDiscordMember && !isTechnicalDiscordError && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                      {t('registrationModal.discordServerRequired')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {t('registrationModal.discordServerRequiredDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 ml-11">
                  {tournamentDiscordUrl && (
                    <a
                      href={tournamentDiscordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t('registrationModal.joinDiscordServer')}
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </a>
                  )}
                  <button
                    onClick={handleVerifyMembership}
                    disabled={isVerifyingMembership}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isVerifyingMembership ? 'animate-spin' : ''}`} />
                    {t('registrationModal.verifyMembership')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Team Name Input for Team Tournaments */}
          {isTeamTournament && !teamId && (
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('registrationModal.teamName')} <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('registrationModal.teamNamePlaceholder')}
                required
              />
            </div>
          )}

          {/* Gaming Account Fields */}
          {isLoadingFields ? (
            <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">{t('registrationModal.loadingGameFields')}</span>
              </div>
            </div>
          ) : gamePublisherFields.length > 0 ? (
            <div>
              <h3 className="text-lg font-heading font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <Gamepad2 className="h-5 w-5 mr-2 text-primary-500" />
                {t('registrationModal.gamingAccountsRequired')}
              </h3>
              <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg space-y-4">
                {/* Special handling for Riot API fields */}
                {hasRiotFields && (
                  /* Find Riot Game Name and Tagline fields */
                  (() => {
                      const gameNameField = gamePublisherFields.find(f => f.id_name.includes('game_name-riot'));
                      const taglineField = gamePublisherFields.find(f => f.id_name.includes('tagline-riot'));

                      if (gameNameField && taglineField) {
                        const isValidating = gameNameField.isValidating || taglineField.isValidating;
                        const isValidated = gameNameField.isValidated || taglineField.isValidated;
                        const bothFieldsHaveValues = gameNameField.value && taglineField.value;

                        return (
                          <div>
                            <label htmlFor="riot_combined" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('registrationModal.riotId')} {(gameNameField.required || taglineField.required) && <span className="text-error-500">*</span>}
                            </label>
                            <div className="flex flex-col space-y-2">
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  id="riot_game_name"
                                  value={gameNameField.value || ''}
                                  onChange={(e) => handleGamePublisherFieldChange(gameNameField.id, e.target.value)}
                                  className="flex-1 bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  placeholder={t('registrationModal.gameName')}
                                  required={gameNameField.required}
                                />
                                <div className="flex items-center px-2">
                                  <span className="text-gray-600 dark:text-gray-400">#</span>
                                </div>
                                <input
                                  type="text"
                                  id="riot_tagline"
                                  value={taglineField.value || ''}
                                  onChange={(e) => handleGamePublisherFieldChange(taglineField.id, e.target.value)}
                                  className="w-1/3 bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  placeholder={t('registrationModal.tagline')}
                                  required={taglineField.required}
                                />
                              </div>

                              {/* Validation button for Riot ID */}
                              {gameHasApi && bothFieldsHaveValues && (
                                <div className="flex justify-end mt-2">
                                  <button
                                    type="button"
                                    onClick={() => validateGameAccount(gameNameField.id)}
                                    disabled={isValidating || isValidated}
                                    className={`px-3 py-2 rounded-lg transition-colors flex items-center ${
                                      isValidated
                                        ? 'bg-success-600 text-white cursor-default'
                                        : isValidating
                                          ? 'bg-primary-600/50 text-white cursor-wait'
                                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                                    }`}
                                  >
                                    {isValidating ? (
                                      <>
                                        <Loader className="h-4 w-4 animate-spin mr-1" />
                                        <span>{t('registrationModal.validating')}</span>
                                      </>
                                    ) : isValidated ? (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        <span>{t('registrationModal.validated')}</span>
                                      </>
                                    ) : (
                                      <span>{t('registrationModal.validate')}</span>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()
                )}

                {/* Render other paired fields (excluding Riot fields if they're handled above) */}
                {Object.entries(groupedFields.paired).map(([baseName, fields]) => {
                  // Skip Riot fields if they're already handled
                  if (baseName === 'riot' && hasRiotFields) {
                    return null;
                  }

                  return (
                    <div key={baseName} className="p-3 border border-gray-700 rounded-lg space-y-3">
                      {fields.map(field => (
                        <div key={field.id}>
                          <label htmlFor={`modal_gaming_${field.id}`} className="label">
                            {field.label} {field.required && <span className="text-error-500">*</span>}
                          </label>
                          <input
                            type="text"
                            id={`modal_gaming_${field.id}`}
                            value={field.value || ''}
                            onChange={(e) => handleGamePublisherFieldChange(field.id, e.target.value)}
                            className={`input w-full ${field.isValidated ? 'border-success-500' : ''}`}
                            placeholder={t('registrationModal.yourField', { field: field.id_name })}
                            required={field.required}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Render single fields */}
                {groupedFields.single.map((field) => (
                  <div key={field.id}>
                    <label htmlFor={`modal_gaming_${field.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {field.label} {field.required && <span className="text-error-500">*</span>}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id={`modal_gaming_${field.id}`}
                        value={field.value || ''}
                        onChange={(e) => handleGamePublisherFieldChange(field.id, e.target.value)}
                        className={`flex-1 bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${field.isValidated ? 'border-success-500' : ''}`}
                        placeholder={t('registrationModal.yourField', { field: field.id_name })}
                        required={field.required}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('registrationModal.gamingAccountsInfo')}
                </p>
              </div>
            </div>
          ) : tournament?.game_id ? (
            <div className="bg-info-100 dark:bg-info-500/20 border border-info-300 dark:border-info-600/30 p-4 rounded-lg">
              <p className="text-info-700 dark:text-info-300 text-sm">
                {t('registrationModal.noSpecificAccountRequired')}
              </p>
            </div>
          ) : null}

          {/* Tournament Fields */}
          {tournamentFields.length > 0 && (
            <div>
              <h3 className="text-lg font-heading font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <FileText className="h-5 w-5 mr-2 text-primary-500" />
                {t('registrationModal.additionalInfo')}
              </h3>
              <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg space-y-4">
                {tournamentFields.map((field) => (
                  <div key={field.id}>
                    <label htmlFor={`tournament_field_${field.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {field.name} {field.required && <span className="text-error-500">*</span>}
                    </label>
                    {field.field_type === 'text' && (
                      <input
                        type="text"
                        id={`tournament_field_${field.id}`}
                        value={field.value || ''}
                        onChange={(e) => handleTournamentFieldChange(field.id, e.target.value)}
                        className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={t('registrationModal.enterYourField', { field: field.name.toLowerCase() })}
                        required={field.required}
                      />
                    )}
                    {field.field_type === 'tel' && (
                      <input
                        type="tel"
                        id={`tournament_field_${field.id}`}
                        value={field.value || ''}
                        onChange={(e) => handleTournamentFieldChange(field.id, e.target.value)}
                        className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ex: +33612345678"
                        required={field.required}
                      />
                    )}
                    {field.field_type === 'phone' && (
                      <div>
                        <PhoneInput
                          id={`tournament_field_${field.id}`}
                          value={field.value || ''}
                          onChange={(phone) => handleTournamentFieldChange(field.id, phone)}
                          defaultCountry={getDefaultPhoneCountry(tournament?.eligible_countries)}
                          preferredCountries={getEligiblePhoneCountries(tournament?.eligible_countries)}
                          required={field.required}
                          placeholder={t('registrationModal.enterPhoneNumber')}
                        />
                        {field.phoneError && field.value && (
                          <p className="text-error-500 text-xs mt-1">{field.phoneError}</p>
                        )}
                      </div>
                    )}
                    {field.field_type === 'date' && (
                      <DateInput
                        id={`tournament_field_${field.id}`}
                        value={field.value || ''}
                        onChange={(value) => handleTournamentFieldChange(field.id, value)}
                        label=""
                        required={field.required}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    )}
                    {field.field_type === 'select' && (
                      <select
                        id={`tournament_field_${field.id}`}
                        value={field.value || ''}
                        onChange={(e) => handleTournamentFieldChange(field.id, e.target.value)}
                        className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required={field.required}
                      >
                        <option value="">{t('registrationModal.selectOption')}</option>
                        {field.options && (() => {
                          try {
                            let optionsArray;

                            if (Array.isArray(field.options)) {
                              optionsArray = field.options;
                            } else if (typeof field.options === 'string') {
                              if (field.options.includes(',')) {
                                optionsArray = field.options.split(',').map(opt => opt.trim());
                              } else {
                                optionsArray = JSON.parse(field.options);
                              }
                            } else {
                              console.error('Unexpected options format:', field.options);
                              return null;
                            }

                            return Array.isArray(optionsArray)
                              ? optionsArray.map((option, index) => (
                                  <option key={index} value={option}>
                                    {option}
                                  </option>
                                ))
                              : null;
                          } catch (error) {
                            console.error('Error parsing select options:', error, field.options);
                            return null;
                          }
                        })()}
                      </select>
                    )}
                    {field.field_type === 'textarea' && (
                      <textarea
                        id={`tournament_field_${field.id}`}
                        value={field.value || ''}
                        onChange={(e) => handleTournamentFieldChange(field.id, e.target.value)}
                        className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                        placeholder={t('registrationModal.enterYourField', { field: field.name.toLowerCase() })}
                        required={field.required}
                      />
                    )}
                    {field.field_type === 'multi-select' && (
                      <div className="space-y-3">
                        {field.options && (() => {
                          try {
                            let optionsArray: string[];

                            if (Array.isArray(field.options)) {
                              optionsArray = field.options;
                            } else if (typeof field.options === 'string') {
                              if (field.options.includes(',')) {
                                optionsArray = field.options.split(',').map(opt => opt.trim());
                              } else {
                                optionsArray = JSON.parse(field.options);
                              }
                            } else {
                              console.error('Unexpected options format:', field.options);
                              return null;
                            }

                            return Array.isArray(optionsArray)
                              ? optionsArray.map((option, index) => (
                                  <label
                                    key={index}
                                    className="flex items-center p-3 bg-white dark:bg-dark-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer group"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isOptionSelected(field.id, option)}
                                      onChange={(e) => handleMultiSelectChange(field.id, option, e.target.checked)}
                                      className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-dark-200 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                                    />
                                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                      {option}
                                    </span>
                                  </label>
                                ))
                              : null;
                          } catch (error) {
                            console.error('Error parsing multi-select options:', error, field.options);
                            return null;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('registrationModal.additionalInfoNote')}
                </p>
              </div>
            </div>
          )}

          {/* Terms Agreement */}
          <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('registrationModal.agreeToTerms')}
                <span className="text-error-500"> *</span>
              </span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            {t('registrationModal.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || isSubmitting || !agreeToTerms}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isLoading || isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {t('registrationModal.registering')}
              </>
            ) : teamId ? (
              t('registrationModal.joinTeam')
            ) : (
              t('registrationModal.confirmRegistration')
            )}
          </button>
        </div>
      </div>

      {/* Discord Connection Required Modal */}
      {showDiscordRequired && (
        <DiscordConnectionRequired
          variant="modal"
          onClose={() => setShowDiscordRequired(false)}
        />
      )}
    </div>
  );
};

export default RegistrationModal;
