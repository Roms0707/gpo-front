import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchTournamentById, registerForTournament } from '../services/api';
import { Tournament, RegistrationFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Gamepad2, FileText } from 'lucide-react';
import { countries } from '../utils/countries';
import { supabase } from '../lib/supabase';
import { validateRiotId } from '../services/api';
import { formatTournamentFieldValueAsJson } from '../utils/tournamentUtils';

interface GamePublisherField {
  id: string;
  game_id: string;
  label: string;
  id_name: string;
  required: boolean;
  value?: string;
  isValidating?: boolean;
  isValidated?: boolean;
  validationError?: string;
}

interface TournamentField {
  id: string;
  name: string;
  field_type: string;
  required: boolean;
  value?: string;
  options?: string | string[];
}

const RegisterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [gamePublisherFields, setGamePublisherFields] = useState<GamePublisherField[]>([]);
  const [tournamentFields, setTournamentFields] = useState<TournamentField[]>([]);
  const [gameHasApi, setGameHasApi] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    username: user?.username || '',
    email: user?.email || '',
    teamName: '',
    agreeToTerms: false,
  });

  useEffect(() => {
    const loadTournament = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const { data } = await fetchTournamentById(id);

        if (!data) {
          toast.error(t('toast.tournamentNotFoundError'));
          navigate('/');
          return;
        }

        // Check if registration is still open
        if (data.status !== 'upcoming' || new Date() > new Date(data.registrationEndDate || '')) {
          toast.error(t('toast.registrationClosedError'));
          navigate(`/tournaments/${id}`);
          return;
        }

        // Check country eligibility if the tournament has restrictions
        if (data.eligible_countries && user?.country) {
          const eligibleCountries = data.eligible_countries.split(',').map(c => c.trim());
          if (!eligibleCountries.includes(user.country)) {
            toast.error(t('toast.countryNotEligibleError'));
            navigate(`/tournaments/${id}`);
            return;
          }
        }

        // Check age eligibility
        if (data.minimum_age && user?.dateOfBirth) {
          const birthDate = new Date(user.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          if (age < data.minimum_age) {
            toast.error(t('toast.minimumAgeError', { age: data.minimum_age }));
            navigate(`/tournaments/${id}`);
            return;
          }
        }

        setTournament(data);

        // Check if the game has an API for validation
        if (data.game_id) {
          await checkGameApiStatus(data.game_id);
        }

        // Load gaming account fields for this tournament's game
        if (data.game_id) {
          console.log('Loading game publisher fields for game:', data.game_id);
          await loadGamePublisherFields(data.game_id);
        } else {
          console.log('No game_id found for tournament');
        }

        // Load tournament fields
        await loadTournamentFields(data.id);
      } catch (err) {
        toast.error(t('toast.tournamentLoadError'));
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();
  }, [id, navigate, user]);

  const checkGameApiStatus = async (gameId: string) => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('has_an_api')
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('Error checking game API status:', error);
        return;
      }

      setGameHasApi(data?.has_an_api || false);
    } catch (error) {
      console.error('Error checking game API status:', error);
    }
  };

  const loadTournamentFields = async (tournamentId: string) => {
    try {
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
        options: item.tournament_fields.options
      }));

      console.log('Tournament fields:', fields);
      setTournamentFields(fields);
    } catch (error) {
      console.error('Error loading tournament fields:', error);
    }
  };

  const loadGamePublisherFields = async (gameId: string) => {
    console.log('loadGamePublisherFields called with gameId:', gameId);

    try {
      // Get game publisher IDs for this specific game
      const { data: publisherIds, error: publisherError } = await supabase
        .from('game_publisher_ids')
        .select('id, label, id_name, required')
        .eq('game_id', gameId)
        .order('label', { ascending: true });

      console.log('Publisher IDs query result:', { publisherIds, publisherError });

      if (publisherError) {
        console.error('Error loading game publisher IDs:', publisherError);
        return;
      }

      if (!publisherIds || publisherIds.length === 0) {
        console.log('No publisher IDs found for game:', gameId);
        setGamePublisherFields([]);
        return;
      }

      console.log('Found publisher IDs:', publisherIds);

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

      console.log('User existing values:', userValues);

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

      console.log('Final fields:', fields);
      setGamePublisherFields(fields);
    } catch (error) {
      console.error('Error loading game publisher fields:', error);
    }
  };

  const handleGamePublisherFieldChange = (fieldId: string, value: string) => {
    setGamePublisherFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, value, isValidated: false, validationError: undefined } : field
      )
    );
  };

  const validateGameAccount = async (fieldId: string) => {
    if (!gameHasApi) return;

    // Find the field to validate
    const field = gamePublisherFields.find(f => f.id === fieldId);
    if (!field || !field.value) return;

    // Check if this is a Riot ID field (we need both game name and tagline)
    const isRiotGameName = field.id_name.includes('riot_game_name');
    const isRiotTagline = field.id_name.includes('riot_tagline');

    if (isRiotGameName || isRiotTagline) {
      // For Riot fields, we need both game name and tagline
      const gameNameField = gamePublisherFields.find(f => f.id_name.includes('riot_game_name'));
      const taglineField = gamePublisherFields.find(f => f.id_name.includes('riot_tagline'));

      if (!gameNameField?.value || !taglineField?.value) {
        // Set validation error for both fields
        setGamePublisherFields(prev =>
          prev.map(f => {
            if (f.id_name.includes('riot_game_name') || f.id_name.includes('riot_tagline')) {
              return { ...f, validationError: t('gaming.fillGameNameAndTagline') };
            }
            return f;
          })
        );
        return;
      }

      try {
        // Set validating state for both Riot fields
        setGamePublisherFields(prev =>
          prev.map(f => {
            if (f.id_name.includes('riot_game_name') || f.id_name.includes('riot_tagline')) {
              return { ...f, isValidating: true, isValidated: false, validationError: undefined };
            }
            return f;
          })
        );

        console.log('Validating Riot ID:', gameNameField.value, taglineField.value);

        const result = await validateRiotId(gameNameField.value, taglineField.value);

        if (result.valid) {
          // Set validated state for both Riot fields
          setGamePublisherFields(prev =>
            prev.map(f => {
              if (f.id_name.includes('riot_game_name') || f.id_name.includes('riot_tagline')) {
                return { ...f, isValidating: false, isValidated: true, validationError: undefined };
              }
              return f;
            })
          );

          toast.success(t('toast.accountValidatedSuccess', { account: `${gameNameField.value}#${taglineField.value}` }));
        } else {
          // Set error state for both Riot fields
          setGamePublisherFields(prev =>
            prev.map(f => {
              if (f.id_name.includes('riot_game_name') || f.id_name.includes('riot_tagline')) {
                return { ...f, isValidating: false, isValidated: false, validationError: result.error || t('errors.validationError') };
              }
              return f;
            })
          );

          toast.error(result.error || t('toast.riotAccountValidationError'));
        }
      } catch (error) {
        console.error('Error validating Riot ID:', error);

        // Set error state for both Riot fields
        setGamePublisherFields(prev =>
          prev.map(f => {
            if (f.id_name.includes('riot_game_name') || f.id_name.includes('riot_tagline')) {
              return { ...f, isValidating: false, isValidated: false, validationError: t('errors.validationFailed') };
            }
            return f;
          })
        );

        toast.error(t('toast.riotAccountValidationError'));
      }
    } else {
      // For other game accounts, simulate validation or implement specific logic
      try {
        setGamePublisherFields(prev =>
          prev.map(f =>
            f.id === fieldId ? { ...f, isValidating: true, isValidated: false, validationError: undefined } : f
          )
        );

        // Simulate validation for other games
        await new Promise(resolve => setTimeout(resolve, 1500));

        setGamePublisherFields(prev =>
          prev.map(f =>
            f.id === fieldId ? { ...f, isValidating: false, isValidated: true, validationError: undefined } : f
          )
        );

        toast.success(t('toast.accountValidatedSuccess', { account: field.value }));
      } catch (error) {
        console.error('Error validating game account:', error);

        setGamePublisherFields(prev =>
          prev.map(f =>
            f.id === fieldId ? { ...f, isValidating: false, isValidated: false, validationError: t('errors.validationFailed') } : f
          )
        );

        toast.error(t('toast.accountValidationError'));
      }
    }
  };

  // Check if a field is part of a Riot ID pair
  const isRiotField = (field: GamePublisherField): boolean => {
    return field.id_name.includes('riot_game_name') || field.id_name.includes('riot_tagline');
  };

  // Check if both Riot fields have values
  const bothRiotFieldsHaveValues = (): boolean => {
    const gameNameField = gamePublisherFields.find(f => f.id_name.includes('riot_game_name'));
    const taglineField = gamePublisherFields.find(f => f.id_name.includes('riot_tagline'));
    return !!(gameNameField?.value && taglineField?.value);
  };

  // Check if any Riot field is being validated or is validated
  const isRiotFieldValidatingOrValidated = (): boolean => {
    return gamePublisherFields.some(f =>
      (f.id_name.includes('riot_game_name') || f.id_name.includes('riot_tagline')) &&
      (f.isValidating || f.isValidated)
    );
  };

  const handleTournamentFieldChange = (fieldId: string, value: string) => {
    setTournamentFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, value } : field
      )
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.username || !formData.email) {
        toast.error(t('toast.fillAllFieldsError'));
        return;
      }

      if (tournament?.mode.toLowerCase().includes('team') && !formData.teamName) {
        toast.error(t('toast.teamNameRequiredError'));
        return;
      }

      // Validate required gaming account fields
      const requiredFields = gamePublisherFields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !field.value || field.value.trim() === '');

      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(field => field.label).join(', ');
        toast.error(t('toast.fillRequiredFieldsError', { fields: fieldNames }));
        return;
      }

      // Validate required tournament fields
      const requiredTournamentFields = tournamentFields.filter(field => field.required);
      const missingTournamentFields = requiredTournamentFields.filter(field => !field.value || field.value.trim() === '');

      if (missingTournamentFields.length > 0) {
        const fieldNames = missingTournamentFields.map(field => field.name).join(', ');
        toast.error(t('toast.fillTournamentFieldsError', { fields: fieldNames }));
        return;
      }
    }

    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const saveGamePublisherAccounts = async () => {
    if (!user?.id || !tournament?.game_id) return;

    try {
      // Delete existing entries for this user and game
      const { error: deleteError } = await supabase
        .from('game_publisher_id_for_users')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', tournament.game_id);

      if (deleteError) {
        console.error('Error deleting existing gaming accounts:', deleteError);
      }

      // Insert new entries for fields with values
      const fieldsWithValues = gamePublisherFields.filter(field => field.value && field.value.trim() !== '');

      if (fieldsWithValues.length > 0) {
        const insertData = fieldsWithValues.map(field => ({
          user_id: user.id,
          game_id: tournament.game_id,
          game_publisher_id: field.id,
          value: field.value.trim()
        }));

        const { error: insertError } = await supabase
          .from('game_publisher_id_for_users')
          .insert(insertData);

        if (insertError) {
          console.error('Error saving gaming accounts:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error saving game publisher accounts:', error);
      throw error;
    }
  };

  const saveTournamentFieldValues = async () => {
    if (!user?.id || !tournament?.id || !tournamentFields.length) return;

    try {
      // Delete existing entries for this user and tournament
      const { error: deleteError } = await supabase
        .from('user_tournament_field_values')
        .delete()
        .eq('user_id', user.id)
        .eq('tournament_id', tournament.id);

      if (deleteError) {
        console.error('Error deleting existing tournament field values:', deleteError);
      }

      // Insert new entries for fields with values
      const fieldsWithValues = tournamentFields.filter(field => field.value && field.value.trim() !== '');

      if (fieldsWithValues.length > 0) {
        const insertData = fieldsWithValues.map(field => {
          // Format the value as JSON object with field_type as key
          const jsonValue = formatTournamentFieldValueAsJson(field.field_type, field.value.trim());

          console.log(`[RegisterPage:saveTournamentFieldValues] Formatted field "${field.name}" (${field.field_type}):`, {
            originalValue: field.value.trim(),
            jsonValue: jsonValue,
            jsonValueType: typeof jsonValue
          });

          return {
            user_id: user.id,
            tournament_id: tournament.id,
            field_id: field.id,
            value: jsonValue // Insert JSON object directly, Supabase will handle serialization
          };
        });

        console.log('[RegisterPage:saveTournamentFieldValues] Inserting field values with JSON objects', insertData);

        const { error: insertError } = await supabase
          .from('user_tournament_field_values')
          .insert(insertData);

        if (insertError) {
          console.error('Error saving tournament field values:', insertError);
          throw insertError;
        }

        console.log('[RegisterPage:saveTournamentFieldValues] Tournament field values saved successfully');
      }
    } catch (error) {
      console.error('Error saving tournament field values:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast.error(t('toast.acceptTermsError'));
      return;
    }

    try {
      setIsSubmitting(true);

      // Save gaming account information first
      if (gamePublisherFields.length > 0) {
        await saveGamePublisherAccounts();
      }

      // Save tournament field values
      if (tournamentFields.length > 0) {
        await saveTournamentFieldValues();
      }

      const isWhitelisted = false;
      console.log('[RegisterPage] User whitelist status:', isWhitelisted);

      const success = await registerForTournament(id!, {
        userId: user?.id,
        ...formData,
        is_whitelisted: isWhitelisted,
      });

      if (success) {
        toast.success(t('toast.registrationSuccess'));
        navigate(`/tournaments/${id}`);
      } else {
        toast.error(t('toast.registrationError'));
      }
    } catch (error) {
      toast.error(t('toast.registrationError'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="bg-dark-100 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-heading font-bold mb-4">
            Tournoi non trouvé
          </h2>
          <p className="text-gray-400 mb-6">
            Nous n'avons pas pu trouver le tournoi demandé.
          </p>
          <Link to="/" className="btn btn-primary">
            Retourner à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={`/tournaments/${id}`} className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tournoi
          </Link>

          <div className="bg-dark-100 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 px-6 py-4 border-b border-gray-800">
              <h1 className="font-heading font-bold text-2xl">
                Inscription au tournoi
              </h1>
              <p className="text-gray-400">{tournament.title}</p>
            </div>

            <div className="p-6">
              {/* Progress steps */}
              <div className="flex items-center justify-center mb-8">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 1 ? 'bg-primary-600' : 'bg-dark-300'
                } mr-2`}>
                  {step > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
                </div>
                <div className={`w-16 h-1 ${
                  step > 1 ? 'bg-primary-600' : 'bg-dark-300'
                } mr-2`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 2 ? 'bg-primary-600' : 'bg-dark-300'
                } mr-2`}>
                  {step > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
                </div>
                <div className={`w-16 h-1 ${
                  step > 2 ? 'bg-primary-600' : 'bg-dark-300'
                } mr-2`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 3 ? 'bg-primary-600' : 'bg-dark-300'
                }`}>
                  3
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div>
                    <h2 className="text-xl font-heading font-semibold mb-4">Informations personnelles</h2>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="username" className="label">
                          Nom d'utilisateur <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="input"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="label">
                          Email <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="input"
                          required
                        />
                      </div>

                      <div>
                        <label className="label">
                          Pays <span className="text-error-500">*</span>
                        </label>
                        <div className="input bg-dark-300 flex items-center">
                          {user?.country ? (
                            <span>
                              {countries.find(c => c.code === user.country)?.name || user.country}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              Pays non défini
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Le pays est défini dans votre profil et ne peut pas être modifié.
                        </p>
                      </div>

                      <div>
                        <label className="label">
                          Date de naissance <span className="text-error-500">*</span>
                        </label>
                        <div className="input bg-dark-300 flex items-center">
                          {user?.dateOfBirth ? (
                            <span>
                              {new Date(user.dateOfBirth).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              {t('profile.dateOfBirthNotDefined')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {t('profile.dateOfBirthCannotBeChanged')}
                        </p>
                      </div>

                      {tournament.mode.toLowerCase().includes('team') && (
                        <div>
                          <label htmlFor="teamName" className="label">
                            Nom de l'équipe <span className="text-error-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="teamName"
                            name="teamName"
                            value={formData.teamName}
                            onChange={handleChange}
                            className="input"
                            required
                          />
                        </div>
                      )}

                      {/* Gaming Account Fields */}
                      {gamePublisherFields.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-heading font-semibold mb-4 flex items-center">
                            <Gamepad2 className="h-5 w-5 mr-2 text-primary-500" />
                            Comptes de jeu requis
                          </h3>
                          <div className="bg-dark-200 p-4 rounded-lg space-y-4">
                            {gamePublisherFields.map((field) => (
                              <div key={field.id}>
                                <label htmlFor={`gaming_${field.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {field.label} {field.required && <span className="text-error-500">*</span>}
                                </label>
                                <div className="flex space-x-2">
                                  <input
                                    type="text"
                                    id={`gaming_${field.id}`}
                                    value={field.value || ''}
                                    onChange={(e) => handleGamePublisherFieldChange(field.id, e.target.value)}
                                    className={`flex-1 input ${
                                      field.isValidated ? 'border-success-500' :
                                      field.validationError ? 'border-error-500' : ''
                                    }`}
                                    placeholder={`Votre ${field.id_name}`}
                                    required={field.required}
                                  />

                                  {/* Validation button for API-enabled games */}
                                  {gameHasApi && isRiotField(field) && (
                                    <button
                                      type="button"
                                      onClick={() => validateGameAccount(field.id)}
                                      disabled={
                                        !bothRiotFieldsHaveValues() ||
                                        isRiotFieldValidatingOrValidated()
                                      }
                                      className={`px-3 py-2 rounded-lg transition-colors flex items-center ${
                                        field.isValidated
                                          ? 'bg-success-600 text-white cursor-default'
                                          : field.isValidating
                                            ? 'bg-primary-600/50 text-white cursor-wait'
                                            : bothRiotFieldsHaveValues()
                                              ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                      }`}
                                    >
                                      {field.isValidating ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                                          <span>Validation...</span>
                                        </>
                                      ) : field.isValidated ? (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          <span>Validé</span>
                                        </>
                                      ) : (
                                        <span>Valider</span>
                                      )}
                                    </button>
                                  )}

                                  {/* Validation button for other games with API */}
                                  {gameHasApi && !isRiotField(field) && field.value && (
                                    <button
                                      type="button"
                                      onClick={() => validateGameAccount(field.id)}
                                      disabled={field.isValidating || field.isValidated}
                                      className={`px-3 py-2 rounded-lg transition-colors flex items-center ${
                                        field.isValidated
                                          ? 'bg-success-600 text-white cursor-default'
                                          : field.isValidating
                                            ? 'bg-primary-600/50 text-white cursor-wait'
                                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                                      }`}
                                    >
                                      {field.isValidating ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                                          <span>Validation...</span>
                                        </>
                                      ) : field.isValidated ? (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          <span>Validé</span>
                                        </>
                                      ) : (
                                        <span>Valider</span>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Validation status messages */}
                                {field.validationError && (
                                  <p className="text-error-500 text-xs mt-1">{field.validationError}</p>
                                )}
                                {field.isValidated && !field.validationError && (
                                  <p className="text-success-500 text-xs mt-1">✓ Compte validé avec succès</p>
                                )}
                              </div>
                            ))}
                            <p className="text-xs text-gray-400 mt-2">
                              Ces informations sont nécessaires pour participer au tournoi. Elles seront sauvegardées dans votre profil.
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Debug information for API status - Always show for now */}
                    {true && (
                      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                        <h4 className="text-blue-400 font-medium mb-2">Debug Info (API):</h4>
                        <div className="text-xs text-blue-200 space-y-1">
                          <div>Game Has API: {gameHasApi ? 'Yes' : 'No'}</div>
                          <div>Game ID: {tournament.game_id || 'None'}</div>
                          <div>Publisher Fields Count: {gamePublisherFields.length}</div>
                          {gamePublisherFields.length > 0 && (
                            <div>
                              Fields: {gamePublisherFields.map(f => `${f.label} (${f.required ? 'required' : 'optional'})`).join(', ')}
                            </div>
                          )}
                          <div>Riot Fields Found: {gamePublisherFields.filter(f => f.id_name.includes('riot')).length}</div>
                          <div>Riot Game Name Field: {gamePublisherFields.find(f => f.id_name.includes('riot_game_name'))?.value || 'Empty'}</div>
                          <div>Riot Tagline Field: {gamePublisherFields.find(f => f.id_name.includes('riot_tagline'))?.value || 'Empty'}</div>
                        </div>
                      </div>
                    )}

                      {/* Tournament Fields */}
                      {tournamentFields.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-heading font-semibold mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary-500" />
                            Informations supplémentaires
                          </h3>
                          <div className="bg-dark-200 p-4 rounded-lg space-y-4">
                            {tournamentFields.map((field) => (
                              <div key={field.id}>
                                <label htmlFor={`tournament_field_${field.id}`} className="label">
                                  {field.name} {field.required && <span className="text-error-500">*</span>}
                                </label>
                                {field.field_type === 'text' && (
                                  <input
                                    type="text"
                                    id={`tournament_field_${field.id}`}
                                    value={field.value || ''}
                                    onChange={(e) => handleTournamentFieldChange(field.id, e.target.value)}
                                    className="input w-full"
                                    placeholder={`Entrez votre ${field.name.toLowerCase()}`}
                                    required={field.required}
                                  />
                                )}
                                {field.field_type === 'tel' && (
                                  <input
                                    type="tel"
                                    id={`tournament_field_${field.id}`}
                                    value={field.value || ''}
                                    onChange={(e) => handleTournamentFieldChange(field.id, e.target.value)}
                                    className="input w-full"
                                    placeholder="Ex: +33612345678"
                                    required={field.required}
                                  />
                                )}
                                {field.field_type === 'select' && (
                                  <select
                                    id={`tournament_field_${field.id}`}
                                    value={field.value || ''}
                                    onChange={(e) => handleTournamentFieldChange(field.id, e.target.value)}
                                    className="input w-full"
                                    required={field.required}
                                  >
                                    <option value="">Sélectionnez une option</option>
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
                                    className="input w-full min-h-[100px]"
                                    placeholder={`Entrez votre ${field.name.toLowerCase()}`}
                                    required={field.required}
                                  />
                                )}
                              </div>
                            ))}
                            <p className="text-xs text-gray-400 mt-2">
                              Ces informations sont spécifiques à ce tournoi et seront utilisées par les organisateurs.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Debug information - Always show for now */}
                      {true && (
                        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                          <h4 className="text-yellow-400 font-medium mb-2">Debug Info:</h4>
                          <div className="text-xs text-yellow-200 space-y-1">
                            <div>Game Has API: {gameHasApi ? 'Yes' : 'No'}</div>
                            <div>Tournament Game ID: {tournament.game_id || 'None'}</div>
                            <div>Publisher Fields Count: {gamePublisherFields.length}</div>
                            <div>Tournament Fields Count: {tournamentFields.length}</div>
                            <div>User ID: {user?.id || 'None'}</div>
                            {gamePublisherFields.length > 0 && (
                              <div>
                                Fields: {gamePublisherFields.map(f => `${f.label} (${f.required ? 'required' : 'optional'})`).join(', ')}
                              </div>
                            )}
                            {tournamentFields.length > 0 && (
                              <div>
                                Tournament Fields: {tournamentFields.map(f => `${f.name} (${f.required ? 'required' : 'optional'})`).join(', ')}
                              </div>
                            )}
                            <div>Should Show Validate Button: {gameHasApi && gamePublisherFields.some(f => f.id_name.includes('riot')) ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={nextStep}
                        className="btn btn-primary"
                      >
                        Continuer
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Tournament Rules */}
                {step === 2 && (
                  <div>
                    <h2 className="text-xl font-heading font-semibold mb-4">Règles du tournoi</h2>

                    <div className="bg-dark-200 p-4 rounded-lg mb-6 max-h-60 overflow-y-auto">
                      <p className="text-sm text-gray-300">
                        En participant à ce tournoi, vous acceptez les conditions suivantes:
                      </p>
                      <ul className="list-disc pl-5 mt-2 text-sm text-gray-300 space-y-2">
                        <li>Vous devez vous présenter à l'heure indiquée pour vos matchs.</li>
                        <li>Vous devez respecter les autres joueurs et les administrateurs du tournoi.</li>
                        <li>Toute forme de triche ou de comportement antisportif entraînera une disqualification immédiate.</li>
                        <li>Les décisions des administrateurs du tournoi sont définitives.</li>
                        <li>Vous devez avoir l'âge minimum requis pour participer (varie selon le jeu).</li>
                        <li>Vous acceptez que votre nom d'utilisateur et vos résultats soient publiés publiquement.</li>
                        {gamePublisherFields.length > 0 && (
                          <li>Vous confirmez que les identifiants de jeu fournis sont corrects et vous appartiennent.</li>
                        )}
                        {tournamentFields.length > 0 && (
                          <li>Vous confirmez que les informations supplémentaires fournies sont exactes.</li>
                        )}
                      </ul>
                    </div>

                    <div className="mb-8">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          name="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onChange={handleChange}
                          className="mt-1 mr-3"
                        />
                        <span className="text-sm text-gray-300">
                          J'ai lu et j'accepte les règles du tournoi et les conditions de participation <span className="text-error-500">*</span>
                        </span>
                      </label>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="btn btn-outline"
                      >
                        Retour
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="btn btn-primary"
                        disabled={!formData.agreeToTerms}
                      >
                        Continuer
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <div>
                    <h2 className="text-xl font-heading font-semibold mb-4">Confirmation</h2>

                    <div className="bg-dark-200 p-4 rounded-lg mb-6">
                      <h3 className="font-medium mb-2">Récapitulatif de l'inscription</h3>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tournoi:</span>
                          <span>{tournament.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Jeu:</span>
                          <span>{tournament.game}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Nom d'utilisateur:</span>
                          <span>{formData.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span>{formData.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pays:</span>
                          <span>{countries.find(c => c.code === user?.country)?.name || 'Non défini'}</span>
                        </div>
                        {tournament.mode.toLowerCase().includes('team') && formData.teamName && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Équipe:</span>
                            <span>{formData.teamName}</span>
                          </div>
                        )}

                        {/* Gaming Account Summary */}
                        {gamePublisherFields.filter(field => field.value && field.value.trim() !== '').length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="font-medium mb-2 text-primary-400">Comptes de jeu:</h4>
                            {gamePublisherFields
                              .filter(field => field.value && field.value.trim() !== '')
                              .map(field => (
                                <div key={field.id} className="flex justify-between">
                                  <span className="text-gray-400">{field.label}:</span>
                                  <span>{field.value}</span>
                                </div>
                              ))
                            }
                          </div>
                        )}

                        {/* Tournament Fields Summary */}
                        {tournamentFields.filter(field => field.value && field.value.trim() !== '').length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="font-medium mb-2 text-primary-400">Informations supplémentaires:</h4>
                            {tournamentFields
                              .filter(field => field.value && field.value.trim() !== '')
                              .map(field => (
                                <div key={field.id} className="flex justify-between">
                                  <span className="text-gray-400">{field.name}:</span>
                                  <span>{field.value}</span>
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-primary-600/10 border border-primary-600/30 p-4 rounded-lg mb-6">
                      <p className="text-sm text-primary-300">
                        En confirmant votre inscription, vous vous engagez à participer au tournoi selon les règles établies. Vous recevrez un email de confirmation avec les détails de votre inscription.
                      </p>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="btn btn-outline"
                      >
                        Retour
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            Inscription en cours...
                          </>
                        ) : (
                          'Confirmer l\'inscription'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
